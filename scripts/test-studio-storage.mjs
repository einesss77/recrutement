import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),sdk=pathToFileURL(require.resolve('@vercel/blob')).href;
await mkdir('output/social/storage-test',{recursive:true});
await build({entryPoints:['lib/socialStudio.ts'],bundle:true,platform:'node',format:'esm',outfile:'output/social/storage-test/service.mjs',external:['zod'],plugins:[{name:'isolated-storage',setup(b){
 b.onResolve({filter:/^@\/lib\/db$/},()=>({path:'db',namespace:'isolated'}));
 b.onResolve({filter:/^@vercel\/blob$/},()=>({path:'blob',namespace:'isolated'}));
 b.onResolve({filter:/^file:/},args=>({path:args.path,external:true}));
 b.onLoad({filter:/.*/,namespace:'isolated'},args=>({loader:'js',contents:args.path==='db'?'export const prisma={};':`
 import {BlobPreconditionFailedError,BlobNotFoundError} from ${JSON.stringify(sdk)};
 export {BlobPreconditionFailedError,BlobNotFoundError};
 export async function get(){const s=globalThis.__studioTest;if(!s.document)return null;return{statusCode:200,blob:{etag:String(s.etag)},stream:new Response(JSON.stringify(s.document)).body};}
 export async function put(path,body,options){const s=globalThis.__studioTest;s.puts++;if(s.beforePut){const fn=s.beforePut;s.beforePut=null;fn(JSON.parse(body));}if(s.failures>0){s.failures--;throw new BlobPreconditionFailedError();}if(options.ifMatch&&options.ifMatch!==String(s.etag))throw new BlobPreconditionFailedError();s.document=JSON.parse(body);s.etag++;return{etag:String(s.etag)};}
 `}));
}}]});
process.env.BLOB_READ_WRITE_TOKEN='test-only-mocked-storage';
const service=await import('../output/social/storage-test/service.mjs');
const {BlobPreconditionFailedError}=await import(sdk);
assert.equal(new BlobPreconditionFailedError().name,'Error');assert.equal(service.isStudioConflict(new BlobPreconditionFailedError()),true);
const state=await service.studioState(),original=structuredClone(state.posts),changed=structuredClone(original);changed[0].title='Modification locale';
const fixture=()=>({document:{posts:structuredClone(original),revision:4,usage:{month:'2026-10',reservedUsd:0,calls:0},appliedPacks:[]},etag:10,puts:0,failures:0});
globalThis.__studioTest=fixture();globalThis.__studioTest.failures=1;assert.equal(await service.saveStudioPosts(changed,4),5);assert.equal(globalThis.__studioTest.puts,2);
globalThis.__studioTest=fixture();globalThis.__studioTest.beforePut=doc=>{globalThis.__studioTest.document=doc;globalThis.__studioTest.etag++;};assert.equal(await service.saveStudioPosts(changed,4),5);assert.equal(globalThis.__studioTest.puts,1);
globalThis.__studioTest=fixture();globalThis.__studioTest.beforePut=()=>{globalThis.__studioTest.document.posts[0].title='Modification distante';globalThis.__studioTest.document.revision++;globalThis.__studioTest.etag++;};await assert.rejects(service.saveStudioPosts(changed,4),service.isStudioConflict);assert.equal(globalThis.__studioTest.document.posts[0].title,'Modification distante');
globalThis.__studioTest=fixture();globalThis.__studioTest.failures=3;await assert.rejects(service.saveStudioPosts(changed,4),service.isStudioConflict);assert.equal(globalThis.__studioTest.puts,3);
globalThis.__studioTest=fixture();assert.equal(await service.saveStudioPosts(original,4),4);assert.equal(globalThis.__studioTest.puts,0);
console.log('Stockage isolé : erreur SDK réelle reconnue, reprise bornée, ajout concurrent identique accepté, conflit différent protégé, sauvegarde identique sans écriture. Aucun accès cloud réel.');
