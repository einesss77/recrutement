/* Ambient light is optional; static gradients and all content work without JS. */
(() => {
  if (!document.body.matches('.premium-site:not(.home-page)')) return;
  const regions = [...document.querySelectorAll('main .page-hero,main .service-hero,main .about-hero,main .mp-scroll-hero,main .premium-contact,main .pi-hero')];
  if (!regions.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const english = document.documentElement.lang === 'en';
  let paused = false;
  try { paused = sessionStorage.getItem('bm-ambient-paused') === 'true'; } catch {}
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'studio-motion-toggle';
  control.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path data-studio-pause d="M8 5v14M16 5v14"/><path data-studio-play d="m8 5 11 7-11 7Z"/></svg>';
  regions[0].append(control);
  function sync() {
    document.body.classList.toggle('studio-ambient-paused', paused);
    document.body.classList.toggle('studio-document-hidden', document.hidden);
    control.hidden = reduced.matches;
    control.setAttribute('aria-pressed', String(paused));
    const label = paused
      ? (english ? 'Resume animated background' : 'Reprendre le fond animé')
      : (english ? 'Pause animated background' : 'Mettre le fond animé en pause');
    control.setAttribute('aria-label', label);
    control.title = label;
  }
  control.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('bm-ambient-paused', String(paused)); } catch {}
    sync();
  });
  regions.forEach(region => region.classList.add('studio-ambient'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-ambient-visible', entry.isIntersecting));
    }, {rootMargin:'80px'});
    regions.forEach(region => observer.observe(region));
  }
  // Without the observer the gradients remain still rather than looping offscreen.
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
