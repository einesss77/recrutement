import {chromium} from '@playwright/test';
import {mkdir,open,readFile,rename,unlink,readdir,stat} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';

export const browserIdentity={profileUrl:'https://www.linkedin.com/in/ines-favre-424651436/',displayName:'Ines Favre',organization:{id:'106357560',name:'B&M Digital Consulting',adminUrl:'https://www.linkedin.com/company/106357560/admin/'}};
const sha=value=>createHash('sha256').update(value).digest('hex');
export class BrowserHumanError extends Error {constructor(message){super(message);this.name='BrowserHumanError';}}

export function browserEndpoint(value=process.env.STUDIO_LINKEDIN_BROWSER_URL||'http://127.0.0.1:9222'){
 const url=new URL(value);
 if(url.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw new BrowserHumanError('La connexion du navigateur doit rester sur une adresse HTTP de boucle locale.');
 return url.origin;
}
export function checkedTarget(target,accountId){
 const expected=accountId==='person'?'person:ines-favre-424651436':accountId==='organization'?'organization:106357560':'';
 if(!expected||!target||target.accountId!==accountId||target.targetKey!==expected||target.profileUrl!==browserIdentity.profileUrl)throw new BrowserHumanError('La destination navigateur ne correspond pas au compte LinkedIn vérifié.');
 if(accountId==='organization'&&(target.organizationId!=='106357560'||target.adminUrl!==browserIdentity.organization.adminUrl))throw new BrowserHumanError('La page entreprise navigateur ne correspond pas à B&M.');
 return target;
}
export function captionFingerprint(post){return sha(post.caption.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,''));}
export function browserContentDigest(post,format,target){return sha(JSON.stringify({targetKey:target.targetKey,format,title:post.title,caption:post.caption,template:post.template,theme:post.theme,image:post.image||'',slides:post.slides.map(s=>({label:s.label,title:s.title,body:s.body,points:s.points}))}));}
export function checkedMedia(media,format){
 if(format==='text'){if(media)throw new BrowserHumanError('Un post texte ne doit pas recevoir un média inattendu.');return null;}
 const mime=format==='png'?'image/png':format==='pdf'?'application/pdf':'';
 if(!mime||media?.mime!==mime||typeof media.base64!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(media.base64))throw new BrowserHumanError('Le format du média ne correspond pas à la publication.');
 const buffer=Buffer.from(media.base64,'base64');
 if(!buffer.length||buffer.length>2_800_000||(format==='png'?(buffer.length<24||!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))):buffer.subarray(0,5).toString()!=='%PDF-'))throw new BrowserHumanError('Média illisible ou trop volumineux.');
 return{name:format==='png'?'publication-bm.png':'publication-bm.pdf',mimeType:mime,buffer};
}
export function verifiedPermalink(input){
 try{const url=new URL(input,'https://www.linkedin.com');if(url.protocol!=='https:'||!['www.linkedin.com','linkedin.com'].includes(url.hostname)||url.username||url.password)return null;
 const decoded=decodeURIComponent(url.pathname),match=/^\/feed\/update\/(urn:li:(?:activity|share|ugcPost):\d+)\/?$/.exec(decoded);
 if(!match)return null;return{permalink:'https://www.linkedin.com/feed/update/'+match[1]+'/',urn:match[1]};
 }catch{return null;}
}

