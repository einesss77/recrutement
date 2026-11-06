import {projects} from './project-data.mjs';

const services = [
  ['01','Application web & SaaS','/services/application-web-saas/'],
  ['02','Application mobile','/services/application-mobile/'],
  ['03','Logiciel métier','/services/logiciel-metier/'],
  ['04','Intelligence artificielle','/services/intelligence-artificielle/'],
];
const steps = [
  {title:'Cadrer',label:'Le plan',copy:'Définir le problème, les usages et le premier périmètre utile.',output:'Périmètre & priorités'},
  {title:'Construire',label:'Le prototype',copy:'Voir le produit prendre forme, tester les parcours et ajuster ensemble.',output:'Prototype & démonstrations'},
  {title:'Livrer',label:'Le produit',copy:'Vérifier la solution, préparer la mise en service et transmettre les clés.',output:'Recette & prise en main'},
];

function stepVisuals() {
  return `
    <div class="ph-scene" data-ph-scene="0">
      <div class="ph-brief"><span>01 / LE CADRAGE</span><strong>Le plan de départ.</strong><ol><li>Usages <b>✓</b></li><li>Priorités <b>✓</b></li><li>Périmètre <b>✓</b></li></ol></div>
    </div>
    <div class="ph-scene" data-ph-scene="1" hidden>
      <div class="ph-window"><div class="ph-window-bar"><i></i><i></i><i></i><span>PROTOTYPE</span></div><div class="ph-wire"><aside></aside><div><b></b><div><i></i><i></i></div><i></i><i></i></div></div></div><span class="ph-scene-chip">↖ À tester</span>
    </div>
    <div class="ph-scene" data-ph-scene="2" hidden>
      <div class="ph-window ph-window-live"><div class="ph-window-bar"><i></i><i></i><i></i><span>VOTRE APPLICATION</span></div><div class="ph-dashboard"><aside></aside><div><strong>Vue d’ensemble</strong><div class="ph-dashboard-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ph-dashboard-row"><i></i><i></i><i></i></div></div></div></div><span class="ph-scene-chip">✓ Prêt à livrer</span>
    </div>`;
}

