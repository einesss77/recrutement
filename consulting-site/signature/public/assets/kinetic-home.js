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
    toggle.querySelector('.kh-motion-symbol').textContent = paused ? '▷' : 'Ⅱ';
    window.dispatchEvent(new CustomEvent('bm:motion', {detail:{paused}}));
  });
  if (!('IntersectionObserver' in window)) return;
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!reduced.matches && !paused) entry.target.classList.add('kh-reveal-enter');
      reveal.unobserve(entry.target);
    });
  }, {threshold:.1});
  document.querySelectorAll('[data-kh-reveal]').forEach(item => reveal.observe(item));
  const idle = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('kh-offscreen', !entry.isIntersecting)), {rootMargin:'120px'});
  document.querySelectorAll('.kh-offer,.kh-project,.kh-method-screen,.kh-ticker').forEach(item => idle.observe(item));
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
})();