async function syncDirectory(directory){if(process.platform==='win32')return;const file=await open(directory,'r');try{await file.sync();}finally{await file.close();}}
export async function reserveBrowserReceipt(workingRoot,job,target){
 const directory=path.join(workingRoot,'browser-receipts');await mkdir(directory,{recursive:true,mode:0o700});
 const file=path.join(directory,sha(job.accountId+'|'+job.id)+'.json');
 const receipt={version:1,jobId:job.id,accountId:job.accountId,leaseToken:job.leaseToken,targetKey:target.targetKey,contentDigest:browserContentDigest(job.payload.post,job.payload.format,target),status:'reserved',at:new Date().toISOString()};
 let handle;
 try{handle=await open(file,'wx',0o600);await handle.writeFile(JSON.stringify(receipt));await handle.sync();await syncDirectory(directory);return{file,receipt,existing:false};}
 catch(error){if(error.code!=='EEXIST')throw error;let previous;try{previous=JSON.parse(await readFile(file,'utf8'));}catch{throw new BrowserHumanError('Un reçu local incomplet existe pour cet envoi. Vérifiez le compte avant de le résoudre.');}
  if(previous.jobId!==job.id||previous.accountId!==job.accountId||previous.targetKey!==target.targetKey||previous.contentDigest!==receipt.contentDigest)throw new BrowserHumanError('Le reçu de cet envoi ne correspond plus au contenu. Une vérification humaine est nécessaire.');
  return{file,receipt:previous,existing:true};
 }finally{await handle?.close();}
}
export async function updateBrowserReceipt(saved,patch){
 const receipt={...saved.receipt,...patch,at:new Date().toISOString()},temp=saved.file+'.'+randomUUID()+'.tmp';let handle;
 try{handle=await open(temp,'wx',0o600);await handle.writeFile(JSON.stringify(receipt));await handle.sync();await handle.close();handle=null;await rename(temp,saved.file);await syncDirectory(path.dirname(saved.file));saved.receipt=receipt;}
 finally{await handle?.close();await unlink(temp).catch(()=>{});}
}
export async function replayConfirmedBrowserReceipts({workingRoot,finish}){
 const directory=path.join(workingRoot,'browser-receipts'),names=await readdir(directory).catch(error=>{if(error.code==='ENOENT')return[];throw error;});let reconciled=0;
 for(const name of names){
  if(reconciled>=20)break;if(!/^[a-f0-9]{64}\.json$/.test(name))continue;
  const file=path.join(directory,name);let receipt;
  try{if((await stat(file)).size>16000)continue;receipt=JSON.parse(await readFile(file,'utf8'));}catch{continue;}
  if(receipt.version!==1||receipt.status!=='published'||receipt.serverAck===true||!['person','organization'].includes(receipt.accountId)||typeof receipt.leaseToken!=='string'||!receipt.leaseToken||receipt.leaseToken.length>200)continue;
  const proof=verifiedPermalink(receipt.permalink),targetKey=receipt.accountId==='person'?'person:ines-favre-424651436':'organization:106357560';
  if(!proof||proof.urn!==receipt.urn||receipt.targetKey!==targetKey||typeof receipt.jobId!=='string'||receipt.jobId.length>100)continue;
  try{await finish({accountId:receipt.accountId,jobId:receipt.jobId,leaseToken:receipt.leaseToken,targetKey,status:'published',...proof,message:'Confirmation rapprochée depuis le reçu durable du navigateur.'});await updateBrowserReceipt({file,receipt},{serverAck:true});reconciled++;}
  catch{return{reconciled,pending:true};}
 }
 return{reconciled,pending:false};
}

