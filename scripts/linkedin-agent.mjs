#!/usr/bin/env node
import {readFile,writeFile,mkdir,rename,chmod,open,unlink,stat,readdir,lstat,realpath} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {homedir} from 'node:os';
import {createHmac,randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {z} from 'zod';
import {subscriptionStatus,generateStructured} from './linkedin-agent/codex.mjs';
import {planJsonSchema,profileJsonSchema,profileSchema,checkPlan,promptFor,redact} from './linkedin-agent/quality.mjs';
import {renderPost,chromiumPath} from './linkedin-agent/render.mjs';

export const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const localRoot=process.env.STUDIO_AGENT_LOCAL_DIR?path.resolve(process.env.STUDIO_AGENT_LOCAL_DIR):path.join(repoRoot,'.local','linkedin-agent'),connectionFile=path.join(localRoot,'connection.json');
const execute=promisify(execFile);
const options=()=>{const result={};for(let i=3;i<process.argv.length;i++){const arg=process.argv[i];if(arg.startsWith('--'))result[arg.slice(2)]=process.argv[i+1]?.startsWith('--')||!process.argv[i+1]?true:process.argv[++i];}return result;};

export function normalizeStudioUrl(input){
 const url=new URL(String(input));
 if(url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw Error('Utilisez uniquement l’origine du studio, sans chemin, identifiant ni paramètres.');
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('Le studio doit utiliser HTTPS (HTTP seulement en développement local).');
 return url.origin;
}
const connectionSchema=z.object({token:z.string().min(24).max(512),workerId:z.string().min(1).max(120),studioUrl:z.string().transform(normalizeStudioUrl)});
const productionStudioUrl='https://www.bandmdigitalconsulting.com';

export async function downloadedConnection(directory=path.join(homedir(),'Downloads'),{newerThan=-Infinity}={}){
 let names;
 try{names=await readdir(directory);}catch(error){if(error.code==='ENOENT')return null;throw Error('Le dossier Téléchargements est inaccessible pour la liaison de l’agent.');}
 const candidates=[];
 for(const name of names){
  if(!/^bm-linkedin-worker[^\\/]*\.json$/i.test(name))continue;
  const file=path.join(directory,name),info=await lstat(file).catch(()=>null);
  if(info?.isFile()&&info.size>0&&info.size<=10000&&info.mtimeMs>newerThan)candidates.push({file,modified:info.mtimeMs});
 }
 candidates.sort((a,b)=>b.modified-a.modified);
 if(!candidates.length)return null;
 try{
  const file=await open(candidates[0].file,'r');
  let raw;
  try{const info=await file.stat();if(!info.isFile()||info.size>10000)throw Error('size');raw=await file.readFile('utf8');}finally{await file.close();}
  if(Buffer.byteLength(raw,'utf8')>10000)throw Error('size');
  const connection=connectionSchema.strict().parse(JSON.parse(raw));
  if(connection.studioUrl!==productionStudioUrl)throw Error('origin');
  return connection;
 }catch{throw Error('Le dernier fichier de liaison B&M téléchargé est invalide. Téléchargez une nouvelle liaison depuis le studio de production.');}
}

async function privatePermissions(file){
 if(process.platform==='win32'){
  const {stdout}=await execute('powershell.exe',['-NoProfile','-NonInteractive','-Command','[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value'],{windowsHide:true});
  const sid=stdout.trim();if(!/^S-\d-(?:\d+-)*\d+$/.test(sid))throw Error('Impossible de déterminer les droits du compte Windows.');
  await execute('icacls.exe',[file,'/inheritance:r','/grant:r',`*${sid}:(F)`],{windowsHide:true});
 }else await chmod(file,file===localRoot?0o700:0o600);
}
async function saveConnection(input){
 const connection=connectionSchema.parse({...input,token:input.token||input.workerToken});
 await mkdir(localRoot,{recursive:true,mode:0o700});await privatePermissions(localRoot);
 const temp=path.join(localRoot,`connection-${randomUUID()}.tmp`);
 try{await writeFile(temp,JSON.stringify(connection),{mode:0o600});await privatePermissions(temp);await rename(temp,connectionFile);await privatePermissions(connectionFile);}finally{await unlink(temp).catch(()=>{});}
 return connection;
}
async function readConnection(){
 try{return connectionSchema.parse(JSON.parse(await readFile(connectionFile,'utf8')));}catch(error){if(error.code==='ENOENT')throw Error('Worker non appairé. Dans le studio, téléchargez le fichier de liaison puis lancez : node scripts/linkedin-agent.mjs pair --file <fichier.json>');throw Error('Le fichier de liaison est invalide. Téléchargez une nouvelle liaison depuis le studio.');}
}
export async function pairDownloadedConnection({connectionPath=connectionFile,directory,save=saveConnection}={}){
 const stored=await stat(connectionPath).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 const downloaded=await downloadedConnection(directory,{newerThan:stored?.mtimeMs??-Infinity});
 if(downloaded){await save(downloaded);return{status:stored?'renewed':'paired',studioUrl:downloaded.studioUrl};}
 return{status:stored?'unchanged':'waiting-for-pairing'};
}
async function api(connection,route,body={},extra={}){
 const response=await fetch(connection.studioUrl+'/api/studio-agent/'+route,{method:'POST',headers:{'Content-Type':'application/json',...(connection.token?{Authorization:'Bearer '+connection.token}:{}),...extra.headers},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(extra.timeout||65000)});
 let data;try{data=await response.json();}catch{throw Error(`Le studio ne répond pas au protocole de l’agent (${response.status}). Vérifiez que sa version déployée contient Agent LinkedIn.`);}
 if(!response.ok)throw Error(response.status===401?'Liaison expirée ou révoquée. Téléchargez un nouveau fichier de liaison dans le studio.':redact(data.error||`Erreur studio (${response.status}).`));
 return data;
}

async function pair(opts){
 let connection;
 if(typeof opts.file==='string'){
  const raw=await readFile(path.resolve(opts.file),'utf8');if(Buffer.byteLength(raw,'utf8')>10000)throw Error('Fichier de liaison trop volumineux.');
  let input;try{input=JSON.parse(raw);input=connectionSchema.parse({...input,token:input.token||input.workerToken});}catch{throw Error('Fichier de liaison invalide. Téléchargez une nouvelle liaison depuis le studio.');}
  connection=await saveConnection(input);
 }else{
  const studioUrl=normalizeStudioUrl(opts.studio||'https://www.bandmdigitalconsulting.com');
  try{process.loadEnvFile(path.join(repoRoot,'.env'));}catch{}
  if(!process.env.ADMIN_PASSWORD)throw Error('Téléchargez la liaison dans Agent LinkedIn, puis utilisez pair --file. Aucun mot de passe administrateur local n’est configuré.');
  const session=createHmac('sha256',process.env.ADMIN_PASSWORD).update('bm-digital-consulting-admin').digest('hex');
  const result=await api({studioUrl},'pair',{name:'Agent B&M — '+(process.env.COMPUTERNAME||'ordinateur')},{headers:{Origin:studioUrl,Cookie:'bm_admin_session='+session}});
  connection=await saveConnection({...result,studioUrl});
 }
 console.log(JSON.stringify({paired:true,studioUrl:connection.studioUrl,workerId:connection.workerId,message:'Liaison enregistrée uniquement sur cette machine. Aucun secret affiché.'}));
}

async function doctor(){
 const auth=await subscriptionStatus();let connection;
 try{connection=await readConnection();}catch{}
 let chromiumReady=true;try{await chromiumPath();}catch{chromiumReady=false;}
 const hosted=process.env.STUDIO_AGENT_RUNTIME==='vps';
 const result={codex:auth,paired:!!connection,studioUrl:connection?.studioUrl||null,chromiumReady,execution:hosted?'Le service et son minuteur tournent sur le VPS, indépendamment du PC.':'La machine qui héberge le worker doit être allumée et son planificateur actif.',nextSteps:[]};
 if(!auth.chatgpt)result.nextSteps.push('Exécuter codex login puis choisir la connexion ChatGPT.');
 if(!connection)result.nextSteps.push(hosted?'Importer la liaison privée du studio sur le VPS avec bm-linkedin-as-user worker pair --file <fichier.json>.':'Télécharger la liaison privée du studio dans Téléchargements ; la tâche Codex l’importera à son prochain passage. Import manuel possible avec pair --file <fichier.json>.');
 if(!chromiumReady)result.nextSteps.push('Exécuter npx playwright install chromium sur cet ordinateur.');
 console.log(JSON.stringify(result,null,2));return result;
}

export async function processJob(connection,job,{generate=generateStructured,render=renderPost,request=api}={}){
 const identity={jobId:job.id,leaseToken:job.leaseToken,...(job.accountId?{accountId:job.accountId}:{})};
 let publishing=false;
 try{
  if(job.kind==='plan'){
   const generated=await generate({schema:planJsonSchema,prompt:promptFor('plan',job.payload),workingRoot:localRoot});
   const result=checkPlan(generated.data,job.payload);
   await request(connection,'worker/complete',{...identity,result});
   return {kind:job.kind,status:'prepared',items:result.items.length,humanChecks:result.items.filter(p=>p.needsHuman).length,usage:generated.usage};
  }
  if(job.kind==='profile'){
   const generated=await generate({schema:profileJsonSchema,prompt:promptFor('profile',job.payload),workingRoot:localRoot});
   const result=profileSchema.parse(generated.data);await request(connection,'worker/complete',{...identity,result});
   return {kind:job.kind,status:'recommendations-ready',usage:generated.usage};
  }
  if(job.kind==='publish'){
   const format=job.payload.format;
   if(!['text','png','pdf'].includes(format))throw Error('Format de publication inconnu.');
   const media=format==='text'?undefined:await render(job.payload.post,format,{repoRoot,workingRoot:localRoot});
   const payload={...identity,...(media?{media:{mime:media.mime,base64:media.base64,title:media.title}}:{})};
   publishing=true;
   // Exactly one attempt: a dropped response may still mean LinkedIn accepted the publication.
   const result=await request(connection,'worker/publish',payload);
   return {kind:job.kind,status:result.status,url:result.url,message:result.message};
  }
  throw Error('Type de travail non pris en charge par ce worker.');
 }catch(error){
  const message=redact(error.message).slice(0,800);
  if(publishing)throw Error('Réponse de publication non confirmée. Vérifiez le journal du studio et LinkedIn avant toute relance. '+message);
  await request(connection,'worker/complete',{...identity,error:message}).catch(()=>{});
  throw Error(message);
 }
}

async function run(opts){
 if(opts['auto-pair-download']){
  const pairing=await pairDownloadedConnection();
  if(pairing.status==='waiting-for-pairing'){console.log(JSON.stringify({...pairing,message:'Dans le studio, téléchargez le fichier de liaison B&M dans Téléchargements. Il sera importé au prochain passage.'}));return;}
  if(pairing.status!=='unchanged')console.log(JSON.stringify({...pairing,message:'Liaison téléchargée importée sur cette machine. Aucun secret affiché.'}));
 }
 const connection=await readConnection(),auth=await subscriptionStatus();
 if(opts.studio&&normalizeStudioUrl(opts.studio)!==connection.studioUrl)throw Error('Cette liaison appartient à un autre studio. Réappairez avec le studio voulu.');
 await mkdir(localRoot,{recursive:true,mode:0o700});
 const lockPath=path.join(localRoot,'run.lock');let lock;
 for(let attempt=0;attempt<2;attempt++){
  try{lock=await open(lockPath,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));break;}
  catch(error){
   if(error.code!=='EEXIST')throw error;
   const prior=await readFile(lockPath,'utf8').catch(()=>''),info=await stat(lockPath).catch(()=>null);let stale=false;
   try{const pid=JSON.parse(prior).pid;if(Number.isInteger(pid)&&pid>0){try{process.kill(pid,0);}catch(e){stale=e.code==='ESRCH';}}}catch{stale=!!info&&Date.now()-info.mtimeMs>300000;}
   if(stale&&attempt===0&&(await readFile(lockPath,'utf8').catch(()=>null))===prior){await unlink(lockPath).catch(()=>{});continue;}
   console.log(JSON.stringify({status:'busy',message:'Un cycle est déjà en cours sur cette machine.'}));return;
  }
 }
 try{
  await api(connection,'worker/heartbeat',{workerId:connection.workerId,status:auth.chatgpt?'online':'error',message:redact(auth.message).slice(0,500),subscriptionAuth:auth.chatgpt});
  if(!auth.chatgpt)throw Error(auth.message);
  const completed=[],limit=Math.max(1,Math.min(4,Number(opts['max-jobs'])||4));
  for(let i=0;i<limit;i++){
   const {job}=await api(connection,'worker/claim',{});if(!job)break;
   await api(connection,'worker/heartbeat',{workerId:connection.workerId,status:'busy',message:job.kind==='plan'?'Préparation de la ligne éditoriale.':job.kind==='profile'?'Préparation du profil.':'Préparation de la publication.',subscriptionAuth:true});
   const result=await processJob(connection,job);completed.push(result);
   console.log(JSON.stringify({job:job.id,...(job.accountId?{account:job.accountId}:{}),...result}));
   if(['uncertain','blocked'].includes(result.status))break;
  }
  await api(connection,'worker/heartbeat',{workerId:connection.workerId,status:'online',message:completed.length?`${completed.length} travail(s) traité(s).`:'À jour. Aucun travail à exécuter maintenant.',subscriptionAuth:true});
  console.log(JSON.stringify({status:'complete',jobs:completed.length,studioUrl:connection.studioUrl}));
 }catch(error){await api(connection,'worker/heartbeat',{workerId:connection.workerId,status:'error',message:redact(error.message).slice(0,500),subscriptionAuth:auth.chatgpt}).catch(()=>{});throw error;}
 finally{await lock.close();await unlink(lockPath).catch(()=>{});}
}

export function draftParameters(opts={}){
 const accountId=opts.account||'organization';if(!['person','organization'].includes(accountId))throw Error('Le compte doit être person ou organization.');
 const days=opts.days===undefined?7:Number(opts.days);if(!Number.isInteger(days)||days<1||days>7)throw Error('Le plan doit comporter entre 1 et 7 jours.');
 const start=opts.start||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(Date.parse(start+'T12:00:00Z'))||new Date(start+'T12:00:00Z').toISOString().slice(0,10)!==start)throw Error('La date de départ doit être une date réelle au format YYYY-MM-DD.');
 const slots=Array.from({length:days},(_,i)=>({day:new Date(Date.parse(start+'T12:00:00Z')+i*86400000).toISOString().slice(0,10),publishAt:''}));
 return{accountId,start,slots};
}
async function draft(opts){
 const {accountId,start,slots}=draftParameters(opts);
 const strategy=JSON.parse(await readFile(path.join(repoRoot,'studio-social','content','strategy.json'),'utf8'));
 const playbook=JSON.parse(await readFile(path.join(repoRoot,'studio-social','content','linkedin-playbook.json'),'utf8'));
 const {buildEditorialStrategy}=await import('../shared/linkedin-strategy.mjs');
 let recentPosts=[];
 if(opts.recent){
  const file=path.resolve(opts.recent),info=await stat(file);if(info.size>500000)throw Error('L’historique de prévisualisation doit rester sous 500 Ko.');
  const previous=JSON.parse(await readFile(file,'utf8')),items=Array.isArray(previous)?previous:previous.items||previous.recentPosts;
  if(!Array.isArray(items))throw Error('L’historique doit être un plan précédent ou une liste de publications.');
  recentPosts=items.slice(-60).map(item=>({accountId:item.accountId||previous.accountId,status:item.status||'draft',title:item.post?.title||item.title||'',caption:item.post?.caption||item.caption||'',publishedAt:item.publishedAt,editorial:item.editorial||previous.editorial?.briefs?.find(brief=>brief.id===item.briefId)}));
 }
 const config={targetType:accountId,targetUrl:accountId==='organization'?'https://www.linkedin.com/company/bandmdigitalconsulting/':'',mode:'autopilot',objective:playbook.primaryGoal,voice:strategy.voice,facts:strategy.facts,pillars:strategy.pillars,excludedTopics:[],commercialFocus:'balanced',targetAudience:'mixed',campaignStart:start};
 const editorial=buildEditorialStrategy({playbook,accountId,config,slots,recentPosts,queue:[],now:new Date()});
 const payload={strategy,config,editorial,slots,recentPosts};
 const generated=await generateStructured({schema:planJsonSchema,prompt:promptFor('plan',payload),workingRoot:localRoot});
 const result=checkPlan(generated.data,payload),output=path.resolve(opts.out||path.join(localRoot,'draft-preview.json'));await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify({accountId,editorial,...result},null,2),{mode:0o600});
 console.log(JSON.stringify({status:'draft-only',accountId,start,posts:result.items.length,humanChecks:result.items.filter(x=>x.needsHuman).length,output,usage:generated.usage,message:'Aucun appel LinkedIn, aucune publication, aucune écriture dans le studio.'}));
}

