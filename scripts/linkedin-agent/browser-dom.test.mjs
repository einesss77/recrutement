import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {access,mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {HermesBrowserSession,BrowserHumanError,browserIdentity,normalizedBrowserText} from './browser.mjs';

// All LinkedIn URLs are fulfilled from these HTML fixtures. No request reaches LinkedIn,
// and the disposable Chrome profile is unrelated to Hermes or the user's browser.
const caption='Une décision explicite aide le métier.\n\nLe contexte reste visible avant de choisir.';
const post={title:'Une décision explicite',caption,template:'editorial',theme:'dark',slides:[{label:'MÉTHODE',title:'Une décision explicite',body:'Nommer la prochaine étape.',points:[]}]};
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const media={mime:'image/png',base64:png};
const pdfMedia={mime:'application/pdf',base64:Buffer.from('%PDF-1.4\n% local fixture, no external upload').toString('base64')};
const publicationProof={urn:'urn:li:activity:999000111222333',permalink:'https://www.linkedin.com/feed/update/urn:li:activity:999000111222333/'};
const target=accountId=>({accountId,profileUrl:browserIdentity.profileUrl,targetKey:accountId==='person'?'person:ines-favre-424651436':'organization:106357560',...(accountId==='organization'?{organizationId:browserIdentity.organization.id,adminUrl:browserIdentity.organization.adminUrl}:{})});
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let chrome,profileDirectory,endpoint;

before(async()=>{
 const candidates=process.env.STUDIO_BROWSER_TEST_EXECUTABLE?[process.env.STUDIO_BROWSER_TEST_EXECUTABLE]:[chromium.executablePath(),...(process.platform==='win32'?[path.join(process.env.PROGRAMFILES||'C:\\Program Files','Google','Chrome','Application','chrome.exe'),path.join(process.env['PROGRAMFILES(X86)']||'C:\\Program Files (x86)','Microsoft','Edge','Application','msedge.exe')]:[])];
 let executable;
 for(const candidate of candidates)try{await access(candidate);executable=candidate;break;}catch{}
 assert.ok(executable,'Installez Chromium Playwright ou définissez STUDIO_BROWSER_TEST_EXECUTABLE vers un navigateur Chromium local.');
 profileDirectory=await mkdtemp(path.join(tmpdir(),'bm-linkedin-dom-'));
 chrome=spawn(executable,['--headless=new','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profileDirectory,'--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'],{windowsHide:true,stdio:'ignore'});
 let spawnError;chrome.on('error',e=>{spawnError=e;});
 for(let i=0;i<100;i++){
  if(spawnError)throw spawnError;
  const value=await readFile(path.join(profileDirectory,'DevToolsActivePort'),'utf8').catch(()=>null);
  if(value){const port=Number(value.split('\n')[0]);assert.ok(Number.isInteger(port)&&port>0);endpoint='http://127.0.0.1:'+port;return;}
  if(chrome.exitCode!==null)throw Error('Le Chrome isolé s’est arrêté avant son démarrage.');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw Error('Le port du Chrome isolé n’est pas disponible.');
});

after(async()=>{
 if(chrome&&chrome.exitCode===null){const exited=new Promise(resolve=>chrome.once('exit',resolve));chrome.kill();await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,5000))]);}
 if(profileDirectory){
  // Verify the exact temporary directory before recursively removing our own browser profile.
  assert.equal(path.dirname(path.resolve(profileDirectory)),path.resolve(tmpdir()));
  assert.match(path.basename(profileDirectory),/^bm-linkedin-dom-/);
  await rm(profileDirectory,{recursive:true,force:true,maxRetries:8,retryDelay:250});
 }
});

