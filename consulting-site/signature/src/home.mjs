const star = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 0v100M0 50h100M14.6 14.6l70.8 70.8m0-70.8L14.6 85.4" stroke="currentColor" stroke-width="13"/></svg>';
const uiIcon = paths => `<svg class="kh-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const phoneIcons = [
  '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>',
  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
];
const steps = [
  ['01','On pose les bonnes questions.','Vos usages, vos contraintes, vos priorités. On définit ensemble ce qui mérite d’être construit.','Cadrage & priorités'],
  ['02','Vous voyez le produit naître.','Des parcours concrets et des démonstrations régulières pour tester, décider et ajuster.','Design & développement'],
  ['03','On prépare la suite.','Recette, mise en service et transmission. Vous repartez avec les clés de votre solution.','Livraison & prise en main'],
];

export function renderHome({icon,button,arrowLink}) {
  return `
  <section class="kh-hero" aria-labelledby="kh-title">
    <div class="kh-art" aria-hidden="true"><canvas data-kinetic-core></canvas><div class="kh-art-fallback"><i></i><i></i><i></i></div></div>
    <div class="wrap kh-hero-inner">
      <p class="kh-eyebrow kh-hero-eyebrow"><span class="kh-dot"></span> STUDIO DIGITAL & INGÉNIERIE IT</p>
      <h1 id="kh-title"><span>L’idée est là.</span><span>Faisons-la</span><span class="kh-accent">exister<span class="kh-title-dot">.</span></span></h1>
      <div class="kh-hero-copy"><p>Des consultants IT pour vos équipes.<br>Des applications sur mesure pour votre métier.</p>${button('Parlons de votre projet','/contact/')}</div>
      <nav class="kh-mobile-links" aria-label="Nos accompagnements"><a href="#expertises"><span>01</span><strong>Consultants IT</strong>${icon()}</a><a href="#solutions-concretes"><span>02</span><strong>Applications sur mesure</strong>${icon()}</a></nav>
      <div class="kh-art-caption" aria-hidden="true"><span class="kh-cross">${icon('plus')}</span><span>STRATÉGIE<br>DESIGN<br>CODE</span><span class="kh-art-orbit">${star}</span></div>
      <div class="kh-hero-bottom"><a href="#expertises">${icon('down')}<span>La suite, c’est ici</span></a><span class="kh-hero-index" aria-hidden="true">B&M — DU POTENTIEL À L’IMPACT</span><button type="button" data-motion-toggle hidden aria-pressed="false" aria-label="Mettre les animations en pause"><span class="kh-motion-symbol" aria-hidden="true">${uiIcon('<path class="kh-pause-bars" d="M8 5v14M16 5v14"/><path class="kh-pause-play" d="m8 5 11 7-11 7Z"/>')}</span><span data-motion-label>Pause</span></button></div>
    </div>
  </section>

  <div class="kh-ticker" id="accompagnements" role="img" aria-label="Imaginer. Construire. Faire évoluer."><div class="kh-ticker-track" aria-hidden="true">${Array.from({length:4},()=>`<span>IMAGINER ${star} CONSTRUIRE ${star} FAIRE ÉVOLUER ${star}</span>`).join('')}</div></div>

  <section class="kh-consultants" id="expertises" aria-labelledby="kh-consultants-title"><div class="wrap kh-consultants-grid" id="outsourcing">
    <div class="kh-consultants-copy" data-kh-reveal><p class="kh-eyebrow">01 / CONSULTANTS & ÉQUIPES IT</p><h2 id="kh-consultants-title">Des consultants IT.<br><span class="kh-outline">Dans votre équipe.</span></h2><p>Un consultant ou une équipe dédiée, selon votre besoin.</p><div class="kh-consultants-roles" id="formats"><span>Développeurs</span><span>Architectes cloud</span><span>Experts data & IA</span><span>Product Owners</span></div><div class="kh-consultants-actions">${button('Trouver un consultant','/contact/?besoin=profil','dark')}${arrowLink('Voir les profils','/profils-et-squads/')}</div></div>
    <div class="kh-team-art" aria-hidden="true"><div class="kh-team-orbit"></div><div class="kh-team-center">B&M<span>LE COLLECTIF</span></div><span class="kh-team-node kh-node-1">DEV</span><span class="kh-team-node kh-node-2">PRODUIT</span><span class="kh-team-node kh-node-3">CLOUD</span><span class="kh-team-node kh-node-4">DATA & IA</span><span class="kh-art-tag">LES BONS RÔLES. LE MÊME CAP.</span></div>
  </div></section>

  <section class="kh-expertise kh-section" aria-labelledby="kh-expertise-title"><div class="wrap">
    <div class="kh-section-heading" data-kh-reveal><p class="kh-eyebrow">02 / APPLICATIONS SUR MESURE</p><div><h2 id="kh-expertise-title">Des applications.<br><span class="kh-outline">Sur mesure.</span></h2><p>Nous concevons et développons vos applications, de la première idée à la mise en service.</p></div></div>
    <article class="kh-offer" id="solutions-concretes" data-kh-reveal>
      <div class="kh-offer-number">02<span>BUILD</span></div>
      <div class="kh-offer-main"><h3>Vos idées.<br>Notre terrain de jeu.</h3><p>On conçoit et développe les outils numériques dont votre activité a besoin.</p><div class="kh-service-links" id="nos-services"><a href="/services/application-web-saas/">Web & SaaS ${icon()}</a><a href="/services/application-mobile/">Applications mobiles ${icon()}</a><a href="/services/logiciel-metier/">Logiciels métier ${icon()}</a><a href="/services/intelligence-artificielle/">Intelligence artificielle ${icon()}</a></div>${arrowLink('Explorer les solutions','/solutions-sur-mesure/')}</div>
      <div class="kh-build-art" aria-hidden="true"><div class="kh-build-grid"></div><div class="kh-build-layer kh-layer-back"><span>01 / STRATÉGIE</span></div><div class="kh-build-layer kh-layer-middle"><span>02 / DESIGN</span><i></i><i></i></div><div class="kh-build-layer kh-layer-front"><span>03 / CODE</span><div>&lt;<b>B&M</b>/&gt;</div><i></i><i></i></div><span class="kh-art-tag">DE L’IDÉE AU PRODUIT ↗</span></div>
    </article>

  </div></section>

  <section class="kh-work kh-section" id="demonstrations" aria-labelledby="kh-work-title"><div class="wrap">
    <div class="kh-work-heading" data-kh-reveal><div><p class="kh-eyebrow">03 / LE CHAMP DES POSSIBLES</p><h2 id="kh-work-title">Show.<br><span class="kh-accent">Don’t tell.</span></h2></div><div><p>Un aperçu de ce que vos outils<br>pourraient devenir.</p>${arrowLink('Explorer les démonstrations','/realisations/')}</div></div>
    <div class="kh-project-grid">
      <a class="kh-project kh-project-web" href="/realisations/exemple-web/" data-kh-reveal><div class="kh-project-stage"><span class="kh-project-label">CONCEPT 01 / APPLICATION WEB</span><div class="kh-browser" aria-hidden="true"><div class="kh-browser-top"><span><i></i><i></i><i></i></span><b>ATELIER / WORKSPACE</b><span>${icon()}</span></div><div class="kh-app"><aside><strong>a<span class="kh-ui-dot"></span></strong><i></i><i></i><i></i><i></i></aside><div class="kh-app-main"><div class="kh-app-title"><span>Votre activité,<br><strong>en un regard.</strong></span><b>+ Nouveau</b></div><div class="kh-app-stats"><div><span>Projets actifs</span><strong>12<span>${icon()}</span></strong></div><div><span>À valider</span><strong>03<span><i class="kh-ui-dot"></i></span></strong></div></div><div class="kh-app-chart"><span>AVANCEMENT DES PROJETS</span><div>${[42,62,49,78,58,89,72,95,84,100].map((height,i)=>`<i style="--bar:${height}%;--i:${i}"></i>`).join('')}</div></div><div class="kh-app-task"><i></i><span>Un espace. Tous vos projets.</span><b>${icon()}</b></div></div></div></div><span class="kh-project-visit" aria-hidden="true">${icon()}</span></div><div class="kh-project-info"><div><p>WEB / SAAS / ESPACE MÉTIER</p><h3>Atelier web</h3></div><span>${icon()}</span></div></a>
      <a class="kh-project kh-project-mobile" href="/realisations/exemple-mobile/" data-kh-reveal><div class="kh-project-stage"><span class="kh-project-label">CONCEPT 02 / APPLICATION MOBILE</span><div class="kh-mobile-ring" aria-hidden="true"></div><div class="kh-phone" aria-hidden="true"><div class="kh-phone-top"><span>9:41</span><i></i><span>${uiIcon('<path d="M3 15v3M7 11v7M11 7v11"/><rect x="15" y="7" width="6" height="11" rx="1"/>')}</span></div><div class="kh-phone-content"><span class="kh-phone-logo">terrain<span>${icon()}</span></span><p>Bonjour, Alex.</p><strong>Sur le terrain.<br>Dans le rythme.</strong><div class="kh-phone-map"><svg viewBox="0 0 220 130"><path d="M0 40h60l30 50h130M25 0v130M120 0v55l100 45M180 0l-50 130" fill="none" stroke="#cdd3d8" stroke-width="13"/><path d="m40 50 40 30 55-30 40 35" fill="none" stroke="#345bff" stroke-width="3" stroke-dasharray="5 4"/><circle cx="135" cy="50" r="9" fill="#345bff" stroke="white" stroke-width="4"/></svg></div><div class="kh-phone-job"><span>PROCHAINE INTERVENTION</span><b>Tout est prêt.<i>${icon()}</i></b><small>Dossier · Accès · Checklist</small></div><div class="kh-phone-nav">${phoneIcons.map(path=>`<b>${uiIcon(path)}</b>`).join('')}</div></div></div><span class="kh-mobile-chip" aria-hidden="true"><i>${icon('check')}</i> Synchronisé</span><span class="kh-project-visit" aria-hidden="true">${icon()}</span></div><div class="kh-project-info"><div><p>MOBILE / TERRAIN / OUTIL MÉTIER</p><h3>Compagnon terrain</h3></div><span>${icon()}</span></div></a>
    </div><p class="kh-project-note">Démonstrations illustratives · données fictives.</p>
  </div></section>

  <section class="kh-method kh-section" id="methode-projet" aria-labelledby="kh-method-title"><div class="wrap"><div class="kh-section-heading" data-kh-reveal><p class="kh-eyebrow">04 / EN MOUVEMENT</p><div><h2 id="kh-method-title">Pas de tunnel.<br>Du <span class="kh-outline">concret.</span></h2><p>Vous voyez ce qui avance. Vous décidez de la suite.</p></div></div><div class="kh-method-layout">
    <div class="kh-method-screen" data-method-screen="0" aria-hidden="true"><div class="kh-screen-top"><span>B&M / WORK IN PROGRESS</span><span data-method-counter>01 — 03</span></div><div class="kh-method-visual"><div class="kh-method-axis"></div><div class="kh-method-shape">${star}</div><div class="kh-method-word" data-method-word>Think.</div></div><div class="kh-screen-bottom"><span data-method-caption>Cadrage & priorités</span><i></i></div></div>
    <div class="kh-method-steps">${steps.map(([n,title,copy,output],i)=>`<article class="kh-method-step${i===0?' is-active':''}" data-method-step="${i}" data-method-caption-text="${output}"><span class="kh-eyebrow">${n} / ${output}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')}${arrowLink('Découvrir notre méthode','/notre-methode/')}</div>
  </div></div></section>

  <section class="kh-contact" id="parlons-en"><div class="wrap"><div class="kh-contact-top"><p class="kh-eyebrow">LE PROCHAIN MOUVEMENT</p><p>Une idée, un projet,<br>une équipe à compléter.</p></div><a class="kh-contact-link" href="/contact/"><h2>À vous<br>de jouer<span>.</span></h2><span class="kh-contact-arrow" aria-hidden="true">${icon()}</span><span class="kh-contact-label">Parlons-en ${icon()}</span></a></div></section>`;
}
