import {mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
for(const project of ['motion-project','motion-kinetic','motion-mockups']){
 const destination=new URL(`studio-social/${project}/assets/`,root);await mkdir(new URL('fonts/',destination),{recursive:true});
 for(const name of ['motion-engine.js','mockups-film.js','mockups-settings.js','characters.js','kinetic-voice.wav','mockups-voice.wav','mockup-web.svg','mockup-mobile.svg'])await copyFile(new URL('studio-social/assets/'+name,root),new URL(name,destination));
 for(const name of ['bricolagegrotesque-0.ttf','manrope-0.ttf','instrumentserif-0.ttf'])await copyFile(new URL('studio-social/assets/fonts/'+name,root),new URL('fonts/'+name,destination));
 await copyFile(new URL('node_modules/gsap/dist/gsap.min.js',root),new URL('gsap.min.js',destination));
}
console.log('Modèles vidéo B&M préparés, sans appel API.');
