/* Motion is an enhancement: content remains visible without JavaScript. */
(()=>{
 const root=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const header=document.querySelector('.site-header');
 const progress=document.createElement('div');progress.className='page-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 let queued=0,stopped=false;
 const active=new Set();
 const targets=[...document.querySelectorAll('.intro-image-window img,.talent-deck,.solo-sculpture,.squad-sculpture,.support-map')];
 const homeMobile=matchMedia('(max-width:700px)');
 const enabled=()=>!reduced.matches&&!stopped&&!(document.body.classList.contains('home-page')&&homeMobile.matches);
 function render(){
  queued=0;
  const scroll=window.scrollY;
  const distance=Math.max(1,root.scrollHeight-window.innerHeight);
  progress.style.setProperty('--page-progress',String(Math.min(1,Math.max(0,scroll/distance))));
  header?.classList.toggle('is-scrolled',scroll>45);
  if(!enabled())return;
  const viewport=window.innerHeight;
  for(const target of active){
   const rect=target.getBoundingClientRect();
   const phase=Math.max(-1,Math.min(1,(viewport/2-rect.top-rect.height/2)/(viewport/2+rect.height/2)));
   const amplitude=target.matches('img')?24:target.matches('.talent-deck')?16:10;
   target.style.setProperty('--motion-y',`${(phase*amplitude*(fine.matches&&window.innerWidth>700?1:.4)).toFixed(2)}px`);
  }
 }
 function schedule(){if(!queued)queued=requestAnimationFrame(render)}
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)active.add(entry.target);else active.delete(entry.target)}schedule()},{rootMargin:'70px'});targets.forEach(target=>observer.observe(target));}
 function configure(){
  root.classList.toggle('motion-enhanced',enabled());
  if(!enabled()){for(const target of targets){target.style.removeProperty('--motion-y');target.style.removeProperty('--tilt-x');target.style.removeProperty('--tilt-y')}}
  schedule();
 }
 document.querySelectorAll('.format-duo,.delivery-grid,.support-method ol').forEach(group=>{
  group.querySelectorAll('[data-reveal]').forEach((el,index)=>el.style.setProperty('--reveal-delay',`${Math.min(index*(fine.matches?75:45),225)}ms`));
 });
 document.querySelectorAll('.talent-deck').forEach(deck=>{
  let bounds=null;
  deck.addEventListener('pointerenter',()=>{bounds=deck.getBoundingClientRect()});
  deck.addEventListener('pointermove',event=>{
   if(!enabled()||(!fine.matches||window.innerWidth<=700)||event.pointerType==='touch'||!bounds)return;
   deck.style.setProperty('--tilt-x',`${(-(event.clientY-bounds.top-bounds.height/2)/bounds.height*5).toFixed(2)}deg`);
   deck.style.setProperty('--tilt-y',`${((event.clientX-bounds.left-bounds.width/2)/bounds.width*6).toFixed(2)}deg`);
  });
  deck.addEventListener('pointerleave',()=>{bounds=null;deck.style.setProperty('--tilt-x','0deg');deck.style.setProperty('--tilt-y','0deg')});
 });
 const pause=document.querySelector('.hero>.motion-pause');
 if(pause){pause.textContent='Ⅱ';pause.setAttribute('aria-label','Mettre les animations en pause');pause.addEventListener('click',()=>{stopped=pause.getAttribute('aria-pressed')==='true';root.classList.toggle('motion-stopped',stopped);pause.textContent=stopped?'▶':'Ⅱ';pause.setAttribute('aria-label',stopped?'Reprendre les animations':'Mettre les animations en pause');configure()})}
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);reduced.addEventListener('change',configure);fine.addEventListener('change',configure);homeMobile.addEventListener('change',configure);configure();
})();
