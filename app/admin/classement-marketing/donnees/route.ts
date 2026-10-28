import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated} from '@/lib/adminAuth';
import {prisma} from '@/lib/db';
import {rankingSchema} from '@/lib/marketingRankingModel';
import {saveMarketingRanking} from '@/lib/marketingRankingStore';
import {BlobPreconditionFailedError} from '@vercel/blob';
export const runtime='nodejs';
function json(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});}
export async function POST(req:NextRequest){
 if(!(await isAdminAuthenticated()))return json({error:'Connexion administrateur requise.'},401);
 try{if(new URL(req.headers.get('origin')||'').host!==req.nextUrl.host)return json({error:'Origine non autorisée.'},403);}catch{return json({error:'Origine non autorisée.'},403);}
 if(Number(req.headers.get('content-length')||0)>500000)return json({error:'Classement trop volumineux.'},413);
 try{
  const raw=await req.text();if(raw.length>500000)return json({error:'Classement trop volumineux.'},413);
  const document=rankingSchema.parse(JSON.parse(raw));
  const ids=await prisma.application.findMany({where:{jobSlug:'growth-manager',id:{in:document.rows.map(r=>r.applicationId)}},select:{id:true}});
  if(ids.length!==document.rows.length)return json({error:'Certains dossiers ont été supprimés ou ne correspondent pas au poste.'},409);
  await saveMarketingRanking(document);return json({ok:true,reviewed:ids.length});
 }catch(error){if(error instanceof BlobPreconditionFailedError)return json({error:'Le classement a changé pendant la sauvegarde. Rechargez avant de réessayer.'},409);return json({error:error instanceof Error&&error.name==='ZodError'?'Classement invalide.':'Impossible d’enregistrer le classement privé.'},400);}
}
