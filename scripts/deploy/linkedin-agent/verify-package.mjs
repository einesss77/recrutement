#!/usr/bin/env node
import {readFile,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
if(manifest.format!==1||!/^[a-f0-9]{16}$/.test(manifest.id)||sha(JSON.stringify(manifest.files))!==manifest.digest||manifest.digest.slice(0,16)!==manifest.id)throw Error('Manifest invalide.');
const names=Object.keys(manifest.files);
for(const name of names){
 if(name.includes('..')||name.startsWith('/')||name.includes('\\')||/(?:^|\/)(?:\.env[^/]*|auth\.json|connection\.json|node_modules|\.git)(?:\/|$)/.test(name))throw Error('Chemin interdit dans le paquet.');
 const file=path.join(root,name),info=await lstat(file);if(!info.isFile()||sha(await readFile(file))!==manifest.files[name])throw Error('Fichier invalide : '+name);
}
async function inspect(directory,relative=''){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const name=(relative?relative+'/':'')+entry.name;
  if(entry.isSymbolicLink())throw Error('Lien symbolique interdit dans le paquet.');
  if(entry.isDirectory())await inspect(path.join(directory,entry.name),name);
  else if(name!=='manifest.json'&&!names.includes(name))throw Error('Fichier inattendu dans le paquet : '+name);
 }
}
await inspect(root);
for(const name of ['package-lock.json','runtime/codex/package-lock.json']){
 const lock=JSON.parse(await readFile(path.join(root,name),'utf8'));
 for(const [key,node]of Object.entries(lock.packages||{}))if(key&&(key.includes('..')||!key.startsWith('node_modules/')||node.link||!node.integrity||!node.resolved?.startsWith('https://registry.npmjs.org/')))throw Error('Dépendance non portable dans '+name);
}
console.log(manifest.id);
