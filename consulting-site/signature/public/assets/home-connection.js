(() => {
  const root = document.querySelector('[data-home-connection]');
  if (!root || root.dataset.enhanced) return;
  const english = document.documentElement.lang === 'en';
  const board = root.querySelector('[data-hc-board]');
  const controls = root.querySelector('.hc-controls');
  const buttons = [...controls.querySelectorAll('[data-hc-mode]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const copy = english ? {
    team:{inputs:['Developer','Architect','Product Owner'],title:'Your team',subtitle:'An integrated expert',result:'The skills you need, working alongside your team.',href:'/en/contact/?besoin=profil'},
    product:{inputs:['Design','Development','Quality'],title:'Your product',subtitle:'Built for your needs',result:'An application designed around your workflows.',href:'/en/contact/?besoin=solution'},
    both:{inputs:['IT experts','Design & code','Delivery'],title:'Your project',subtitle:'A shared direction',result:'A team and a product moving forward together.',href:'/en/contact/'},
  } : {
    team:{inputs:['Développeur','Architecte','Product Owner'],title:'Votre équipe',subtitle:'Un renfort intégré',result:'Les compétences qui manquent, aux côtés de votre équipe.',href:'/contact/?besoin=profil'},
    product:{inputs:['Design','Développement','Qualité'],title:'Votre produit',subtitle:'Conçu sur mesure',result:'Une application pensée autour de vos usages.',href:'/contact/?besoin=solution'},
    both:{inputs:['Experts IT','Design & code','Pilotage'],title:'Votre projet',subtitle:'Un cap commun',result:'Une équipe et un produit qui avancent ensemble.',href:'/contact/'},
  };
  let visible = !('IntersectionObserver' in window);
  let changeFrame = 0;
  function syncMotion() {
    board.dataset.running = String(visible && !document.hidden && !reduced.matches && document.body.dataset.motionPaused !== 'true');
  }
  function select(mode) {
    const item = copy[mode];
    if (!item || board.dataset.mode === mode) return;
    board.dataset.mode = mode;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.hcMode === mode)));
    root.querySelectorAll('[data-hc-input]').forEach((node,index) => node.textContent = item.inputs[index]);
    root.querySelector('[data-hc-title]').textContent = item.title;
    root.querySelector('[data-hc-subtitle]').textContent = item.subtitle;
    root.querySelector('[data-hc-result]').textContent = item.result;
    root.querySelector('[data-hc-link]').href = item.href;
    board.classList.remove('is-updating');
    cancelAnimationFrame(changeFrame);
    if (!reduced.matches && document.body.dataset.motionPaused !== 'true') changeFrame = requestAnimationFrame(() => board.classList.add('is-updating'));
  }
  buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.hcMode)));
  controls.addEventListener('keydown', event => {
    const index = buttons.indexOf(event.target);
    if (index < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    select(buttons[next].dataset.hcMode);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting;syncMotion();}, {rootMargin:'60px'});
    observer.observe(board);
  }
  document.addEventListener('visibilitychange', syncMotion);
  addEventListener('bm:motion', syncMotion);
  reduced.addEventListener('change', syncMotion);
  controls.hidden = false;
  root.dataset.enhanced = 'true';
  syncMotion();
})();
