import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {browserEndpoint,browserIdentity,checkedTarget,checkedMedia,captionFingerprint,verifiedPermalink,publishWithHermes,replayConfirmedBrowserReceipts,prepareBrowserPublication,normalizedBrowserText,freshPublicationCandidates,verifiedPublicationCard,verifiedPublicationCards,HermesBrowserSession} from './browser.mjs';

const target={accountId:'person',profileUrl:browserIdentity.profileUrl,targetKey:'person:ines-favre-424651436'};
const post={title:'Clarifier la prochaine décision',caption:'Une règle explicite aide à nommer la décision attendue. Le contexte et les contraintes restent visibles avant de choisir une réponse.',template:'editorial',theme:'dark',image:'',slides:[{label:'MÉTHODE',title:'Une décision explicite',body:'Nommer la prochaine étape.',points:[]}]};
const job=()=>({id:'browser-job',accountId:'person',leaseToken:'test-lease-only',kind:'publish',payload:{provider:'hermes-browser',target,post,format:'text',fingerprint:captionFingerprint(post)}});
const proof={permalink:'https://www.linkedin.com/feed/update/urn:li:share:123456789/',urn:'urn:li:share:123456789'};
async function setup(){
 const workingRoot=await mkdtemp(path.join(tmpdir(),'bm-browser-test-')),counts={opened:0,prepared:0,submitted:0,discarded:0,disconnected:0,begin:0,finished:[]};
 const session={verify:async()=>structuredClone(browserIdentity),prepare:async()=>{counts.prepared++;},ready:async()=>{},submit:async()=>{counts.submitted++;},confirmation:async()=>proof,disconnect:async()=>{counts.disconnected++;},discardOwnDraft:async()=>{counts.discarded++;}};
 const options={job:job(),workingRoot,render:async()=>{throw Error('Un rendu ne doit pas être appelé pour ce post texte.');},openSession:async()=>{counts.opened++;return session;},begin:async()=>{counts.begin++;return{post,format:'text',target};},finish:async value=>{counts.finished.push(value);}};
 const cleanup=async()=>{const dir=path.join(workingRoot,'browser-receipts');for(const name of await readdir(dir).catch(()=>[]))await unlink(path.join(dir,name));await rmdir(dir).catch(()=>{});await rmdir(workingRoot);};
 return{counts,session,options,cleanup};
}

