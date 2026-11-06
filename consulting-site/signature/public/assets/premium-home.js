/* The workshop is user controlled. The first state also works without JS. */
document.querySelectorAll('[data-ph-lab]').forEach(lab => {
  const triggers = [...lab.querySelectorAll('[data-ph-trigger]')];
  const scenes = [...lab.querySelectorAll('[data-ph-scene]')];
  const caption = lab.querySelector('[data-ph-caption]');
  const number = lab.querySelector('[data-ph-number]');
  function select(index) {
    triggers.forEach((trigger, i) => {
      trigger.setAttribute('aria-expanded', String(i === index));
      document.getElementById(trigger.getAttribute('aria-controls')).hidden = i !== index;
      scenes[i].hidden = i !== index;
    });
    caption.textContent = triggers[index].closest('[data-ph-step]').querySelector('[data-ph-label]').textContent;
    number.textContent = `0${index + 1} / 03`;
  }
  triggers.forEach((trigger, i) => trigger.addEventListener('click', () => select(i)));
});

const signalToggle = document.querySelector('[data-signal-toggle]');
if (signalToggle) {
  const field = document.querySelector('[data-signal-field]');
  function showControl() { signalToggle.hidden = field?.dataset.signalReady !== 'true'; }
  if (field) {
    showControl();
    new MutationObserver(showControl).observe(field, {attributes:true,attributeFilter:['data-signal-ready']});
  }
  signalToggle.addEventListener('click', () => {
    const paused = signalToggle.getAttribute('aria-pressed') !== 'true';
    signalToggle.setAttribute('aria-pressed', String(paused));
    signalToggle.querySelector('[data-signal-playing]').hidden = paused;
    signalToggle.querySelector('[data-signal-paused]').hidden = !paused;
    window.dispatchEvent(new CustomEvent('bm:signal-motion', {detail:{paused}}));
  });
}

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const entrance = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('ph-in-view');
      observer.unobserve(entry.target);
    }
  }, {threshold:.12});
  document.querySelectorAll('.ph-section-head,.ph-offer,.ph-project,.ph-lab-visual').forEach((item, i) => {
    item.style.setProperty('--ph-enter-delay', `${(i % 2) * 75}ms`);
    entrance.observe(item);
  });
}
