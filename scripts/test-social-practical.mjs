import {chromium,webkit,devices} from '@playwright/test';
import {createHmac} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const base=process.env.SOCIAL_TEST_URL||'http://localhost:3007',safari=process.env.SOCIAL_TEST_BROWSER==='webkit';
const browser=safari?await webkit.launch():await chromium.launch({channel:'msedge'});
const practical=JSON.parse(await readFile('studio-social/content/practical-pack.json','utf8')),companions=JSON.parse(await readFile('studio-social/content/companion-pack.json','utf8'));
const pack={posts:[...practical.posts,...companions.posts]},expectedCount=20+pack.posts.length;
try{
 const context=await browser.newContext(safari?devices['iPhone 13']:{viewport:{width:390,height:844}});
 await context.addCookies([{name:'bm_admin_session',value:createHmac('sha256',process.env.ADMIN_PASSWORD).update('bm-digital-consulting-admin').digest('hex'),url:base,httpOnly:true,sameSite:'Lax'}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/studio-social');await page.locator('.thumb').first().waitFor();assert.equal(await page.locator('.thumb').count(),expectedCount);
 await page.reload();await page.locator('.thumb').first().waitFor();assert.equal(await page.locator('.thumb').count(),expectedCount);
 const render=await context.newPage();await render.goto(base+'/studio-social?render=1');await render.waitForFunction(()=>window.renderPost);
 await mkdir('output/social/practical',{recursive:true});const overflows=[];
 for(const post of pack.posts)for(const ratio of ['square','portrait'])for(let i=0;i<post.slides.length;i++){
  await render.evaluate(({post,ratio,i})=>window.renderPost(post,i,'png',ratio),{post,ratio,i});await render.evaluate(()=>document.fonts.ready);
  const bad=await render.locator('.art-body').evaluate(e=>e.scrollHeight>e.clientHeight+2);if(bad)overflows.push({id:post.id,i,ratio});
  if(i===0&&ratio==='square')await render.locator('.art').screenshot({path:`output/social/practical/${post.id}.png`});
 }
 assert.deepEqual(overflows,[]);
 await page.locator('.thumb').first().click();await page.locator('#heading').fill('Mon exemple adapté.');await page.locator('#back').click();await page.locator('.thumb').first().waitFor();await page.reload();await page.locator('.thumb').first().waitFor();await page.locator('.thumb').first().click();assert.equal(await page.locator('#heading').inputValue(),'Mon exemple adapté.');
 const png=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter PNG',exact:true}).click();await(await png).saveAs('output/social/practical/export-chat.png');
 const pdf=page.waitForEvent('download');await page.getByRole('button',{name:'Carrousel PDF',exact:true}).click();await(await pdf).saveAs('output/social/practical/export-chat.pdf');
 page.once('dialog',d=>d.accept());await page.locator('#delete').click();await page.waitForFunction(()=>document.querySelector('#save-state')?.textContent==='Enregistré sur cet appareil');await page.reload();await page.locator('.thumb').first().waitFor();assert.equal(await page.locator('.thumb').count(),expectedCount-1);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({engine:safari?'WebKit':'Chromium',newPosts:pack.posts.length,renderedSlides:pack.posts.reduce((n,p)=>n+p.slides.length*2,0),overflows,editsPreserved:true,deletedPostsStayDeleted:true,png:true,pdf:true,errors},null,2));
}finally{await browser.close();}
