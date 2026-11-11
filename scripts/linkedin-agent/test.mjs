import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,unlink,rmdir,utimes} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {checkPlan,similarity,promptFor,redact,safeStrategy} from './quality.mjs';
import {subscriptionEnvironment} from './codex.mjs';
import {processJob,normalizeStudioUrl,downloadedConnection,pairDownloadedConnection} from '../linkedin-agent.mjs';
import {validateEmbeddedImage} from './render.mjs';

const sample=()=>({items:[{post:{title:'Clarifier le bon renfort.',category:'Consultants',template:'editorial',theme:'dark',caption:'Une compétence précise ou un projet à construire : le choix du renfort commence par le travail à accomplir. Posons le contexte avant de décider.',slides:[{label:'LE BON CADRE',title:'Clarifier le bon renfort.',body:'Un rôle clair dans votre équipe.',points:[]}]},rationale:'Expliquer le choix du format.',sourceUrls:['https://www.bandmdigitalconsulting.com/'],needsHuman:false,humanReason:''}],summary:'Une publication.'});
const payload={slots:[{day:'2026-11-12'}],strategy:{facts:['Consultants individuels ou squads selon le besoin.']},recentPosts:[]};

test('les statistiques non confirmées déclenchent un relais humain',()=>{const input=sample();input.items[0].post.caption+=' Nous apportons 35 % de productivité et 100 clients satisfaits.';const checked=checkPlan(input,payload);assert.equal(checked.items[0].needsHuman,true);assert.match(checked.items[0].humanReason,/chiffré/);});
test('un fait permanent peut être préparé sans validation répétée',()=>{const checked=checkPlan(sample(),payload);assert.equal(checked.items[0].needsHuman,false);assert.equal(checked.items[0].post.date,'2026-11-12');assert.equal(checked.items[0].post.image,'');assert.equal(checked.items[0].post.status,'draft');});
test('un contenu récent ne se republie pas silencieusement',()=>{const input=sample();const checked=checkPlan(input,{...payload,recentPosts:[input.items[0].post]});assert.equal(checked.items[0].needsHuman,true);assert.match(checked.items[0].humanReason,/proche/);assert.equal(similarity('Un renfort clair dans votre équipe','Un renfort clair dans votre équipe'),1);});
test('les sujets exclus par l’utilisateur sont effectivement bloqués',()=>{const input=sample();input.items[0].post.caption+=' La cryptomonnaie mérite aussi une discussion.';const result=checkPlan(input,{...payload,config:{excludedTopics:['cryptomonnaie']}});assert.equal(result.items[0].needsHuman,true);assert.match(result.items[0].humanReason,/Sujet exclu/);});
test('les sources nouvelles et les références clients demandent vérification',()=>{const input=sample();input.items[0].sourceUrls=['https://exemple.com/etude'];input.items[0].post.caption+=' Notre client Acme a obtenu de meilleurs résultats.';const item=checkPlan(input,payload).items[0];assert.equal(item.needsHuman,true);assert.match(item.humanReason,/externe/);assert.match(item.humanReason,/Référence/);});
test('le nombre de brouillons correspond aux créneaux du serveur',()=>assert.throws(()=>checkPlan(sample(),{slots:[{},{}]}),/créneaux/));
test('la portée des instructions respecte le nouvel autopilote sans copier des secrets',()=>{
 const strategy={rules:['Pas de publication automatique : export puis validation humaine.','Ne pas inventer.'],rhythm:'Trois fois par semaine'};
 assert.deepEqual(safeStrategy(strategy).rules,['Ne pas inventer.']);
 const prompt=promptFor('plan',{strategy,config:{objective:'Expliquer les consultants',voice:'Direct',facts:['Un référent par mission'],excludedTopics:['crypto'],clientSecret:'hidden-secret',workerToken:'worker-secret'},slots:[{}]});
 assert.ok(prompt.includes('Expliquer les consultants'));assert.ok(!prompt.includes('hidden-secret'));assert.ok(!prompt.includes('worker-secret'));
 assert.ok(prompt.includes('Un référent par mission'));assert.ok(prompt.includes('crypto'));assert.ok(prompt.includes('Direct'));
});
test('le profil personnel et la page entreprise ont des voix distinctes',()=>{
 const person=promptFor('plan',{config:{targetType:'person'},slots:[{}]});const company=promptFor('plan',{config:{targetType:'organization'},slots:[{}]});
 assert.match(person,/première personne/);assert.match(person,/sans inventer une expérience vécue/);assert.match(company,/voix collective/);
});
test('le contexte croise les comptes et les métriques sans copier les secrets ni inventer de mesure',()=>{
 const prompt=promptFor('plan',{config:{targetType:'person'},slots:[{}],recentPosts:[{accountId:'organization',status:'scheduled',title:'Angle existant',caption:'Légende déjà programmée',token:'secret-history'}],analytics:{updatedAt:'2026-11-11T09:00:00.000Z',metrics:[{key:'impressions',label:'Impressions',value:123},{key:'unknown',value:NaN}],accessToken:'secret-analytics'},previousResults:[{kind:'plan',status:'failed',message:'Quota atteint',at:'2026-11-10',token:'secret-result'}]});
 const context=JSON.parse(prompt.split('CONTEXTE_JSON:\n')[1]);
 assert.equal(context.recentPosts[0].accountId,'organization');assert.equal(context.recentPosts[0].status,'scheduled');
 assert.equal(context.analytics.metrics.length,1);assert.equal(context.analytics.metrics[0].value,123);assert.equal(context.previousResults[0].message,'Quota atteint');
 assert.ok(!prompt.includes('secret-history'));assert.ok(!prompt.includes('secret-analytics'));assert.ok(!prompt.includes('secret-result'));
});
test('aucune clé de facturation ou d’administration ne passe au processus Codex',()=>{
 const env=subscriptionEnvironment({PATH:'path',HOME:'home',OPENAI_API_KEY:'secret1',CODEX_API_KEY:'secret2',ADMIN_PASSWORD:'secret3',DATABASE_URL:'secret4',LINKEDIN_TOKEN:'secret5'});
 assert.deepEqual(env,{PATH:'path',HOME:'home'});
 assert.ok(!redact('Bearer sensitive_token_value').includes('sensitive_token_value'));assert.ok(!redact('client_secret=supersecret').includes('supersecret'));
});
test('la liaison refuse un transport non chiffré ou des identifiants dans une URL',()=>{
 assert.equal(normalizeStudioUrl('https://www.bandmdigitalconsulting.com/'),'https://www.bandmdigitalconsulting.com');
 assert.equal(normalizeStudioUrl('http://127.0.0.1:3110'),'http://127.0.0.1:3110');
 assert.throws(()=>normalizeStudioUrl('http://example.com'));
 assert.throws(()=>normalizeStudioUrl('https://user:secret@example.com'));
 assert.throws(()=>normalizeStudioUrl('https://example.com/path'));
});
test('la liaison automatique ne lit que les téléchargements B&M valides et prend le plus récent',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'bm-pair-test-')),files=[];
 const put=async(name,value)=>{const file=path.join(directory,name);files.push(file);await writeFile(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 const pair={token:'test-token-not-a-real-secret-123456',workerId:'first',studioUrl:'https://www.bandmdigitalconsulting.com'};
 try{
  await put('unrelated-credentials.json','secret not for this worker');
  assert.equal(await downloadedConnection(directory),null);
  const older=await put('bm-linkedin-worker.json',pair);await utimes(older,new Date(0),new Date(0));
  await put('bm-linkedin-worker-new.json',{...pair,workerId:'latest'});
  await put('bm-linkedin-worker-oversized.json','x'.repeat(10001));
  assert.equal((await downloadedConnection(directory)).workerId,'latest');
  const invalid=await put('bm-linkedin-worker-invalid.json',{...pair,studioUrl:'https://example.com'});await utimes(invalid,new Date(Date.now()+1000),new Date(Date.now()+1000));
  await assert.rejects(downloadedConnection(directory),/invalide/);
  await writeFile(invalid,JSON.stringify({...pair,extraSecret:'must not be imported'}));
  await assert.rejects(downloadedConnection(directory),/invalide/);
 }finally{for(const file of files)await unlink(file).catch(()=>{});await rmdir(directory);}
});
test('un téléchargement récent renouvelle la liaison existante sans réimporter une ancienne clé',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'bm-renew-test-')),connectionPath=path.join(directory,'connection.json'),download=path.join(directory,'bm-linkedin-worker.json');
 const old={token:'old-test-token-not-real-secret-123456',workerId:'old-worker',studioUrl:'https://www.bandmdigitalconsulting.com'},fresh={...old,token:'new-test-token-not-real-secret-123456',workerId:'new-worker'},saved=[];
 const save=async data=>{saved.push(data);await writeFile(connectionPath,JSON.stringify(data));};
 try{
  assert.equal((await pairDownloadedConnection({connectionPath,directory,save})).status,'waiting-for-pairing');
  await writeFile(connectionPath,JSON.stringify(old));await writeFile(download,JSON.stringify(old));await utimes(download,new Date(0),new Date(0));
  assert.equal((await pairDownloadedConnection({connectionPath,directory,save})).status,'unchanged');assert.equal(saved.length,0);
  await utimes(connectionPath,new Date(0),new Date(0));await writeFile(download,JSON.stringify(fresh));
  assert.equal((await pairDownloadedConnection({connectionPath,directory,save})).status,'renewed');assert.equal(saved.length,1);assert.equal(saved[0].workerId,'new-worker');
  await utimes(download,new Date(0),new Date(0));
  assert.equal((await pairDownloadedConnection({connectionPath,directory,save})).status,'unchanged');assert.equal(saved.length,1);
 }finally{await unlink(connectionPath).catch(()=>{});await unlink(download).catch(()=>{});await rmdir(directory);}
});
test('les images importées sont prises en charge sans ouvrir des URL arbitraires',()=>{
 const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5W0fQAAAAASUVORK5CYII=';
 assert.doesNotThrow(()=>validateEmbeddedImage(pixel));
 assert.throws(()=>validateEmbeddedImage('https://example.com/photo.png'));
 assert.throws(()=>validateEmbeddedImage('data:image/svg+xml;base64,PHN2Zz4='));
 assert.throws(()=>validateEmbeddedImage('data:image/png;base64,SGVsbG8='));
});
test('une publication à réponse perdue ne fait jamais l’objet d’un second envoi',async()=>{
 const calls=[];
 await assert.rejects(processJob({}, {id:'one',kind:'publish',leaseToken:'lease',payload:{format:'text',post:{}}},{request:async(_c,route)=>{calls.push(route);throw Error('Connection reset');}}),/non confirmée/);
 assert.deepEqual(calls,['worker/publish']);
});
test('l’identité du compte suit le travail jusqu’à la publication',async()=>{
 let sent;
 await processJob({}, {id:'one',accountId:'person',kind:'publish',leaseToken:'lease',payload:{format:'text',post:{}}},{request:async(_c,_route,body)=>{sent=body;return{status:'published'};}});
 assert.equal(sent.accountId,'person');assert.equal(sent.jobId,'one');assert.equal(sent.leaseToken,'lease');
});
test('un rendu défaillant bloque le travail sans publier de texte à la place',async()=>{
 const calls=[];
 await assert.rejects(processJob({}, {id:'one',kind:'publish',leaseToken:'lease',payload:{format:'png',post:{}}},{render:async()=>{throw Error('Rendu illisible');},request:async(_c,route)=>{calls.push(route);return{};}}),/Rendu illisible/);
 assert.deepEqual(calls,['worker/complete']);
});
test('une erreur de quota renvoie le diagnostic, sans autre appel de génération',async()=>{
 let generations=0;const calls=[];
 await assert.rejects(processJob({}, {id:'one',kind:'plan',leaseToken:'lease',payload},{generate:async()=>{generations++;throw Error('Quota ChatGPT atteint.');},request:async(_c,route,body)=>{calls.push({route,error:body.error});return{};}}),/Quota/);
 assert.equal(generations,1);assert.deepEqual(calls,[{route:'worker/complete',error:'Quota ChatGPT atteint.'}]);
});
test('un diagnostic long reste compatible avec la clôture du bail serveur',async()=>{
 let received;
 await assert.rejects(processJob({}, {id:'one',accountId:'person',kind:'plan',leaseToken:'lease',payload},{generate:async()=>{throw Error('Diagnostic '.repeat(150));},request:async(_c,_route,body)=>{received=body;return{};}}));
 assert.equal(received.error.length,800);assert.equal(received.accountId,'person');
});
