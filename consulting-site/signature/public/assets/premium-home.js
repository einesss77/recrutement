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
