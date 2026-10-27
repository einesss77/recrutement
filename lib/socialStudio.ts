import { get, put, BlobNotFoundError } from '@vercel/blob';
import { prisma } from '@/lib/db';
import initialPosts from '@/studio-social/content/posts.json';
import strategy from '@/studio-social/content/strategy.json';
import practicalPack from '@/studio-social/content/practical-pack.json';
import companionPack from '@/studio-social/content/companion-pack.json';
import { z } from 'zod';

const slideSchema=z.object({label:z.string().max(100),title:z.string().max(140),body:z.string().max(350),points:z.array(z.string().max(240)).max(4)});
export const postsSchema=z.array(z.object({id:z.string().min(1).max(80),title:z.string().max(180),category:z.string().max(100),template:z.enum(['editorial','steps','squad','checklist','case','focus','chatbot','document','automation','advisor','cat']),theme:z.enum(['dark','light']),status:z.enum(['draft','ready']),date:z.string().max(10),image:z.string().max(3_500_000).refine(s=>!s||/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)),caption:z.string().max(15000),slides:z.array(slideSchema).min(1).max(10)})).max(500).refine(posts=>new Set(posts.map(p=>p.id)).size===posts.length);
export type SocialPost=z.infer<typeof postsSchema>[number];
type Document={posts:SocialPost[];appliedPacks?:string[];revision:number;usage:{month:string;reservedUsd:number;calls:number}};
const pathname='bm-social-studio/document-v1.json';
const token=()=>process.env.BLOB_READ_WRITE_TOKEN??process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
const initial=():Document=>({posts:postsSchema.parse(initialPosts),revision:0,usage:{month:new Date().toISOString().slice(0,7),reservedUsd:0,calls:0}});
async function ensureTable(){
 await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "SocialStudioDocument" ("id" TEXT PRIMARY KEY, "data" JSONB NOT NULL, "revision" INTEGER NOT NULL DEFAULT 0)`;
}
export async function readStudio():Promise<{document:Document;etag?:string;backend:string}>{
 if(token()){
  try{const result=await get(pathname,{access:'private',token:token(),useCache:false});if(result?.statusCode===200){return{document:JSON.parse(await new Response(result.stream).text()),etag:result.blob.etag,backend:'cloud'};}}catch(e){if(!(e instanceof BlobNotFoundError))throw e;}
  return{document:initial(),backend:'cloud'};
 }
 if(!process.env.DATABASE_URL)throw Error('Aucun stockage persistant configuré.');
 await ensureTable();
 const rows=await prisma.$queryRaw<{data:Document}[]>`SELECT "data" FROM "SocialStudioDocument" WHERE "id" = 'main'`;
 return{document:rows[0]?.data||initial(),backend:'cloud'};
}
export async function writeStudio(document:Document,revision:number,etag?:string){
 document.revision=revision+1;
 if(token()){
  await put(pathname,JSON.stringify(document),{access:'private',token:token(),addRandomSuffix:false,contentType:'application/json',cacheControlMaxAge:60,...(etag?{ifMatch:etag,allowOverwrite:true}:{allowOverwrite:false})});
 }else{
  await ensureTable();
  const count=await prisma.$executeRaw`INSERT INTO "SocialStudioDocument" ("id","data","revision") VALUES ('main',${JSON.stringify(document)}::jsonb,${document.revision}) ON CONFLICT ("id") DO UPDATE SET "data"=EXCLUDED."data", "revision"=EXCLUDED."revision" WHERE "SocialStudioDocument"."revision"=${revision}`;
  if(count!==1)throw Error('CONFLICT');
 }
 return document.revision;
}
export async function studioState(){
 let document:Document,backend:string;
 try{({document,backend}=await readStudio());}catch{document=initial();backend='readonly';}
 if(document.usage.month!==new Date().toISOString().slice(0,7))document.usage={month:new Date().toISOString().slice(0,7),reservedUsd:0,calls:0};
 return{...document,availablePacks:[practicalPack,companionPack],strategy,backend,aiEnabled:!!process.env.GEMINI_API_KEY&&backend==='cloud',budget:Number(process.env.AI_MONTHLY_BUDGET_USD||2)};
}
export async function generateStudio(topic:string){
 if(!process.env.GEMINI_API_KEY)throw Error('La rédaction IA attend une clé GEMINI_API_KEY.');
 const current=await readStudio(),document=current.document;
 const month=new Date().toISOString().slice(0,7);if(document.usage.month!==month)document.usage={month,reservedUsd:0,calls:0};
 const budget=Number(process.env.AI_MONTHLY_BUDGET_USD||2);
 if(!Number.isFinite(budget)||document.usage.reservedUsd+.02>budget)throw Error('Budget mensuel du studio atteint.');
 document.usage.reservedUsd+=.02;document.usage.calls++;
 const revision=await writeStudio(document,document.revision,current.etag);
 const prompt=`Tu rédiges en français pour B&M. Stratégie : ${JSON.stringify(strategy)}. Sujet : ${topic}. Produis exactement 3 brouillons distincts sans inventer de faits. Réponds avec un tableau JSON de 3 objets : title, category, template parmi editorial/steps/squad/checklist/focus, theme dark/light, caption (texte LinkedIn complet), slides (1 à 4 objets label,title,body,points). Limites par diapositive : title 100 caractères, body 220, points tableau de 0 à 3 textes de 80 caractères. Pas de Markdown.`;
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},signal:AbortSignal.timeout(55000),body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',maxOutputTokens:5000,temperature:.7}})});
 if(!response.ok)throw Error(`Erreur du fournisseur IA (${response.status}). Aucun nouvel essai automatique.`);
 const result=await response.json(),drafts=JSON.parse(result.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text||'').join('')||'null');
 if(!Array.isArray(drafts)||drafts.length!==3)throw Error('Réponse IA incomplète.');
 const posts=postsSchema.parse(drafts.map(p=>({...p,id:crypto.randomUUID(),status:'draft',date:'',image:''})));
 return{posts,usage:document.usage,revision};
}
