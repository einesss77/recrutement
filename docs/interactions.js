'use strict';
(() => {
  const mode = document.querySelector('#need-mode');
  const hint = document.querySelector('#mode-hint');
  const result = document.querySelector('#result');
  const hints = {
    profil: 'Profil individuel : rôle, compétences recherchées et intégration souhaitée.',
    squad: 'Squad : chantier, responsabilités de l’équipe et coordination avec l’existant.',
    solution: 'Sur-mesure : problème métier, usages attendus et critères de validation envisagés.',
    clarifier: 'Besoin à clarifier : objectif et contexte, sans présumer le mode d’accompagnement.'
  };
  const signature = document.querySelector('#bm-signature-evolved');
  const menu = signature.querySelector('.bme-menu');
  const nav = signature.querySelector('.bme-mobile-nav');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width:600px)');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    nav.hidden = true;
    menu.querySelector('span').textContent = '+';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.hidden = !open;
    menu.querySelector('span').textContent = open ? '−' : '+';
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) { closeMenu(); menu.focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !nav.hidden) { closeMenu(); menu.focus(); }
  });
  mobile.addEventListener('change', () => {
    const hadFocus = nav.contains(document.activeElement) || document.activeElement === menu;
    closeMenu();
    if (!mobile.matches && hadFocus) signature.querySelector('.bme-brand').focus();
  });
  signature.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const bounds = signature.getBoundingClientRect();
    signature.style.setProperty('--bme-pointer-x', `${((event.clientX-bounds.left)/bounds.width-.5)*150}px`);
    signature.style.setProperty('--bme-pointer-y', `${((event.clientY-bounds.top)/bounds.height-.5)*80}px`);
  });
  function resetPointer() {
    signature.style.setProperty('--bme-pointer-x', '0px');
    signature.style.setProperty('--bme-pointer-y', '0px');
  }
  signature.addEventListener('pointerleave', resetPointer);
  reduced.addEventListener('change', resetPointer);
  signature.classList.add('bme-ready');
  function updateMode() {
    hint.textContent = hints[mode.value] || 'Sélectionnez un mode pour préciser les informations utiles.';
    result.hidden = true;
  }
  mode.addEventListener('change', updateMode);
  document.querySelectorAll('[data-need]').forEach(link => link.addEventListener('click', () => {
    mode.value = link.dataset.need;
    updateMode();
  }));
  const form = document.querySelector('#brief-form');
  let briefUrl;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (briefUrl) URL.revokeObjectURL(briefUrl);
    const context = document.querySelector('#context').value.trim();
    const content = `B&M Digital Consulting — Brief\n\nAccompagnement : ${mode.selectedOptions[0].textContent}\n\nContexte :\n${context}\n`;
    briefUrl = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = briefUrl;
    download.download = 'brief-bm-consulting.txt';
    download.textContent = 'Télécharger mon brief';
    result.replaceChildren(document.createTextNode('Votre brief est prêt. '), download);
    result.hidden = false;
  });
  form.addEventListener('input', () => { result.hidden = true; });
})();
