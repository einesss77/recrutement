import {createServer} from 'node:http';
import {readFile,mkdir,access,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

const types={'.css':'text/css','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'};
const allowed=new Set(['style.css','brand-art.css','templates.js','characters.js','fonts/manrope-0.ttf','fonts/bricolagegrotesque-0.ttf','fonts/instrumentserif-0.ttf']);
export function validateEmbeddedImage(image){
 if(!image)return;
 if(typeof image!=='string'||image.length>3_500_000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image))throw Error('L’image doit être un PNG, JPEG ou WebP embarqué de moins de 2,6 Mo. Les URL externes ne sont pas chargées.');
 const [head,encoded]=image.split(','),bytes=Buffer.from(encoded,'base64');
 const valid=head.includes('/png;')?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):head.includes('/jpeg;')?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!valid)throw Error('Le contenu de l’image ne correspond pas au format annoncé.');
}
export async function chromiumPath(){
 const candidates=[process.env.STUDIO_CHROMIUM_PATH,chromium.executablePath()].filter(Boolean);
 const cache=process.platform==='win32'?path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'ms-playwright'):path.join(os.homedir(),'.cache','ms-playwright');
 try{
  const dirs=(await readdir(cache)).filter(name=>/^chromium-\d+$/.test(name)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1]));
  for(const name of dirs)for(const suffix of process.platform==='win32'?['chrome-win64/chrome.exe','chrome-win/chrome.exe']:['chrome-linux64/chrome','chrome-linux/chrome'])candidates.push(path.join(cache,name,suffix));
 }catch{}
 for(const candidate of candidates)try{await access(candidate);return candidate;}catch{}
 throw Error('Chromium est absent. Exécutez npx playwright install chromium ou définissez STUDIO_CHROMIUM_PATH.');
}
export async function renderPost(post,format,{repoRoot,workingRoot,maxBytes=2_800_000}={}){
 if(!['png','pdf'].includes(format))throw Error('Format de publication non pris en charge.');
 // Imported raster images remain supported without allowing remote URLs or executable SVG.
 validateEmbeddedImage(post.image);
 await mkdir(workingRoot,{recursive:true,mode:0o700});
 const bundlePath=path.join(workingRoot,'exporter.bundle.js');
 await build({entryPoints:[path.join(repoRoot,'studio-social','exporter.js')],outfile:bundlePath,bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'none'});
 const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url||'/','http://localhost').pathname;
  try{
   if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/studio-social/style.css"><link rel="stylesheet" href="/studio-social/brand-art.css"></head><body></body></html>');return;}
   const name=pathname.replace(/^\/studio-social\//,'');let file;
   if(name==='exporter.bundle.js')file=bundlePath;else if(allowed.has(name))file=path.join(repoRoot,'studio-social','assets',name);else{res.statusCode=404;res.end();return;}
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));
  }catch{res.statusCode=404;res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 let browser;
 try{
  const launch={headless:true,executablePath:await chromiumPath()};
  browser=await chromium.launch(launch);
  const context=await browser.newContext({viewport:{width:1080,height:1350},reducedMotion:'reduce'});
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  const page=await context.newPage();await page.goto(origin);
  const encoded=await page.evaluate(async({post,format})=>{
   const {browserExport}=await import('/studio-social/exporter.bundle.js');
   const response=await browserExport({post,format,index:0,ratio:'portrait'}),blob=await response.blob();
   return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('Lecture du rendu impossible.'));r.readAsDataURL(blob);});
  },{post,format});
  const bytes=Buffer.from(encoded,'base64');if(bytes.length>maxBytes)throw Error('Visuel trop lourd pour LinkedIn via le studio. Réduisez le nombre de pages ou le texte puis relancez.');
  return {mime:format==='png'?'image/png':'application/pdf',base64:encoded,title:post.title,bytes:bytes.length};
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
