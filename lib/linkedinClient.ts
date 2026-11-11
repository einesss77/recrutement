/** LinkedIn REST adapters. Credentials never leave the server; no scraping or browser cookies. */
export const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || '202610';
const api = 'https://api.linkedin.com';
export class LinkedInError extends Error {
  constructor(message:string, public status=0, public uncertain=false) { super(message); this.name='LinkedInError'; }
}
export type LinkedInTokens={access_token:string;expires_in:number;scope?:string;refresh_token?:string;refresh_token_expires_in?:number};
export type Identity={sub:string;name?:string;given_name?:string;family_name?:string};
export type Target={authorUrn:string;targetName:string;memberUrn:string};
type LinkedInObject={id?:number|string;localizedName?:string;organization?:string;role?:string;state?:string;author?:string;commentary?:string;lifecycleState?:string;totalShareStatistics?:Record<string,number>};

function failure(status:number, operation:string, uncertain=false) {
  const detail=status===401?'Autorisation LinkedIn expirée ou révoquée. Reconnectez le compte.':status===403?'Les permissions LinkedIn ou le rôle sur la page ne permettent pas cette action.':status===429?'Limite LinkedIn atteinte. Attendez avant de relancer.':`${operation} refusé par LinkedIn (HTTP ${status}).`;
  return new LinkedInError(detail,status,uncertain);
}
export async function linkedinRequest<T>(token:string,path:string,init:RequestInit={}):Promise<{data:T;response:Response}>{
  let response:Response;
  try { response=await fetch(api+path,{...init,redirect:'error',signal:AbortSignal.timeout(18000),headers:{Authorization:`Bearer ${token}`,'Linkedin-Version':LINKEDIN_VERSION,'X-Restli-Protocol-Version':'2.0.0','Content-Type':'application/json',...init.headers}}); }
  catch { throw new LinkedInError('LinkedIn est injoignable. Aucun nouvel essai automatique.',0,init.method==='POST'&&path==='/rest/posts'); }
  if(!response.ok)throw failure(response.status,'La requête',init.method==='POST'&&path==='/rest/posts'&&response.status>=500);
  const text=await response.text();let data:T;
  try{data=(text?JSON.parse(text):{}) as T;}catch{throw new LinkedInError('Réponse LinkedIn illisible.',response.status,init.method==='POST'&&path==='/rest/posts');}
  return{data,response};
}
export async function exchangeLinkedInCode(code:string,clientId:string,clientSecret:string,redirectUri:string):Promise<LinkedInTokens>{
  return tokenRequest(new URLSearchParams({grant_type:'authorization_code',code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri}));
}
export async function refreshLinkedInToken(refreshToken:string,clientId:string,clientSecret:string):Promise<LinkedInTokens>{
  return tokenRequest(new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken,client_id:clientId,client_secret:clientSecret}));
}
async function tokenRequest(body:URLSearchParams):Promise<LinkedInTokens>{
  let response:Response;
  try{response=await fetch('https://www.linkedin.com/oauth/v2/accessToken',{method:'POST',body,signal:AbortSignal.timeout(15000),redirect:'error'});}catch{throw new LinkedInError('La connexion LinkedIn n’a pas abouti. Recommencez depuis le studio.');}
  if(!response.ok)throw failure(response.status,'La connexion');
  const data=await response.json() as LinkedInTokens;
  if(!data.access_token||!Number.isFinite(data.expires_in)||data.expires_in<=0)throw new LinkedInError('LinkedIn n’a pas renvoyé une autorisation valide.');
  return data;
}
export async function verifyLinkedInTarget(token:string,targetType:'person'|'organization',targetUrl:string,organizationUrn=''):Promise<Target&{identity:Identity}>{
  const {data:identity}=await linkedinRequest<Identity>(token,'/v2/userinfo');
  if(!identity.sub||!/^[a-zA-Z0-9_-]+$/.test(identity.sub))throw new LinkedInError('Identité LinkedIn non vérifiable. Activez Sign In with LinkedIn using OpenID Connect pour cette application.');
  const memberUrn=`urn:li:person:${identity.sub}`;
  if(targetType==='person')return{authorUrn:memberUrn,memberUrn,targetName:identity.name||[identity.given_name,identity.family_name].filter(Boolean).join(' ')||'Profil LinkedIn connecté',identity};
  let targetName='',authorUrn=organizationUrn;
  const vanity=new URL(targetUrl).pathname.split('/').filter(Boolean)[1];
  if(!vanity)throw new LinkedInError('Indiquez le lien de la page entreprise.');
  const {data:lookup}=await linkedinRequest<{elements?:LinkedInObject[]}>(token,`/rest/organizations?q=vanityName&vanityName=${encodeURIComponent(vanity)}`);
  const org=lookup.elements?.[0];
  if(!org?.id)throw new LinkedInError('La page entreprise n’a pas été trouvée par LinkedIn. Vérifiez son lien.');
  const found=`urn:li:organization:${org.id}`;
  if(authorUrn&&authorUrn!==found)throw new LinkedInError('L’identifiant de page ne correspond pas au lien LinkedIn.');
  authorUrn=found;targetName=org.localizedName||vanity;
  let allowed=false;
  for(let start=0;start<500;start+=100){
    const {data}=await linkedinRequest<{elements?:LinkedInObject[]}>(token,`/rest/organizationAcls?q=roleAssignee&state=APPROVED&start=${start}&count=100`);
    const elements=data.elements||[];
    allowed=elements.some(r=>r.organization===authorUrn&&r.state==='APPROVED'&&['ADMINISTRATOR','CONTENT_ADMIN','DIRECT_SPONSORED_CONTENT_POSTER'].includes(r.role||''));
    if(allowed||elements.length<100)break;
  }
  if(!allowed)throw new LinkedInError('Ce compte n’a pas de rôle de publication vérifiable sur cette page entreprise.');
  return{authorUrn,targetName,memberUrn,identity};
}
export type PublishMedia={mime:'image/png'|'application/pdf';base64:string;title?:string};
export function decodeMedia(media:PublishMedia):Buffer{
  if(!['image/png','application/pdf'].includes(media.mime)||!/^[a-zA-Z0-9+/]*={0,2}$/.test(media.base64))throw new LinkedInError('Média invalide.');
  const bytes=Buffer.from(media.base64,'base64');
  if(!bytes.length||bytes.length>2_800_000)throw new LinkedInError('Le média dépasse 2,8 Mo. Réduisez sa taille.');
  if(media.mime==='image/png'&&(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.length<24))throw new LinkedInError('Le fichier n’est pas un PNG valide.');
  if(media.mime==='application/pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new LinkedInError('Le fichier n’est pas un PDF valide.');
  return bytes;
}
export async function uploadLinkedInMedia(token:string,author:string,media:PublishMedia):Promise<string>{
  const bytes=decodeMedia(media),kind=media.mime==='image/png'?'images':'documents',field=kind==='images'?'image':'document';
  const {data}=await linkedinRequest<{value?:{uploadUrl?:string;image?:string;document?:string}}>(token,`/rest/${kind}?action=initializeUpload`,{method:'POST',body:JSON.stringify({initializeUploadRequest:{owner:author}})});
  const url=new URL(data.value?.uploadUrl||'https://invalid.invalid'),urn=data.value?.[field];
  // LinkedIn-provided upload URLs are signed. Do not follow redirects or forward tokens to arbitrary hosts.
  if(url.protocol!=='https:'||!['www.linkedin.com','api.linkedin.com'].includes(url.hostname)||url.username||url.password||!urn?.startsWith(`urn:li:${field}:`))throw new LinkedInError('Adresse de téléversement LinkedIn non reconnue.');
  let uploaded:Response;
  try{uploaded=await fetch(url,{method:'PUT',body:new Uint8Array(bytes),headers:{Authorization:`Bearer ${token}`,'Content-Type':media.mime},redirect:'error',signal:AbortSignal.timeout(18000)});}catch{throw new LinkedInError('Le téléversement du visuel a échoué. Aucune publication n’a été envoyée.');}
  if(!uploaded.ok)throw failure(uploaded.status,'Le téléversement');
  // The documents API is asynchronous. Publishing before AVAILABLE would discard the intended attachment.
  if(kind==='documents'){
    for(let attempt=0;attempt<4;attempt++){
      const {data:status}=await linkedinRequest<{status?:string}>(token,`/rest/documents/${encodeURIComponent(urn)}`);
      if(status.status==='AVAILABLE')return urn;
      if(status.status==='PROCESSING_FAILED')throw new LinkedInError('Le PDF a été refusé par LinkedIn.');
      if(attempt<3)await new Promise(resolve=>setTimeout(resolve,700));
    }
    throw new LinkedInError('LinkedIn prépare encore le PDF. Le post reste bloqué et n’a pas été envoyé.');
  }
  return urn;
}
export async function publishLinkedInPost(token:string,author:string,caption:string,mediaUrn?:string,title='Publication B&M'){
  if(!/^urn:li:(person|organization):[a-zA-Z0-9_-]+$/.test(author))throw new LinkedInError('Auteur LinkedIn non vérifié.');
  if(!caption.trim()||caption.length>3000)throw new LinkedInError('La légende LinkedIn doit contenir entre 1 et 3 000 caractères.');
  const body={author,commentary:caption,visibility:'PUBLIC',distribution:{feedDistribution:'MAIN_FEED',targetEntities:[],thirdPartyDistributionChannels:[]},lifecycleState:'PUBLISHED',isReshareDisabledByAuthor:false,...(mediaUrn?{content:{media:{id:mediaUrn,title:title.slice(0,200)}}}:{})};
  const {response}=await linkedinRequest<unknown>(token,'/rest/posts',{method:'POST',body:JSON.stringify(body)});
  const urn=response.headers.get('x-restli-id');
  if(response.status!==201||!urn||!/^urn:li:(share|ugcPost):\d+$/.test(urn))throw new LinkedInError('LinkedIn a répondu sans identifiant de publication vérifiable. Vérifiez le compte avant toute reprise.',response.status,true);
  return{urn,url:`https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`};
}
export async function getLinkedInPost(token:string,urn:string){
  if(!/^urn:li:(share|ugcPost):\d+$/.test(urn))throw new LinkedInError('Identifiant de publication invalide.');
  return(await linkedinRequest<LinkedInObject>(token,`/rest/posts/${encodeURIComponent(urn)}`)).data;
}
export async function getLinkedInAnalytics(token:string,author:string){
  if(!author.startsWith('urn:li:organization:'))throw new LinkedInError('Les statistiques de profil personnel ne sont pas activées dans cette intégration.');
  const {data}=await linkedinRequest<{elements?:LinkedInObject[]}>(token,`/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(author)}`);
  const stats=data.elements?.[0]?.totalShareStatistics;
  if(!stats)return{metrics:[],message:'LinkedIn ne renvoie pas encore de statistiques pour cette page.'};
  const labels:Record<string,string>={impressionCount:'Impressions organiques',uniqueImpressionsCount:'Impressions uniques',clickCount:'Clics',likeCount:'Réactions',commentCount:'Commentaires',shareCount:'Partages',engagement:'Taux d’engagement'};
  return{metrics:Object.entries(labels).filter(([key])=>typeof stats[key]==='number').map(([key,label])=>({key,label,value:stats[key]})),message:'Statistiques organiques cumulées renvoyées par LinkedIn, hors campagnes sponsorisées.'};
}
