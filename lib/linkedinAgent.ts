import {AsyncLocalStorage} from 'node:async_hooks';
import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID,scryptSync,timingSafeEqual} from 'node:crypto';
import {get,put,BlobNotFoundError,BlobPreconditionFailedError} from '@vercel/blob';
import {z} from 'zod';
import {prisma} from '@/lib/db';
import {postsSchema,type SocialPost} from '@/lib/socialStudio';
import strategy from '@/studio-social/content/strategy.json';
import playbook from '@/studio-social/content/linkedin-playbook.json';
import {buildEditorialStrategy,type EditorialBrief,type EditorialStrategy} from '@/shared/linkedin-strategy.mjs';
import {exchangeLinkedInCode,refreshLinkedInToken,verifyLinkedInTarget,uploadLinkedInMedia,publishLinkedInPost,getLinkedInPost,getLinkedInAnalytics,LinkedInError,type PublishMedia} from '@/lib/linkedinClient';

const pathname='bm-social-studio/linkedin-agent-v1.json';
const vpsStore=()=>process.env.STUDIO_AGENT_STORE_URL;
async function storeRequest(method:string,body?:string,etag?:string){const url=new URL(vpsStore()!);if(url.protocol!=='https:')throw new AgentError('Le stockage VPS doit utiliser HTTPS.',503);const key=process.env.STUDIO_AGENT_STORE_TOKEN;if(!key)throw new AgentError('Liaison du stockage VPS absente.',503);const r=await fetch(url,{method,headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json',...(etag?{'If-Match':etag}:{'If-None-Match':'*'})}:{})},...(body?{body}:{}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(r.status===412)throw Error('CONFLICT');if(!r.ok&&r.status!==404)throw new AgentError('Stockage VPS indisponible ('+r.status+').',503);return r;}
const token=()=>process.env.BLOB_READ_WRITE_TOKEN??process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
const statuses=['draft','scheduled','publishing','published','blocked','uncertain','rejected'] as const;
type QueueStatus=typeof statuses[number];
const sourceUrl=z.string().url().max(500).refine(v=>new URL(v).protocol==='https:');
const campaignDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const stamp=Date.parse(v+'T12:00:00Z');return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===v;});
const feedbackSchema=z.object({qualifiedConversations:z.number().int().min(0).max(999),meetings:z.number().int().min(0).max(999),opportunities:z.number().int().min(0).max(999),notes:z.string().max(1000).default('')});
const configSchema=z.object({
 commercialFocus:z.enum(['balanced','consulting','build']),targetAudience:z.enum(['mixed','it','business']),campaignStart:campaignDate,
 targetType:z.enum(['organization','person']),targetUrl:z.string().max(300).refine(v=>{if(!v)return true;let u:URL;try{u=new URL(v);}catch{return false;}return u.protocol==='https:'&&['linkedin.com','www.linkedin.com'].includes(u.hostname)&&/^\/(company|in)\/[\w%-]+\/?$/.test(u.pathname);}),
 organizationUrn:z.string().max(100).refine(v=>!v||/^urn:li:organization:\d+$/.test(v)),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),timezone:z.string().max(60).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true;}catch{return false;}}),
 mode:z.enum(['autopilot','review']),enabled:z.boolean(),publishWindowMinutes:z.number().int().min(15).max(180),objective:z.string().min(1).max(1500),voice:z.string().max(1000),facts:z.array(z.string().min(1).max(500)).max(40),pillars:z.array(z.string().min(1).max(200)).min(1).max(12),excludedTopics:z.array(z.string().max(160)).max(30)
});
export type AgentConfig=z.infer<typeof configSchema>;
export type SalesFeedback=z.infer<typeof feedbackSchema>&{updatedAt:string;source:'manual'};
export type QueueItem={editorial?:EditorialBrief;salesFeedback?:SalesFeedback;id:string;day:string;publishAt:string;post:SocialPost;format?:'png'|'pdf'|'text';status:QueueStatus;rationale:string;sourceUrls:string[];humanReason:string;error?:string;linkedinUrn?:string;linkedinUrl?:string;publishedAt?:string;fingerprint:string;publishJobId?:string;authorKey?:string;authorUrn?:string;mediaUrn?:string};
type Job={editorial?:EditorialStrategy;id:string;kind:'plan'|'publish'|'profile';status:'queued'|'running'|'completed'|'failed';createdAt:string;finishedAt?:string;message?:string;itemId?:string;leaseHash?:string;leaseExpiresAt?:string;phase?:'rendering'|'uploading'|'sending';slots?:{day:string;publishAt:string}[]};
type BrowserTarget={accountId:AccountId;targetKey:string;profileUrl:string;organizationId?:string;adminUrl?:string};
type BrowserConnection={sessionReady:boolean;verifiedAt:string;lastError:string;targetKey:string;profileUrl:string;organizationId?:string;adminUrl?:string};
type Connection={provider?:'linkedin-oauth'|'hermes-browser';browser?:BrowserConnection;connected:boolean;targetConfirmed:boolean;displayName:string;targetName:string;authorUrn:string;memberUrn:string;expiresAt:string;scopes:string[]};
type Journal={id:string;at:string;level:'info'|'warning'|'error';message:string};
type AgentDocument={version:1;revision:number;config:AgentConfig;connection:Connection;secrets:{clientId?:string;clientSecret?:string;access?:string;refresh?:string;refreshExpiresAt?:string};worker:{id?:string;tokenHash?:string;name?:string;lastSeenAt?:string;status:string;message:string;subscriptionAuth:boolean};queue:QueueItem[];jobs:Job[];journal:Journal[];oauth?:{hash:string;expiresAt:string;fingerprint:string;application:string;scopes:string[]};analytics:{updatedAt?:string;attemptedAt?:string;metrics:{key:string;label:string;value:number}[];message:string};profile:{updatedAt?:string;headline?:string;about?:string;recommendations:string[];summary?:string}};
export class AgentError extends Error {constructor(message:string,public status=400,public code='AGENT_ERROR'){super(message);this.name='AgentError';}}
const nowIso=()=>new Date().toISOString();
export type AccountId='organization'|'person';
const accountContext=new AsyncLocalStorage<AccountId>();
export function accountId(value:unknown):AccountId {if(value===undefined||value===null||value==='')return 'organization';if(value==='organization'||value==='person')return value;throw new AgentError('Compte LinkedIn inconnu.');}
export function withAgentAccount<T>(id:AccountId,operation:()=>T):T{return accountContext.run(id,operation);}
const selectedAccount=()=>accountContext.getStore()||'organization';
type AgentStore={version:2;revision:number;accounts:Record<AccountId,AgentDocument>;worker:AgentDocument['worker'];app:{clientId?:string;clientSecret?:string}};
const legacyPersonalVoice='Écrire à la première personne comme un consultant et dirigeant B&M. Partager un point de vue concret, des enseignements et des questions de terrain. Aucun copier-coller des publications de la page entreprise. '+strategy.voice;
const personalVoice='Écrire à la première personne depuis le profil professionnel d’Ines Favre, CEO Office Associate chez B&M Digital Consulting. Exprimer un point de vue concret sur la coordination et les décisions de travail, sans inventer une fonction de dirigeante, une mission de consultante ou une expérience vécue. Aucun copier-coller des publications de la page entreprise. '+strategy.voice;
const verifiedPersonalRole='Le profil professionnel utilisé est celui d’Ines Favre, CEO Office Associate chez B&M Digital Consulting.';
export function initialAgent(id:AccountId=selectedAccount()):AgentDocument{const doc:AgentDocument={version:1,revision:0,config:{commercialFocus:'balanced',targetAudience:'mixed',campaignStart:dayAt(new Date(),'Europe/Paris'),targetType:'organization',targetUrl:'https://www.linkedin.com/company/bandmdigitalconsulting/',organizationUrn:'',time:'09:00',timezone:'Europe/Paris',mode:'autopilot',enabled:false,publishWindowMinutes:120,objective:strategy.objective,voice:strategy.voice,facts:[...strategy.facts],pillars:[...strategy.pillars],excludedTopics:['Résultats clients non vérifiés','Promesses de performance','Sujets politiques partisans']},connection:{connected:false,targetConfirmed:false,displayName:'',targetName:'',authorUrn:'',memberUrn:'',expiresAt:'',scopes:[]},secrets:{},worker:{status:'offline',message:'Le service d’exécution n’est pas encore relié.',subscriptionAuth:false},queue:[],jobs:[],journal:[],analytics:{metrics:[],message:'Aucune statistique LinkedIn collectée.'},profile:{recommendations:[]}};if(id==='person'){doc.config.targetType='person';doc.config.targetUrl='';doc.config.time='10:00';doc.config.voice=personalVoice;}return doc;}
function ensureStrategyConfig(d:AgentDocument){d.config.commercialFocus??='balanced';d.config.targetAudience??='mixed';d.config.campaignStart??=dayAt(new Date(),d.config.timezone||'Europe/Paris');}
function storeDocument(value?:AgentStore|AgentDocument):AgentStore{if(value?.version===2){Object.values(value.accounts).forEach(ensureStrategyConfig);return value;}const organization=initialAgent('organization'),person=initialAgent('person');const accounts={organization,person};if(value){ensureStrategyConfig(value);accounts[value.config.targetType]=value;}return{version:2,revision:value?.revision||0,accounts,worker:value?.worker||organization.worker,app:{clientId:value?.secrets.clientId,clientSecret:value?.secrets.clientSecret}};}
function scopedDocument(store:AgentStore){const d=store.accounts[selectedAccount()];d.revision=store.revision;d.worker=store.worker;d.secrets.clientId=store.app.clientId;d.secrets.clientSecret=store.app.clientSecret;return d;}
function conflict(error:unknown){return error instanceof BlobPreconditionFailedError||/CONFLICT|precondition failed|etag mismatch|already exists/i.test(error instanceof Error?error.message:'');}
async function readAgent():Promise<{document:AgentDocument;etag?:string;store:AgentStore}>{
 let raw:AgentStore|AgentDocument|undefined,etag:string|undefined;
 if(vpsStore()){const r=await storeRequest('GET');if(r.status===404)throw new AgentError('État VPS absent : restaurer avant de démarrer.',503);raw=await r.json();etag=r.headers.get('etag')||undefined;}else if(token()){
  try{const r=await get(pathname,{access:'private',token:token(),useCache:false,headers:{'Accept-Encoding':'identity'}});if(r?.statusCode===200){raw=JSON.parse(await new Response(r.stream).text());etag=r.blob.etag;}}catch(e){if(!(e instanceof BlobNotFoundError))throw e;}
 }else{
  if(!process.env.DATABASE_URL)throw new AgentError('Stockage persistant indisponible. Configurez Vercel Blob privé ou PostgreSQL avant de relier l’agent.',503,'STORAGE_UNAVAILABLE');
  await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "LinkedInAgentDocument" ("id" TEXT PRIMARY KEY,"data" JSONB NOT NULL,"revision" INTEGER NOT NULL DEFAULT 0)`;
  const rows=await prisma.$queryRaw<{data:AgentStore|AgentDocument}[]>`SELECT "data" FROM "LinkedInAgentDocument" WHERE "id"='main'`;
  raw=rows[0]?.data;
 }
 const store=storeDocument(raw);return{document:scopedDocument(store),etag,store};
}
async function writeAgent(document:AgentDocument,revision:number,etag:string|undefined,store:AgentStore){
 const appChanged=store.app.clientId!==document.secrets.clientId||store.app.clientSecret!==document.secrets.clientSecret;
 store.revision=revision+1;document.revision=store.revision;store.accounts[selectedAccount()]=document;store.worker=document.worker;store.app={clientId:document.secrets.clientId,clientSecret:document.secrets.clientSecret};
 if(appChanged)for(const id of ['organization','person'] as const)if(id!==selectedAccount()){const d=store.accounts[id];d.config.enabled=false;d.connection.connected=false;d.connection.authorUrn='';delete d.secrets.access;delete d.secrets.refresh;delete d.oauth;for(const q of d.queue)if(['scheduled','draft','blocked'].includes(q.status)){q.status='blocked';q.error='L’application LinkedIn a changé. Reconnectez ce compte et relisez les publications.';}log(d,'Application LinkedIn modifiée. Reconnexion du compte nécessaire.','warning');}
 if(vpsStore())await storeRequest('PUT',JSON.stringify(store),etag);
 else if(token())await put(pathname,JSON.stringify(store),{access:'private',token:token(),contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60,...(etag?{ifMatch:etag,allowOverwrite:true}:{allowOverwrite:false})});
 else{
  const count=await prisma.$executeRaw`INSERT INTO "LinkedInAgentDocument" ("id","data","revision") VALUES ('main',${JSON.stringify(store)}::jsonb,${store.revision}) ON CONFLICT ("id") DO UPDATE SET "data"=EXCLUDED."data","revision"=EXCLUDED."revision" WHERE "LinkedInAgentDocument"."revision"=${revision}`;
  if(count!==1)throw Error('CONFLICT');
 }
}
async function mutate<T>(change:(document:AgentDocument,store:AgentStore)=>T):Promise<T>{
 for(let i=0;i<4;i++){
  const {document,etag,store}=await readAgent(),revision=store.revision;
  const result=change(document,store);
  try{await writeAgent(document,revision,etag,store);return result;}catch(e){if(!conflict(e))throw e;if(i===3)throw new AgentError('Une autre action a modifié l’agent. Réessayez.',409,'AGENT_CONFLICT');}
 }
 throw new AgentError('Modification concurrente.',409);
}
function log(d:AgentDocument,message:string,level:Journal['level']='info'){d.journal.unshift({id:randomUUID(),at:nowIso(),level,message:message.slice(0,700)});d.journal=d.journal.slice(0,150);}
function hash(value:string){return createHash('sha256').update(value).digest('hex');}
function same(a:string,b:string){const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length===bb.length&&timingSafeEqual(aa,bb);}
function secretKey(){const secret=process.env.LINKEDIN_ENCRYPTION_KEY||process.env.ADMIN_PASSWORD;if(!secret)throw new AgentError('La clé de chiffrement du studio n’est pas configurée.',503);return scryptSync(secret,'bm-studio/linkedin-secrets/v1',32);}
export function seal(value:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secretKey(),iv);const body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),body.toString('base64url')].join('.');}
function unseal(value:string){try{const [version,iv,tag,body]=value.split('.');if(version!=='v1')throw Error();const cipher=createDecipheriv('aes-256-gcm',secretKey(),Buffer.from(iv,'base64url'));cipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([cipher.update(Buffer.from(body,'base64url')),cipher.final()]).toString('utf8');}catch{throw new AgentError('Les autorisations chiffrées ne peuvent plus être lues. Reconnectez LinkedIn.',409,'RECONNECT_REQUIRED');}}
function credentials(d:AgentDocument){return{clientId:process.env.LINKEDIN_CLIENT_ID||d.secrets.clientId||'',clientSecret:process.env.LINKEDIN_CLIENT_SECRET||(d.secrets.clientSecret?unseal(d.secrets.clientSecret):'')};}
function applicationFingerprint(d:AgentDocument){const c=credentials(d);return hash(c.clientId+'|'+c.clientSecret);}
function targetFingerprint(c:AgentConfig){return hash([c.targetType,c.targetUrl,c.organizationUrn].join('|'));}
export function studioBase(){const raw=process.env.STUDIO_PUBLIC_URL||'https://www.bandmdigitalconsulting.com';const url=new URL(raw);if(url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&['localhost','127.0.0.1'].includes(url.hostname)))throw new AgentError('Adresse du studio invalide.',503);return url.origin;}
export function callbackUrl(){return studioBase()+'/api/studio-agent/callback';}
export function dayAt(date:Date,timezone:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return`${p.year}-${p.month}-${p.day}`;}
function localParts(date:Date,timezone:string){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));return`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
function addDay(day:string,n=1){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
/** Resolve civil time without assuming a fixed UTC offset. Fall-back chooses the first occurrence; a skipped minute advances to the next valid one. */
export function dailySlot(day:string,time:string,timezone:string){
 const nominal=Date.parse(`${day}T${time}:00Z`),target=`${day}T${time}`;
 if(!Number.isFinite(nominal))throw new AgentError('Date de publication invalide.');
 let candidate=nominal;
 for(let i=0;i<4;i++){const local=localParts(new Date(candidate),timezone);const delta=Date.parse(local+':00Z')-nominal;if(!delta)break;candidate-=delta;}
 const possibilities=[candidate-3600000,candidate,candidate+3600000].filter(t=>localParts(new Date(t),timezone)===target);
 if(possibilities.length)return new Date(Math.min(...possibilities)).toISOString();
 // DST gap: select the first real local minute after the requested one, never yesterday/tomorrow.
 for(let t=nominal-14*3600000;t<=nominal+14*3600000;t+=60000){const local=localParts(new Date(t),timezone);if(local.startsWith(day)&&local>=target)return new Date(t).toISOString();}
 throw new AgentError('Ce créneau ne peut pas être résolu dans le fuseau choisi.');
}
export function nextRun(config:AgentConfig,now=new Date()){let day=dayAt(now,config.timezone),slot=dailySlot(day,config.time,config.timezone);if(Date.parse(slot)<=now.getTime())slot=dailySlot(addDay(day),config.time,config.timezone);return slot;}
function slotsFor(d:AgentDocument,now=new Date()){
 let day=dayAt(now,d.config.timezone);if(Date.parse(dailySlot(day,d.config.time,d.config.timezone))<=now.getTime())day=addDay(day);
 if(d.config.campaignStart&&day<d.config.campaignStart)day=d.config.campaignStart;
 const slots:{day:string;publishAt:string}[]=[];
 for(let i=0;slots.length<7&&i<60;i++,day=addDay(day)){if(!d.queue.some(q=>q.day===day&&q.status!=='rejected'))slots.push({day,publishAt:dailySlot(day,d.config.time,d.config.timezone)});}
 return slots;
}
function recentPostsFor(store:AgentStore){return Object.entries(store.accounts).flatMap(([accountId,a])=>a.queue.filter(q=>q.status!=='rejected').slice(-30).map(q=>({accountId,status:q.status,title:q.post.title,caption:q.post.caption,publishedAt:q.publishedAt,editorial:q.editorial})));}
function editorialFor(d:AgentDocument,store:AgentStore,slots=slotsFor(d),now=new Date()):EditorialStrategy{return buildEditorialStrategy({playbook,accountId:selectedAccount(),config:d.config,slots,recentPosts:recentPostsFor(store),queue:d.queue,now});}
export function postFingerprint(post:SocialPost){return hash(post.caption.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,''));}
function assess(post:SocialPost,config:AgentConfig,needsHuman=false,reason=''){
 const issues:string[]=[];const all=[post.caption,...post.slides.flatMap(s=>[s.title,s.body,...s.points])].join(' ');
 if(!post.caption.trim()||post.caption.length>3000)issues.push('Légende LinkedIn à ajuster (1 à 3 000 caractères).');
 if(needsHuman)issues.push(reason||'Le rédacteur demande une vérification humaine.');
 if(/\p{Extended_Pictographic}/u.test(all))issues.push('Retirer les emoji pour respecter la charte B&M.');
 const numericClaims=all.match(/\d+(?:[.,]\d+)?\s*(?:%|€|euros|clients|entreprises|utilisateurs)/gi)||[];
 for(const claim of numericClaims)if(!config.facts.some(f=>f.toLowerCase().includes(claim.toLowerCase())))issues.push(`Confirmer la donnée : ${claim}.`);
 for(const excluded of config.excludedTopics)if(excluded.length>5&&all.toLowerCase().includes(excluded.toLowerCase()))issues.push('Le contenu reprend un sujet exclu du brief.');
 return [...new Set(issues)].join(' ');
}
function refreshAvailable(d:AgentDocument){return !!d.secrets.refresh&&Date.parse(d.secrets.refreshExpiresAt||'')>Date.now();}
const browserProfile='https://www.linkedin.com/in/ines-favre-424651436/';
const browserOrganization='106357560';
function canonicalLinkedIn(value:string){try{const u=new URL(value);if(u.protocol!=='https:'||!['www.linkedin.com','linkedin.com'].includes(u.hostname)||u.username||u.password||u.port||u.search||u.hash)return '';return 'https://www.linkedin.com'+u.pathname.replace(/\/+$/,'')+'/';}catch{return '';}}
function browserTarget(d:AgentDocument):BrowserTarget{const b=d.connection.browser;if(d.connection.provider!=='hermes-browser'||!b)throw new AgentError('La connexion navigateur de ce compte est absente.',409);return{accountId:d.config.targetType,targetKey:b.targetKey,profileUrl:b.profileUrl,...(b.organizationId?{organizationId:b.organizationId,adminUrl:b.adminUrl}:{} )};}
function browserFresh(d:AgentDocument){const b=d.connection.browser;return !!(d.connection.connected&&d.connection.targetConfirmed&&b?.sessionReady&&Date.parse(b.verifiedAt)>Date.now()-26*3600000&&d.worker.subscriptionAuth&&Date.parse(d.worker.lastSeenAt||'')>Date.now()-2*3600000);}
function capabilities(d:AgentDocument){if(d.connection.provider==='hermes-browser')return{publish:browserFresh(d),analytics:false,comments:false,profileEdit:false};const active=d.connection.connected&&(Date.parse(d.connection.expiresAt)>Date.now()||refreshAvailable(d));return{publish:active&&d.connection.targetConfirmed&&!!d.connection.authorUrn&&d.connection.scopes.includes(d.config.targetType==='organization'?'w_organization_social':'w_member_social'),analytics:active&&d.config.targetType==='organization'&&d.connection.scopes.includes('rw_organization_admin'),comments:false,profileEdit:false};}
function blockers(d:AgentDocument,storageReady=true){
 const out:string[]=[];if(!storageReady)out.push('Stockage persistant indisponible : aucune activation ni sauvegarde serveur.');
 if(d.connection.provider==='hermes-browser'){
  if(!d.connection.connected||!d.connection.browser?.sessionReady)out.push(d.connection.browser?.lastError||'Reconnecter la session LinkedIn du navigateur Hermes.');
  else if(Date.parse(d.connection.browser.verifiedAt)<=Date.now()-26*3600000)out.push('Le moteur doit revérifier la session et les deux destinataires LinkedIn.');
 }else{
  let creds;try{creds=credentials(d);}catch(e){out.push((e as Error).message);}
  if(!creds?.clientId||!creds.clientSecret)out.push('Renseigner le Client ID et le Client Secret de l’application LinkedIn.');
  if(!d.connection.connected)out.push('Connecter LinkedIn et vérifier le compte cible.');else if(!d.connection.targetConfirmed)out.push('Confirmer que le profil personnel connecté est bien le destinataire.');else if(Date.parse(d.connection.expiresAt)<=Date.now()&&!refreshAvailable(d))out.push('Autorisation LinkedIn expirée : reconnecter le compte.');else if(!capabilities(d).publish)out.push('Permission de publication LinkedIn manquante.');
 }
 if(!d.worker.tokenHash)out.push('Relier le service d’exécution utilisant l’abonnement ChatGPT.');else if(!d.worker.subscriptionAuth)out.push('Le moteur doit confirmer sa connexion Codex avec ChatGPT.');else if(!d.worker.lastSeenAt||Date.now()-Date.parse(d.worker.lastSeenAt)>2*3600000)out.push('Le service d’exécution n’a pas donné signe de vie depuis plus de deux heures.');return out;
}
function publicState(d:AgentDocument,store:AgentStore,storageReady=true){let configured=false;try{const c=credentials(d);configured=!!c.clientId&&!!c.clientSecret;}catch{}return{editorial:editorialFor(d,store),accountId:selectedAccount(),config:d.config,connection:{...d.connection,clientConfigured:configured,redirectUri:callbackUrl()},worker:{paired:!!d.worker.tokenHash,id:d.worker.id,name:d.worker.name,lastSeenAt:d.worker.lastSeenAt,status:d.worker.status,message:d.worker.message,subscriptionAuth:d.worker.subscriptionAuth},queue:d.queue,jobs:d.jobs.map(({leaseHash,...j})=>j),journal:d.journal,capabilities:capabilities(d),blockers:blockers(d,storageReady),storageReady,revision:d.revision,analytics:d.analytics,profile:d.profile,nextRunAt:nextRun(d.config)};}
export async function agentState(){
 let store:AgentStore,storageReady=true;try{store=(await readAgent()).store;}catch{store=storeDocument();storageReady=false;}
 const selected=selectedAccount(),state=publicState(scopedDocument(store),store,storageReady);
 const accounts=(['organization','person'] as const).map(id=>{const d=store.accounts[id];return{id,label:id==='organization'?'Page B&M':'Profil professionnel',enabled:d.config.enabled,connected:d.connection.connected,targetName:d.connection.targetName,nextRunAt:nextRun(d.config),pendingCount:d.queue.filter(q=>['draft','scheduled','blocked','uncertain'].includes(q.status)).length};});
 return{...state,selectedAccountId:selected,accounts};
}
export async function configureAgent(input:unknown){
 const extra=z.object({linkedinClientId:z.string().max(300).optional(),linkedinClientSecret:z.string().max(2000).optional()}).passthrough().parse(input);
 return mutate(d=>{
  const previous=d.config,next=configSchema.parse({...d.config,...extra});
  if(next.targetType!==selectedAccount())throw new AgentError('Le type de compte ne peut pas être modifié. Sélectionnez le compte correspondant.');
  if(next.targetType==='organization'&&(!next.targetUrl||!new URL(next.targetUrl).pathname.startsWith('/company/')))throw new AgentError('La cible entreprise doit être une page /company/.');
  if(next.targetType==='person'&&next.targetUrl&&!new URL(next.targetUrl).pathname.startsWith('/in/'))throw new AgentError('La cible personnelle doit être un profil /in/.');
  const changed=targetFingerprint(previous)!==targetFingerprint(next),appChanged=!!(extra.linkedinClientId&&extra.linkedinClientId!==d.secrets.clientId)||!!extra.linkedinClientSecret;
  if(extra.linkedinClientId)d.secrets.clientId=extra.linkedinClientId.trim();if(extra.linkedinClientSecret)d.secrets.clientSecret=seal(extra.linkedinClientSecret);
  d.config=next;
  if(!changed&&(previous.time!==next.time||previous.timezone!==next.timezone))for(const q of d.queue)if(['scheduled','draft'].includes(q.status)&&Date.parse(q.publishAt)>Date.now())q.publishAt=dailySlot(q.day,next.time,next.timezone);
  if(changed||appChanged){delete d.oauth;d.config.enabled=false;d.connection.connected=false;d.connection.authorUrn='';delete d.secrets.access;delete d.secrets.refresh;for(const q of d.queue)if(['scheduled','draft','blocked'].includes(q.status)){q.status='blocked';q.error='La cible ou l’application LinkedIn a changé. Relire avant reprogrammation.';}log(d,'Cible ou application modifiée. Une nouvelle connexion LinkedIn est nécessaire.','warning');}
  if(d.config.enabled){if(!capabilities(d).publish)throw new AgentError('Connectez LinkedIn avec la permission de publication avant d’activer le quotidien.');if(!d.worker.tokenHash||!d.worker.subscriptionAuth)throw new AgentError('Reliez le service d’exécution et vérifiez sa connexion ChatGPT avant l’activation.');}
  log(d,d.config.enabled?'Le quotidien LinkedIn est activé.':'Paramètres de l’agent enregistrés.');return{ok:true};
 });
}
function enqueue(d:AgentDocument,kind:'plan'|'profile',store:AgentStore,now=new Date()){
 if(d.jobs.some(j=>j.kind===kind&&['queued','running'].includes(j.status)))return;
 const slots=kind==='plan'?slotsFor(d,now):undefined;
 d.jobs.unshift({id:randomUUID(),kind,status:'queued',createdAt:now.toISOString(),...(slots?{slots,editorial:editorialFor(d,store,slots,now)}:{})});d.jobs=d.jobs.slice(0,80);log(d,kind==='plan'?'Préparation de sept publications demandée.':'Diagnostic éditorial du profil demandé.');
}
export async function agentCommand(input:unknown){
 const cmd=z.object({action:z.enum(['plan','run','pause','approve','reject','retry','analytics','profile','disconnect','update','resolve','enqueue','confirm-target','feedback']),feedback:feedbackSchema.optional(),authorUrn:z.string().max(150).optional(),itemId:z.string().max(100).optional(),caption:z.string().max(3000).optional(),post:z.unknown().optional(),format:z.enum(['image','document','text']).optional(),publishAt:z.string().datetime().optional(),linkedinUrn:z.string().max(150).optional()}).parse(input);
 if(cmd.action==='analytics')return collectAnalytics();
 if(cmd.action==='resolve')return resolveUncertain(cmd.itemId||'',cmd.linkedinUrn||'');
 return mutate((d,store)=>{
  if(cmd.action==='confirm-target'){if(!d.connection.connected||cmd.authorUrn!==d.connection.authorUrn)throw new AgentError('Le profil connecté a changé.');d.connection.targetConfirmed=true;log(d,'Profil connecté confirmé comme destinataire : '+d.connection.targetName);return{ok:true};}
  if(cmd.action==='plan'||cmd.action==='profile'){enqueue(d,cmd.action,store);return{ok:true,message:'Demande enregistrée. Le service d’exécution la prendra au prochain passage.'};}
  if(cmd.action==='pause'){d.config.enabled=false;log(d,'Le quotidien a été mis en pause.');return{ok:true};}
  if(cmd.action==='disconnect'){d.config.enabled=false;d.connection=initialAgent().connection;delete d.secrets.access;delete d.secrets.refresh;log(d,'Compte LinkedIn déconnecté.');return{ok:true};}
  if(cmd.action==='run'){if(!d.queue.some(q=>q.status==='scheduled'))enqueue(d,'plan',store);log(d,'Cycle demandé. Le moteur respecte le créneau quotidien et les contrôles.');return{ok:true};}
  if(cmd.action==='enqueue'){
   const post=postsSchema.parse([cmd.post])[0],fingerprint=postFingerprint(post);
   if(Object.values(store.accounts).some(a=>a.queue.some(q=>q.fingerprint===fingerprint&&q.status!=='rejected')))throw new AgentError('Cette publication est déjà dans le calendrier LinkedIn.');
   const slot=slotsFor(d)[0];if(!slot)throw new AgentError('Aucun créneau disponible sur les soixante prochains jours.');
   const id=`li-${selectedAccount()}-${slot.day}-${randomUUID().slice(0,8)}`,format=cmd.format==='text'?'text':cmd.format==='document'?'pdf':cmd.format==='image'?'png':post.slides.length>1?'pdf':'png',humanReason=assess(post,d.config);
   post.id=id;post.date=slot.day;d.queue.push({id,...slot,post,format,status:humanReason||d.config.mode==='review'?'draft':'scheduled',rationale:'Ajouté depuis la bibliothèque du studio.',sourceUrls:[],humanReason,fingerprint});log(d,`Ajout au calendrier LinkedIn : ${post.title}`);return{ok:true,itemId:id,publishAt:slot.publishAt};
  }
  const q=d.queue.find(q=>q.id===cmd.itemId);if(!q)throw new AgentError('Publication introuvable.',404);
  if(cmd.action==='feedback'){if(q.status!=='published')throw new AgentError('Les retours commerciaux concernent uniquement les publications déjà publiées.');if(!cmd.feedback)throw new AgentError('Renseignez les retours commerciaux observés.');q.salesFeedback={...cmd.feedback,updatedAt:nowIso(),source:'manual'};log(d,`Retours commerciaux saisis manuellement pour « ${q.post.title} » : ${cmd.feedback.qualifiedConversations} conversations qualifiées, ${cmd.feedback.meetings} rendez-vous, ${cmd.feedback.opportunities} opportunités.`);return{ok:true};}
  if(['published','publishing','uncertain'].includes(q.status))throw new AgentError('Cette publication est envoyée, en cours ou à résultat incertain. Aucune modification ni nouvelle tentative automatique.',409);
  if(cmd.action==='reject'){q.status='rejected';log(d,`Publication écartée : ${q.post.title}`);return{ok:true};}
  if(cmd.action==='update'){
   if(cmd.post)q.post=postsSchema.parse([cmd.post])[0];if(cmd.caption!==undefined)q.post.caption=cmd.caption;
   if(cmd.publishAt){const time=Date.parse(cmd.publishAt);if(time<=Date.now())throw new AgentError('Choisissez un créneau futur.');const day=dayAt(new Date(time),d.config.timezone);if(d.queue.some(x=>x.id!==q.id&&x.day===day&&x.status!=='rejected'))throw new AgentError('Une publication est déjà prévue ce jour-là.');q.publishAt=cmd.publishAt;q.day=day;}
   q.post.id=q.id;q.post.date=q.day;q.fingerprint=postFingerprint(q.post);if(Object.values(store.accounts).some(a=>a.queue.some(x=>x.id!==q.id&&x.fingerprint===q.fingerprint&&x.status!=='rejected')))throw new AgentError('Ce contenu existe déjà dans un des deux calendriers. Adaptez le texte au destinataire.');q.humanReason=assess(q.post,d.config);q.status=q.humanReason||d.config.mode==='review'?'draft':'scheduled';delete q.error;log(d,`Publication mise à jour : ${q.post.title}`);return{ok:true};
  }
  if(cmd.action==='approve'||cmd.action==='retry'){
   if(!q.post.caption.trim()||q.post.caption.length>3000)throw new AgentError('Corrigez la légende avant de programmer.');
   if(Date.parse(q.publishAt)<Date.now()-d.config.publishWindowMinutes*60000)throw new AgentError('Le créneau est passé. Reprogrammez la publication à une date future.');
   q.humanReason='';delete q.error;q.status='scheduled';log(d,`Publication validée et programmée : ${q.post.title}`);return{ok:true};
  }
  throw new AgentError('Action non prise en charge.');
 });
}
export async function pairWorker(name='Ordinateur B&M'){
 const bearer=randomBytes(32).toString('base64url'),workerId=randomUUID();
 await mutate((d,store)=>{d.worker={id:workerId,tokenHash:hash(bearer),name:name.slice(0,80),status:'offline',message:'Clé créée. En attente du premier signal du moteur.',subscriptionAuth:false};for(const a of Object.values(store.accounts))a.config.enabled=false;log(d,'Clé du moteur créée ou renouvelée. L’ancienne clé est révoquée.');});
 return{token:bearer,workerId,studioUrl:studioBase()};
}
export async function authenticateWorker(bearer:string){if(!bearer||bearer.length>200)throw new AgentError('Clé du moteur requise.',401);const {document}=await readAgent();if(!document.worker.tokenHash||!same(hash(bearer),document.worker.tokenHash))throw new AgentError('Clé du moteur invalide ou révoquée.',401);return document.worker.id!;}
function workerCheck(d:AgentDocument,workerId:string){if(!d.worker.id||d.worker.id!==workerId)throw new AgentError('Clé du moteur révoquée.',401);}
export async function workerHeartbeat(workerId:string,input:unknown){
 const body=z.object({status:z.enum(['online','busy','error']).default('online'),message:z.string().max(500).optional(),subscriptionAuth:z.boolean(),browser:z.object({sessionReady:z.boolean(),message:z.string().max(500).optional()}).optional()}).parse(input);
 const result=await mutate((d,store)=>{workerCheck(d,workerId);d.worker.lastSeenAt=nowIso();d.worker.status=body.status;d.worker.message=body.message||'';d.worker.subscriptionAuth=body.subscriptionAuth;if(body.browser?.sessionReady===false)for(const a of Object.values(store.accounts))if(a.connection.provider==='hermes-browser'&&a.connection.browser){a.connection.browser.sessionReady=false;a.connection.browser.lastError=body.browser.message||'La session LinkedIn doit être reconnectée dans Hermes.';log(a,a.connection.browser.lastError,'warning');}return{ok:true,enabled:Object.values(store.accounts).some(a=>a.config.enabled),accounts:Object.entries(store.accounts).map(([id,a])=>({id,enabled:a.config.enabled,nextRunAt:nextRun(a.config)})),nextRunAt:nextRun(d.config)};});
 // Read-only provider request, once per day. A provider failure never prevents drafting or publishing.
 if(body.status==='online')await withAgentAccount('organization',()=>collectAnalytics(true)).catch(()=>{});
 return result;
}
function expireJobs(d:AgentDocument,now:Date){for(const j of d.jobs)if(j.status==='running'&&Date.parse(j.leaseExpiresAt||'')<now.getTime()){j.status='failed';j.finishedAt=now.toISOString();j.message='Le bail du moteur a expiré.';const item=d.queue.find(q=>q.id===j.itemId);if(item?.status==='publishing'){item.status=j.phase==='sending'?'uncertain':'blocked';item.error=j.phase==='sending'?'Le résultat de l’envoi est inconnu. Vérifiez LinkedIn avant de résoudre.':'Le moteur a été interrompu avant l’envoi. Vous pouvez reprogrammer.';}log(d,j.message,'warning');}}
export function dueQueueItem(d:AgentDocument,now=new Date()){
 const day=dayAt(now,d.config.timezone);
 if(d.queue.some(q=>['published','publishing','uncertain'].includes(q.status)&&(q.day===day||(q.publishedAt&&dayAt(new Date(q.publishedAt),d.config.timezone)===day))))return undefined;
 for(const q of [...d.queue].sort((a,b)=>a.publishAt.localeCompare(b.publishAt))){if(q.status!=='scheduled'||Date.parse(q.publishAt)>now.getTime())continue;
  if(q.day!==day||now.getTime()-Date.parse(q.publishAt)>d.config.publishWindowMinutes*60000){q.status='blocked';q.error='Créneau manqué. Reprogrammez : aucun rattrapage automatique.';continue;}
  return q;
 }
}
async function claimScopedJob(workerId:string){
 const now=new Date(),leaseToken=randomBytes(32).toString('base64url');
 return mutate((d,store)=>{
  workerCheck(d,workerId);for(const a of Object.values(store.accounts))expireJobs(a,now);d.worker.lastSeenAt=now.toISOString();
  if(Object.values(store.accounts).some(a=>a.jobs.some(j=>j.status==='running')))return{job:null,message:'Une tâche est déjà en cours.'};
  if(d.config.enabled&&capabilities(d).publish&&d.worker.subscriptionAuth){
   const due=dueQueueItem(d,now);if(due){due.status='publishing';due.authorUrn=d.connection.authorUrn;due.authorKey=d.connection.provider==='hermes-browser'?browserTarget(d).targetKey:undefined;due.publishJobId=randomUUID();d.jobs.unshift({id:due.publishJobId,kind:'publish',status:'queued',createdAt:now.toISOString(),itemId:due.id,phase:'rendering'});}
   const future=d.queue.filter(q=>['scheduled','draft'].includes(q.status)&&Date.parse(q.publishAt)>now.getTime()).length;
   const recentlyPlanned=d.jobs.some(j=>j.kind==='plan'&&['completed','failed'].includes(j.status)&&Date.parse(j.finishedAt||j.createdAt)>now.getTime()-(j.status==='failed'?24:6)*3600000);
   if(future<3&&!recentlyPlanned)enqueue(d,'plan',store,now);
  }
  const j=d.jobs.find(j=>j.status==='queued'&&j.kind==='publish')||[...d.jobs].reverse().find(j=>j.status==='queued');if(!j)return{job:null,nextRunAt:nextRun(d.config,now),blockers:blockers(d)};
  if(j.kind==='publish'&&(!d.config.enabled||!capabilities(d).publish)){j.status='failed';j.message='Publication désactivée ou connexion manquante.';const item=d.queue.find(q=>q.id===j.itemId);if(item?.status==='publishing')item.status='blocked';return{job:null};}
  j.status='running';j.leaseHash=hash(leaseToken);j.leaseExpiresAt=new Date(now.getTime()+20*60000).toISOString();d.worker.status='busy';
  const recentPosts=recentPostsFor(store);
  if(j.kind==='plan'&&!j.editorial){j.slots??=slotsFor(d,now);j.editorial=editorialFor(d,store,j.slots,now);}
  const previousResults=d.jobs.filter(j=>['completed','failed'].includes(j.status)).slice(0,8).map(j=>({kind:j.kind,status:j.status,message:j.message,at:j.finishedAt||j.createdAt}));
  const item=d.queue.find(q=>q.id===j.itemId);
  const payload=j.kind==='publish'?{itemId:item!.id,post:item!.post,provider:d.connection.provider||'linkedin-oauth',fingerprint:item!.fingerprint,...(d.connection.provider==='hermes-browser'?{target:browserTarget(d)}:{}),format:item!.format||(item!.post.slides.length>1?'pdf':'png'),publishAt:item!.publishAt}:{config:d.config,strategy,recentPosts,analytics:d.analytics,previousResults,templates:['offer','editorial','steps','squad','checklist','case','focus','chatbot','document','automation'],...(j.kind==='plan'?{slots:j.slots||slotsFor(d,now),editorial:j.editorial}:{})};
  return{job:{accountId:selectedAccount(),id:j.id,kind:j.kind,leaseToken,leaseExpiresAt:j.leaseExpiresAt,payload}};
 });
}
/** One global worker lease, two independent calendars. Give due publications priority over planning. */
export async function claimJob(workerId:string){
 const {store}=await readAgent(),now=new Date();
 const ids=(['organization','person'] as const).slice().sort((a,b)=>{
  const due=(id:AccountId)=>{const d=store.accounts[id];return d.config.enabled&&capabilities({...d,worker:store.worker}) .publish&&d.queue.some(q=>q.status==='scheduled'&&Date.parse(q.publishAt)<=now.getTime()&&q.day===dayAt(now,d.config.timezone))?1:0;};return due(b)-due(a);
 });
 for(const id of ids){const result=await withAgentAccount(id,()=>claimScopedJob(workerId));if(result.job)return result;}
 return{job:null,nextRunAt:ids.map(id=>nextRun(store.accounts[id].config)).sort()[0]};
}
function leased(d:AgentDocument,jobId:string,leaseToken:string){const job=d.jobs.find(j=>j.id===jobId);if(!job||job.status!=='running'||!job.leaseHash||!same(hash(leaseToken),job.leaseHash)||Date.parse(job.leaseExpiresAt||'')<=Date.now())throw new AgentError('Le bail de cette tâche a expiré ou a déjà été consommé.',409,'LEASE_EXPIRED');return job;}
export async function completeJob(workerId:string,input:unknown){
 const b=z.object({jobId:z.string().max(100),leaseToken:z.string().max(200),result:z.unknown().optional(),error:z.string().max(800).optional()}).parse(input);
 return mutate((d,store)=>{
  workerCheck(d,workerId);const j=leased(d,b.jobId,b.leaseToken);
  if(b.error){j.status='failed';j.finishedAt=nowIso();delete j.leaseHash;j.message=b.error;d.worker.status='error';d.worker.message=b.error;const q=d.queue.find(x=>x.id===j.itemId);if(q?.status==='publishing'){q.status=j.phase==='sending'?'uncertain':'blocked';q.error=b.error;}log(d,b.error,'error');return{ok:true,status:'failed'};}
  if(j.kind==='publish')throw new AgentError('Le résultat de publication doit être confirmé par LinkedIn, pas par le modèle.');
  if(j.kind==='plan'){
   const plan=z.object({items:z.array(z.object({briefId:z.string().max(240).optional(),post:z.unknown(),rationale:z.string().max(700).default(''),sourceUrls:z.array(sourceUrl).max(8).default([]),needsHuman:z.boolean().default(false),humanReason:z.string().max(700).default('')})).min(1).max(7),summary:z.string().max(1000).default('')}).parse(b.result);
   const slots=j.slots||[];let count=0;
   for(const [index,item]of plan.items.entries()){
    const brief=j.editorial?.briefs[index];if(item.briefId!==undefined&&item.briefId!==brief?.id)throw new AgentError('Le brief de la publication ne correspond pas au plan éditorial demandé. Relancez la préparation.',409);
    const slot=slots[index];if(!slot||d.queue.some(q=>q.day===slot.day&&q.status!=='rejected'))continue;
    const post=postsSchema.parse([item.post])[0];post.id=`li-${selectedAccount()}-${slot.day}-${randomUUID().slice(0,8)}`;post.date=slot.day;post.status='draft';post.image='';
    const fingerprint=postFingerprint(post);if(Object.values(store.accounts).some(a=>a.queue.some(q=>q.fingerprint===fingerprint&&q.status!=='rejected')))continue;
    const humanReason=assess(post,d.config,item.needsHuman,item.humanReason);
    d.queue.push({...(brief?{editorial:structuredClone(brief)}:{}),id:post.id,day:slot.day,publishAt:slot.publishAt,post,...(d.connection.provider==='hermes-browser'&&d.config.targetType==='organization'?{format:'png' as const}:{}),status:humanReason||d.config.mode==='review'?'draft':'scheduled',rationale:item.rationale,sourceUrls:item.sourceUrls,humanReason,fingerprint});count++;
   }
   j.message=`${count} nouvelles publications préparées.`;log(d,j.message);d.queue=d.queue.slice(-180);
  }else{
   const result=z.object({headline:z.string().max(220),about:z.string().max(2600),recommendations:z.array(z.string().max(600)).max(12),summary:z.string().max(1200).default('')}).parse(b.result);d.profile={...result,updatedAt:nowIso()};j.message='Proposition de profil prête à appliquer manuellement.';log(d,j.message);
  }
  j.status='completed';j.finishedAt=nowIso();delete j.leaseHash;d.worker.status='online';d.worker.message='';return{ok:true,status:'completed'};
 });
}
async function activeAccess(){const {document:d}=await readAgent();if(!d.connection.connected||!d.secrets.access)throw new AgentError('Connectez LinkedIn avant de publier.',409);
 if(Date.parse(d.connection.expiresAt)>Date.now()+60000)return unseal(d.secrets.access);
 if(!d.secrets.refresh||Date.parse(d.secrets.refreshExpiresAt||'0')<Date.now())throw new AgentError('Autorisation LinkedIn expirée. Reconnectez le compte.',409);
 const c=credentials(d),fresh=await refreshLinkedInToken(unseal(d.secrets.refresh),c.clientId,c.clientSecret),previous=d.secrets.access;
 await mutate(next=>{if(next.secrets.access!==previous)throw new AgentError('Autorisation modifiée pendant le renouvellement.',409);next.secrets.access=seal(fresh.access_token);next.connection.expiresAt=new Date(Date.now()+fresh.expires_in*1000).toISOString();if(fresh.refresh_token)next.secrets.refresh=seal(fresh.refresh_token);log(next,'Autorisation LinkedIn renouvelée.');});return fresh.access_token;
}
function assertPublicationWindow(d:AgentDocument,q:QueueItem,now=new Date()){
 const day=dayAt(now,d.config.timezone),delay=now.getTime()-Date.parse(q.publishAt);
 if(q.day!==day||delay<0||delay>d.config.publishWindowMinutes*60000)throw new AgentError('Le créneau a expiré pendant la préparation. Reprogrammez la publication.');
 if(d.queue.some(other=>other.id!==q.id&&['published','publishing','uncertain'].includes(other.status)&&(other.day===day||(other.publishedAt&&dayAt(new Date(other.publishedAt),d.config.timezone)===day))))throw new AgentError('Une publication a déjà été envoyée pour ce compte aujourd’hui. Reprogrammez.');
}
export async function publishJob(workerId:string,input:unknown){
 const b=z.object({jobId:z.string().max(100),leaseToken:z.string().max(200),media:z.object({mime:z.enum(['image/png','application/pdf']),base64:z.string().max(3_733_336),title:z.string().max(200).optional()}).optional()}).parse(input);
 let item:QueueItem|undefined,phase:'uploading'|'sending'='uploading';
 try{
  item=await mutate(d=>{workerCheck(d,workerId);const j=leased(d,b.jobId,b.leaseToken);if(j.kind!=='publish')throw new AgentError('Cette tâche n’est pas une publication.');if(d.connection.provider==='hermes-browser')throw new AgentError('Utilisez le protocole de publication du navigateur Hermes.',409);if(j.phase!=='rendering')throw new AgentError('Cet envoi a déjà démarré. Aucun deuxième envoi autorisé.',409);const q=d.queue.find(x=>x.id===j.itemId);if(!q||q.status!=='publishing')throw new AgentError('État de publication invalide.',409);if(!d.config.enabled||!capabilities(d).publish||q.authorUrn!==d.connection.authorUrn)throw new AgentError('Publication interrompue : agent désactivé ou cible modifiée.',409);j.phase='uploading';return structuredClone(q);});
  const format=item.format||(item.post.slides.length>1?'pdf':'png');
  if(format!=='text'&&!b.media)throw new AgentError('Le visuel du post est requis. Aucun remplacement silencieux par du texte.');
  if(format!=='text'&&(format==='pdf'?'application/pdf':'image/png')!==b.media?.mime)throw new AgentError('Le format du média ne correspond pas au modèle de publication.');
  const access=await activeAccess(),mediaUrn=format==='text'?undefined:await uploadLinkedInMedia(access,item.authorUrn!,b.media as PublishMedia);
  await mutate(d=>{workerCheck(d,workerId);const j=leased(d,b.jobId,b.leaseToken),q=d.queue.find(x=>x.id===j.itemId)!;if(!d.config.enabled||!capabilities(d).publish||q.authorUrn!==d.connection.authorUrn||q.fingerprint!==item!.fingerprint)throw new AgentError('L’agent ou la publication a changé avant l’envoi.',409);assertPublicationWindow(d,q);j.phase='sending';q.mediaUrn=mediaUrn;});
  phase='sending';const result=await publishLinkedInPost(access,item.authorUrn!,item.post.caption,mediaUrn,item.post.title);
  // If this persistence fails after the external POST, the stored sending phase forbids automatic retry.
  await mutate(d=>{const j=d.jobs.find(x=>x.id===b.jobId),q=d.queue.find(x=>x.id===item!.id);if(!j||!q)throw new AgentError('Journal de publication indisponible.',503);q.status='published';q.linkedinUrn=result.urn;q.linkedinUrl=result.url;q.publishedAt=nowIso();delete q.error;j.status='completed';j.finishedAt=nowIso();delete j.leaseHash;d.worker.status='online';log(d,`Publié sur LinkedIn : ${q.post.title}`);});
  return{status:'published',...result};
 }catch(error){
  const message=error instanceof LinkedInError||error instanceof AgentError?error.message:'Une erreur a interrompu la publication.';
  const uncertain=(error instanceof LinkedInError&&error.uncertain)||(phase==='sending'&&!(error instanceof LinkedInError));
  if(item)await mutate(d=>{const j=d.jobs.find(x=>x.id===b.jobId),q=d.queue.find(x=>x.id===item!.id);if(!j||!q||q.status==='published')return;q.status=uncertain?'uncertain':'blocked';q.error=message;j.status='failed';j.message=message;j.finishedAt=nowIso();delete j.leaseHash;d.worker.status='error';d.worker.message=message;log(d,message,uncertain?'error':'warning');}).catch(()=>{});
  if(!item)throw error;
  return{status:uncertain?'uncertain':'blocked',message};
 }
}
export async function beginOAuth(){const {document:d}=await readAgent(),c=credentials(d);if(!c.clientId||!c.clientSecret)throw new AgentError('Enregistrez d’abord le Client ID et le Client Secret de l’application LinkedIn.');const state=randomBytes(32).toString('base64url');
 // Both configured destinations use the same grant: changing scopes invalidates prior tokens for this member/app.
 const scopes=['openid','profile','w_member_social','w_organization_social','rw_organization_admin','r_organization_social'];
 await mutate(next=>{if(applicationFingerprint(next)!==applicationFingerprint(d))throw new AgentError('L’application a changé pendant la connexion. Recommencez.',409);next.oauth={application:applicationFingerprint(next),hash:hash(state),expiresAt:new Date(Date.now()+10*60000).toISOString(),fingerprint:targetFingerprint(next.config),scopes};});
 const url=new URL('https://www.linkedin.com/oauth/v2/authorization');url.search=new URLSearchParams({response_type:'code',client_id:c.clientId,redirect_uri:callbackUrl(),state,scope:scopes.join(' ')}).toString();return{state,url:url.toString()};
}
export async function finishOAuth(code:string,state:string,cookieState:string){
 if(!state||!cookieState||!same(state,cookieState))throw new AgentError('Session de connexion LinkedIn invalide. Recommencez depuis le studio.',400,'OAUTH_STATE');
 const setup=await mutate(d=>{const s=d.oauth;if(!s||!same(s.hash,hash(state))||Date.parse(s.expiresAt)<Date.now()||s.fingerprint!==targetFingerprint(d.config)||s.application!==applicationFingerprint(d))throw new AgentError('Connexion LinkedIn expirée ou cible modifiée. Recommencez.',400,'OAUTH_STATE');delete d.oauth;return{config:d.config,credentials:credentials(d),scopes:s.scopes,application:s.application};});
 const tokens=await exchangeLinkedInCode(code,setup.credentials.clientId,setup.credentials.clientSecret,callbackUrl());
 const target=await verifyLinkedInTarget(tokens.access_token,setup.config.targetType,setup.config.targetUrl,setup.config.organizationUrn);
 // On a successful grant LinkedIn omits scope when it is unchanged; the requested scope set is then the granted set.
 const scopes=tokens.scope?tokens.scope.split(/[ ,]+/).filter(Boolean):setup.scopes;
 await mutate(d=>{if(targetFingerprint(d.config)!==targetFingerprint(setup.config)||applicationFingerprint(d)!==setup.application)throw new AgentError('La cible ou l’application a changé pendant la connexion.',409);d.config.enabled=false;if(d.connection.authorUrn&&d.connection.authorUrn!==target.authorUrn)for(const q of d.queue)if(['scheduled','draft','blocked'].includes(q.status)){q.status='blocked';q.error='L’identité LinkedIn a changé. Relire avant reprogrammation.';}d.secrets.access=seal(tokens.access_token);if(tokens.refresh_token){d.secrets.refresh=seal(tokens.refresh_token);d.secrets.refreshExpiresAt=new Date(Date.now()+(tokens.refresh_token_expires_in||0)*1000).toISOString();}else{delete d.secrets.refresh;delete d.secrets.refreshExpiresAt;}d.connection={connected:true,targetConfirmed:d.config.targetType==='organization',displayName:target.identity.name||target.targetName,targetName:target.targetName,authorUrn:target.authorUrn,memberUrn:target.memberUrn,expiresAt:new Date(Date.now()+tokens.expires_in*1000).toISOString(),scopes};log(d,`Compte LinkedIn vérifié : ${target.targetName}.`);});return{ok:true};
}
async function collectAnalytics(automatic=false){
 const snapshot=await mutate(d=>{
  if(!capabilities(d).analytics){if(automatic)return null;throw new AgentError('Les statistiques nécessitent une page entreprise connectée et la permission rw_organization_admin.');}
  if(automatic&&(!d.config.enabled||Date.parse(d.analytics.attemptedAt||'')>Date.now()-86400000))return null;
  d.analytics.attemptedAt=nowIso();return{authorUrn:d.connection.authorUrn,attemptedAt:d.analytics.attemptedAt};
 });
 if(!snapshot)return{ok:true,skipped:true};
 try{const result=await getLinkedInAnalytics(await activeAccess(),snapshot.authorUrn);await mutate(next=>{if(next.connection.authorUrn!==snapshot.authorUrn)return;next.analytics={...result,attemptedAt:snapshot.attemptedAt,updatedAt:nowIso()};log(next,'Statistiques LinkedIn actualisées.');});return{ok:true};}
 catch(e){const message=e instanceof LinkedInError?e.message:'Les statistiques n’ont pas pu être actualisées.';await mutate(next=>{if(next.connection.authorUrn!==snapshot.authorUrn)return;next.analytics.message=message;log(next,message,'warning');});throw new AgentError(message);}
}
async function resolveUncertain(itemId:string,urn:string){const {document:d}=await readAgent();if(d.connection.provider==='hermes-browser')throw new AgentError('Le résultat doit être vérifié et rapproché par le moteur navigateur. Aucun nouvel envoi automatique.',409);const q=d.queue.find(x=>x.id===itemId);if(!q||q.status!=='uncertain')throw new AgentError('Seule une publication incertaine peut être résolue ainsi.');const post=await getLinkedInPost(await activeAccess(),urn);if(post.author!==q.authorUrn||post.commentary!==q.post.caption||post.lifecycleState!=='PUBLISHED')throw new AgentError('La publication LinkedIn ne correspond pas à cet envoi.');await mutate(next=>{const item=next.queue.find(x=>x.id===itemId);if(!item||item.status!=='uncertain')throw new AgentError('État modifié.',409);item.status='published';item.linkedinUrn=urn;item.linkedinUrl=`https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`;item.publishedAt=nowIso();delete item.error;log(next,`Envoi incertain résolu par preuve LinkedIn : ${item.post.title}`);});return{ok:true};}

export async function connectBrowser(workerId:string,input:unknown){
 const b=z.object({profileUrl:z.string().max(300),displayName:z.string().min(1).max(120),organization:z.object({id:z.string().max(30),name:z.string().min(1).max(160),adminUrl:z.string().max(300)}),activate:z.boolean().default(false),verifyOnly:z.boolean().default(false)}).strict().parse(input);
 if(b.verifyOnly&&b.activate)throw new AgentError('Une vérification de session ne peut pas activer la publication.',409);
 const normalizedName=b.displayName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
 const adminUrl=canonicalLinkedIn(b.organization.adminUrl);
 if(canonicalLinkedIn(b.profileUrl)!==browserProfile||normalizedName!=='ines favre'||b.organization.id!==browserOrganization||!adminUrl.startsWith(`https://www.linkedin.com/company/${browserOrganization}/admin/`))throw new AgentError('La session vérifiée ne correspond pas à Ines Favre et à la page B&M attendues.',409,'BROWSER_TARGET_MISMATCH');
 return mutate((d,store)=>{
  workerCheck(d,workerId);const ids=(['organization','person'] as const).filter(id=>!b.verifyOnly||(store.accounts[id].connection.provider==='hermes-browser'&&store.accounts[id].connection.connected));if(b.activate&&!d.worker.subscriptionAuth)throw new AgentError('Le moteur doit confirmer sa connexion ChatGPT avant activation.',409);
  for(const id of ids){const a=store.accounts[id],url=canonicalLinkedIn(a.config.targetUrl);
   if(id==='person'&&a.config.targetUrl&&url!==browserProfile)throw new AgentError('Un autre profil personnel est configuré. La liaison Hermes ne le remplace pas.',409);
   if(id==='organization'&&(!['https://www.linkedin.com/company/bandmdigitalconsulting/',`https://www.linkedin.com/company/${browserOrganization}/`].includes(url)||(a.config.organizationUrn&&a.config.organizationUrn!==`urn:li:organization:${browserOrganization}`)))throw new AgentError('Une autre page entreprise est configurée. La liaison Hermes ne la remplace pas.',409);
   if(a.connection.connected&&a.connection.provider!=='hermes-browser'&&((id==='organization'&&a.connection.authorUrn&&a.connection.authorUrn!==`urn:li:organization:${browserOrganization}`)||(id==='person'&&a.connection.displayName&&a.connection.displayName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()!=='ines favre')))throw new AgentError('Un autre destinataire est déjà connecté. Déconnectez-le explicitement avant la liaison Hermes.',409);
   if(a.jobs.some(j=>j.status==='running'&&j.kind==='publish')&&a.connection.provider!=='hermes-browser')throw new AgentError('Une publication API est en cours. Attendez sa résolution avant de changer de connexion.',409);
  }
  d.worker.lastSeenAt=nowIso();
  for(const id of ids){const a=store.accounts[id],organization=id==='organization',targetKey=organization?'organization:'+browserOrganization:'person:ines-favre-424651436';
   if(!organization){if(a.config.voice===legacyPersonalVoice)a.config.voice=personalVoice;if(!a.config.facts.includes(verifiedPersonalRole)&&a.config.facts.length<40)a.config.facts.push(verifiedPersonalRole);}
   a.config.targetUrl=organization?a.config.targetUrl:browserProfile;if(organization)a.config.organizationUrn=`urn:li:organization:${browserOrganization}`;
   a.connection={provider:'hermes-browser',connected:true,targetConfirmed:true,displayName:b.displayName,targetName:organization?b.organization.name:b.displayName,authorUrn:organization?`urn:li:organization:${browserOrganization}`:'',memberUrn:'',expiresAt:'',scopes:[],browser:{sessionReady:true,verifiedAt:nowIso(),lastError:'',targetKey,profileUrl:browserProfile,...(organization?{organizationId:browserOrganization,adminUrl}:{} )}};
   if(organization)for(const q of a.queue)if(['scheduled','draft'].includes(q.status)&&!q.format)q.format='png';
   delete a.secrets.access;delete a.secrets.refresh;delete a.secrets.refreshExpiresAt;delete a.oauth;
   if(b.activate)a.config.enabled=true;
   log(a,b.activate?'Session Hermes vérifiée ; publication quotidienne activée.':'Session Hermes et destinataire LinkedIn revérifiés.');
  }
  return{ok:true,provider:'hermes-browser',accounts:ids,activated:b.activate,unchanged:ids.length===0};
 });
}
export async function beginBrowserPublication(workerId:string,input:unknown){
 const b=z.object({accountId:z.enum(['organization','person']).optional(),jobId:z.string().max(100),leaseToken:z.string().max(200),fingerprint:z.string().regex(/^[a-f0-9]{64}$/),verification:z.object({sessionReady:z.literal(true),profileUrl:z.string().max(300),organizationId:z.string().max(30).optional()})}).strict().parse(input);
 return mutate(d=>{
  workerCheck(d,workerId);const j=leased(d,b.jobId,b.leaseToken),q=d.queue.find(x=>x.id===j.itemId),target=browserTarget(d);
  if(j.kind!=='publish'||j.phase!=='rendering'||q?.status!=='publishing')throw new AgentError('Cet envoi a déjà démarré ou son bail est invalide. Aucun deuxième envoi.',409);
  if(!d.config.enabled||q.publishJobId!==j.id||q.authorKey!==target.targetKey||q.fingerprint!==b.fingerprint||postFingerprint(q.post)!==b.fingerprint)throw new AgentError('L’agent, le destinataire ou le contenu a changé avant l’envoi.',409);
  if(canonicalLinkedIn(b.verification.profileUrl)!==browserProfile||(target.accountId==='organization'&&b.verification.organizationId!==browserOrganization))throw new AgentError('Le destinataire visible dans le navigateur ne correspond pas à la tâche.',409,'BROWSER_TARGET_MISMATCH');
  d.connection.browser!.sessionReady=true;d.connection.browser!.verifiedAt=nowIso();d.connection.browser!.lastError='';d.worker.lastSeenAt=nowIso();
  if(!capabilities(d).publish)throw new AgentError('La session navigateur ou ChatGPT doit être revérifiée avant publication.',409);
  assertPublicationWindow(d,q);j.phase='sending';log(d,'Envoi navigateur réservé pour '+q.post.title+'. Aucun deuxième clic autorisé.');
  return{ok:true,post:q.post,format:q.format||(q.post.slides.length>1?'pdf':'png'),fingerprint:q.fingerprint,target};
 });
}
function browserProof(permalink:string,urn?:string){
 let url:URL;try{url=new URL(permalink);}catch{throw new AgentError('Lien de publication LinkedIn invalide.');}
 if(url.protocol!=='https:'||!['linkedin.com','www.linkedin.com'].includes(url.hostname)||url.username||url.password||url.port)throw new AgentError('Lien de publication LinkedIn invalide.');
 const path=decodeURIComponent(url.pathname),feed=/^\/feed\/update\/(urn:li:(?:activity|share|ugcPost):\d+)\/?$/.exec(path),post=/^\/posts\/[^/]*-activity-(\d+)(?:-[^/]*)?\/?$/.exec(path),observed=feed?.[1]||(post?'urn:li:activity:'+post[1]:'');
 if(!observed||(urn&&urn!==observed))throw new AgentError('L’identifiant ne correspond pas au lien de publication observé.');
 return{urn:observed,url:`https://www.linkedin.com/feed/update/${encodeURIComponent(observed)}/`};
}
export async function finishBrowserPublication(workerId:string,input:unknown){
 const b=z.object({accountId:z.enum(['organization','person']).optional(),jobId:z.string().max(100),leaseToken:z.string().max(200),targetKey:z.string().max(120),status:z.enum(['published','uncertain','blocked']),permalink:z.string().max(1200).optional(),urn:z.string().max(150).optional(),message:z.string().max(700).optional()}).strict().parse(input);
 const proof=b.status==='published'?browserProof(b.permalink||'',b.urn):null;
 return mutate((d,store)=>{
  workerCheck(d,workerId);const j=d.jobs.find(x=>x.id===b.jobId),q=d.queue.find(x=>x.id===j?.itemId);
  if(!j||j.kind!=='publish'||!j.leaseHash||!same(hash(b.leaseToken),j.leaseHash)||!q||q.publishJobId!==j.id||q.authorKey!==b.targetKey)throw new AgentError('Ce reçu ne correspond pas à la réservation du navigateur.',409);
  if(q.status==='published'){if(proof&&q.linkedinUrn!==proof.urn)throw new AgentError('Un autre résultat a déjà été enregistré pour cet envoi.',409);return{status:'published',urn:q.linkedinUrn,url:q.linkedinUrl};}
  if(!['publishing','uncertain','blocked'].includes(q.status))throw new AgentError('Ce reçu ne peut plus modifier cette publication.',409);
  if(proof){if(Object.values(store.accounts).some(account=>account.queue.some(other=>other.id!==q.id&&other.linkedinUrn===proof.urn)))throw new AgentError('Ce reçu LinkedIn est déjà associé à une autre publication.',409);if(j.phase!=='sending')throw new AgentError('Aucun envoi n’a été réservé pour ce reçu.',409);q.status='published';q.linkedinUrn=proof.urn;q.linkedinUrl=proof.url;q.publishedAt=nowIso();delete q.error;j.status='completed';j.finishedAt=nowIso();d.worker.status='online';log(d,'Publication confirmée par le navigateur : '+q.post.title);return{status:'published',...proof};}
  const uncertain=j.phase==='sending'||b.status==='uncertain';q.status=uncertain?'uncertain':'blocked';q.error=b.message||(uncertain?'Résultat navigateur inconnu. Vérifier LinkedIn et le reçu local, sans nouvel envoi.':'Préparation navigateur interrompue avant tout envoi.');j.status='failed';j.finishedAt=nowIso();j.message=q.error;d.worker.status='error';d.worker.message=q.error;log(d,q.error,uncertain?'error':'warning');return{status:q.status,message:q.error};
 });
}
