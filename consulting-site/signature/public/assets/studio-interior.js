/* Enhancement only: every paragraph and control remains visible without JS. */
(() => {
  if (!document.body.matches('.premium-site:not(.home-page)') || !('IntersectionObserver' in window)) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  const selector = '.service-catalog-heading,.service-system-heading,.service-usages-grid,.service-delivery-heading,.about-services header,.mp-heading,.folio-collection-heading,.cs-reading-grid,.questions-grid';
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!motion.matches) entry.target.classList.add('studio-section-enter');
      observer.unobserve(entry.target);
    });
  }, {threshold: .12});
  document.querySelectorAll(selector).forEach(node => observer.observe(node));
  motion.addEventListener('change', () => {
    if (!motion.matches) return;
    observer.disconnect();
    document.querySelectorAll('.studio-section-enter').forEach(node => node.classList.remove('studio-section-enter'));
  });
})();
