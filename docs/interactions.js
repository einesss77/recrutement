'use strict';
(() => {
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#navigation');
  const mode = document.querySelector('#need-mode');
  const hint = document.querySelector('#mode-hint');
  const result = document.querySelector('#result');
  const hints = {
    profil: 'Profil individuel : rôle, compétences recherchées et intégration souhaitée.',
    squad: 'Squad : chantier, responsabilités de l’équipe et coordination avec l’existant.',
    solution: 'Sur-mesure : problème métier, usages attendus et critères de validation envisagés.',
    clarifier: 'Besoin à clarifier : objectif et contexte, sans présumer le mode d’accompagnement.'
  };
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.innerHTML = 'Menu <span aria-hidden="true">＋</span>';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.innerHTML = open ? 'Fermer <span aria-hidden="true">−</span>' : 'Menu <span aria-hidden="true">＋</span>';
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });
  window.matchMedia('(max-width:800px)').addEventListener('change', closeMenu);
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