function composerHTML(accountId,variant={}){
 const personal=accountId==='person',name=personal?'Options de publicités':'Fenêtre modale Créer un post';
 const author=variant.wrongAuthor?'Autre personne':personal?'Ines Favre':'B&M Digital Consulting B&M Digital Consulting Visibilité : Tout le monde';
 const authorButton=`<button aria-label="${escapeHtml(author)}">${escapeHtml(author)}</button>`;
 const editor=`<div role="textbox" ${personal?'':'aria-label="Éditeur de texte pour créer du contenu"'} contenteditable="true">${escapeHtml(variant.existingCaption||'')}</div>`;
 return `<section role="dialog" aria-label="${name}" id="composer">${authorButton}${variant.duplicateAuthor?authorButton:''}${personal?`<figure aria-hidden="true"><img alt="" src="data:image/png;base64,${png}"></figure>`:''}${editor}${variant.duplicateEditor?editor:''}<button id="add-media" aria-label="${personal?'Médias':'Ajouter un média'}">Média</button><input id="file" type="file" accept="image/png" hidden><button id="expand-document">${personal?'Développer les types de contenu':'Plus'}</button>${personal?'<a href="#" id="add-document" hidden>Document</a>':'<button id="add-document" hidden>Ajouter un document</button>'}<button id="remove-media" ${variant.existingMedia?'':'hidden'}>${personal?'Close':'Supprimer le média'}</button><button onclick="document.body.dataset.publishClicks=String(Number(document.body.dataset.publishClicks||0)+1)">Publier</button><button onclick="document.body.dataset.discardClicks=String(Number(document.body.dataset.discardClicks||0)+1);document.getElementById('composer').hidden=true">Ignorer</button></section>`;
}

