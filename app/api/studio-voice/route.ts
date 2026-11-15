import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated} from '@/lib/adminAuth';
import {generateVoice,voiceCatalog,VoiceError} from '@/lib/studioVoice';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers});
export async function GET(req:NextRequest){
  if(!await isAdminAuthenticated())return json({error:'Reconnectez-vous au studio.'},401);
  try{return json(await voiceCatalog(req.nextUrl.searchParams.get('provider')||''));}
  catch(error){return fail(error);}
}
export async function POST(req:NextRequest){
  if(!await isAdminAuthenticated())return json({error:'Reconnectez-vous au studio.'},401);
  try{
    if(new URL(req.headers.get('origin')||'').host!==req.headers.get('host'))return json({error:'Origine non autorisée.'},403);
  }catch{return json({error:'Origine non autorisée.'},403);}
  try{
    const body=await req.text();if(Buffer.byteLength(body)>6000)return json({error:'Texte trop volumineux.'},413);
    let input;try{input=JSON.parse(body);}catch{return json({error:'Requête invalide.'},400);}
    const {bytes,mime}=await generateVoice(input);
    return new NextResponse(bytes,{headers:{...headers,'Content-Type':mime,'Content-Length':String(bytes.length)}});
  }catch(error){return fail(error);}
}
function fail(error:unknown){return json({error:error instanceof VoiceError?error.message:'Le service vocal est indisponible.'},error instanceof VoiceError?error.status:503);}
