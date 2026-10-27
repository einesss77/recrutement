import {readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
const root=new URL('../studio-social/',import.meta.url);
await build({entryPoints:[new URL('exporter.js',root).pathname.replace(/^\/([A-Za-z]:)/,'$1')],outfile:new URL('assets/exporter.bundle.js',root).pathname.replace(/^\/([A-Za-z]:)/,'$1'),bundle:true,format:'esm',minify:true,target:'es2022',legalComments:'linked'});
console.log('B&M Studio browser exports prepared');
