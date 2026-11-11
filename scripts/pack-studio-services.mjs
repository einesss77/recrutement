import {readFile,writeFile} from 'node:fs/promises';
import {zipSync,strToU8} from 'fflate';

// Render PNGs from service-posts.json with the shared exporter, then optimize PNG encoding losslessly.
const posts=JSON.parse(await readFile('studio-social/content/service-posts.json','utf8'));
const files={};
for(const post of posts){
 const image=await readFile(`studio-social/assets/services/${post.id}.png`);
 if(image.readUInt32BE(16)!==1080||image.readUInt32BE(20)!==1350)throw Error(`Format invalide : ${post.id}`);
 files[post.id+'.png']=new Uint8Array(image);
 files[post.id+'-legende.txt']=strToU8(post.caption);
}
files['contenus.json']=strToU8(JSON.stringify({version:1,posts},null,2));
files['LIRE-MOI.txt']=strToU8('B&M — Collection services\n10 visuels portrait 1080 × 1350 et leurs légendes.\nCharte : bleu nuit, cobalt, citron et papier. Bricolage Grotesque / Manrope.\nContenus à adapter et à valider avant diffusion.\nImportez contenus.json dans le studio pour personnaliser ces compositions.\n');
const archive=zipSync(files,{level:0});
// This private download goes through a serverless route. Keep the response below its payload limit.
if(archive.byteLength>4_000_000)throw Error('ZIP trop volumineux : optimiser l’encodage PNG sans modifier les pixels avant de créer l’archive.');
await writeFile('studio-social/assets/services/collection-bm.zip',archive);
console.log(`${posts.length} visuels et légendes réunis dans le ZIP services.`);
