import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated,setAdminSession,clearAdminSession} from '@/lib/adminAuth';
import {postsSchema,saveStudioPosts,isStudioConflict,studioState,generateStudio} from '@/lib/socialStudio';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
type Context={params:Promise<{path?:string[]}>};
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
function json(value:unknown,status=200){return NextResponse.json(value,{status,headers});}
function sameOrigin(req:NextRequest){try{return new URL(req.headers.get('origin')||'').host===req.headers.get('host');}catch{return false;}}
function login(error=false){return new NextResponse(`<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>B&M — Accès au studio</title><style>*{box-sizing:border-box}body{margin:0;background:#111e2c;color:#fff;font:16px/1.6 system-ui;min-height:100dvh;display:grid;place-items:center;padding:24px}main{max-width:420px;width:100%}.brand{font-size:36px;font-weight:700;color:#b9efde}h1{font-size:32px;line-height:1.2}p{color:#b8cbc6}label{display:block;margin:25px 0 8px}input,button{width:100%;padding:15px;border-radius:8px;border:1px solid #81988d;font:inherit}button{background:#b9efde;color:#143c31;margin-top:18px;font-weight:600;cursor:pointer}a{color:#b9efde}.error{color:#ffc3b0}</style></head><body><main><div class="brand">B&M.</div><p>LE STUDIO SOCIAL</p><h1>Votre atelier de marque.</h1><p>Connectez-vous avec le mot de passe administrateur B&M.</p><form method="post" action="/studio-social/login"><label for="password">Mot de passe</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required>${error?'<p class="error">Connexion impossible. Vérifiez le mot de passe administrateur.</p>':''}<button>Ouvrir le studio</button></form><p><a href="/">Retour au site B&M</a></p></main></body></html>`,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});}
async function handle(req:NextRequest,context:Context){
 const segments=(await context.params).path||[],route=segments.join('/');
 if(['POST','PUT','DELETE'].includes(req.method)&&!sameOrigin(req))return json({error:'Origine non autorisée.'},403);
 if(route==='login'){
  if(req.method==='GET')return login(req.nextUrl.searchParams.has('error'));
  if(req.method==='POST'){
   const form=await req.formData(),password=form.get('password'),expected=process.env.ADMIN_PASSWORD;
   const input=Buffer.from(typeof password==='string'?password:''),target=Buffer.from(expected||'');
   if(!expected||input.length!==target.length||!timingSafeEqual(input,target))return NextResponse.redirect(new URL('/studio-social/login?error=1',req.url),303);
   await setAdminSession();return NextResponse.redirect(new URL('/studio-social',req.url),303);
  }
 }
 if(!(await isAdminAuthenticated()))return route.startsWith('api/')?json({error:'Veuillez vous reconnecter au studio.'},401):NextResponse.redirect(new URL('/studio-social/login',req.url));
 try{
  if(route==='logout'&&req.method==='POST'){await clearAdminSession();return NextResponse.redirect(new URL('/studio-social/login',req.url),303);}
  if(route==='api/state'&&req.method==='GET')return json(await studioState());
  if(route==='api/posts'&&req.method==='PUT'){
   if(Number(req.headers.get('content-length')||0)>4_000_000)return json({error:'Lot trop volumineux. Réduisez la taille des images.'},413);
   const input=await req.json(),posts=postsSchema.parse(input.posts),revision=input.revision;
   if(!Number.isSafeInteger(revision)||revision<0)return json({error:'Version du document invalide.'},400);
   const appliedPacks=Array.isArray(input.appliedPacks)?input.appliedPacks.filter((id:unknown)=>typeof id==='string'&&id.length<100).slice(0,100):undefined;
   const nextRevision=await saveStudioPosts(posts,revision,appliedPacks);return json({ok:true,revision:nextRevision});
  }
  if(route==='api/generate'&&req.method==='POST'){
   const input=await req.json(),topic=String(input.topic||'').trim();if(!topic||topic.length>1500)return json({error:'Sujet requis : 1 500 caractères maximum.'},400);
   return json(await generateStudio(topic));
  }
  if(req.method!=='GET')return json({error:'Méthode non autorisée.'},405);
  const asset=route||'index.html';
  if(!/^[a-zA-Z0-9_./-]+$/.test(asset)||asset.split('/').some(p=>p==='..'))return json({error:'Chemin invalide.'},400);
  const root=path.join(process.cwd(),'studio-social','assets'),file=path.join(root,asset);
  if(!file.startsWith(root+path.sep))return json({error:'Chemin invalide.'},400);
  const bytes=await readFile(file),mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4','.wav':'audio/wav','.svg':'image/svg+xml','.png':'image/png','.zip':'application/zip','.md':'text/markdown; charset=utf-8'};
  if(/\.(mp4|wav)$/.test(asset)){
   const mediaHeaders={...headers,'Content-Type':mime[path.extname(file)],'Accept-Ranges':'bytes'};
   const range=req.headers.get('range');
   if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!match||(!match[1]&&!match[2]))return new NextResponse(null,{status:416,headers:{...mediaHeaders,'Content-Range':`bytes */${bytes.length}`}});
    const start=match[1]?Number(match[1]):Math.max(0,bytes.length-Number(match[2])),end=match[1]?(match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1):bytes.length-1;
    if(start>end||start>=bytes.length)return new NextResponse(null,{status:416,headers:{...mediaHeaders,'Content-Range':`bytes */${bytes.length}`}});
    return new NextResponse(new Uint8Array(bytes.subarray(start,end+1)),{status:206,headers:{...mediaHeaders,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':String(end-start+1)}});
   }
   return new NextResponse(new Uint8Array(bytes),{headers:{...mediaHeaders,'Content-Length':String(bytes.length)}});
  }
  return new NextResponse(bytes,{headers:{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream'}});
 }catch(e){const error=e as {name?:string;code?:string;message?:string};if(isStudioConflict(e))return json({code:'STUDIO_CONFLICT',error:'Une sauvegarde concurrente a été détectée. Votre copie locale peut être synchronisée.'},409);if(error.code==='ENOENT')return json({error:'Introuvable.'},404);console.error('Studio social:',error.name);return json({error:route==='api/generate'&&/^(Budget mensuel du studio atteint\.|La rédaction IA attend une clé GEMINI_API_KEY\.|Erreur du fournisseur IA \(\d{3}\)\. Aucun nouvel essai automatique\.|Réponse IA incomplète\.)$/.test(error.message||'')?error.message:error.name==='ZodError'?'Publication invalide ou texte trop long.':'La sauvegarde en ligne est indisponible. Vos modifications restent sur cet appareil.'},400);}
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
