import {chromium,webkit,devices} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const base=process.env.SOCIAL_TEST_URL||'http://localhost:3006';
const safari=process.env.SOCIAL_TEST_BROWSER==='webkit';
const browser=safari?await webkit.launch({headless:true}):await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext(safari?{...devices['iPhone 13']}:{viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const privateState=await context.request.get(base+'/studio-social/api/state');assert.equal(privateState.status(),401);
 await page.goto(base+'/studio-social');await page.getByLabel('Mot de passe').fill(process.env.ADMIN_PASSWORD);await page.getByRole('button',{name:'Ouvrir le studio'}).click();
 // WebKit does not send production Secure cookies over local HTTP.
 // Keep production cookies secure; adapt only this local test context.
 if(safari&&new URL(base).protocol==='http:'){
  const cookies=await context.cookies();await context.clearCookies();await context.addCookies(cookies.map(cookie=>({...cookie,secure:false})));await page.goto(base+'/studio-social');
 }
 await page.locator('.thumb').first().waitFor();
 const response=await context.request.get(base+'/studio-social/api/state'),state=await response.json();assert.ok(state.posts.length>=20);assert.equal(response.headers()['x-robots-tag'],'noindex, nofollow');console.log('Backend:',state.backend);
 const crossOrigin=await context.request.put(base+'/studio-social/api/posts',{headers:{Origin:'https://example.com'},data:{posts:state.posts,revision:state.revision}});assert.equal(crossOrigin.status(),403);
 let persisted=false;
 if(state.backend==='cloud'){
  const saved=await context.request.put(base+'/studio-social/api/posts',{headers:{Origin:base},data:{posts:state.posts,revision:state.revision}});assert.equal(saved.status(),200);
  const stale=await context.request.put(base+'/studio-social/api/posts',{headers:{Origin:base},data:{posts:state.posts,revision:state.revision}});assert.equal(stale.status(),200);
  const different=structuredClone(state.posts);different[0].caption+=' test de conflit';const conflict=await context.request.put(base+'/studio-social/api/posts',{headers:{Origin:base},data:{posts:different,revision:state.revision+100}});assert.equal(conflict.status(),409);
  const other=await browser.newContext();await other.addCookies(await context.cookies());const synced=await(await other.request.get(base+'/studio-social/api/state')).json();assert.equal(synced.revision,state.revision);persisted=true;await other.close();await page.reload();await page.locator('.thumb').first().waitFor();
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mkdir('output/social',{recursive:true});await page.screenshot({path:'output/social/mobile.png',fullPage:false});
 await page.locator('.thumb').first().click();
 const downloadPromise=page.waitForEvent('download',{timeout:15000});await page.getByRole('button',{name:'Exporter PNG',exact:true}).click();await page.waitForTimeout(2500);console.log('Export status:',await page.locator('#notice').textContent());const download=await downloadPromise;await download.saveAs('output/social/browser-export.png');
 const pdfPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Carrousel PDF',exact:true}).click();const pdf=await pdfPromise;await pdf.saveAs('output/social/browser-export.pdf');
 await page.getByRole('button',{name:'← Publications'}).click();await page.locator('.thumb').first().waitFor();await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'output/social/desktop.png',fullPage:false});
 if(safari){
  const source=await readFile('studio-social/assets/app.js','utf8'),boot="if(!new URLSearchParams(location.search).has('render'))start();";
  const previous=source.replace(boot,'').replace('let state',boot+'\nlet state');
  await page.route('**/studio-social/app.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:previous}));
  await page.reload();await page.getByText("Cannot access 'state' before initialization.",{exact:true}).waitFor();
  await page.unroute('**/studio-social/app.js');await page.reload();await page.locator('.thumb').first().waitFor();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({authenticated:true,unauthenticatedDenied:true,crossOriginDenied:true,persisted,backend:state.backend,mobile:true,png:true,pdf:true,safariStartupRegression:safari,jsErrors:errors.length},null,2));
}finally{await browser.close();}