function documentHTML(body,script=''){
 return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>body{font:16px sans-serif}iframe{width:900px;height:650px;border:0}[contenteditable]{min-height:80px;border:1px solid #aaa;padding:8px}button{margin:6px}img{width:60px;height:60px}</style></head><body data-publish-clicks="0" data-discard-clicks="0">${body}<script>${script}</script></body></html>`;
}

function mediaScript(personal,variant){
 const image=variant.missingPreview?'':`<img alt="${personal?'Aperçu de l’image':'Aperçu de publication-bm.png'}" src="data:image/png;base64,${png}">`;
 return `const file=document.getElementById('file');document.getElementById('add-media').onclick=()=>file.click();file.onchange=()=>{document.getElementById('composer').hidden=true;const upload=document.createElement('section');upload.setAttribute('role','dialog');upload.setAttribute('aria-label','Éditeur');upload.id='media-editor';upload.innerHTML=${JSON.stringify(image+'<button id="media-next">Suivant</button>')};document.body.append(upload);document.getElementById('media-next').onclick=()=>{upload.remove();const composer=document.getElementById('composer');composer.hidden=false;const preview=document.createElement('img');preview.alt=${JSON.stringify(personal?'':'Aperçu de l’image')};preview.src=URL.createObjectURL(file.files[0]);const container=document.createElement('figure');${personal?"container.setAttribute('aria-hidden','true');":''}container.append(preview);composer.append(container);document.getElementById('remove-media').hidden=false;document.getElementById('remove-media').onclick=()=>{container.remove();document.getElementById('remove-media').hidden=true;};};};`;
}

function pdfScript(personal){
 const uploaded=personal?'<p>3 pages</p>':'<h2>publication-bm.pdf</h2><button>Supprimer un document chargé</button>';
 const fields=uploaded+`<label>Titre du document${personal?'':' '}*<input id="document-title" type="text"></label><button id="document-done">Terminé</button>`;
 return `document.getElementById('expand-document').onclick=()=>document.getElementById('add-document').hidden=false;document.getElementById('add-document').onclick=event=>{event.preventDefault();document.getElementById('composer').hidden=true;const upload=document.createElement('section');upload.setAttribute('role','dialog');upload.setAttribute('aria-label','Partager un document');upload.id='pdf-upload';upload.innerHTML='<button id="choose-pdf">Choisir un fichier</button><input id="pdf-file" type="file" accept=".doc,.docx,.pdf,.ppt,.pptx" hidden>';document.body.append(upload);const input=document.getElementById('pdf-file');document.getElementById('choose-pdf').onclick=()=>input.click();input.onchange=()=>{document.body.dataset.pdfName=input.files[0].name;document.body.dataset.pdfMime=input.files[0].type;upload.innerHTML=${JSON.stringify(fields)};document.getElementById('document-done').onclick=()=>{const title=document.getElementById('document-title').value;upload.remove();const composer=document.getElementById('composer');composer.hidden=false;const preview=document.createElement('div');preview.id='pdf-preview';${personal?"const heading=document.createElement('p');heading.textContent=title;preview.append(heading);const pages=document.createElement('p');pages.textContent='• 3 pages';preview.append(pages);":"preview.setAttribute('role','alert');preview.textContent='Le chargement de votre document est terminé';const documentFrame=document.createElement('iframe');documentFrame.src='/fixture/document-preview';preview.append(documentFrame);"}composer.append(preview);const remove=document.getElementById('remove-media');remove.hidden=false;remove.onclick=()=>{preview.remove();remove.hidden=true;};};};};`;
}

function publicationHTML(variant){
 const accountId=variant.publicationAccountId||'organization';
 const card=(authorId,urn,commentOnly=false)=>{
  const href=authorId==='person'?browserIdentity.profileUrl:authorId==='organization'?'https://www.linkedin.com/company/106357560/':'https://www.linkedin.com/in/autre-auteur/';
  const name=authorId==='person'?'Ines Favre':authorId==='organization'?'B&M Digital Consulting':'Autre auteur';
  const body=`${variant.attributedLike?`<header><a href="${browserIdentity.profileUrl}">Ines Favre</a> a aimé ceci</header>`:''}<h2>Post du fil d’actualité</h2><a href="${href}">${name}</a><button aria-label="Ouvrir le menu de commandes pour le post de ${name}">Options</button><p>${escapeHtml(commentOnly?'Un autre texte dans la publication.':caption)}</p><button>J’aime</button><button>Commenter</button>${commentOnly?`<section><a href="${browserIdentity.profileUrl}">Ines Favre</a><p>${escapeHtml(caption)}</p></section>`:''}`;
  return variant.reactPublication?`<div>${body}</div>`:`<article data-urn="${urn}">${body}</article>`;
 };
 if(variant.recommendation)return card('other',publicationProof.urn)+card(accountId,'urn:li:activity:444000111222333');
 return card(variant.wrongPublicationAuthor||variant.attributedLike?'other':accountId,variant.mismatchedUrn?'urn:li:activity:555000111222333':publicationProof.urn,variant.commentOnly);
}

function fixture(url,variant){
 const u=new URL(url);
 if(u.pathname===new URL(publicationProof.permalink).pathname)return documentHTML(variant.reactPublication?'<iframe title="Publication LinkedIn" src="/fixture/publication-frame"></iframe>':publicationHTML(variant));
 if(u.pathname==='/fixture/publication-frame')return documentHTML(publicationHTML(variant));
 if(u.pathname==='/feed/')return documentHTML('<h1>Fil d’actualité</h1><iframe title="Fil LinkedIn" src="/fixture/feed-frame"></iframe>');
 if(u.pathname==='/fixture/feed-frame'){
  const body=`<aside role="complementary" aria-label="Barre latérale"><a href="${browserIdentity.profileUrl}">Ines Favre</a><a href="${browserIdentity.organization.adminUrl}">B&M Digital Consulting</a></aside><button style="display:none">Commencer un post</button><button id="start">Commencer un post</button><div id="personal-composer"></div>`;
  return documentHTML(body,`document.getElementById('start').onclick=()=>{document.getElementById('personal-composer').innerHTML=${JSON.stringify(composerHTML('person',variant))};${mediaScript(true,variant)}${pdfScript(true)}};`);
 }
 if(u.pathname==='/company/106357560/admin/feed/posts'){
  return documentHTML(composerHTML('organization',variant),mediaScript(false,variant)+pdfScript(false));
 }
 if(u.pathname==='/company/106357560/admin/')return documentHTML('<h1>B&M Digital Consulting</h1><section role="region" aria-label="Section de navigation pour les administrateurs de page organisationnelle">Administrer la page</section>');
 return null;
}

async function withSession(variant,run){
 const browser=await chromium.connectOverCDP(endpoint),session=new HermesBrowserSession(browser);
 await session.context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='https://www.linkedin.com')return route.abort();
  const html=fixture(url.href,variant);
  if(html===null)return route.abort();
  await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
 });
 try{return await run(session);}finally{await session.disconnect();}
}

