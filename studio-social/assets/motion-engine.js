import {character} from './characters.js';
export const VIDEO_WIDTH=720,VIDEO_HEIGHT=1280,VIDEO_DURATION=15;
const C={navy:'#111e2c',teal:'#153a35',mint:'#b9efde',white:'#f8fbf4',muted:'#b6cbc2'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>1-Math.pow(1-clamp(v),3);
const enter=(t,start,d=.55)=>ease((t-start)/d);
function rounded(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function font(c,size,face='Bricolage',weight=500){c.font=`${weight} ${size}px ${face}`;}
function wrap(c,text,width){const out=[];let line='';for(const word of String(text||'').split(/\s+/)){const test=line?line+' '+word:word;if(c.measureText(test).width>width&&line){out.push(line);line=word;}else line=test;}if(line)out.push(line);return out;}
function text(c,value,x,y,width,{size=44,min=28,maxLines=5,color=C.white,face='Bricolage',weight=500,lineHeight=1.15}={}){
 let lines;do{font(c,size,face,weight);lines=wrap(c,value,width);if(lines.length<=maxLines||size<=min)break;size-=2;}while(true);
 c.fillStyle=color;for(let i=0;i<lines.length;i++)c.fillText(lines[i],x,y+i*size*lineHeight);return lines.length*size*lineHeight;
}
function label(c,value,x,y,color=C.mint){font(c,15,'Manrope',500);c.fillStyle=color;c.fillText(value,x,y);}
function frame(c,t,from,to,draw){const a=enter(t,from,.28)*(1-enter(t,to,.28));if(a<=0)return;c.save();c.globalAlpha=a;draw(t-from);c.restore();}
function brand(c,dark=false){c.fillStyle=dark?C.teal:C.white;font(c,43,'Bricolage',700);c.fillText('B&M.',54,84);font(c,12,'Manrope');c.fillText('Digital Consulting',178,78);}
export function configFromPost(post){const s=post.slides[0],points=s.points||[];return{title:s.title,subtitle:s.body,question:points[0]||'Où retrouver la bonne information ?',answer:points[1]||'Je vous aide à chercher dans les documents autorisés, puis à consulter la source.',source:points[2]||'Démonstration · assistant métier',kind:post.template==='advisor'?'advisor':'cat',category:post.category||'Votre assistant métier'};}
export async function prepareMotion(config){
 await document.fonts.ready;
 await Promise.all([document.fonts.load('500 48px Bricolage'),document.fonts.load('400 28px Manrope')]);
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(character(config.kind||'cat').replace('<svg ','<svg width="480" height="540" '));await image.decode();
 const resources={image,config};if(config.style==='mockups')await prepareMockups(resources);return resources;
}
export async function prepareMockups(resources){
 const load=async name=>{const image=new Image();image.src=new URL(name,import.meta.url).href;await image.decode();return image;};
 resources.web??=await load('./mockup-web.svg');resources.mobile??=await load('./mockup-mobile.svg');return resources;
}
export function drawMotion(canvas,time,resources){
 if(resources.config.style==='kinetic'){drawKinetic(canvas,time);return;}
 if(resources.config.style==='mockups'){drawMockups(canvas,time,resources);return;}
 const c=canvas.getContext('2d'),t=clamp(time,0,14.999),{image,config}=resources;canvas.width===VIDEO_WIDTH||(canvas.width=VIDEO_WIDTH);canvas.height===VIDEO_HEIGHT||(canvas.height=VIDEO_HEIGHT);
 c.clearRect(0,0,720,1280);c.fillStyle=C.navy;c.fillRect(0,0,720,1280);
 // The quarter-ring is B&M's existing visual signature.
 c.strokeStyle='#294e49';c.lineWidth=110;c.beginPath();c.arc(780,1320,270,0,Math.PI*2);c.stroke();
 brand(c);label(c,'L’IA, EN CONVERSATION',54,146);
 const mascot=(x,y,w,phase=0)=>{const bob=Math.sin((t+phase)*2)*4;c.drawImage(image,x,y+bob,w,w*540/480);};
 frame(c,t,-.28,3.5,local=>{
  c.save();c.translate(0,24*(1-enter(local,0,.6)));text(c,config.title,54,235,600,{size:58,min:40,maxLines:3});c.restore();
  text(c,config.subtitle,54,415,590,{size:25,min:23,maxLines:3,face:'Manrope',color:C.muted,lineHeight:1.45});
  const a=enter(local,.15,.65),scale=1+.08*Math.sin(clamp((local-.15)/.65)*Math.PI)*(1-clamp((local-.15)/.65));
  c.save();c.translate(360,800);c.scale(scale*a,scale*a);mascot(-235,-245,470);c.restore();
  if(local>.8){c.save();c.globalAlpha=enter(local,.8);rounded(c,395,635,245,72,20,C.white);text(c,'On regarde ça ?',417,680,204,{size:22,color:C.teal,maxLines:1});c.restore();}
 });
 frame(c,t,3.5,7,local=>{
  text(c,'Une question.',54,238,600,{size:62,maxLines:2});
  // Arrival timing adapted from the HyperFrames chat-message primitive.
  const a=enter(local,.2,.12);c.save();c.translate(666,302);c.scale(.75+.25*a,.75+.25*a);c.globalAlpha=a;
  rounded(c,-612,0,612,210,24,'#dcece1');label(c,'VOUS',-586,39,'#527265');text(c,config.question,-586,91,550,{size:34,min:26,maxLines:3,color:C.teal});c.restore();
  mascot(10,565,385,.3);
  rounded(c,330,680,308,126,23,C.white);label(c,'VOTRE ASSISTANT',354,715,'#377b79');
  for(let i=0;i<3;i++){const y=757-7*Math.sin(Math.max(0,local-.3)*6-i*.8);c.fillStyle='#377b79';c.beginPath();c.arc(366+i*25,y,6,0,Math.PI*2);c.fill();}
 });
 frame(c,t,7,11.8,local=>{
  text(c,'Une réponse utile.',54,238,612,{size:57,maxLines:2});
  const a=enter(local,.08,.3);c.save();c.globalAlpha=a;c.translate(0,22*(1-a));rounded(c,54,315,612,460,26,C.white);
  label(c,'VOTRE ASSISTANT MÉTIER',82,357,'#377b79');
  const words=config.answer.split(/\s+/),count=Math.max(1,Math.floor(enter(local,.25,1.15)*words.length));
  text(c,words.slice(0,count).join(' '),82,415,550,{size:34,min:27,maxLines:7,color:C.teal,lineHeight:1.3});
  c.strokeStyle='#d4e3d7';c.lineWidth=1;c.beginPath();c.moveTo(82,670);c.lineTo(638,670);c.stroke();text(c,'↗ '+config.source,82,708,545,{size:20,min:18,maxLines:2,color:'#377b79',face:'Manrope'});c.restore();
  mascot(20,820,250,.5);label(c,'DES SOURCES À CONSULTER',307,919);label(c,'UN RELAIS HUMAIN PRÉVU',307,950);
 });
 const close=enter(t,11.8,.35);if(close>0){c.save();c.globalAlpha=close;c.fillStyle=C.mint;c.fillRect(0,0,720,1280);
  c.strokeStyle='#93c9b6';c.lineWidth=105;c.beginPath();c.arc(790,1320,285,0,Math.PI*2);c.stroke();brand(c,true);
  label(c,'CONSEIL. PRODUIT. INGÉNIERIE.',54,177,'#377b79');
  c.save();c.translate(0,25*(1-enter(t,11.9,.5)));text(c,'Une idée à concrétiser ?',54,353,595,{size:68,maxLines:3,color:C.teal});c.restore();
  text(c,'Parlons-en.',54,564,590,{size:68,color:'#377b79',face:'Instrument',maxLines:1});
  rounded(c,54,658,332,76,38,C.teal);text(c,'Parlons de votre projet  ↗',79,705,285,{size:21,min:19,maxLines:1,color:C.white,face:'Manrope'});
  mascot(352,760,280,.5);text(c,'bandmdigitalconsulting.com',54,872,600,{size:21,face:'Manrope',color:C.teal,maxLines:1});c.restore();}
 label(c,'SCÉNARIO ILLUSTRATIF · SANS VOIX OFF',54,1208,close>.9?'#377b79':'#91afa3');
}
function drawMockups(canvas,time,resources){
 const c=canvas.getContext('2d'),t=clamp(time,0,14.999);c.fillStyle=C.navy;c.fillRect(0,0,720,1280);
 c.strokeStyle='#23483f';c.lineWidth=115;c.beginPath();c.arc(800,1330,300,0,Math.PI*2);c.stroke();
 const laptop=(x,y,w,zoom=1)=>{
  const h=w*.625+34;
  c.save();c.shadowColor='#0007';c.shadowBlur=30;c.shadowOffsetY=23;rounded(c,x,y,w,h,15,'#243532');c.restore();
  rounded(c,x+3,y+3,w-6,h-6,13,'#112322');c.fillStyle='#94bca8';c.beginPath();c.arc(x+w/2,y+8,2.5,0,Math.PI*2);c.fill();
  const sx=x+12,sy=y+18,sw=w-24,sh=sw*.625;c.save();c.beginPath();c.roundRect(sx,sy,sw,sh,4);c.clip();c.fillStyle='#f1f5f1';c.fillRect(sx,sy,sw,sh);if(resources.web){const cropW=resources.web.naturalWidth/zoom,cropH=resources.web.naturalHeight/zoom;c.drawImage(resources.web,resources.web.naturalWidth-cropW,0,cropW,cropH,sx,sy,sw,sh);}c.restore();
  const gradient=c.createLinearGradient(0,y+h,0,y+h+17);gradient.addColorStop(0,'#d4e0d6');gradient.addColorStop(.45,'#839c8e');gradient.addColorStop(1,'#3c574a');c.fillStyle=gradient;c.beginPath();c.moveTo(x-28,y+h-1);c.lineTo(x+w+28,y+h-1);c.quadraticCurveTo(x+w+20,y+h+17,x+w-12,y+h+18);c.lineTo(x+12,y+h+18);c.quadraticCurveTo(x-20,y+h+16,x-28,y+h-1);c.fill();rounded(c,x+w*.39,y+h,w*.22,5,3,'#617e6d');
 };
 const phone=(x,y,w)=>{const h=w*844/390;c.save();c.shadowColor='#0008';c.shadowBlur=35;c.shadowOffsetY=18;rounded(c,x,y,w,h,36,'#a4b6aa');c.restore();rounded(c,x+2,y+2,w-4,h-4,34,'#122722');c.save();c.beginPath();c.roundRect(x+8,y+8,w-16,h-16,28);c.clip();c.fillStyle='#f5f2eb';c.fillRect(x+8,y+8,w-16,h-16);if(resources.mobile)c.drawImage(resources.mobile,x+8,y+8,w-16,h-16);c.restore();rounded(c,x+w*.34,y+13,w*.32,14,8,'#10221d');rounded(c,x+w*.33,y+h-14,w*.34,4,3,'#526f62');c.fillStyle='#38574a';c.fillRect(x-2,y+93,3,33);c.fillRect(x+w-1,y+110,3,49);};
 const stamp=(title,body,x,y,w=320)=>{rounded(c,x,y,w,103,17,C.white);label(c,title,x+20,y+32,'#377b79');text(c,body,x+20,y+70,w-40,{size:26,min:22,maxLines:2,color:C.teal});};
 frame(c,t,-.28,3,local=>{label(c,'APPLICATIONS SUR MESURE',54,180);text(c,'VOTRE IDÉE.',54,300,610,{size:73,maxLines:2,weight:700});text(c,'À L’ÉCRAN.',54,400,610,{size:82,maxLines:2,color:C.mint,weight:700});const a=enter(local,.1,.75);c.save();c.translate(360,745+90*(1-a));c.scale(.8+.2*a,.8+.2*a);laptop(-298,-175,596);c.restore();text(c,'Du besoin au premier écran.',54,1030,600,{size:29,face:'Manrope',color:C.muted,maxLines:2});});
 frame(c,t,3,6.3,local=>{label(c,'DANS LE NAVIGATEUR',54,180);text(c,'UNE APP WEB.',54,285,612,{size:69,weight:700,maxLines:2});text(c,'Pensée pour vos usages.',54,346,600,{size:30,face:'Manrope',color:C.muted,maxLines:2});const a=enter(local,0,.65);laptop(44-70*(1-a),460,632,1+.42*enter(local,.35,1.1));stamp('UN PARCOURS CONCRET','Créer une demande.',316,860,350);const click=enter(local,1,.5);c.save();c.translate(550,538);c.fillStyle=C.white;c.beginPath();c.moveTo(0,0);c.lineTo(0,28);c.lineTo(7,21);c.lineTo(14,34);c.lineTo(20,31);c.lineTo(13,18);c.lineTo(24,18);c.closePath();c.fill();c.strokeStyle=C.mint;c.lineWidth=3;c.globalAlpha=1-click;c.beginPath();c.arc(0,0,10+click*35,0,Math.PI*2);c.stroke();c.restore();});
 frame(c,t,6.3,9.4,local=>{c.fillStyle=C.mint;c.fillRect(0,0,720,1280);label(c,'AU PLUS PRÈS DU TERRAIN',54,180,C.teal);text(c,'ET SUR MOBILE.',54,282,612,{size:63,color:C.teal,maxLines:2,weight:700});const a=enter(local,0,.7);phone(208+150*(1-a),362,294);stamp('LE BON ÉCRAN','Au bon moment.',36,769,255);});
 frame(c,t,9.4,12,local=>{label(c,'UNE EXPÉRIENCE COHÉRENTE',54,180);text(c,'UN PRODUIT.',54,285,615,{size:66,maxLines:2,weight:700});text(c,'PLUSIEURS ÉCRANS.',54,375,615,{size:61,maxLines:2,color:C.mint,weight:700});const a=enter(local,0,.6);laptop(45,572+60*(1-a),520);phone(470,655+100*(1-a),179);text(c,'Web · mobile · logiciel métier',54,1085,610,{size:28,face:'Manrope',color:C.muted,maxLines:2});});
 const a=enter(t,12,.25);if(a>0){c.save();c.globalAlpha=a;c.fillStyle=C.teal;c.fillRect(0,0,720,1280);label(c,'VOTRE PROJET, AVEC B&M',54,235);text(c,'Du besoin',54,380,615,{size:77,maxLines:2});text(c,'au produit.',54,489,615,{size:82,color:C.mint,face:'Instrument',maxLines:2});text(c,'B&M.',54,680,615,{size:132,weight:700,maxLines:1});rounded(c,54,781,435,78,15,C.mint);text(c,'PARLONS DE VOTRE PROJET  ↗',77,830,390,{size:23,min:21,maxLines:1,color:C.teal,weight:700});text(c,'bandmdigitalconsulting.com',54,944,600,{size:22,face:'Manrope',color:C.muted,maxLines:1});c.restore();}
 label(c,'INTERFACES ILLUSTRATIVES · DÉMONSTRATION B&M',54,1208,'#91afa3');
}
function drawKinetic(canvas,time){
 const c=canvas.getContext('2d'),t=clamp(time,0,14.999);c.fillStyle=C.navy;c.fillRect(0,0,720,1280);
 c.strokeStyle='#1d353b';c.lineWidth=100;c.beginPath();c.arc(800,1320,310,0,Math.PI*2);c.stroke();
 const hit=(value,x,y,w,size,local,delay=0,color=C.white)=>{const k=enter(local,delay,.22);c.save();c.translate(x,y+38*(1-k));c.globalAlpha=k;text(c,value,0,0,w,{size,min:size-10,maxLines:3,color,weight:700});c.restore();};
 frame(c,t,-.28,2.2,local=>{label(c,'DANS VOTRE ENTREPRISE',54,275);hit('VOS INFOS.',54,410,620,88,local);rounded(c,46,460,624,120,10,C.mint);hit('PARTOUT.',65,553,580,89,local,.15,C.teal);text(c,'Documents. Messages. Procédures.',54,658,610,{size:26,color:C.muted,face:'Manrope',maxLines:2});});
 frame(c,t,2.2,4.2,local=>{hit('VOTRE TEMPS ?',54,385,615,62,local);hit('PRÉCIEUX.',54,540,615,90,local,.12,C.mint);c.save();c.translate(360,780);c.rotate(-.12*(1-enter(local,0)));c.strokeStyle=C.mint;c.lineWidth=8;c.beginPath();c.arc(0,0,95,-Math.PI/2,Math.PI*1.5);c.stroke();c.beginPath();c.moveTo(0,-55);c.lineTo(0,0);c.lineTo(45,23);c.stroke();c.restore();});
 frame(c,t,4.2,6.6,local=>{hit('UNE QUESTION.',54,322,620,67,local);const a=enter(local,.16,.12);c.save();c.translate(650,420);c.scale(.75+.25*a,.75+.25*a);c.globalAlpha=a;rounded(c,-596,0,596,210,22,C.white);label(c,'VOUS',-568,42,'#377b79');text(c,'Où retrouver la bonne information ?',-568,102,530,{size:40,color:C.teal,maxLines:3});c.restore();text(c,'Un point d’entrée pour vos recherches.',54,740,600,{size:32,color:C.muted,face:'Manrope',maxLines:3});});
 frame(c,t,6.6,9.2,local=>{label(c,'UN PARCOURS À CONSTRUIRE',54,255);['RETROUVER LES SOURCES','LES CONSULTER','VÉRIFIER'].forEach((value,i)=>{const a=enter(local,i*.22,.3);c.save();c.globalAlpha=a;c.translate(40*(1-a),0);rounded(c,54,330+i*130,612,102,13,i===2?C.mint:'#1b343a');c.strokeStyle=i===2?C.teal:C.mint;c.lineWidth=3;c.beginPath();c.arc(94,381+i*130,17,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(87,381+i*130);c.lineTo(93,387+i*130);c.lineTo(103,375+i*130);c.stroke();text(c,value,130,391+i*130,500,{size:31,min:26,maxLines:1,color:i===2?C.teal:C.white,weight:700});c.restore();});});
 frame(c,t,9.2,11.6,local=>{hit('L’IA PRÉPARE.',54,355,610,64,local);hit('VOUS',54,520,610,96,local,.14,C.mint);hit('DÉCIDEZ.',54,635,610,90,local,.25,C.mint);text(c,'La validation humaine garde sa place.',54,790,600,{size:28,color:C.muted,face:'Manrope',maxLines:2});});
 const a=enter(t,11.6,.22);if(a>0){c.save();c.globalAlpha=a;c.fillStyle=C.mint;c.fillRect(0,0,720,1280);label(c,'CONSEIL. PRODUIT. INGÉNIERIE.',54,247,C.teal);text(c,'B&M.',54,435,610,{size:155,color:C.teal,weight:700,maxLines:1});text(c,'Parlons de votre projet.',54,570,610,{size:54,color:C.teal,maxLines:2});rounded(c,54,710,490,84,12,C.teal);text(c,'OUVRONS LA CONVERSATION  ↗',77,761,450,{size:24,color:C.white,maxLines:1,weight:700});text(c,'bandmdigitalconsulting.com',54,882,610,{size:23,color:C.teal,face:'Manrope',maxLines:1});c.restore();}
 label(c,'EXEMPLE DE MOTION DESIGN B&M',54,1208,a>.9?C.teal:'#91afa3');
}
