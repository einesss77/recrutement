#!/usr/bin/env node
import {readFile,writeFile,mkdir,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
export const dependencies=['zod','esbuild','@playwright/test','html-to-image','jspdf','fflate'];
const sha=data=>createHash('sha256').update(data).digest('hex');

export function minimalLock(source){
 if(source.lockfileVersion!==3||!source.packages)throw Error('package-lock.json v3 requis.');
 const direct=Object.fromEntries(dependencies.map(name=>{
  const node=source.packages['node_modules/'+name];if(!node?.version)throw Error('Dépendance absente du lock : '+name);
  return[name,node.version];
 }));
 const manifest={name:'bm-linkedin-worker-runtime',version:'1.0.0',private:true,type:'module',engines:{node:'>=22.15.1'},dependencies:direct};
 const selected=new Set(),pending=dependencies.map(name=>'node_modules/'+name);
 const resolve=(from,name)=>{
  let current=from;
  while(true){const candidate=(current?current+'/':'')+'node_modules/'+name;if(source.packages[candidate])return candidate;if(!current)return null;const index=current.lastIndexOf('/node_modules/');current=index<0?'':current.slice(0,index);}
 };
 while(pending.length){
  const key=pending.pop();if(selected.has(key))continue;const node=source.packages[key];
  if(!node||node.link||!node.integrity||!node.resolved?.startsWith('https://registry.npmjs.org/'))throw Error('Entrée de dépendance non portable : '+key);
  selected.add(key);
  const names=new Set([...Object.keys(node.dependencies||{}),...Object.keys(node.optionalDependencies||{}),...Object.keys(node.peerDependencies||{})]);
  for(const name of names){const target=resolve(key,name);const optional=Object.hasOwn(node.optionalDependencies||{},name)||node.peerDependenciesMeta?.[name]?.optional;if(!target&&!optional)throw Error('Dépendance transitive absente : '+name+' depuis '+key);if(target)pending.push(target);}
 }
 const packages={'':{name:manifest.name,version:manifest.version,engines:manifest.engines,dependencies:direct}};
 for(const key of [...selected].sort()){
  const node=structuredClone(source.packages[key]);delete node.dev;delete node.devOptional;
  packages[key]=node;
 }
 return{manifest,lock:{name:manifest.name,version:manifest.version,lockfileVersion:3,requires:true,packages}};
}

const runtimeFiles=[
 'scripts/linkedin-agent.mjs','scripts/linkedin-agent/codex.mjs','scripts/linkedin-agent/quality.mjs','scripts/linkedin-agent/render.mjs','scripts/linkedin-agent/browser.mjs',
 'shared/linkedin-strategy.mjs','studio-social/exporter.js','studio-social/content/strategy.json','studio-social/content/linkedin-playbook.json',
 'studio-social/assets/style.css','studio-social/assets/brand-art.css','studio-social/assets/templates.js','studio-social/assets/characters.js',
 'studio-social/assets/fonts/manrope-0.ttf','studio-social/assets/fonts/bricolagegrotesque-0.ttf','studio-social/assets/fonts/instrumentserif-0.ttf'
];

export async function buildPackage(output){
 const sourceLock=await readFile(path.join(root,'package-lock.json'));
 const {manifest,lock}=minimalLock(JSON.parse(sourceLock));
 const files=new Map();
 for(const name of runtimeFiles){const file=path.join(root,name);if(!(await lstat(file)).isFile())throw Error('Fichier runtime non régulier : '+name);files.set(name,await readFile(file));}
 for(const name of ['install.sh','bm-linkedin.service','bm-linkedin.timer','verify-package.mjs','as-user.sh'])files.set('deploy/'+name,Buffer.from((await readFile(path.join(here,name),'utf8')).replace(/\r\n/g,'\n')));
 const licenses=path.join(root,'studio-social/assets/licenses');
 for(const name of await readdir(licenses)){const file=path.join(licenses,name);if((await lstat(file)).isFile())files.set('studio-social/assets/licenses/'+name,await readFile(file));}
 files.set('package.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
 files.set('package-lock.json',Buffer.from(JSON.stringify(lock,null,2)+'\n'));
 for(const name of ['package.json','package-lock.json']){
  const bytes=await readFile(path.join(here,'runtime-codex',name)),json=JSON.parse(bytes);
  if(/"(?:file:|link:)|"link"\s*:\s*true|"\.\.\//.test(JSON.stringify(json)))throw Error('Le paquet Codex contient une dépendance locale.');
  files.set('runtime/codex/'+name,bytes);
 }
 const hashes=Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,sha(bytes)]));
 const digest=sha(JSON.stringify(hashes)),id=digest.slice(0,16),target=path.resolve(output||path.join(root,'.local','linkedin-agent-vps',id));
 const existing=await readdir(target).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
 if(existing.length){const prior=JSON.parse(await readFile(path.join(target,'manifest.json'),'utf8'));if(prior.digest!==digest)throw Error('Le dossier de sortie contient un autre paquet. Choisissez un nouveau --out.');}
 await mkdir(target,{recursive:true});
 for(const [name,bytes]of files){const file=path.join(target,name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);}
 await writeFile(path.join(target,'manifest.json'),JSON.stringify({format:1,id,digest,sourceLockSha256:sha(sourceLock),codexVersion:'0.167.0',dependencies:manifest.dependencies,files:hashes},null,2)+'\n');
 return{directory:target,id,files:files.size,bytes:[...files.values()].reduce((n,b)=>n+b.length,0),dependencies:manifest.dependencies};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--out'))throw Error('Utilisation : node package.mjs [--out dossier]');
 console.log(JSON.stringify(await buildPackage(args[1]),null,2));
}
