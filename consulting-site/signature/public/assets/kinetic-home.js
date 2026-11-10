(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const english = document.documentElement.lang === 'en';
  const toggle = document.querySelector('[data-motion-toggle]');
  let paused = false;
  if (toggle) toggle.hidden = false;
  toggle?.addEventListener('click', () => {
    paused = !paused;
    document.body.dataset.motionPaused = String(paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? (english ? 'Resume animations' : 'Reprendre les animations') : (english ? 'Pause animations' : 'Mettre les animations en pause'));
    toggle.querySelector('[data-motion-label]').textContent = paused ? (english ? 'Resume' : 'Reprendre') : 'Pause';
    window.dispatchEvent(new CustomEvent('bm:motion', {detail:{paused}}));
  });
  if (!('IntersectionObserver' in window)) return;
  const revealTargets = [...document.querySelectorAll('[data-kh-reveal],.kh-method-step,.kh-contact-top,.kh-contact-link')];
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('kh-revealed');
      reveal.unobserve(entry.target);
    });
  }, {threshold:.08,rootMargin:'0px 0px -25px 0px'});
  revealTargets.forEach(item => {
    if (!reduced.matches) item.classList.add('kh-reveal-ready');
    reveal.observe(item);
  });
  document.addEventListener('focusin',event => event.target.closest('.kh-reveal-ready')?.classList.add('kh-revealed'));
  const idle = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('kh-offscreen', !entry.isIntersecting)), {rootMargin:'120px'});
  document.querySelectorAll('.kh-consultants,.kh-offer,.kh-project,.kh-method-screen,.kh-ticker').forEach(item => idle.observe(item));
  const screen = document.querySelector('[data-method-screen]');
  const steps = [...document.querySelectorAll('[data-method-step]')];
  const wide = matchMedia('(min-width: 761px)');
  const selectStep = index => {
    if (!screen) return;
    screen.dataset.methodScreen = String(index);
    screen.querySelector('[data-method-word]').textContent = ['Think.', 'Build.', 'Ship.'][index];
    screen.querySelector('[data-method-counter]').textContent = `0${index+1} — 03`;
    screen.querySelector('[data-method-caption]').textContent = english ? ['Discovery & priorities','Design & development','Delivery & handover'][index] : steps[index].dataset.methodCaptionText;
    steps.forEach((step,i)=>step.classList.toggle('is-active',i===index));
  };
  let methodVisible = false;
  let methodFrame = 0;
  function updateMethod() {
    methodFrame = 0;
    if (!wide.matches || !methodVisible || !steps.length) return;
    const middle = innerHeight * .5;
    const distances = steps.map(step => {
      const bounds = step.getBoundingClientRect();
      return Math.abs(bounds.top + bounds.height / 2 - middle);
    });
    const index = distances.indexOf(Math.min(...distances));
    if (screen.dataset.methodScreen !== String(index)) selectStep(index);
  }
  function scheduleMethod() {
    if (!methodFrame && wide.matches && methodVisible) methodFrame = requestAnimationFrame(updateMethod);
  }
  const method = new IntersectionObserver(([entry]) => {
    methodVisible = entry.isIntersecting;
    scheduleMethod();
  }, {rootMargin:'80px'});
  if (screen) method.observe(screen.closest('.kh-method-layout'));
  addEventListener('scroll', scheduleMethod, {passive:true});
  addEventListener('resize', scheduleMethod, {passive:true});
  wide.addEventListener('change',()=>{if(!wide.matches) selectStep(0);else scheduleMethod();});

  // Independent translate leaves each object's local rotation and floating animation intact.
  const depthTargets = [...document.querySelectorAll('.kh-browser,.kh-phone,.kh-build-art,.kh-consultants .kh-team-art')];
  const depthActive = new Set();
  let depthFrame = 0;
  const depthObserver = new IntersectionObserver(entries => {
    entries.forEach(entry=>entry.isIntersecting?depthActive.add(entry.target):depthActive.delete(entry.target));
    scheduleDepth();
  }, {rootMargin:'100px'});
  function updateDepth() {
    depthFrame = 0;
    if (reduced.matches || paused) return;
    const amount = wide.matches ? 28 : 13;
    const bounds = [...depthActive].map(item=>[item,item.parentElement.getBoundingClientRect()]);
    bounds.forEach(([item,box])=>{
      const phase = Math.max(-1,Math.min(1,(innerHeight*.5-box.top-box.height*.5)/(innerHeight*.5+box.height*.5)));
      item.style.setProperty('--kh-depth-y',`${(phase*amount).toFixed(2)}px`);
    });
  }
  function scheduleDepth() {if(!depthFrame&&!reduced.matches&&!paused)depthFrame=requestAnimationFrame(updateDepth);}
  depthTargets.forEach(item=>{item.classList.add('kh-depth');depthObserver.observe(item);});
  addEventListener('scroll',scheduleDepth,{passive:true});
  addEventListener('resize',scheduleDepth,{passive:true});
  addEventListener('bm:motion',()=>{if(paused){cancelAnimationFrame(depthFrame);depthFrame=0;}else scheduleDepth();});
  reduced.addEventListener('change',()=>{
    if(reduced.matches){revealTargets.forEach(item=>item.classList.add('kh-revealed'));depthTargets.forEach(item=>item.style.removeProperty('--kh-depth-y'));}
    scheduleDepth();
  });
})();