test('le contrôle retrouve identité et rôle administrateur dans le fil iframe, puis ferme ses seuls onglets',async()=>{
 await withSession({},async session=>{
  const existing=session.context.pages().map(p=>p.url());
  assert.deepEqual(await session.verify(),browserIdentity);
  assert.equal(session.pages.size,0);
  assert.deepEqual(session.context.pages().map(p=>p.url()),existing);
 });
});

test('le compositeur personnel React dans une iframe ignore les boutons homonymes invisibles',async()=>{
 await withSession({},async session=>{
  await session.prepare(target('person'),post,'text',null);
  assert.equal(session.composer.frame.url(),'https://www.linkedin.com/fixture/feed-frame');
  assert.equal(normalizedBrowserText(await session.composer.editor.innerText()),normalizedBrowserText(caption));
  const frame=session.composer.frame;
  await session.discardOwnDraft();
  assert.equal(await frame.locator('body').getAttribute('data-discard-clicks'),'1');
  assert.equal(await frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('le compositeur Ember accepte les espaces Quill sans modifier le texte et retire son propre brouillon',async()=>{
 await withSession({},async session=>{
  await session.prepare(target('organization'),post,'text',null);
  const page=session.composer.page,editor=session.composer.editor;
  await editor.evaluate((element,text)=>{element.innerHTML=text.split('\n\n').map(p=>'<p>'+p+'</p><p><br></p>').join('');},caption);
  assert.equal(normalizedBrowserText(await editor.innerText()),normalizedBrowserText(caption));
  await session.ready();await session.discardOwnDraft();
  assert.equal(await page.locator('#composer [contenteditable]').innerText(),'');
  assert.equal(await page.locator('body').getAttribute('data-discard-clicks'),'1');
  assert.equal(await page.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('un auteur différent bloque avant toute écriture dans le composeur',async()=>{
 await withSession({wrongAuthor:true},async session=>{
  await assert.rejects(session.prepare(target('person'),post,'text',null),error=>error instanceof BrowserHumanError&&/auteur/.test(error.message));
  assert.equal(await session.composer.dialog.getByRole('textbox').innerText(),'');
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('des auteurs ou éditeurs visibles ambigus bloquent au lieu de choisir arbitrairement',async()=>{
 for(const variant of [{duplicateAuthor:true},{duplicateEditor:true}])await withSession(variant,async session=>{
  await assert.rejects(session.prepare(target('organization'),post,'text',null),BrowserHumanError);
  assert.deepEqual(await session.composer.dialog.getByRole('textbox').allTextContents(),variant.duplicateEditor?['','']:['']);
  assert.equal(await session.composer.page.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('un brouillon personnel préexistant, même composé seulement d’un média, reste intact',async()=>{
 for(const variant of [{existingCaption:'Un texte commencé par Ines.'},{existingMedia:true}])await withSession(variant,async session=>{
  await assert.rejects(session.prepare(target('person'),post,'text',null),error=>error instanceof BrowserHumanError&&/brouillon/.test(error.message));
  await session.discardOwnDraft();
  assert.equal(await session.composer.dialog.getByRole('textbox').innerText(),variant.existingCaption||'');
  assert.equal(await session.composer.dialog.getByRole('button',{name:'Close',exact:true}).isVisible(),!!variant.existingMedia);
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-discard-clicks'),'0');
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('une modification substantielle interdit la publication et la suppression du brouillon',async()=>{
 await withSession({},async session=>{
  await session.prepare(target('organization'),post,'text',null);
  const changed='Une modification humaine remplace le message préparé.';
  await session.composer.editor.fill(changed);
  await assert.rejects(session.ready(),error=>error instanceof BrowserHumanError&&/texte/.test(error.message));
  await assert.rejects(session.discardOwnDraft(),error=>error instanceof BrowserHumanError&&/brouillon/.test(error.message));
  assert.equal(await session.composer.editor.innerText(),changed);
  assert.equal(await session.composer.page.locator('body').getAttribute('data-discard-clicks'),'0');
  assert.equal(await session.composer.page.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('un PNG passe par le sélecteur de fichier et deux aperçus avant de devenir prêt',async()=>{
 await withSession({},async session=>{
  await session.prepare(target('organization'),post,'png',media);
  assert.equal(session.composer.mediaReady,true);
  assert.equal(await session.composer.dialog.getByRole('img',{name:'Aperçu de l’image',exact:true}).count(),1);
  const page=session.composer.page;
  await session.discardOwnDraft();
  assert.equal(await page.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('le PNG personnel distingue la preview blob de l’avatar homonyme dans le compositeur React',async()=>{
 await withSession({},async session=>{
  await session.prepare(target('person'),post,'png',media);
  assert.equal(session.composer.mediaReady,true);
  assert.equal(await session.composer.dialog.locator('figure[aria-hidden="true"] img[alt=""]').count(),2);
  assert.equal(await session.composer.dialog.locator('figure[aria-hidden="true"] img[alt=""][src^="blob:"]').count(),1);
  const frame=session.composer.frame;
  await session.discardOwnDraft();
  assert.equal(await frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('les PDF Ember et React restent vérifiables quand LinkedIn remplace le champ fichier après sélection',async()=>{
 for(const accountId of ['organization','person'])await withSession({},async session=>{
  await session.prepare(target(accountId),post,'pdf',pdfMedia);
  assert.equal(session.composer.mediaReady,true);
  const frame=session.composer.frame;
  assert.equal(await frame.locator('body').getAttribute('data-pdf-name'),'publication-bm.pdf');
  assert.equal(await frame.locator('body').getAttribute('data-pdf-mime'),'application/pdf');
  assert.equal(await frame.locator('#pdf-file').count(),0);
  if(accountId==='person')assert.equal(await session.composer.dialog.getByText('publication-bm.pdf',{exact:true}).count(),0);
  await session.discardOwnDraft();
  assert.equal(await frame.locator('#pdf-preview').count(),0);
  assert.equal(await frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('un PNG retiré ou remplacé après préparation bloque le dernier contrôle avant publication',async()=>{
 for(const accountId of ['organization','person'])for(const replacement of [false,true])await withSession({},async session=>{
  await session.prepare(target(accountId),post,'png',media);
  if(replacement){
   const preview=accountId==='person'?session.composer.dialog.locator('img[src^="blob:"]'):session.composer.dialog.getByRole('img',{name:'Aperçu de l’image',exact:true});
   await preview.evaluate(async image=>{const copy=await(await fetch(image.src)).blob();image.src=URL.createObjectURL(copy);await image.decode();});
  }else await session.composer.dialog.getByRole('button',{name:accountId==='person'?'Close':'Supprimer le média',exact:true}).click();
  await assert.rejects(session.ready(),error=>error instanceof BrowserHumanError&&/média|aperçu|PNG/.test(error.message));
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('le titre du PDF personnel ne peut pas changer après la préparation',async()=>{
 await withSession({},async session=>{
  await session.prepare(target('person'),post,'pdf',pdfMedia);
  await session.composer.dialog.locator('#pdf-preview p').first().evaluate(node=>{node.textContent='Un document différent';});
  await assert.rejects(session.ready(),error=>error instanceof BrowserHumanError&&/document|PDF|média/.test(error.message));
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('un nouveau permalien est confirmé dans sa carte Ember ou React avec le bon auteur et le texte intégral',async()=>{
 for(const accountId of ['organization','person'])await withSession({publicationAccountId:accountId,reactPublication:accountId==='person'},async session=>{
  await session.prepare(target(accountId),post,'text',null);
  const frame=session.composer.frame;
  await session.composer.dialog.getByRole('button',{name:'Publier',exact:true}).evaluate((button,permalink)=>{button.onclick=()=>{document.body.dataset.publishClicks=String(Number(document.body.dataset.publishClicks||0)+1);document.getElementById('composer').hidden=true;const notice=document.createElement('div');notice.setAttribute('role','status');notice.innerHTML='<p>Votre post a été publié</p>';const link=document.createElement('a');link.href=permalink;link.textContent='Voir le post';notice.append(link);document.body.append(notice);};},publicationProof.permalink);
  await session.submit();
  assert.deepEqual(await session.confirmation({timeout:1000,pollInterval:20}),publicationProof);
  await assert.rejects(session.submit(),error=>error instanceof BrowserHumanError&&/déjà/.test(error.message));
  assert.equal(await frame.locator('body').getAttribute('data-publish-clicks'),'1');
  assert.equal(session.pages.size,1);
 });
});

test('une notification conservant un ancien permalien, même auparavant masqué, ne confirme pas un nouvel envoi',async()=>{
 for(const hidden of [false,true])await withSession({},async session=>{
  await session.prepare(target('organization'),post,'text',null);
  await session.composer.frame.evaluate(({permalink,hidden})=>{const notice=document.createElement('div');notice.id='prior-notification';notice.hidden=hidden;notice.setAttribute('role','alert');notice.innerHTML='<p>Votre post a été publié</p><a href="'+permalink+'">Voir le post</a>';document.body.append(notice);},{permalink:publicationProof.permalink,hidden});
  await session.composer.dialog.getByRole('button',{name:'Publier',exact:true}).evaluate(button=>{button.onclick=()=>{document.body.dataset.publishClicks=String(Number(document.body.dataset.publishClicks||0)+1);document.getElementById('prior-notification').hidden=false;};});
  await session.submit();
  await assert.rejects(session.confirmation({timeout:100,pollInterval:20}),BrowserHumanError);
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-publish-clicks'),'1');
 });
});

test('le permalien refuse un autre auteur, un commentaire, une recommandation, une attribution et un autre URN',async()=>{
 for(const variant of [{wrongPublicationAuthor:true},{commentOnly:true},{recommendation:true},{recommendation:true,reactPublication:true},{attributedLike:true},{mismatchedUrn:true}])await withSession({...variant,publicationAccountId:'person'},async session=>{
  await session.prepare(target('person'),post,'text',null);
  assert.equal(await session.verifyPublicationPermalink(publicationProof,{timeout:100,pollInterval:20}),false,JSON.stringify(variant));
  assert.equal(session.pages.size,1);
  assert.equal(await session.composer.frame.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('un fichier sélectionné sans aperçu ne devient jamais prêt à publier',async()=>{
 await withSession({missingPreview:true},async session=>{
  await assert.rejects(session.prepare(target('organization'),post,'png',media),error=>error instanceof BrowserHumanError&&/prévisualisation/.test(error.message));
  assert.notEqual(session.composer.mediaReady,true);
  assert.equal(await session.composer.page.locator('body').getAttribute('data-publish-clicks'),'0');
 });
});

test('la déconnexion CDP conserve Chrome et un onglet préexistant non détenu par le worker',async()=>{
 const observer=await chromium.connectOverCDP(endpoint),context=observer.contexts()[0],existing=await context.newPage();
 await existing.setContent('<title>Onglet préexistant à préserver</title><p id="unchanged">Contenu extérieur au cycle</p>');
 try{
  await withSession({},async session=>{
   const owned=await session.newPage('https://www.linkedin.com/feed/');assert.equal(owned.isClosed(),false);
   assert.equal(session.pages.has(existing),false);
   await session.closePage(existing);
   assert.equal(existing.isClosed(),false);
  });
  assert.equal((await fetch(endpoint+'/json/version')).ok,true);
  assert.equal(existing.isClosed(),false);
  assert.equal(await existing.title(),'Onglet préexistant à préserver');
  assert.equal(await existing.locator('#unchanged').innerText(),'Contenu extérieur au cycle');
  const fresh=await chromium.connectOverCDP(endpoint);
  assert.ok(fresh.contexts()[0].pages().length>=2);await fresh.close();
 }finally{await existing.close();await observer.close();}
});
