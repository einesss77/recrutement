import {toPng,getFontEmbedCSS} from 'html-to-image';
import {jsPDF} from 'jspdf';
import {zipSync,strToU8} from 'fflate';
import {artwork} from './assets/templates.js';
let fontCSS;
async function capture(post,index,ratio){
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:1080px;z-index:-100;';host.innerHTML=artwork(post,index);document.body.append(host);
 try{const art=host.firstElementChild;if(ratio==='portrait')art.classList.add('portrait-art');await document.fonts.ready;await Promise.all([...art.querySelectorAll('img')].map(i=>i.decode()));
  const area=art.querySelector('.art-body');if(area.scrollHeight>area.clientHeight+2)throw Error(`Texte trop long dans « ${post.title} ». Répartissez-le sur plusieurs pages.`);
  fontCSS??=await getFontEmbedCSS(art);
  return await toPng(art,{width:1080,height:ratio==='portrait'?1350:1080,pixelRatio:1,fontEmbedCSS:fontCSS,skipAutoScale:true});
 }finally{host.remove();}
}
async function exportOne(post,format,index=0,ratio='square'){
 if(format==='png'){const image=await capture(post,index,ratio);return await(await fetch(image)).blob();}
 const height=ratio==='portrait'?1350:1080,pdf=new jsPDF({orientation:height>1080?'portrait':'landscape',unit:'px',format:[1080,height],hotfixes:['px_scaling']});
 for(let i=0;i<post.slides.length;i++){if(i)pdf.addPage([1080,height],height>1080?'portrait':'landscape');const image=await capture(post,i,ratio);pdf.addImage(image,'PNG',0,0,1080,height,undefined,'FAST');}
 return pdf.output('blob');
}
export async function browserExport(input,batch=false){
 if(!batch)return new Response(await exportOne(input.post,input.format,input.index,input.ratio));
 if(input.posts.length>30)throw Error('Export par lot limité à 30 publications.');
 const files={};for(const [i,p]of input.posts.entries()){
  const name=`${String(i+1).padStart(2,'0')}-${p.template}`;
  files[name+'.pdf']=new Uint8Array(await(await exportOne(p,'pdf',0,'square')).arrayBuffer());
  files[name+'.png']=new Uint8Array(await(await exportOne(p,'png',0,'square')).arrayBuffer());
  files[name+'-legende.txt']=strToU8(p.caption||'');
 }
 files['contenus.json']=strToU8(JSON.stringify({version:1,posts:input.posts},null,2));return new Response(new Blob([zipSync(files,{level:0})],{type:'application/zip'}));
}