async function requireVisible(locator,message,timeout=15000){try{await locator.waitFor({state:'visible',timeout});}catch{throw new BrowserHumanError(message);}return locator;}
export function normalizedBrowserText(value){return String(value||'').replace(/\s+/gu,' ').trim();}
const normalizedText=normalizedBrowserText;
const publicationSuccess=/(?:post|publication)\s+(?:(?:a\s+été|est|was|is|has\s+been)\s+)?(?:publié[es]?|réussi[es]?|published|successful(?:ly)?)|(?:publié[es]?|partagé[es]?)\s+avec\s+succès|successfully\s+(?:posted|published|shared)|your post is live/iu;
export function freshPublicationCandidates(before,after){
 const previous=new Set((before?.links||[]).map(value=>verifiedPermalink(value)?.urn).filter(Boolean));
 for(const notice of before?.notifications||[])for(const link of notice.links||[]){const proof=verifiedPermalink(link);if(proof)previous.add(proof.urn);}
 const candidates=new Map();
 for(const notice of after?.notifications||[]){
  if(!publicationSuccess.test(normalizedText(notice.text))||/\b(?:pas|impossible|erreur|failed|unable|not|couldn[’']t)\b/iu.test(notice.text))continue;
  for(const link of notice.links||[]){const proof=verifiedPermalink(link);if(proof&&!previous.has(proof.urn))candidates.set(proof.urn,proof);}
 }
 return [...candidates.values()];
}
export function verifiedPublicationCard(card,target,caption,organizationPaths=[]){
 if(!card||card.caption!==normalizedText(caption))return false;
 const expectedAuthor=target.accountId==='person'?browserIdentity.displayName:browserIdentity.organization.name;
 if(normalizedText(card.menuAuthor)!==expectedAuthor)return false;
 try{
  const author=new URL(card.authorHref,'https://www.linkedin.com');
  if(author.protocol!=='https:'||!['www.linkedin.com','linkedin.com'].includes(author.hostname)||author.username||author.password)return false;
  const pathname=author.pathname.replace(/\/$/,'');
  if(target.accountId==='person')return pathname==='/in/ines-favre-424651436';
  return ['/company/106357560',...organizationPaths].includes(pathname)&&normalizedText(card.authorName)===browserIdentity.organization.name;
 }catch{return false;}
}
export function verifiedPublicationCards(cards,proof,target,caption,organizationPaths=[]){
 const attached=cards.filter(card=>card.urn===proof.urn);
 const candidates=attached.length===1?attached:cards.length===1&&!cards[0].urn?cards:[];
 return candidates.length===1&&verifiedPublicationCard(candidates[0],target,caption,organizationPaths);
}
function checkPageUrl(page){const url=new URL(page.url());if(url.hostname!=='www.linkedin.com'||/\/(?:login|checkpoint|authwall|challenge|captcha)(?:\/|$)/i.test(url.pathname))throw new BrowserHumanError('LinkedIn demande une connexion ou un contrôle humain. Reprendre la session du navigateur.');}

export class HermesBrowserSession {
 constructor(browser){this.browser=browser;this.context=browser.contexts()[0];this.pages=new Set();if(!this.context)throw new BrowserHumanError('Le navigateur ne contient aucune session existante.');}
 async newPage(url){const page=await this.context.newPage();this.pages.add(page);page.setDefaultTimeout(12000);await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});checkPageUrl(page);return page;}
 async closePage(page){if(!this.pages.has(page))return;await page.close({runBeforeUnload:false}).catch(()=>{});this.pages.delete(page);}
 async dismissPremium(page){const dialog=page.getByRole('dialog').filter({hasText:'Page LinkedIn Premium'});if(await dialog.isVisible().catch(()=>false)){const ignore=dialog.getByRole('button',{name:'Ignorer',exact:true});if(await ignore.isVisible())await ignore.click();}}
 async verifiedFeedFrame(page){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){for(const frame of page.frames()){
   const sidebar=frame.getByRole('complementary',{name:'Barre latérale',exact:true}),profile=sidebar.locator('a[href*="/in/ines-favre-424651436/"]').first();
   if(!(await profile.isVisible().catch(()=>false)))continue;
   const profileUrl=new URL(await profile.getAttribute('href'),page.url());if(profileUrl.origin!=='https://www.linkedin.com'||profileUrl.pathname!=='/in/ines-favre-424651436/')throw new BrowserHumanError('Le profil actuellement connecté est différent de celui attendu.');
   if(!(await sidebar.getByText('Ines Favre',{exact:true}).isVisible().catch(()=>false)))continue;
   if(await sidebar.locator('a[href*="/company/106357560/admin/"]').first().isVisible().catch(()=>false))return frame;
  }await new Promise(resolve=>setTimeout(resolve,250));}
  throw new BrowserHumanError('Le profil connecté et son accès administrateur B&M ne sont pas vérifiables dans la barre latérale.');
 }
 async verify(){
  let feed,admin;
  try{
   feed=await this.newPage('https://www.linkedin.com/feed/');
   await this.verifiedFeedFrame(feed);
   admin=await this.newPage(browserIdentity.organization.adminUrl);await this.dismissPremium(admin);
   await requireVisible(admin.getByRole('region',{name:'Section de navigation pour les administrateurs de page organisationnelle',exact:true}),'Le rôle administrateur de la page B&M n’est pas vérifiable.');
   await requireVisible(admin.getByRole('heading',{name:browserIdentity.organization.name,exact:true,level:1}),'La page administrée ne correspond pas à B&M.');
   if(!new URL(admin.url()).pathname.startsWith('/company/106357560/admin/'))throw new BrowserHumanError('LinkedIn a quitté la page administrateur attendue.');
   this.organizationPaths=await admin.locator('a[href]').evaluateAll(links=>links.map(link=>new URL(link.href,location.href)).filter(url=>url.origin==='https://www.linkedin.com'&&url.pathname.replace(/\/$/,'')==='/company/bandmdigitalconsulting').map(url=>url.pathname.replace(/\/$/,'')));
   return structuredClone(browserIdentity);
  }finally{if(feed)await this.closePage(feed);if(admin)await this.closePage(admin);}
 }
 async visibleDialog(page,name){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){for(const frame of page.frames()){const dialog=frame.getByRole('dialog',{name,exact:true});if(await dialog.isVisible().catch(()=>false))return{frame,dialog};}await new Promise(resolve=>setTimeout(resolve,250));}
  throw new BrowserHumanError('Le compositeur LinkedIn attendu n’est pas disponible. Vérifier la session ou l’interface.');
 }
 async composerFrame(page,accountId){return this.visibleDialog(page,accountId==='organization'?'Fenêtre modale Créer un post':'Options de publicités');}
 async visibleButton(page,name){const deadline=Date.now()+20000;while(Date.now()<deadline){for(const frame of page.frames()){const candidates=frame.getByRole('button',{name,exact:true});for(let i=0;i<await candidates.count();i++)if(await candidates.nth(i).isVisible())return candidates.nth(i);}await new Promise(resolve=>setTimeout(resolve,250));}throw new BrowserHumanError('Une étape du compositeur LinkedIn a changé : '+name+'.');}
 async author(){
  const {dialog,target}=this.composer;
  const selector=target.accountId==='organization'?dialog.getByRole('button',{name:'B&M Digital Consulting B&M Digital Consulting Visibilité : Tout le monde',exact:true}):dialog.locator('[aria-label="Ines Favre"]');
  await requireVisible(selector,'L’auteur affiché dans le compositeur ne correspond pas à la destination.');
 }
 async prepare(target,post,format,media){
  const page=await this.newPage(target.accountId==='organization'?'https://www.linkedin.com/company/106357560/admin/feed/posts?share=true':'https://www.linkedin.com/feed/');
  await this.dismissPremium(page);
  if(target.accountId==='person')await (await this.visibleButton(page,'Commencer un post')).click();
  let composer;try{composer=await this.composerFrame(page,target.accountId);}catch(error){if(target.accountId!=='person'||new URL(page.url()).pathname!=='/feed/')throw error;await page.goto('https://www.linkedin.com/sharing/compose',{waitUntil:'domcontentloaded',timeout:30000});composer=await this.composerFrame(page,target.accountId);}const {frame,dialog}=composer;
  this.composer={page,frame,dialog,target,post,format};await this.author();
  const editor=target.accountId==='organization'?dialog.getByRole('textbox',{name:'Éditeur de texte pour créer du contenu',exact:true}):dialog.getByRole('textbox');
  await requireVisible(editor,'L’éditeur de la publication n’est pas disponible.');
  const existing=normalizedText(await editor.innerText());
  if(existing&&!['Donnez votre avis…','De quoi souhaitez-vous discuter ?'].includes(existing))throw new BrowserHumanError('Un brouillon LinkedIn existe déjà dans ce compositeur. Le relire ou l’écarter avant la reprise.');
  const existingMedia=dialog.getByRole('button',{name:target.accountId==='person'?'Close':'Supprimer le média',exact:true});
  if(await existingMedia.isVisible().catch(()=>false))throw new BrowserHumanError('Un média appartient déjà à un brouillon LinkedIn. Le conserver pour vérification humaine avant la reprise.');
  await editor.fill(post.caption);this.composer.editor=editor;this.composer.ownedContent=true;
  if(format!=='text')await this.attach(checkedMedia(media,format));
  await this.ready();
 }
 async attach(file){
  const {page,dialog,target,post,format}=this.composer;
  const personal=target.accountId==='person';
  if(format==='png'){
   const chooserPromise=page.waitForEvent('filechooser',{timeout:15000});await dialog.getByRole('button',{name:personal?'Médias':'Ajouter un média',exact:true}).click();const chooser=await chooserPromise;await chooser.setFiles(file);
   const actual=await chooser.element().evaluate(node=>({mime:node.files?.[0]?.type,name:node.files?.[0]?.name}));if(actual.mime!==file.mimeType||actual.name!==file.name)throw new BrowserHumanError('Le PNG chargé ne correspond pas au média préparé.');
   if(personal){
    const next=await this.visibleButton(page,'Suivant');
    const frame=this.composer.frame;
    await requireVisible(frame.getByRole('img',{name:'Aperçu de l’image',exact:true}).last(),'Le PNG n’a pas produit de prévisualisation LinkedIn.',30000);await next.click();
   }else{
    const {dialog:editor}=await this.visibleDialog(page,'Éditeur');await requireVisible(editor.getByRole('img',{name:'Aperçu de '+file.name,exact:true}),'Le PNG n’a pas produit de prévisualisation LinkedIn.',30000);await editor.getByRole('button',{name:'Suivant',exact:true}).click();
   }
   const returned=await this.composerFrame(page,target.accountId);this.composer.frame=returned.frame;this.composer.dialog=returned.dialog;
   if(personal){
    await requireVisible(returned.dialog.getByRole('button',{name:'Close',exact:true}),'Le compositeur n’affiche pas le média chargé.',30000);
    const preview=returned.dialog.locator('figure[aria-hidden="true"] img[alt=""][src^="blob:"]');await preview.waitFor({state:'attached',timeout:15000});
    const dimensions=await preview.evaluate(async image=>{await image.decode();return{width:image.naturalWidth,height:image.naturalHeight};});
    if(dimensions.width!==file.buffer.readUInt32BE(16)||dimensions.height!==file.buffer.readUInt32BE(20))throw new BrowserHumanError('L’aperçu LinkedIn ne correspond pas aux dimensions du PNG préparé.');
   }else await requireVisible(returned.dialog.getByRole('img',{name:'Aperçu de l’image',exact:true}),'Le compositeur n’affiche pas le PNG attendu.',30000);
  }else{
   await dialog.getByRole('button',{name:personal?'Développer les types de contenu':'Plus',exact:true}).click();
   if(personal)await dialog.getByRole('link',{name:'Document',exact:true}).click();else await dialog.getByRole('button',{name:'Ajouter un document',exact:true}).click();
   const {dialog:upload}=await this.visibleDialog(page,'Partager un document');let input;
   if(personal){const chooserPromise=page.waitForEvent('filechooser',{timeout:15000});await upload.getByRole('button',{name:'Choisir un fichier',exact:true}).click();const chooser=await chooserPromise;await chooser.setFiles(file);input=chooser.element();}
   else{input=await upload.locator('input[type="file"][accept*=".pdf"]').elementHandle();if(!input)throw new BrowserHumanError('Le champ de document LinkedIn n’est pas disponible.');await input.setInputFiles(file);}
   if(personal)await requireVisible(upload.getByText(/^\d+\s+pages?$/),'LinkedIn n’affiche pas les pages du PDF chargé.',120000);
   else await requireVisible(upload.getByText(file.name,{exact:true}),'LinkedIn n’affiche pas le fichier PDF préparé.',30000);
   if(!personal)await requireVisible(upload.getByRole('button',{name:'Supprimer un document chargé',exact:true}),'Le document n’a pas été chargé dans LinkedIn.',30000);
   await upload.getByRole('textbox',{name:/^Titre du document\s*\*$/}).fill(post.title.slice(0,58));await upload.getByRole('button',{name:'Terminé',exact:true}).click();
   const returned=await this.composerFrame(page,target.accountId);this.composer.frame=returned.frame;this.composer.dialog=returned.dialog;
   if(personal){await requireVisible(returned.dialog.getByText(post.title.slice(0,58),{exact:true}),'Le compositeur n’affiche pas le titre du PDF.',45000);await requireVisible(returned.dialog.getByText(/•\s*\d+\s+pages?/),'Le PDF chargé n’affiche pas ses pages.',45000);}
   else await requireVisible(returned.frame.getByRole('alert').filter({hasText:'Le chargement de votre document est terminé'}),'LinkedIn n’a pas confirmé le chargement du PDF.',120000);
  }
  this.composer.editor=personal?this.composer.dialog.getByRole('textbox'):this.composer.dialog.getByRole('textbox',{name:'Éditeur de texte pour créer du contenu',exact:true});
  this.composer.mediaReady=true;
 }
 async ready(){
  const {page,dialog,editor,post,format,target}=this.composer;
  checkPageUrl(page);await this.author();
  if(normalizedText(await editor.innerText())!==normalizedText(post.caption))throw new BrowserHumanError('Le texte du compositeur ne correspond plus au texte autorisé.');
  if(format!=='text'&&!this.composer.mediaReady)throw new BrowserHumanError('Le média n’est pas confirmé dans le compositeur.');
  if(format==='png'){
   const personal=target.accountId==='person';
   const remove=dialog.getByRole('button',{name:personal?'Close':'Supprimer le média',exact:true});
   if(!(await remove.isVisible().catch(()=>false)))throw new BrowserHumanError('Le média préparé a disparu du compositeur.');
   const preview=personal?dialog.locator('figure[aria-hidden="true"] img[alt=""][src^="blob:"]'):dialog.getByRole('img',{name:'Aperçu de l’image',exact:true});
   if(await preview.count()!==1)throw new BrowserHumanError('L’aperçu du PNG préparé n’est plus identifiable.');
   const current=await preview.evaluate(async image=>{await image.decode();return{src:image.currentSrc||image.src,width:image.naturalWidth,height:image.naturalHeight,complete:image.complete};});
   if(!current.src||!current.complete||!current.width||!current.height)throw new BrowserHumanError('L’aperçu du PNG n’est plus chargé.');
   const signature=JSON.stringify(current);
   if(this.composer.mediaSignature&&this.composer.mediaSignature!==signature)throw new BrowserHumanError('Le média affiché a changé depuis sa préparation.');
   this.composer.mediaSignature=signature;
  }
  if(format==='pdf'&&target.accountId==='person'){
   const title=dialog.getByText(post.title.slice(0,58),{exact:true}),pages=dialog.getByText(/•\s*\d+\s+pages?/);
   if(!(await title.isVisible().catch(()=>false))||!(await pages.isVisible().catch(()=>false)))throw new BrowserHumanError('Le titre ou l’aperçu du PDF préparé a changé.');
   const signature=JSON.stringify({title:await title.innerText(),pages:await pages.innerText()});
   if(this.composer.mediaSignature&&this.composer.mediaSignature!==signature)throw new BrowserHumanError('Le document affiché a changé depuis sa préparation.');
   this.composer.mediaSignature=signature;
  }
  if(format==='pdf'&&target.accountId==='organization'){
   const preview=dialog.locator('iframe');
   if(!(await dialog.getByRole('button',{name:'Supprimer le média',exact:true}).isVisible().catch(()=>false))||await preview.count()!==1)throw new BrowserHumanError('L’aperçu du document préparé a disparu.');
   const signature=await preview.getAttribute('src');
   if(!signature||this.composer.mediaSignature&&this.composer.mediaSignature!==signature)throw new BrowserHumanError('Le document affiché a changé depuis sa préparation.');
   this.composer.mediaSignature=signature;
  }
  const publish=dialog.getByRole('button',{name:'Publier',exact:true});
  if(!(await publish.isEnabled()))throw new BrowserHumanError('LinkedIn ne permet pas encore la publication de ce contenu.');
 }
 async publicationSignals(page){
  const snapshot={links:[],notifications:[],complete:true};
  for(const frame of page.frames()){
   const part=await frame.evaluate(()=>{
    const visible=element=>Boolean(element.getClientRects().length)&&getComputedStyle(element).visibility!=='hidden';
    const links=(element,visibleOnly=true)=>[...element.querySelectorAll('a[href]')].filter(link=>!visibleOnly||visible(link)).map(link=>link.href);
    const notices=[...document.querySelectorAll('[role="alert"],[role="status"],[aria-live="polite"],[aria-live="assertive"],.artdeco-toast-item')].filter(visible).filter(element=>element.innerText.length<1500);
    const notifications=notices.filter(element=>!notices.some(other=>other!==element&&element.contains(other))).map(element=>({text:element.innerText,links:links(element)}));
    return{links:links(document,false),notifications};
   }).catch(()=>null);
   if(part){snapshot.links.push(...part.links);snapshot.notifications.push(...part.notifications);}else snapshot.complete=false;
  }
  return snapshot;
 }
 async publicationCards(page,caption){
  const cards=[];
  for(const frame of page.frames()){
   const part=await frame.evaluate(expected=>{
    const normalized=value=>String(value||'').replace(/\s+/gu,' ').trim();
    const visible=element=>Boolean(element.getClientRects().length)&&getComputedStyle(element).visibility!=='hidden';
    const controls=element=>[...element.querySelectorAll('button')].some(button=>/Ouvrir le menu de commandes pour le post|Open control menu for post/iu.test(button.getAttribute('aria-label')||button.innerText));
    const roots=new Set([...document.querySelectorAll('article,[data-urn^="urn:li:activity:"],[data-urn^="urn:li:share:"],[data-urn^="urn:li:ugcPost:"]')].filter(controls));
    for(const heading of document.querySelectorAll('h2,[role="heading"]')){
     if(!/^(?:Post du fil d[’']actualité|Feed post)$/iu.test(normalized(heading.innerText)))continue;
     for(let node=heading.parentElement;node&&node!==document.body;node=node.parentElement){if(controls(node)){roots.add(node);break;}}
    }
    const candidates=[...roots].filter(visible);
    return candidates.filter(root=>!candidates.some(other=>other!==root&&root.contains(other))).flatMap(root=>{
     const author=[...root.querySelectorAll('a[href]')].find(link=>visible(link)&&/^\/(?:in|company)\//.test(new URL(link.href,location.href).pathname));
     if(!author)return[];
     const menu=[...root.querySelectorAll('button')].map(button=>normalized(button.getAttribute('aria-label')||button.innerText)).find(name=>/^(?:Ouvrir le menu de commandes pour le post de |Open control menu for post by )/iu.test(name));
     const menuAuthor=menu?.replace(/^(?:Ouvrir le menu de commandes pour le post de |Open control menu for post by )/iu,'')||'';
     const actions=[...root.querySelectorAll('button')].filter(button=>/^(?:J[’']aime|Like|Réagir|React|Commenter|Comment|Aimer (?:la|le|ce))/iu.test(normalized(button.getAttribute('aria-label')||button.innerText)));
     const boundary=actions[0];
     const captionNode=[...root.querySelectorAll('p,div,span')].find(node=>visible(node)&&!node.closest('[role="dialog"],form')&&normalized(node.innerText)===expected&&boundary&&Boolean(node.compareDocumentPosition(boundary)&Node.DOCUMENT_POSITION_FOLLOWING)&&!node.contains(boundary));
     const authorPath=new URL(author.href,location.href).pathname.replace(/\/$/,'');
     const namedAuthor=[...root.querySelectorAll('a[href]')].find(link=>visible(link)&&new URL(link.href,location.href).pathname.replace(/\/$/,'')===authorPath&&normalized(link.innerText));
     const authorName=normalized(namedAuthor?.innerText)||normalized(author.getAttribute('aria-label'))||normalized(author.querySelector('img')?.getAttribute('alt'));
     return[{authorHref:author.href,authorName,menuAuthor,caption:captionNode?normalized(captionNode.innerText):'',urn:root.getAttribute('data-urn')||''}];
    });
   },normalizedText(caption)).catch(()=>null);
   if(!part)throw new BrowserHumanError('Les cartes du permalien ne sont pas toutes vérifiables. Aucun reçu confirmé.');
   cards.push(...part);
  }
  return cards;
 }
 async verifyPublicationPermalink(proof,{timeout=12000,pollInterval=250}={}){
  let page;
  try{
   page=await this.newPage(proof.permalink);
   const deadline=Date.now()+timeout;
   do{
    checkPageUrl(page);
    const current=verifiedPermalink(page.url());
    if(!current||current.urn!==proof.urn)return false;
    const cards=await this.publicationCards(page,this.composer.post.caption);
    if(verifiedPublicationCards(cards,proof,this.composer.target,this.composer.post.caption,this.organizationPaths||[]))return true;
    if(Date.now()>=deadline)break;
    await new Promise(resolve=>setTimeout(resolve,pollInterval));
   }while(Date.now()<deadline);
   return false;
  }finally{if(page)await this.closePage(page);}
 }
 async submit(){
  const {page,dialog}=this.composer;
  // Record the click attempt before dispatch; a timeout must never permit a second click.
  if(this.composer.submissionAttempted)throw new BrowserHumanError('Un clic de publication a déjà été tenté. Vérifier LinkedIn avant toute reprise.');
  this.composer.beforePublication=await this.publicationSignals(page);
  if(this.composer.beforePublication.complete===false)throw new BrowserHumanError('Les liens présents avant la publication ne sont pas tous vérifiables. Aucun clic envoyé.');
  this.composer.submissionAttempted=true;
  await dialog.getByRole('button',{name:'Publier',exact:true}).click({timeout:15000});
 }
 async confirmation({timeout=30000,pollInterval=250}={}){
  if(!this.composer?.submissionAttempted||!this.composer.beforePublication)throw new BrowserHumanError('Aucune tentative de publication ne peut être rapprochée.');
  const {page,beforePublication}=this.composer,deadline=Date.now()+timeout,checked=new Set();
  do{
   checkPageUrl(page);
   const afterPublication=await this.publicationSignals(page);
   for(const proof of afterPublication.complete===false?[]:freshPublicationCandidates(beforePublication,afterPublication)){
    if(checked.has(proof.urn))continue;checked.add(proof.urn);
    if(await this.verifyPublicationPermalink(proof,{timeout:Math.min(12000,Math.max(0,deadline-Date.now())),pollInterval}))return proof;
   }
   if(Date.now()>=deadline)break;
   await new Promise(resolve=>setTimeout(resolve,pollInterval));
  }while(Date.now()<deadline);
  throw new BrowserHumanError('La publication a été soumise, mais aucun nouveau permalien avec l’auteur et le texte intégral vérifiés n’a été établi. Vérifier LinkedIn avant toute reprise.');
 }
 async discardOwnDraft(){
  if(!this.composer?.ownedContent||!this.composer.editor)return;
  const {dialog,editor,post,target,format}=this.composer;
  await this.author();
  if(normalizedText(await editor.innerText())!==normalizedText(post.caption))throw new BrowserHumanError('Le brouillon a changé pendant le contrôle. Le conserver pour vérification humaine.');
  if(format!=='text'){const remove=dialog.getByRole('button',{name:target.accountId==='person'?'Close':'Supprimer le média',exact:true});if(await remove.isVisible().catch(()=>false))await remove.click();}
  await editor.fill('');await dialog.getByRole('button',{name:'Ignorer',exact:true}).click();this.composer=null;
 }
 async disconnect(){
  for(const page of [...this.pages])await this.closePage(page);
  // With the pinned Playwright CDP transport this disconnects the client; it does not send Browser.close to Chrome.
  await this.browser.close({reason:'Déconnexion du client CDP B&M, navigateur conservé.'});
 }
}
export async function openHermesBrowser(){return new HermesBrowserSession(await chromium.connectOverCDP(browserEndpoint(),{timeout:15000}));}
export async function verifyHermesBrowser({openSession=openHermesBrowser}={}){const session=await openSession();try{return await session.verify();}finally{await session.disconnect();}}
export async function prepareBrowserPublication({post,format,accountId,render,openSession=openHermesBrowser}){
 const target={accountId,profileUrl:browserIdentity.profileUrl,targetKey:accountId==='person'?'person:ines-favre-424651436':'organization:106357560',...(accountId==='organization'?{organizationId:'106357560',adminUrl:browserIdentity.organization.adminUrl}:{})};checkedTarget(target,accountId);
 const session=await openSession();
 try{await session.verify();const media=format==='text'?null:await render(post,format);checkedMedia(media,format);await session.prepare(target,post,format,media);await session.ready();await session.discardOwnDraft();return{status:'prepared-only',accountId,format,mediaBytes:media?Buffer.from(media.base64,'base64').length:0,message:'Auteur, texte et média vérifiés ; contenu de contrôle retiré. Aucun envoi au studio ni clic Publier.'};}
 finally{if(session.composer)await session.discardOwnDraft().catch(()=>{});await session.disconnect();}
}

export async function publishWithHermes({job,workingRoot,render,begin,finish,openSession=openHermesBrowser}){
 const target=checkedTarget(job.payload.target,job.accountId);
 if(job.payload.fingerprint!==captionFingerprint(job.payload.post))throw new BrowserHumanError('L’empreinte du texte reçu ne correspond pas à la publication.');
 const saved=await reserveBrowserReceipt(workingRoot,job,target);
 if(saved.existing){const receipt=saved.receipt,result=receipt.status==='published'?{status:'published',targetKey:target.targetKey,permalink:receipt.permalink,urn:receipt.urn,message:'Envoi déjà confirmé dans le reçu local.'}:{status:'uncertain',targetKey:target.targetKey,message:'Un reçu existe déjà pour cet envoi. Aucun deuxième clic de publication.'};await finish(result);return result;}
 let session,began=false,submission=false;
 try{
  session=await openSession();const verified=await session.verify();
  const media=job.payload.format==='text'?null:await render(job.payload.post,job.payload.format);checkedMedia(media,job.payload.format);
  await session.prepare(target,job.payload.post,job.payload.format,media);
  await session.ready();
  await updateBrowserReceipt(saved,{status:'begin-requested'});began=true;
  const allowed=await begin({fingerprint:job.payload.fingerprint,verification:{profileUrl:verified.profileUrl,sessionReady:true,...(job.accountId==='organization'?{organizationId:verified.organization.id}:{})}});
  checkedTarget(allowed.target,job.accountId);
  if(browserContentDigest(allowed.post,allowed.format,allowed.target)!==saved.receipt.contentDigest)throw new BrowserHumanError('Le serveur a modifié le contenu ou la destination après préparation. Aucun clic envoyé.');
  await session.ready();await updateBrowserReceipt(saved,{status:'submitting',mediaSha256:media?sha(Buffer.from(media.base64,'base64')):null});submission=true;
  await session.submit();
  const proof=await session.confirmation();const verifiedLink=verifiedPermalink(proof?.permalink);
  if(!verifiedLink||proof.urn!==verifiedLink.urn)throw new BrowserHumanError('Le permalien reçu ne confirme pas une publication LinkedIn.');
  const result={status:'published',targetKey:target.targetKey,...verifiedLink,message:'Publication confirmée dans LinkedIn.'};
  await updateBrowserReceipt(saved,{...result,confirmedAt:new Date().toISOString(),serverAck:false});
  try{await finish(result);await updateBrowserReceipt(saved,{serverAck:true});return result;}catch{return{...result,status:'uncertain',message:'Publication confirmée dans le navigateur, mais journal serveur non confirmé. Le reçu local conserve le permalien ; aucun nouvel envoi.'};}
 }catch(error){
  let message=error instanceof BrowserHumanError?error.message:'Le navigateur ou la confirmation de l’envoi est indisponible. Vérifier LinkedIn avant toute reprise.';
  if(!submission&&session?.composer?.ownedContent)try{await session.discardOwnDraft();}catch{message+=' Le brouillon créé par ce cycle doit être vérifié avant reprise.';}
  const result={status:began||submission?'uncertain':'blocked',targetKey:target.targetKey,message};
  if(saved.receipt.status!=='published')await updateBrowserReceipt(saved,result).catch(()=>{});
  await finish(result).catch(()=>{});return result;
 }finally{await session?.disconnect().catch(()=>{});}
}