export function renderHome({icon,button,arrowLink}) {
  return `
  <section class="ph-hero ph-signal" aria-labelledby="ph-title">
    <div class="ph-signal-art" aria-hidden="true">
      <canvas data-signal-field></canvas>
      <svg class="ph-signal-fallback" viewBox="0 0 800 660" fill="none" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="ph-static-ink" x1="130" y1="590" x2="600" y2="50" gradientUnits="userSpaceOnUse"><stop stop-color="#274d42"/><stop offset=".55" stop-color="#84b9a2"/><stop offset="1" stop-color="#e8b584"/></linearGradient></defs><g stroke="url(#ph-static-ink)"><path d="M62 608H180V296a234 234 0 0 1 468 0v312h111"/><path d="M84 584h119V296a211 211 0 0 1 422 0v288h113"/><path d="M103 561h124V296a187 187 0 0 1 374 0v265h115"/><path d="M125 538h126V296a163 163 0 0 1 326 0v242h118"/><path d="M145 515h129V296a140 140 0 0 1 280 0v219h119"/><path d="M168 491h130V296a116 116 0 0 1 232 0v195h121"/><path d="M187 469h134V296a93 93 0 0 1 186 0v173h123"/></g><circle cx="581" cy="228" r="4" fill="#e8b584"/><circle cx="227" cy="438" r="3" fill="#a6d8bf"/><circle cx="625" cy="510" r="3" fill="#a6d8bf"/></svg>
    </div>
    <div class="wrap ph-signal-inner">
      <div class="ph-hero-content">
        <p class="ph-kicker ph-signal-kicker"><i></i> STUDIO PRODUIT & INGÉNIERIE IT</p>
        <h1 id="ph-title"><span class="ph-signal-line">Des talents pour <em>avancer.</em></span><span class="ph-signal-line">Des idées qui <em>prennent vie.</em></span></h1>
        <p class="ph-lead">B&M conçoit vos applications et mobilise les experts IT pour faire avancer vos projets.</p>
        <div class="ph-actions">${button('Parler de mon projet','/contact/?besoin=solution')}${arrowLink('Renforcer mon équipe','#outsourcing')}</div>
      </div>
      <div class="ph-signal-label" aria-hidden="true"><span>+</span><span>FIG. 01<br> SIGNAL FIELD</span></div>
      <div class="ph-signal-dock"><a href="#expertises" class="ph-signal-scroll">${icon('down')}<span>Découvrir nos expertises</span></a><button class="ph-signal-pause" type="button" data-signal-toggle aria-pressed="false" aria-label="Pause du fond animé" hidden><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path class="ph-pause-bars" d="M5.5 3.5v9m5-9v9"/><path class="ph-pause-play" d="m6 3.5 6 4.5-6 4.5z"/></svg><span data-signal-playing>Pause</span><span data-signal-paused hidden>Reprendre</span></button></div>
    </div>
  </section>
  <div class="ph-strip" id="accompagnements"><div class="wrap"><span>CONSEIL & CONCEPTION</span><span>INGÉNIERIE LOGICIELLE</span><span>CONSULTANTS & SQUADS</span></div></div>

  <section class="ph-section ph-expertise" id="expertises" aria-labelledby="ph-expertise-title"><div class="wrap">
    <header class="ph-section-head"><div><p class="ph-kicker">01 / EXPERTISES</p><h2 id="ph-expertise-title">Deux façons<br><em>de faire équipe.</em></h2></div><p>Confiez-nous un produit à réaliser ou intégrez les compétences qui manquent à votre équipe.</p></header>
    <div class="ph-offers">
      <article class="ph-offer ph-offer-product" id="solutions-concretes"><div class="ph-offer-top"><span>01 / PROJET SUR MESURE</span>${icon('layers')}</div><h3>Construire un produit.</h3><p>De la conception à la mise en service, autour de vos usages.</p><div class="ph-service-list" id="nos-services">${services.map(([n,label,href])=>`<a href="${href}"><span aria-hidden="true">${n}</span><strong>${label}</strong>${icon()}</a>`).join('')}</div>${arrowLink('Explorer les solutions','/solutions-sur-mesure/','ph-offer-link')}</article>
      <article class="ph-offer ph-offer-team" id="outsourcing"><div class="ph-offer-top"><span>02 / RENFORT IT</span>${icon('people')}</div><h3>Renforcer une équipe.</h3><p>Un consultant ou une squad, selon le périmètre et le pilotage souhaités.</p><div class="ph-team-lines" id="formats"><div><span>SOLO</span><strong>Une expertise ciblée</strong></div><div><span>SQUAD</span><strong>Des rôles complémentaires</strong></div></div><div class="ph-tags"><span>Fullstack</span><span>Cloud</span><span>Data</span><span>IA</span><span>Produit</span></div>${arrowLink('Découvrir les profils & squads','/profils-et-squads/','ph-offer-link')}</article>
    </div>
  </div></section>

  <section class="ph-section ph-work" id="demonstrations" aria-labelledby="ph-work-title"><div class="wrap">
    <header class="ph-section-head"><div><p class="ph-kicker">02 / DÉMONSTRATIONS</p><h2 id="ph-work-title">Des usages.<br><em>Des interfaces.</em></h2></div>${arrowLink('Voir les projets et démonstrations','/realisations/')}</header>
    <div class="ph-projects">${projects.slice(0,2).map((project,i)=>`<article class="ph-project"><a href="/realisations/${project.slug}/"><div class="ph-project-image ph-project-image-${i}"><span class="ph-project-index">0${i+1} / DÉMO</span><img src="${project.cover.url}" alt="${project.cover.alt}" width="${project.cover.width}" height="${project.cover.height}" loading="lazy" decoding="async"></div><div class="ph-project-details"><div><p class="ph-kicker">${project.category}</p><h3>${project.name}</h3><p>${project.summary}</p></div><span class="ph-circle" aria-hidden="true">${icon()}</span></div></a></article>`).join('')}</div>
    <p class="ph-caption">Concepts illustratifs · données fictives.</p>
  </div></section>

  <section class="ph-section ph-method" id="methode-projet" aria-labelledby="ph-method-title"><div class="wrap">
    <header class="ph-section-head"><div><p class="ph-kicker">03 / MÉTHODE</p><h2 id="ph-method-title">Du brief<br><em>au premier usage.</em></h2></div><p>Un produit se construit avec vous, par étapes courtes et décisions visibles.</p></header>
    <div class="ph-lab" data-ph-lab>
      <div class="ph-lab-visual" aria-hidden="true"><div class="ph-lab-meta"><span>ATELIER B&M</span><span data-ph-number>01 / 03</span></div>${stepVisuals()}<div class="ph-lab-footer"><span data-ph-caption>${steps[0].label}</span><i></i></div></div>
      <div class="ph-lab-steps">${steps.map((step,i)=>`<div class="ph-step" data-ph-step><button type="button" data-ph-trigger="${i}" aria-expanded="${i===0}" aria-controls="ph-step-${i}"><span class="ph-step-index">0${i+1}</span><strong>${step.title}</strong><span class="ph-step-icon" aria-hidden="true">${icon('plus')}</span></button><div class="ph-step-detail" id="ph-step-${i}" ${i===0?'':'hidden'}><p>${step.copy}</p><span>${icon('check')}${step.output}</span></div><span hidden data-ph-label>${step.label}</span></div>`).join('')}${arrowLink('Découvrir notre méthode','/notre-methode/','ph-method-link')}</div>
    </div>
  </div></section>

  <section class="ph-end" id="parlons-en"><div class="wrap ph-end-inner"><div><p class="ph-kicker"><i></i> LE PREMIER ÉCHANGE</p><h2>Qu’est-ce qu’on<br><em>construit ensemble ?</em></h2></div><div><p>Parlez-nous de votre projet ou du rôle qu’il vous manque.</p>${button('Contacter B&M','/contact/')}</div></div></section>`;
}
