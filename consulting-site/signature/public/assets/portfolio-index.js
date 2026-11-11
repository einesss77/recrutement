import {indexCardsMarkup} from './portfolio-index-render.mjs';

const root=document.querySelector('[data-portfolio-index]');
if(root){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let cleanup=()=>{};
  function enhance(){
    cleanup();
    const active=new Set();
    const cards=[...root.querySelectorAll('[data-index-card]')];
    let frame=0;
    const entrance='IntersectionObserver' in window?new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        if(!reduced.matches){entry.target.classList.add('pi-entered');}
        entrance.unobserve(entry.target);
      }
    },{threshold:.12}):null;
    root.querySelectorAll('[data-index-reveal]').forEach((el,i)=>{el.style.setProperty('--pi-delay',`${i%3*65}ms`);entrance?.observe(el)});
    function render(){
      frame=0;
      if(reduced.matches)return;
      const readings=[...active].map(card=>[card,card.getBoundingClientRect()]);
      for(const [card,bounds] of readings){
        const progress=Math.max(-1,Math.min(1,(innerHeight*.5-bounds.top-bounds.height*.5)/(innerHeight*.5+bounds.height*.5)));
        card.querySelector('[data-index-depth]')?.style.setProperty('--pi-depth-y',`${progress*(innerWidth>700?14:6)}px`);
      }
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(render)}
    const visibility='IntersectionObserver' in window?new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.isIntersecting?active.add(entry.target):active.delete(entry.target));schedule();
    },{rootMargin:'100px'}):null;
    cards.forEach(card=>visibility?.observe(card));
    function sync(){
      if(reduced.matches)root.querySelectorAll('[data-index-depth]').forEach(el=>el.style.removeProperty('--pi-depth-y'));
      schedule();
    }
    addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule,{passive:true});
    reduced.addEventListener('change',sync);
    cleanup=()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);reduced.removeEventListener('change',sync);cancelAnimationFrame(frame);entrance?.disconnect();visibility?.disconnect()};
    schedule();
  }
  enhance();
  if(!document.querySelector('meta[name="bm-portfolio-source"][content="examples"]')){
    fetch('/api/content.php?action=public',{cache:'no-store',credentials:'same-origin'})
      .then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'Portfolio unavailable');return data})
      .then(data=>{
        const projects=(data.projects||[]).slice().sort((a,b)=>(a.position||0)-(b.position||0));
        root.innerHTML=indexCardsMarkup(projects);
        const count=document.querySelector('[data-index-count]');if(count)count.textContent=String(projects.length).padStart(2,'0');
        const disclosure=document.querySelector('[data-index-disclosure]');
        if(disclosure){disclosure.hidden=!projects.some(p=>p.isTest);disclosure.textContent=projects.every(p=>p.isTest)?'Les projets présentés sont des démonstrations sur données fictives.':'Les projets de démonstration sont signalés sur chaque fiche.';}
        window.BMI18N?.walk(root);
        enhance();
      }).catch(()=>{
        const status=document.querySelector('.pi-status');
        if(status)status.textContent=document.documentElement.lang==='en'?'Showing the bundled demonstrations.':'Les démonstrations intégrées restent disponibles.';
      });
  }
}