async function render(opts){
 if(!opts.file)throw Error('Utilisez render --file <publication.json> [--format png|pdf] [--out <fichier>].');
 const source=JSON.parse(await readFile(path.resolve(opts.file),'utf8')),post=source.items?.[0]?.post||source.post||source;
 const format=opts.format||'png',media=await renderPost(post,format,{repoRoot,workingRoot:localRoot});
 const out=path.resolve(opts.out||path.join(localRoot,'post-preview.'+format));await mkdir(path.dirname(out),{recursive:true});await writeFile(out,Buffer.from(media.base64,'base64'));
 console.log(JSON.stringify({output:out,bytes:media.bytes,mime:media.mime}));
}

export async function main(){
 const command=process.argv[2]||'doctor',opts=options();
 if(command==='doctor')return doctor();if(command==='pair')return pair(opts);if(command==='run')return run(opts);if(command==='draft')return draft(opts);if(command==='render')return render(opts);
 if(command==='help'){console.log('Agent LinkedIn B&M\n  doctor\n  pair --file <liaison.json>\n  pair --studio <origine HTTPS>  (mot de passe local)\n  run [--auto-pair-download] [--max-jobs 4]\n  draft [--days 7] [--account person|organization] [--start YYYY-MM-DD] [--out <plan.json>] [--recent <plan-ou-historique.json>]  (local, aucun envoi)\n  render --file <post-ou-plan.json> --format png|pdf [--out <fichier>]');return;}
 throw Error('Commande inconnue. Utilisez help.');
}
const entryPath=process.argv[1]?await realpath(path.resolve(process.argv[1])).catch(()=>path.resolve(process.argv[1])):null;
if(entryPath&&import.meta.url===pathToFileURL(entryPath).href)main().catch(error=>{console.error(redact(error.message));process.exitCode=1;});
