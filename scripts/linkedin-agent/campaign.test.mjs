import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkPlan,campaignTemplateIds} from './quality.mjs';
import {campaignTemplates,campaignArtwork} from '../../studio-social/assets/campaign-templates.js';
const pack=JSON.parse(await readFile(new URL('../../studio-social/content/campaign-v2.json',import.meta.url),'utf8'));
const strategy=JSON.parse(await readFile(new URL('../../studio-social/content/strategy.json',import.meta.url),'utf8'));
function checked(account,mutate=x=>x,editorial){
 const calendar=pack.calendar.filter(c=>c.accountId===account),other=pack.calendar.filter(c=>c.accountId!==account);
 const posts=calendar.map(c=>structuredClone(pack.posts.find(p=>p.id===c.postId)));
 mutate(posts);
 return checkPlan({summary:'People & Products.',items:posts.map(p=>({post:Object.fromEntries(['title','category','template','theme','caption','slides'].map(k=>[k,p[k]])),rationale:'Présentation commerciale B&M.',sourceUrls:['https://www.bandmdigitalconsulting.com/'],needsHuman:false,humanReason:''}))},{config:{languages:'fr-en'},strategy,slots:calendar.map(c=>({day:c.day})),recentPosts:other.map(c=>pack.posts.find(p=>p.id===c.postId)),editorial});
}
test('les deux semaines FR/EN passent les contrôles sans référence ni disponibilité inventée',()=>{
 assert.equal(pack.posts.length,14);
 for(const a of ['person','organization']){
  const result=checked(a);assert.equal(result.items.length,7);
  assert.deepEqual(result.items.filter(x=>x.needsHuman).map(x=>({title:x.post.title,reason:x.humanReason})),[]);
  assert.equal(new Set(result.items.map(x=>x.post.template)).size,5);
 }
});
test('le générateur et le Studio partagent les cinq identifiants et chaque composition a sa structure',()=>{
 assert.deepEqual(Object.keys(campaignTemplates),campaignTemplateIds);
 const structures=[];
 for(const id of campaignTemplateIds){
  const post=pack.posts.find(p=>p.template===id),html=campaignArtwork(post);
  assert(html.includes(`v2-${id}`));assert(html.includes('studio-v2'));
  assert(!html.includes('signal-scene'));structures.push(html);
 }
 assert.equal(new Set(structures).size,5);
});
test('une maquette produit non identifiée bloque la publication',()=>{
 const result=checked('organization',posts=>{const p=posts.find(p=>p.template==='product');p.caption=p.caption.replaceAll(/illustratif|illustrative/g,'visuel');});
 assert(result.items.some(x=>x.post.template==='product'&&x.needsHuman&&/illustrative/.test(x.humanReason)));
});
test('le format des blocs et la densité sont contrôlés avant programmation',()=>{
 const result=checked('person',posts=>{const p=posts.find(p=>p.template==='brief');p.slides[0].points[0]='Un bloc sans détail';p.slides[0].title='T'.repeat(60);});
 const bad=result.items.find(x=>x.post.template==='brief');assert(bad.needsHuman);assert.match(bad.humanReason,/trois points|55 caractères/);assert.match(bad.humanReason,/séparés/);
});
test('les valeurs du formulaire sont échappées dans le rendu',()=>{
 const post=structuredClone(pack.posts.find(p=>p.template==='brief'));post.slides[0].title='<script>oops</script>';post.slides[0].points[0]='<img> | <iframe>';
 const html=campaignArtwork(post);assert(!html.includes('<script>'));assert(!html.includes('<iframe>'));assert(html.includes('&lt;img&gt;'));
});