test('CDP reste en boucle locale et les cibles restent celles vérifiées',()=>{
 assert.equal(browserEndpoint('http://127.0.0.1:9222'),'http://127.0.0.1:9222');
 for(const url of ['https://example.com','http://user:secret@127.0.0.1:9222','http://127.0.0.1:9222/path'])assert.throws(()=>browserEndpoint(url));
 assert.equal(checkedTarget(target,'person'),target);assert.throws(()=>checkedTarget({...target,targetKey:'person:another'},'person'));
 assert.throws(()=>checkedTarget({...target,accountId:'organization'},'organization'));
});
test('les retours Quill sont tolérés sans masquer une modification du texte',()=>{
 assert.equal(normalizedBrowserText('Première idée.\n\nDeuxième idée.'),normalizedBrowserText('Première idée.\n\n\n\n\nDeuxième idée.'));
 assert.notEqual(normalizedBrowserText('Le projet avance.'),normalizedBrowserText('Le projet ne progresse pas.'));
});
test('un lien générique ou un média mal déclaré ne prouve pas une publication',()=>{
 assert.deepEqual(verifiedPermalink(proof.permalink),proof);
 assert.equal(verifiedPermalink('https://www.linkedin.com/feed/'),null);assert.equal(verifiedPermalink('https://example.com/feed/update/urn:li:share:123/'),null);
 assert.throws(()=>checkedMedia({mime:'application/pdf',base64:Buffer.from('not a PDF').toString('base64')},'pdf'));
 assert.throws(()=>checkedMedia({mime:'image/png',base64:Buffer.from('%PDF-1.7').toString('base64')},'pdf'));
});
test('une notification positive ne confirme que des liens nouveaux après le clic',()=>{
 const previous='https://www.linkedin.com/feed/update/urn:li:activity:987654321/?trk=before';
 const before={links:[previous],notifications:[]};
 const after={links:[proof.permalink],notifications:[{text:'Votre post a été publié. Voir le post',links:[previous,proof.permalink]}]};
 assert.deepEqual(freshPublicationCandidates(before,after),[proof]);
 assert.deepEqual(freshPublicationCandidates(before,{...after,notifications:[{text:'Le post n’a pas été publié.',links:[proof.permalink]}]}),[]);
 assert.deepEqual(freshPublicationCandidates(before,{...after,notifications:[]}),[]);
 assert.deepEqual(freshPublicationCandidates({links:[],notifications:after.notifications},after),[]);
 for(const text of ['Publication réussie. Voir le post','Your post was published. View post','Successfully shared. View post'])assert.deepEqual(freshPublicationCandidates({links:[]},{notifications:[{text,links:[proof.permalink]}]}),[proof]);
});
test('le permalien doit contenir tout le texte et le lien de la destination exacte',()=>{
 const card={authorHref:browserIdentity.profileUrl,authorName:'Ines Favre',menuAuthor:'Ines Favre',caption:normalizedBrowserText(post.caption)};
 assert.equal(verifiedPublicationCard(card,target,post.caption),true);
 assert.equal(verifiedPublicationCard({...card,authorHref:'https://www.linkedin.com/in/autre-personne/'},target,post.caption),false);
 assert.equal(verifiedPublicationCard({...card,authorHref:'https://example.com/in/ines-favre-424651436/'},target,post.caption),false);
 assert.equal(verifiedPublicationCard({...card,caption:card.caption.slice(0,-1)},target,post.caption),false);
 const organization={accountId:'organization'},companyCard={...card,authorHref:'https://www.linkedin.com/company/bandmdigitalconsulting/',authorName:'B&M Digital Consulting',menuAuthor:'B&M Digital Consulting'};
 assert.equal(verifiedPublicationCard(companyCard,organization,post.caption),false);
 assert.equal(verifiedPublicationCard(companyCard,organization,post.caption,['/company/bandmdigitalconsulting']),true);
 assert.equal(verifiedPublicationCard({...companyCard,authorName:'Autre page'},organization,post.caption,['/company/bandmdigitalconsulting']),false);
});
test('la confirmation réelle renvoie la preuve vérifiée après un seul clic',async()=>{
 const session=new HermesBrowserSession({contexts:()=>[{}]}),counts={clicks:0,verified:[]};
 const page={url:()=>browserIdentity.profileUrl};
 session.composer={page,target,post,dialog:{getByRole:()=>({click:async()=>{counts.clicks++;}})}};
 session.publicationSignals=async()=>counts.clicks?{notifications:[{text:'Votre post a été publié. Voir le post',links:[proof.permalink]}]}:{links:[],notifications:[]};
 session.verifyPublicationPermalink=async candidate=>{counts.verified.push(candidate);return true;};
 await session.submit();
 assert.deepEqual(await session.confirmation({timeout:10,pollInterval:1}),proof);
 assert.equal(counts.clicks,1);assert.deepEqual(counts.verified,[proof]);
 await assert.rejects(()=>session.submit(),/déjà été tenté/);assert.equal(counts.clicks,1);
});
test('une recommandation ne remplace pas la carte du permalien',()=>{
 const expected={authorHref:browserIdentity.profileUrl,authorName:'Ines Favre',menuAuthor:'Ines Favre',caption:normalizedBrowserText(post.caption)};
 const other={authorHref:'https://www.linkedin.com/in/autre/',authorName:'Autre auteur',caption:'Un autre texte',urn:proof.urn};
 assert.equal(verifiedPublicationCards([expected],proof,target,post.caption),true);
 assert.equal(verifiedPublicationCards([{...expected,urn:'urn:li:share:987'}],proof,target,post.caption),false);
 assert.equal(verifiedPublicationCards([other,expected],proof,target,post.caption),false);
 assert.equal(verifiedPublicationCards([{...other,urn:''},expected],proof,target,post.caption),false);
 assert.equal(verifiedPublicationCards([{...expected,urn:proof.urn},{...other,urn:'urn:li:share:987'}],proof,target,post.caption),true);
});
test('un ancien lien ou une carte non vérifiée reste incertain sans nouveau clic',async()=>{
 for(const stale of [true,false]){
  const session=new HermesBrowserSession({contexts:()=>[{}]}),counts={clicks:0,verified:0};
  session.composer={page:{url:()=>browserIdentity.profileUrl},target,post,dialog:{getByRole:()=>({click:async()=>{counts.clicks++;}})}};
  session.publicationSignals=async()=>counts.clicks?{notifications:[{text:'Votre post a été publié.',links:[proof.permalink]}]}:{links:stale?[proof.permalink]:[],notifications:[]};
  session.verifyPublicationPermalink=async()=>{counts.verified++;return false;};
  await session.submit();await assert.rejects(()=>session.confirmation({timeout:5,pollInterval:1}),/aucun nouveau permalien/);
  assert.equal(counts.clicks,1);assert.equal(counts.verified,stale?0:1);
 }
});
test('une lecture incomplète avant publication interdit le clic',async()=>{
 const session=new HermesBrowserSession({contexts:()=>[{}]});let clicks=0;
 session.composer={page:{url:()=>browserIdentity.profileUrl},target,post,dialog:{getByRole:()=>({click:async()=>{clicks++;}})}};
 session.publicationSignals=async()=>({links:[],notifications:[],complete:false});
 await assert.rejects(()=>session.submit(),/Aucun clic envoyé/);assert.equal(clicks,0);
});
test('une confirmation perdue après le clic ne déclenche jamais un deuxième clic',async()=>{
 const state=await setup();try{
  state.session.confirmation=async()=>{throw Error('Aucune preuve disponible');};
  assert.equal((await publishWithHermes(state.options)).status,'uncertain');
  assert.equal((await publishWithHermes(state.options)).status,'uncertain');
  assert.equal(state.counts.submitted,1);assert.equal(state.counts.begin,1);assert.equal(state.counts.opened,1);
 }finally{await state.cleanup();}
});
test('un refus serveur ou un contenu modifié après préparation interdit le clic',async()=>{
 for(const mode of ['paused','changed']){const state=await setup();try{
  state.options.begin=async()=>{if(mode==='paused')throw Error('Compte en pause');return{post:{...post,caption:'Texte modifié'},format:'text',target};};
  assert.equal((await publishWithHermes(state.options)).status,'uncertain');assert.equal(state.counts.submitted,0);
 }finally{await state.cleanup();}}
});
test('une preuve confirmée est rapprochée après perte réseau sans nouvelle interaction navigateur',async()=>{
 const state=await setup();try{
  state.options.finish=async()=>{throw Error('Réponse serveur perdue');};
  assert.equal((await publishWithHermes(state.options)).status,'uncertain');assert.equal(state.counts.submitted,1);
  const sent=[];const result=await replayConfirmedBrowserReceipts({workingRoot:state.options.workingRoot,finish:async value=>sent.push(value)});
  assert.equal(result.reconciled,1);assert.equal(sent[0].leaseToken,'test-lease-only');assert.equal(sent[0].status,'published');assert.equal(sent[0].urn,proof.urn);
  assert.equal((await replayConfirmedBrowserReceipts({workingRoot:state.options.workingRoot,finish:async()=>{throw Error('Ne pas rejouer un reçu acquitté');}})).reconciled,0);
  assert.equal(state.counts.submitted,1);assert.equal(state.counts.opened,1);
  const file=(await readdir(path.join(state.options.workingRoot,'browser-receipts')))[0],receipt=JSON.parse(await readFile(path.join(state.options.workingRoot,'browser-receipts',file),'utf8'));assert.equal(receipt.serverAck,true);
 }finally{await state.cleanup();}
});
test('un reçu incertain n’est jamais rejoué comme publication confirmée',async()=>{
 const state=await setup();try{
  state.session.confirmation=async()=>{throw Error('Pas de preuve');};await publishWithHermes(state.options);
  const result=await replayConfirmedBrowserReceipts({workingRoot:state.options.workingRoot,finish:async()=>{throw Error('Aucun rapprochement autorisé');}});assert.equal(result.reconciled,0);
 }finally{await state.cleanup();}
});
test('le contrôle de compositeur retire uniquement son brouillon et ne possède aucun chemin de publication',async()=>{
 const state=await setup();try{
  const result=await prepareBrowserPublication({post,format:'text',accountId:'person',render:state.options.render,openSession:state.options.openSession});
  assert.equal(result.status,'prepared-only');assert.equal(state.counts.discarded,1);assert.equal(state.counts.submitted,0);assert.equal(state.counts.begin,0);assert.equal(state.counts.disconnected,1);
 }finally{await state.cleanup();}
});
