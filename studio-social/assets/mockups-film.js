// Frame-driven film. The studio and HyperFrames render exactly the same frames.
import {normalizeSettings} from './mockups-settings.js';
function paintFilm(canvas,time,r,S){
const P=S.colors,T=S.text;
const cut=[0,2.25,4.2,7.9,10.4,12.35,15];
const sat=v=>Math.max(0,Math.min(1,v)),out=v=>1-(1-sat(v))**4;
const ramp=(t,a,d=.4)=>out((t-a)/d);
const box=(c,x,y,w,h,r,fill)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
function type(c,s,x,y,size=56,color=P.paper,weight=700,align='left',maxWidth=520){c.font=`${weight} ${size}px Bricolage`;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y,maxWidth);c.textAlign='left';}
function small(c,s,x,y,color=P.muted,size=22,maxWidth=390){c.font=`500 ${size}px Manrope`;c.fillStyle=color;c.fillText(s,x,y,maxWidth);}
function word(c,s,y,t,delay=0,{size=76,color=P.paper,chip=false}={}){
 const a=ramp(t,delay,.27);c.save();c.globalAlpha=a;c.translate(360,y+48*(1-a));c.scale(.93+.07*a,.93+.07*a);
 c.font=`700 ${size}px Bricolage`;while(c.measureText(s).width>610&&size>20){size-=1;c.font=`700 ${size}px Bricolage`;}const w=c.measureText(s).width;
 if(chip)box(c,-w/2-18,-size*.85,w+36,size*1.13,9,P.mint);
 type(c,s,0,0,size,chip?P.ink:color,700,'center',610);c.restore();
}
function check(c,x,y,t,color=P.mint){const a=sat(t/.2);c.strokeStyle=color;c.lineWidth=3.5;c.lineCap='round';c.beginPath();c.arc(x,y,15,-Math.PI/2,-Math.PI/2+Math.PI*2*a);c.stroke();if(a>.65){c.beginPath();c.moveTo(x-6,y);c.lineTo(x-1,y+5);c.lineTo(x+8,y-6);c.stroke();}}
function pointer(c,x,y,click=0){c.save();c.translate(x,y);if(click>0&&click<1){c.globalAlpha=1-click;c.strokeStyle=P.mint;c.lineWidth=4;c.beginPath();c.arc(0,0,12+click*50,0,Math.PI*2);c.stroke();c.globalAlpha=1;}c.fillStyle=P.paper;c.strokeStyle=P.ink;c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(0,33);c.lineTo(9,24);c.lineTo(17,40);c.lineTo(24,36);c.lineTo(16,21);c.lineTo(30,20);c.closePath();c.fill();c.stroke();c.restore();}
function cover(c,image,x,y,w,h){const iw=image.naturalWidth,ih=image.naturalHeight,scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;c.drawImage(image,(iw-sw)/2,0,sw,sh,x,y,w,h);}
function web(c,r,t){
 box(c,0,0,1000,625,0,P.paper);if(r.web)cover(c,r.web,0,0,1000,625);if(!S.interactions)return;
 // A demonstrated interaction, not a cursor floating over a static screenshot.
 const a=ramp(t,.65,.28);if(a>0){c.save();c.globalAlpha=a;box(c,548,65,410,478,20,P.paper);c.strokeStyle='#ceddd5';c.lineWidth=2;c.strokeRect(570,147,365,1);type(c,T.form,575,115,31,P.ink,700,'left',350);small(c,T.object,575,196,P.ink,20);box(c,575,213,354,59,8,P.mint);small(c,'',595,251,P.ink);const label=T.request;small(c,label.slice(0,Math.floor(sat((t-1.05)/.5)*label.length)),595,251,P.ink,24,314);small(c,T.teamLabel,575,315,P.ink,20);box(c,575,334,354,56,8,'#e1ece4');small(c,T.team,595,369,P.ink,22,314);box(c,575,425,354,70,12,P.ink);type(c,T.create,752,469,25,P.paper,600,'center',320);c.restore();}
 const success=ramp(t,2.15,.25);if(success>0){c.save();c.globalAlpha=success;box(c,548,65,410,478,20,P.ink);check(c,752,230,t-2.15);type(c,T.created,752,316,36,P.paper,700,'center',350);small(c,T.createdBody,585,365,P.mint,20,330);c.restore();}
 const m=ramp(t,.1,.4),n=ramp(t,1.65,.35);if(t<2.3)pointer(c,480+(870-480)*m+(752-870)*n,50+(47-50)*m+(457-47)*n,t<1?sat((t-.54)/.35):sat((t-2)/.25));
}
function laptop(c,r,t){
 c.save();c.shadowColor='#0009';c.shadowBlur=45;c.shadowOffsetY=28;box(c,-518,-352,1036,700,22,'#6a8580');c.restore();
 box(c,-515,-349,1030,694,20,'#172c2c');c.fillStyle=P.mint;c.beginPath();c.arc(0,-337,3,0,Math.PI*2);c.fill();
 c.save();c.translate(-500,-323);c.beginPath();c.roundRect(0,0,1000,625,5);c.clip();web(c,r,t);c.restore();
 const g=c.createLinearGradient(0,345,0,378);g.addColorStop(0,'#c7d8d0');g.addColorStop(.35,'#8fa9a0');g.addColorStop(1,'#36554e');c.fillStyle=g;c.beginPath();c.moveTo(-565,345);c.lineTo(565,345);c.lineTo(546,364);c.quadraticCurveTo(530,378,500,378);c.lineTo(-500,378);c.quadraticCurveTo(-542,375,-565,345);c.fill();box(c,-95,345,190,9,0,'#54776c');
}
function phone(c,r,t){
 c.save();c.shadowColor='#0008';c.shadowBlur=40;c.shadowOffsetY=24;box(c,-159,-332,318,664,42,'#77958b');c.restore();box(c,-156,-329,312,658,40,'#102822');
 c.save();c.beginPath();c.roundRect(-147,-319,294,638,31);c.clip();box(c,-147,-319,294,638,0,P.paper);if(r.mobile)cover(c,r.mobile,-147,-319,294,638);
 const a=S.interactions?ramp(t,.65,.35):0;if(a){c.save();c.globalAlpha=a;box(c,-133,-73+35*(1-a),266,243,17,P.ink);small(c,T.mobileTag,-113,-35,P.mint,13,224);type(c,T.mobileTitle,-113,12,23,P.paper,700,'left',224);small(c,T.mobileBody,-113,48,P.muted,14,224);box(c,-113,85,224,56,12,P.mint);type(c,t>1.4?T.mobileDone:T.mobileAction,-1,119,18,P.ink,600,'center',210);c.restore();}c.restore();box(c,-49,-309,98,21,13,'#102822');box(c,-48,309,96,4,3,'#22493e');
}
function background(c,t){c.fillStyle=P.bg;c.fillRect(0,0,720,1280);const g=c.createRadialGradient(360+100*Math.sin(t*.4),640,15,360,640,580);g.addColorStop(0,P.mint+'18');g.addColorStop(1,P.bg+'00');c.fillStyle=g;c.fillRect(0,0,720,1280);}
function drawFilm(canvas,time,r){
 const c=canvas.getContext('2d'),t=Math.max(0,Math.min(14.999,time));if(canvas.width!==720)canvas.width=720;if(canvas.height!==1280)canvas.height=1280;c.clearRect(0,0,720,1280);background(c,t);
 const scene=cut.findIndex((v,i)=>i<cut.length-1&&t>=v&&t<cut[i+1]),q=t-cut[scene];
 c.save();
 // Short camera handoffs, not long dissolves between repeated slide layouts.
 const end=cut[scene+1]-cut[scene],exit=sat((q-(end-.16))/.16);c.globalAlpha=1-exit*.75;c.translate(-exit*36,0);
 if(scene===0){
  word(c,T.hook1,430,q,0,{size:78});word(c,T.hook2,532,q,.23,{size:76,chip:true});
  const cards=[[T.card1,T.body1,-13],[T.card2,T.body2,10],[T.card3,T.body3,-5]];
  cards.forEach(([a,b,rot],i)=>{const k=ramp(q,.45+i*.14,.35);c.save();c.globalAlpha=k;c.translate(360+(i-1)*30,680+i*112+40*(1-k));c.rotate(rot*Math.PI/180*(1-k));box(c,-228,-35,456,87,12,P.ink);type(c,a,-202,-2,26);small(c,b,-202,28,P.muted,19);c.restore();});
 }else if(scene===1){
  small(c,T.intro,156,361,P.muted,22);word(c,T.solution1,521,q,.03,{size:87});word(c,T.solution2,628,q,.18,{size:89,chip:true});
  [T.list1,T.list2,T.list3].forEach((s,i)=>{const a=ramp(q,.45+i*.15,.25);c.save();c.globalAlpha=a;box(c,129+45*(1-a),738+i*76,462,61,12,'#1d3839');type(c,s,155+45*(1-a),779+i*76,26,P.paper,700,'left',350);check(c,554,768+i*76,q-.6-i*.15);c.restore();});
 }else if(scene===2){
  word(c,T.web1,290,q,0,{size:61});word(c,T.web2,369,q,.12,{size:72,color:P.mint});
  const arrive=ramp(q,0,.55),push=ramp(q,.85,.85),pull=ramp(q,2.95,.5),scale=(.53+.35*push-.24*pull)*(.87+.13*arrive);
  c.save();c.translate(360-145*push+145*pull,765+120*(1-arrive)-30*push);c.scale(scale,scale);c.transform(1,0,.08*(1-arrive),1,0,0);laptop(c,r,q-.18);c.restore();
  if(q>2.45){const a=ramp(q,2.45,.22);c.save();c.globalAlpha=a;box(c,165,1060-18*a,390,62,31,P.mint);type(c,T.badge,360,1082,28,P.ink,600,'center',350);c.restore();}
 }else if(scene===3){
  const flood=ramp(q,0,.25);box(c,0,1280*(1-flood),720,1280,0,P.mint);
  word(c,T.mobile1,284,q,.07,{size:65,color:P.ink});word(c,T.mobile2,369,q,.2,{size:70,color:P.ink});
  const a=ramp(q,.05,.45),zoom=ramp(q,1.1,.65);c.save();c.translate(360+240*(1-a)-26*zoom,788+70*(1-a));c.scale(.88+.14*zoom,.88+.14*zoom);phone(c,r,q);c.restore();
  if(q>1.45&&S.interactions){c.save();c.globalAlpha=ramp(q,1.45,.2);box(c,200,393,320,62,16,P.paper);check(c,231,424,q-1.45,P.ink);type(c,T.notification,259,432,23,P.ink,700,'left',245);c.restore();}
 }else if(scene===4){
  word(c,T.result1,375,q,0,{size:65});word(c,T.result2,462,q,.15,{size:69,chip:true});
  [T.benefit1,T.benefit2,T.benefit3].forEach((s,i)=>{const a=ramp(q,.25+i*.2,.25);c.save();c.globalAlpha=a;c.translate(0,25*(1-a));box(c,90,587+i*105,540,84,14,'#1d3839');check(c,131,629+i*105,q-.35-i*.2);type(c,s,170,640+i*105,32,P.paper,700,'left',420);c.restore();});
 }else{
  const k=ramp(q,0,.4);c.save();c.translate(360,640);c.scale(k*4.8,k*4.8);c.strokeStyle=P.mint;c.lineWidth=140;c.beginPath();c.arc(0,0,155,-Math.PI*.5,Math.PI*1.5);c.stroke();c.restore();if(q>.23)box(c,0,0,720,1280,0,P.mint);
  if(q>.3){word(c,T.close1,438,q,.3,{size:66,color:P.ink});word(c,T.close2,526,q,.46,{size:74,color:P.ink});c.save();c.globalAlpha=ramp(q,.62,.3);type(c,T.brand,360,716,113,P.ink,700,'center');box(c,134,827,452,81,41,P.ink);type(c,T.cta,360,878,28,P.paper,600,'center',420);type(c,T.domain,360,977,22,P.ink,500,'center',610);c.restore();}
 }
 c.restore();
 const light=scene===3||(scene===5&&q>.23);small(c,T.brand,52,139,light?P.ink:P.mint,20);small(c,T.strap,365,139,light?P.ink:P.muted,15,300);
 small(c,'INTERFACES ILLUSTRATIVES · '+T.brand,52,1155,light?P.ink:P.muted,14);
}

return drawFilm(canvas,time,r);
}
export function drawMockupsFilm(canvas,time,r){return paintFilm(canvas,time,r,normalizeSettings(r.config.mockups));}
