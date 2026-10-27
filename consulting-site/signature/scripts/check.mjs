import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../dist');
async function walk(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory())result.push(...await walk(p));else result.push(p)}return result}
const files=await walk(root),pages=files.filter(p=>p.endsWith('.html'));
let links=0;
for(const page of pages){const html=await readFile(page,'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`One H1: ${page}`);assert(html.includes(page.slice(root.length).replaceAll(String.fromCharCode(92),'/').startsWith('/en/')?'lang="en"':'lang="fr"'),page);assert(html.includes('noindex,nofollow'),`Preproduction noindex: ${page}`);for(const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){const url=match[1].replaceAll('&amp;','&');if(!url.startsWith('/'))continue;const pathname=new URL(url,'http://localhost').pathname;let target=resolve(root,'.'+pathname);try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target)}catch{throw new Error(`Missing link or asset: ${url} from ${page}`)}links++}}
const fonts=await readFile(join(root,'assets/fonts.css'),'utf8');for(const match of fonts.matchAll(/url\(([^)]+)\)/g)){const target=resolve(root,'assets',match[1]);assert((await stat(target)).size>1000,`Font: ${target}`)}
console.log(`Passed: ${pages.length} pages, ${links} internal links/assets, local fonts, unique H1s, preproduction indexation.`);

for(const file of files){const relative=file.slice(root.length+1).replaceAll('\\','/');assert(!/(^|\/)(\.local|config\.json|projects\.json)(\/|$)/i.test(relative),'No private data in build: '+relative)}
