(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const trigger=document.querySelector('.nav-services-toggle'),panel=document.querySelector('.nav-services-panel');
 function setMenu(open,focus=false){if(!trigger||!panel)return;trigger.setAttribute('aria-expanded',String(open));panel.hidden=!open;if(focus)trigger.focus()}
 trigger?.addEventListener('click',()=>setMenu(trigger.getAttribute('aria-expanded')!=='true'));
 trigger?.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();setMenu(true);panel.querySelector('a')?.focus()}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden)setMenu(false,true)});
 document.addEventListener('click',e=>{if(!e.target.closest('.nav-services'))setMenu(false)});
 document.querySelector('.nav-services')?.addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))setMenu(false)});
 const targets=[...document.querySelectorAll('.service-card,.service-visual,.service-system-diagram,.service-usages article,.service-steps li,.service-brief-sheet,.home-faq header,.about-service,.method-item')];
 targets.forEach((el,i)=>{el.classList.add('fx-ready');el.style.setProperty('--fx-delay',`${(i%3)*70}ms`);el.querySelectorAll('li,.service-brief-sheet>div,.service-flow>span,.service-ai-flow>span').forEach((node,n)=>node.style.setProperty('--node-index',n))});
 let reveal;if('IntersectionObserver'in window){reveal=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fx-seen');reveal.unobserve(e.target)}})},{threshold:.12});targets.forEach(e=>reveal.observe(e))}else targets.forEach(e=>e.classList.add('fx-seen'));
 document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{if(!el.open||reduced.matches)return;const body=el.querySelector(':scope>div');body?.animate([{opacity:.2,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.16,1,.3,1)'})}));
 const depth=[...document.querySelectorAll('.service-visual,.service-brief-sheet,.workshop-canvas,.service-system-diagram')];const active=new Set();let frame=0;
 function update(){frame=0;if(reduced.matches||document.documentElement.classList.contains('motion-stopped'))return;const viewport=innerHeight;const readings=[...active].map(el=>[el,el.getBoundingClientRect()]);for(const[el,r]of readings){const phase=Math.max(-1,Math.min(1,(viewport*.5-r.top-r.height*.5)/(viewport*.5+r.height*.5)));el.style.setProperty('--fx-y',`${(phase*17).toFixed(2)}px`)}}
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(e=>e.isIntersecting?active.add(e.target):active.delete(e.target));schedule()},{rootMargin:'70px'});depth.forEach(el=>{el.classList.add('fx-depth');observer.observe(el)})}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',()=>{depth.forEach(el=>el.style.removeProperty('--fx-y'));schedule()});
})();
/* Full-site scroll choreography: visible fades for editorial content and media. */
(()=>{
 if(location.pathname.startsWith('/gestion-realisations'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const root=document.documentElement;
 const running=new Set();
 const disabled=()=>reduced.matches||root.classList.contains('motion-stopped');
 function play(el,frames,options={}){if(disabled()||!el.animate)return;const animation=el.animate(frames,{duration:850,easing:'cubic-bezier(.16,1,.3,1)',...options});running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));return animation}
 const excluded='[aria-hidden="true"],.service-visual,.workshop-canvas,.talent-deck,.solo-sculpture,.squad-sculpture,.folio-device,.cs-scene,.mp-cycle-visual,.demo';
 const candidates=[...document.querySelectorAll('main h1,main h2,main h3,main p,main figure,main .service-card,main .mission-format,main .mp-framing-card,main .cs-content-block,main .folio-collection-link,main .service-handover>div,main .service-handover>aside')];
 const fade=candidates.filter(el=>!el.closest(excluded)&&!el.matches('[data-reveal]')&&!el.closest('.service-card,.mission-format,.mp-framing-card,.folio-collection-link')&&el.getAttribute('role')!=='status'&&!el.matches('[aria-live],.field-error,.form-status'));
 // Whole cards enter as a unit; text within diagrams stays legible as the diagram animates.
 document.querySelectorAll('main .mission-format,main .mp-framing-card,main .folio-collection-link').forEach(el=>{if(!el.matches('[data-reveal]'))fade.push(el)});
 const siblingCounts=new WeakMap();
 fade.forEach(el=>{el.dataset.scrollFade='';const parent=el.parentElement;const index=siblingCounts.get(parent)||0;siblingCounts.set(parent,index+1);el.style.setProperty('--fade-delay',`${Math.min(index*85,255)}ms`);if(!disabled())el.classList.add('scroll-fade-waiting')});
 const seen=new WeakSet();
 function show(el){el.classList.remove('scroll-fade-waiting');if(seen.has(el))return;seen.add(el);el.classList.add('scroll-fade-shown');play(el,[{opacity:0,translate:'0 28px'},{opacity:1,translate:'0 0'}],{duration:950,delay:parseFloat(el.style.getPropertyValue('--fade-delay'))||0,fill:'backwards'})}
 let fadeObserver;if('IntersectionObserver'in window){fadeObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){show(e.target);fadeObserver.unobserve(e.target)}},{threshold:.08,rootMargin:'0px 0px -35px 0px'});fade.forEach(el=>fadeObserver.observe(el))}else fade.forEach(show);
 if(location.pathname.replace(/^\/en(?=\/|$)/,'').startsWith('/realisations')){const main=document.querySelector('main');const discover=()=>main.querySelectorAll('.folio-collection-link:not([data-scroll-fade]),.cs-content-flow h2:not([data-scroll-fade]),.cs-content-flow p:not([data-scroll-fade])').forEach((el,i)=>{el.dataset.scrollFade='';el.style.setProperty('--fade-delay',`${(i%3)*100}ms`);if(!disabled())el.classList.add('scroll-fade-waiting');fade.push(el);if(fadeObserver)fadeObserver.observe(el);else show(el)});if(main){new MutationObserver(discover).observe(main,{childList:true,subtree:true});discover()}}
 const scenes=[...document.querySelectorAll('.solo-sculpture,.squad-sculpture,.about-panel-art,.mp-hero-board,.mp-artifact-body,.mission-animation,.site-footer,.service-handover,.contact-steps,.service-stack')];
 function scene(el){el.classList.add('motion-scene-entered');const pieces=el.matches('.site-footer')?el.querySelectorAll('.footer-top>a,.footer-top>p,.footer-links>a'):el.matches('.service-stack')?el.children:el.querySelectorAll('.sculpture-head,.sculpture-body,.mission-person,.mission-milestones>span,.about-brief>div,.about-team>div,.mp-board-slot,.contact-steps>div,.service-handover li');[...pieces].forEach((piece,i)=>play(piece,[{opacity:.05,translate:'0 20px'},{opacity:1,translate:'0 0'}],{duration:1000,delay:Math.min(i*110,550),fill:'backwards'}));el.querySelectorAll('.icon path').forEach((path,i)=>{if(!path.getTotalLength)return;const length=path.getTotalLength();play(path,[{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:1000,delay:Math.min(i*90,400)})})}
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){scene(e.target);observer.unobserve(e.target)}})},{threshold:.12});scenes.forEach(el=>observer.observe(el))}
 document.querySelectorAll('[role=tablist]').forEach(list=>{const enter=()=>requestAnimationFrame(()=>{const tab=list.querySelector('[aria-selected="true"]');const panel=tab&&document.getElementById(tab.getAttribute('aria-controls'));if(!panel)return;panel.querySelectorAll('h3,p,.about-panel-art>div,.mp-artifact-panel>div').forEach((el,i)=>play(el,[{opacity:.1,translate:'0 13px'},{opacity:1,translate:'0 0'}],{duration:650,delay:Math.min(i*65,195),fill:'backwards'}))});list.addEventListener('click',enter);list.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key))enter()})});
 function sync(){if(disabled()){fade.forEach(el=>el.classList.remove('scroll-fade-waiting'));running.forEach(animation=>animation.cancel())}}
 reduced.addEventListener('change',sync);new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class']});
})();
(()=>{function updateLanguageLinks(){const base=location.pathname.replace(/^\/en(?=\/|$)/,'')||'/';document.querySelectorAll('[data-locale-link]').forEach(link=>{link.href=(link.dataset.localeLink==='en'?'/en'+base:base)+location.search+location.hash})}updateLanguageLinks();addEventListener('hashchange',updateLanguageLinks)})();
