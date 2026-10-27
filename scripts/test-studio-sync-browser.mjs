import {chromium,webkit,devices} from '@playwright/test';
import {createHmac} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const base=process.env.SOCIAL_TEST_URL||'http://localhost:3012',safari=process.env.SOCIAL_TEST_BROWSER==='webkit';
const initial=JSON.parse(await readFile('studio-social/content/posts.json','utf8')),practical=JSON.parse(await readFile('studio-social/content/practical-pack.json','utf8')),companions=JSON.parse(await readFile('studio-social/content/companion-pack.json','utf8'));
const browser=safari?await webkit.launch():await chromium.launch({channel:'msedge'});
try{
 const context=await browser.newContext(safari?devices['iPhone 13']:{viewport:{width:1360,height:1000}});
 await context.addCookies([{name:'bm_admin_session',value:createHmac('sha256',process.env.ADMIN_PASSWORD).update('bm-digital-consulting-admin').digest('hex'),url:base,httpOnly:true,sameSite:'Lax'}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let remote={posts:structuredClone(initial),revision:7,appliedPacks:[],backend:'cloud'},writes=0,firstRace=true,offline=false,pauseNext=false,release;
 const state=()=>({...structuredClone(remote),availablePacks:[practical,companions],strategy:{},budget:2,usage:{reservedUsd:0},aiEnabled:false});
 await context.route('**/studio-social/api/state',route=>route.fulfill({json:state()}));
 await context.route('**/studio-social/api/posts',async route=>{
  const input=route.request().postDataJSON();writes++;
  if(offline){await route.fulfill({status:503,json:{error:'Stockage indisponible'}});return;}
  if(pauseNext){pauseNext=false;await new Promise(resolve=>{release=resolve;});}
  if(firstRace){firstRace=false;remote={...remote,posts:input.posts,appliedPacks:input.appliedPacks,revision:8};await route.fulfill({status:400,json:{error:'Vercel Blob: Precondition failed: ETag mismatch.'}});return;}
  if(input.revision!==remote.revision){await route.fulfill({status:409,json:{code:'STUDIO_CONFLICT',error:'Sauvegarde concurrente'}});return;}
  remote={...remote,posts:input.posts,appliedPacks:input.appliedPacks,revision:remote.revision+1};await route.fulfill({json:{ok:true,revision:remote.revision}});
 });
 await page.goto(base+'/studio-social');await page.locator('.thumb').first().waitFor();await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Enregistré en ligne');assert.equal(await page.locator('.thumb').count(),30);assert.equal(writes,2);assert.doesNotMatch(await page.locator('body').innerText(),/ETag mismatch/);
 const target=remote.posts[0].id,other=remote.posts[1].id;
 await page.locator(`[data-id="${target}"]`).click();remote.posts.find(p=>p.id===other).caption='Texte modifié sur un autre appareil';remote.revision++;
 await page.locator('#heading').fill('Titre local conservé');await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Enregistré en ligne');assert.equal(remote.posts.find(p=>p.id===target).slides[0].title,'Titre local conservé');assert.equal(remote.posts.find(p=>p.id===other).caption,'Texte modifié sur un autre appareil');
 // A second edit arrives while the first save is still in flight.
 pauseNext=true;await page.locator('#heading').fill('Premier titre');await page.waitForTimeout(650);assert.equal(typeof release,'function');await page.locator('#heading').fill('Dernier titre pendant la sauvegarde');release();await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Enregistré en ligne');await page.waitForTimeout(600);assert.equal(remote.posts.find(p=>p.id===target).slides[0].title,'Dernier titre pendant la sauvegarde');
 // A competing change to the same field remains protected on the server.
 remote.posts.find(p=>p.id===target).slides[0].title='Titre distant protégé';remote.revision++;
 await page.locator('#heading').fill('Ma version locale en conflit');await page.locator('#sync-recovery').waitFor();assert.equal(remote.posts.find(p=>p.id===target).slides[0].title,'Titre distant protégé');
 const pngPromise=page.waitForEvent('download');await page.locator('#png').click();const png=await pngPromise;await mkdir('output/social/sync',{recursive:true});await png.saveAs('output/social/sync/'+(safari?'safari':'chrome')+'-local.png');assert.equal((await readFile('output/social/sync/'+(safari?'safari':'chrome')+'-local.png')).subarray(1,4).toString(),'PNG');
 const beforeReloadWrites=writes;page.once('dialog',d=>d.accept());await page.reload();await page.locator('#sync-recovery').waitFor();assert.equal(writes,beforeReloadWrites);assert.equal(remote.posts.find(p=>p.id===target).slides[0].title,'Titre distant protégé');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger ma copie'}).click();const download=await downloadPromise;await mkdir('output/social/sync',{recursive:true});const file=`output/social/sync/${safari?'safari':'chrome'}-copie.json`;await download.saveAs(file);const backup=JSON.parse(await readFile(file,'utf8'));assert.equal(backup.posts.find(p=>p.id===target).slides[0].title,'Ma version locale en conflit');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({engine:safari?'WebKit':'Chromium',startupETagRaceRecovered:true,independentEditsMerged:true,inFlightEditPreserved:true,sameFieldProtected:true,localRecoveryAfterReload:true,backupDownload:true,exportDuringConflict:true,writes,errors},null,2));
}finally{await browser.close();}
