import {NextRequest,NextResponse} from 'next/server';
import {isAdminAuthenticated} from '@/lib/adminAuth';
import {AgentError,accountId,withAgentAccount,agentState,configureAgent,agentCommand,pairWorker,authenticateWorker,workerHeartbeat,claimJob,completeJob,publishJob,beginOAuth,finishOAuth,studioBase} from '@/lib/linkedinAgent';
import {LinkedInError} from '@/lib/linkedinClient';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers});
type Context={params:Promise<{path?:string[]}>};
function originAllowed(req:NextRequest){try{return new URL(req.headers.get('origin')||'').host===req.headers.get('host');}catch{return false;}}
async function body(req:NextRequest){if(Number(req.headers.get('content-length')||0)>4_000_000)throw new AgentError('Requête trop volumineuse.',413);const raw=await req.text();if(Buffer.byteLength(raw)>4_000_000)throw new AgentError('Requête trop volumineuse.',413);try{return raw?JSON.parse(raw):{};}catch{throw new AgentError('JSON invalide.');}}
async function handler(req:NextRequest,context:Context){
 const route=((await context.params).path||[]).join('/');
 try{
  if(route.startsWith('worker/')){
   if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
   const bearer=/^Bearer ([A-Za-z0-9_-]+)$/.exec(req.headers.get('authorization')||'')?.[1]||'',workerId=await authenticateWorker(bearer),input=await body(req);
   if(route==='worker/heartbeat')return json(await workerHeartbeat(workerId,input));
   if(route==='worker/claim')return json(await claimJob(workerId));
   if(route==='worker/complete')return json(await withAgentAccount(accountId(input.accountId),()=>completeJob(workerId,input)));
   if(route==='worker/publish')return json(await withAgentAccount(accountId(input.accountId),()=>publishJob(workerId,input)));
   return json({error:'Introuvable.'},404);
  }
  if(!(await isAdminAuthenticated()))return json({error:'Reconnectez-vous au studio.'},401);
  if(['POST','PUT','DELETE'].includes(req.method)&&!originAllowed(req))return json({error:'Origine non autorisée.'},403);
  if(route==='state'&&req.method==='GET')return json(await withAgentAccount(accountId(req.nextUrl.searchParams.get('accountId')),()=>agentState()));
  if(route==='config'&&req.method==='PUT'){const input=await body(req);return await withAgentAccount(accountId(input.accountId),async()=>{await configureAgent(input);return json(await agentState());});}
  if(route==='command'&&req.method==='POST'){const input=await body(req);return await withAgentAccount(accountId(input.accountId),async()=>{const result=await agentCommand(input);return json({...result,state:await agentState()});});}
  if(route==='pair'&&req.method==='POST'){const input=await body(req);return json(await pairWorker(typeof input.name==='string'?input.name:'Ordinateur B&M'));}
  if(route==='connect'&&req.method==='GET'){const id=accountId(req.nextUrl.searchParams.get('accountId')),start=await withAgentAccount(id,()=>beginOAuth()),res=NextResponse.redirect(start.url);res.cookies.set('bm_linkedin_oauth',id+':'+start.state,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:600,path:'/api/studio-agent'});return res;}
  if(route==='callback'&&req.method==='GET'){
   const state=req.nextUrl.searchParams.get('state')||'',code=req.nextUrl.searchParams.get('code')||'';
   if(req.nextUrl.searchParams.has('error'))throw new AgentError('Connexion LinkedIn refusée ou interrompue.');
   if(!code||code.length>3000)throw new AgentError('Code de connexion LinkedIn absent ou invalide.');
   const [rawAccount,cookieState]=(req.cookies.get('bm_linkedin_oauth')?.value||'').split(':'),id=accountId(rawAccount);await withAgentAccount(id,()=>finishOAuth(code,state,cookieState||''));const res=NextResponse.redirect(studioBase()+'/studio-social/?agentAccount='+id+'#agent');res.cookies.set('bm_linkedin_oauth','',{maxAge:0,path:'/api/studio-agent',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});return res;
  }
  return json({error:'Route ou méthode inconnue.'},404);
 }catch(e){
  const known=e instanceof AgentError||e instanceof LinkedInError,validation=e instanceof Error&&e.name==='ZodError';
  const message=known?e.message:validation?'Données invalides ou trop longues. Vérifiez les champs.':'Le stockage ou le service de l’agent est indisponible. Aucune publication n’a été confirmée.';
  if(route==='callback'||route==='connect'){
   // Avoid echoing provider errors/codes/credentials into a redirect or URL.
   const res=new NextResponse(`<!doctype html><html lang="fr"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connexion LinkedIn</title><body style="background:#090e18;color:#f4f6f8;font:16px/1.7 system-ui;padding:40px;max-width:640px;margin:auto"><h1>Connexion à reprendre</h1><p>${message.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}</p><a style="color:#d6ff46" href="/studio-social/#agent">Retour au studio</a></body></html>`,{status:known?400:503,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});res.cookies.set('bm_linkedin_oauth','',{maxAge:0,path:'/api/studio-agent',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});return res;
  }
  return json({error:message,code:e instanceof AgentError?e.code:validation?'VALIDATION_ERROR':'AGENT_UNAVAILABLE'},e instanceof AgentError?e.status:e instanceof LinkedInError?400:validation?400:503);
 }
}
export const GET=handler;export const POST=handler;export const PUT=handler;
