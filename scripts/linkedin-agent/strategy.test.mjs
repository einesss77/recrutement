import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildEditorialStrategy} from '../../shared/linkedin-strategy.mjs';
const playbook=JSON.parse(await readFile(new URL('../../studio-social/content/linkedin-playbook.json',import.meta.url),'utf8'));
const day=(n)=>new Date(Date.UTC(2026,10,1+n,12)).toISOString().slice(0,10);
const slots=(start=0,length=7)=>Array.from({length},(_,i)=>({day:day(start+i)}));
const base={playbook,accountId:'organization',config:{campaignStart:day(0),timezone:'Europe/Paris',commercialFocus:'balanced',targetAudience:'mixed'},slots:slots(),now:new Date('2026-11-01T12:00:00Z')};
const plan=extra=>buildEditorialStrategy({...base,...extra});
test('chaque semaine suit un mix utile et un seul contact commercial',()=>{
 for(let offset=0;offset<28;offset++){
  const p=plan({slots:slots(offset)});
  assert.equal(p.briefs.length,7);assert.equal(p.briefs.filter(b=>b.ctaKind==='contact').length,1);
  assert.equal(p.briefs.filter(b=>b.ctaKind==='none').length,2);
  assert.equal(p.briefs.filter(b=>b.purpose==='proof').length,1);
 }
});
test('les deux comptes équilibrés se partagent les angles, pas un copier-coller',()=>{
 for(let week=0;week<4;week++){
  const organization=plan({slots:slots(week*7)}),person=plan({accountId:'person',slots:slots(week*7)});
  assert.notEqual(organization.accountRole,person.accountRole);
  assert.equal(new Set([...organization.briefs,...person.briefs].map(b=>b.topicKey)).size,14);
  assert.equal([...organization.briefs,...person.briefs].filter(b=>b.offer==='consulting').length,7);
 }
});
test('le besoin commercial et la cible choisis guident chaque brief',()=>{
 const p=plan({config:{...base.config,commercialFocus:'build',targetAudience:'it'}});
 assert(p.briefs.every(b=>b.offer==='build'&&b.audienceId==='it'));
 assert.equal(p.audiences.length,1);assert.equal(p.audiences[0].id,'it');
});
test('les dates du cycle restent civiles lors du changement d’heure',()=>{
 const config={...base.config,campaignStart:'2026-10-20'};
 assert.equal(plan({config,now:'2026-10-26T23:30:00Z',slots:[]}).campaign.week,2);
 assert.equal(plan({config,now:'2026-11-16T23:30:00Z',slots:[]}).campaign.cycle,2);
 assert.throws(()=>plan({slots:[{day:'2026-02-30'}]}),/Créneau/);
});
test('un cycle suivant apporte une contrainte de lecture différente',()=>{
 const first=plan(),next=plan({slots:slots(28),now:day(28)+'T12:00:00Z'});
 assert.equal(next.campaign.cycle,2);assert.notEqual(next.briefs[0].angle,first.briefs[0].angle);
 assert.notEqual(next.briefs[0].id,first.briefs[0].id);
});
test('le lien de contact est traçable et les autres posts ne poussent pas de lien',()=>{
 const p=plan(),contact=p.briefs.find(b=>b.ctaKind==='contact'),url=new URL(contact.destinationUrl);
 assert.equal(url.hostname,'www.bandmdigitalconsulting.com');assert.equal(url.searchParams.get('utm_source'),'linkedin');
 assert.equal(url.searchParams.get('utm_medium'),'organic_social');
 assert(p.briefs.filter(b=>b.ctaKind!=='contact').every(b=>b.destinationUrl===''));
});
test('les preuves et la prudence sur les faits sont attachées au brief',()=>{
 const p=plan();assert.match(p.briefs.find(b=>b.purpose==='proof').proofRequirement,/fictif|illustratif/);
 assert(p.proofRules.some(r=>/disponibilité/.test(r)));assert.match(p.assumption,/stratégie de départ/);
});
test('l’historique croisé est utilisé sans répéter un nouvel angle dans le lot',()=>{
 const first=plan(),recentPosts=first.briefs.slice(0,2).map(editorial=>({status:'published',editorial}));
 const revised=plan({recentPosts});
 assert.notEqual(revised.briefs[0].topicKey,first.briefs[0].topicKey);
 assert.equal(new Set(revised.briefs.map(b=>b.topicKey)).size,7);
});
function queueItem(n,feedback,offer=n%2?'build':'consulting'){
 return {status:'published',publishedAt:day(n)+'T12:00:00Z',editorial:{offer},...(feedback?{salesFeedback:{source:'manual',updatedAt:'2026-11-25T12:00:00Z',qualifiedConversations:0,meetings:0,opportunities:0,...feedback}}:{})};
}
test('absence de saisie et zéro explicite restent distincts',()=>{
 const p=plan({now:'2026-11-28T12:00:00Z',queue:[queueItem(0),queueItem(1,{})]});
 assert.equal(p.review.publishedCount,2);assert.equal(p.review.observedCount,1);assert.equal(p.review.totalQualifiedConversations,0);
 assert.equal(p.review.status,'collecting');assert.equal(p.review.byOffer[0].conversationsPerObservedPost,null);
 assert.equal(p.review.byOffer[1].conversationsPerObservedPost,0);
});
test('un brouillon, un retour futur ou un post trop récent ne compte pas dans le bilan',()=>{
 const p=plan({now:'2026-11-28T12:00:00Z',queue:[{...queueItem(0,{qualifiedConversations:9}),status:'draft'},queueItem(1,{updatedAt:'2026-12-01T12:00:00Z',qualifiedConversations:9}),queueItem(25,{qualifiedConversations:9})]});
 assert.equal(p.review.observedCount,0);assert.equal(p.review.totalQualifiedConversations,0);
});
test('un zéro saisi au lancement ne devient pas une observation mature sans mise à jour',()=>{
 const queue=[queueItem(0,{updatedAt:'2026-11-02T12:00:00Z'}),queueItem(1,{updatedAt:'2026-11-01T12:00:00Z',qualifiedConversations:2})];
 const p=plan({now:'2026-11-28T12:00:00Z',queue});
 assert.equal(p.review.publishedCount,2);assert.equal(p.review.observedCount,0);
 queue[0].salesFeedback.updatedAt='2026-11-08T12:00:00Z';
 assert.equal(plan({now:'2026-11-28T12:00:00Z',queue}).review.observedCount,1);
});
test('le bilan utilise seulement des retours manuels et ne change pas le mix',()=>{
 const queue=Array.from({length:8},(_,n)=>queueItem(n,{qualifiedConversations:n%2?1:3,meetings:n%2?0:1}));
 const config={...base.config};const p=plan({now:'2026-11-28T12:00:00Z',queue,config});
 assert.equal(p.review.status,'observations');assert.equal(p.review.totalQualifiedConversations,16);assert.equal(p.review.totalMeetings,4);
 assert.match(p.review.recommendation,/ne prouve pas une cause/);assert.deepEqual(p.weeklyMix,playbook.weeklyMix);assert.deepEqual(config,base.config);
});
test('un mois de posts sans retours ne devient pas une preuve de performance nulle',()=>{
 const p=plan({now:'2026-11-28T12:00:00Z',queue:Array.from({length:20},(_,n)=>queueItem(n))});
 assert.equal(p.review.observedCount,0);assert.equal(p.review.status,'collecting');assert.match(p.review.recommendation,/Aucun thème gagnant/);
});
