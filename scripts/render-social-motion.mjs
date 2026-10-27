import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
await import('./prepare-motion.mjs');
const exe=process.platform==='win32'?'.exe':'';
const local=name=>{const file=resolve('.local','motion-bin',name+exe);return existsSync(file)?file:name;};
const env={...process.env,HYPERFRAMES_FFMPEG_PATH:process.env.HYPERFRAMES_FFMPEG_PATH||local('ffmpeg'),HYPERFRAMES_FFPROBE_PATH:process.env.HYPERFRAMES_FFPROBE_PATH||local('ffprobe')};
for(const binary of [env.HYPERFRAMES_FFMPEG_PATH,env.HYPERFRAMES_FFPROBE_PATH])try{execFileSync(binary,['-version'],{stdio:'ignore'});}catch{throw Error('FFmpeg et FFprobe sont nécessaires pour régénérer les MP4 locaux. Configurez HYPERFRAMES_FFMPEG_PATH et HYPERFRAMES_FFPROBE_PATH. Les exports du navigateur restent autonomes.');}
const npx=process.platform==='win32'?'npx.cmd':'npx';
for(const [project,file]of [['motion-project','video-demo.mp4'],['motion-kinetic','kinetic-demo.mp4'],['motion-mockups','mockups-demo.mp4']]){
 execFileSync(npx,['--yes','hyperframes@0.8.209','check',`studio-social/${project}`],{env,stdio:'inherit',shell:process.platform==='win32'});
 execFileSync(npx,['--yes','hyperframes@0.8.209','render',`studio-social/${project}`,'--quality','looks','--crf','23','--max-bitrate','1500k','--buffer-size','3000k','--workers','2','--output',`studio-social/assets/${file}`],{env,stdio:'inherit',shell:process.platform==='win32'});
}
