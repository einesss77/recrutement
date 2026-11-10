/* Method: ordinary scrolling is the controller. Content never waits for playback. */
(() => {
  const page = document.querySelector('.mp-page');
  if (!page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const process = page.querySelector('[data-method-process]');
  const display = page.querySelector('[data-process-display]');
  const steps = [...page.querySelectorAll('[data-process-step]')];
  const markers = [...page.querySelectorAll('[data-process-marker]')];
  const route = page.querySelector('[data-method-parallax]');
  const hero = page.querySelector('.mp-scroll-hero');
  const motion = new Set();
  const active = new Set();
  let frame = 0;
  let current = 0;

  function select(index) {
    if (!display || current === index) return;
    current = index;
    display.dataset.processDisplay = String(index);
    display.style.setProperty('--process-progress', String((index + 1) / steps.length));
    display.querySelector('[data-process-number]').textContent = String(index + 1).padStart(2, '0');
    // Read translated, visible content rather than maintaining a second copy of the labels.
    display.querySelector('[data-process-name]').textContent = steps[index].querySelector('.mp-process-step-label>span:last-child').textContent;
    markers.forEach((marker, i) => marker.classList.toggle('is-current', i === index));
    steps.forEach((step, i) => step.classList.toggle('is-current', i === index));
  }
  function update() {
    frame = 0;
    if (active.has(process) && steps.length) {
      const center = innerHeight * .52;
      const distances = steps.map(step => {
        const box = step.getBoundingClientRect();
        return Math.abs(box.top + box.height / 2 - center);
      });
      select(distances.indexOf(Math.min(...distances)));
    }
    if (route && active.has(hero)) {
      const box = hero.getBoundingClientRect();
      const drift = reduced.matches || innerWidth < 761 ? 0 : Math.max(-18, Math.min(24, -box.top * .06));
      route.style.setProperty('--route-drift', drift.toFixed(2) + 'px');
    }
  }
  function schedule() {
    if (!frame && active.size) frame = requestAnimationFrame(update);
  }
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
      schedule();
    }, {rootMargin:'100px'});
    if (hero) visibility.observe(hero);
    if (process) visibility.observe(process);
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduced.matches && entry.target.animate) {
          const animation = entry.target.animate([
            {opacity:.18, transform:'translateY(32px)'},
            {opacity:1, transform:'translateY(0)'}
          ], {duration:800, easing:'cubic-bezier(.16,1,.3,1)'});
          motion.add(animation);
          animation.finished.catch(()=>{}).finally(()=>motion.delete(animation));
        }
        reveal.unobserve(entry.target);
      });
    }, {threshold:.12});
    steps.forEach(step => reveal.observe(step));
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      motion.forEach(animation => animation.cancel());
      route?.style.setProperty('--route-drift', '0px');
    }
    schedule();
  });

  page.querySelectorAll('[data-method-artifacts]').forEach(root => {
    const tabs = [...root.querySelectorAll('[role=tab]')];
    function show(index) {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
      });
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => show(i));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        show(next);
        tabs[next].focus();
      });
    });
  });
  const index = page.querySelector('.mp-index');
  if (index && 'IntersectionObserver' in window) {
    const links = [...index.querySelectorAll('a')];
    const sections = links.map(link=>document.getElementById(link.hash.slice(1))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry=>entry.isIntersecting);
      if (!visible.length) return;
      const section = visible[0].target;
      links.forEach(link=>link.hash === '#'+section.id ? link.setAttribute('aria-current','location') : link.removeAttribute('aria-current'));
    }, {rootMargin:'-110px 0px -55% 0px'});
    sections.forEach(section=>observer.observe(section));
  }
})();
