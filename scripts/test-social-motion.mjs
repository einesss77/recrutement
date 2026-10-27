import {chromium,webkit,devices} from '@playwright/test';
import {createHmac,createHash} from 'node:crypto';
import {mkdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const base=process.env.SOCIAL_TEST_URL||'http://localhost:3010',safari=process.env.SOCIAL_TEST_BROWSER==='webkit';
const browser=safari?await webkit.launch():await chromium.launch({channel:'msedge'});
try{
 const context=await browser.newContext(safari?devices['iPhone 13']:{viewport:{width:1360,height:1000}});
 await context.addCookies([{name:'bm_admin_session',value:createHmac('sha256',process.env.ADMIN_PASSWORD).update('bm-digital-consulting-admin').digest('hex'),url:base,httpOnly:true,sameSite:'Lax'}]);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/studio-social');await page.locator('[data-id="bm-companion-2026-cat"]').click();await page.locator('#motion-open').click();await page.locator('.motion-dialog canvas').waitFor();
 await page.waitForFunction(()=>document.querySelector('.motion-dialog canvas')?.getContext('2d').getImageData(0,0,1,1).data[3]>0);
 await mkdir('output/social/motion',{recursive:true});
 const testedStyles=process.env.SOCIAL_TEST_STYLE?[process.env.SOCIAL_TEST_STYLE]:['character','kinetic','mockups'];
 for(const style of testedStyles){
  if(style!=='character'){await page.locator('#motion-style').selectOption(style);if(style==='mockups')await page.waitForFunction(()=>document.querySelector('#motion-status')?.textContent.includes('Mockups prêts'));}
  const a=await page.locator('.motion-dialog canvas').evaluate(c=>c.toDataURL());
  await page.locator('#motion-seek').fill('9');const b=await page.locator('.motion-dialog canvas').evaluate(c=>c.toDataURL());assert.notEqual(a,b);
  await page.locator('.motion-dialog canvas').screenshot({path:`output/social/motion/${safari?'safari':'chrome'}-${style}.png`});
  if(!safari){const download=page.waitForEvent('download',{timeout:35000});await page.locator('#motion-export').click();const file=await download;await file.saveAs(`output/social/motion/${style}-${file.suggestedFilename()}`);assert.match(await page.locator('#motion-status').textContent(),/Vidéo prête/);}
  if(style==='mockups')for(const [slot,at,label]of [['web',4.8,'laptop'],['mobile',7.8,'iPhone']]){
   await page.locator('#motion-seek').fill(String(at));const before=await page.locator('.motion-dialog canvas').evaluate(c=>c.toDataURL());
   const png=await page.evaluate(slot=>{const c=document.createElement('canvas');c.width=slot==='web'?1440:390;c.height=slot==='web'?900:844;const x=c.getContext('2d');x.fillStyle='#377b79';x.fillRect(0,0,c.width,c.height);x.fillStyle='white';x.font='40px sans-serif';x.fillText('Capture de test',25,100);return c.toDataURL().split(',')[1];},slot);
   await page.locator('#motion-'+slot+'-shot').setInputFiles({name:'capture.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.getByText('Capture '+label+' chargée.',{exact:true}).waitFor();assert.notEqual(await page.locator('.motion-dialog canvas').evaluate(c=>c.toDataURL()),before);
  }
 }
 const range=await context.request.get(base+'/studio-social/'+(process.env.SOCIAL_TEST_STYLE==='mockups'?'mockups-demo.mp4':'video-demo.mp4'),{headers:{Range:'bytes=0-63'}});assert.equal(range.status(),206);assert.equal((await range.body()).length,64);assert.equal(range.headers()['content-type'],'video/mp4');
 const audio=await context.request.get(base+'/studio-social/kinetic-voice.wav',{headers:{Range:'bytes=0-31'}});assert.equal(audio.status(),206);assert.equal((await audio.body()).length,32);
 await page.locator('#motion-close').click();assert.equal(await page.locator('.motion-dialog').count(),0);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({engine:safari?'WebKit':'Chromium',previewStyles:testedStyles,animatedFrames:true,videoExport:!safari,protectedMediaRanges:true,errors},null,2));
}finally{await browser.close();}
