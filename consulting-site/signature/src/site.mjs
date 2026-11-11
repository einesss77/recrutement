import {renderSEO,seoConfig} from './seo.mjs';
import {serviceCatalog,services} from './services.mjs';
import {methodPage} from './method-page.mjs';
import {aboutPage} from './about-page.mjs';
import {deliveryMethod} from './delivery-method.mjs';
import {missionSupport} from './mission-support.mjs';
import {renderHome} from './home.mjs';
import {identity} from './collaboration.mjs';
import {outsourcingSection,profileCatalog} from './outsourcing.mjs';

export const site = {
  name: 'B&M Digital Consulting',
  contactEmail: '',
  canonicalOrigin: seoConfig().origin,
  contactEnabled: false,
};

export const icons = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  right: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  down: '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  code: '<path d="m8 5-7 7 7 7m8-14 7 7-7 7m-3-17-2 20"/>',
  spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};
export const icon=(name='arrow',cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.arrow}</svg>`;
export const arrowLink=(label,href,cls='')=>`<a class="text-link ${cls}" href="${href}"><span>${label}</span>${icon()}</a>`;
export const button=(label,href,kind='primary')=>`<a class="button button-${kind}" href="${href}"><span>${label}</span><span class="button-icon">${icon()}</span></a>`;
export const eyebrow=(text,n='')=>`<p class="eyebrow">${n?`<span class="section-number">${n}</span>`:'<span class="status-dot"></span>'}${text}</p>`;
export const atmosphere=()=>'<div class="atmosphere" aria-hidden="true"><div class="light light-a"></div><div class="light light-b"></div><div class="light light-c"></div><div class="pointer-light"></div><div class="grain"></div><div class="vignette"></div></div>';
const nav=[['/profils-et-squads/','Profils & squads'],['/solutions-sur-mesure/','Solutions sur mesure'],['/realisations/','Réalisations'],['/notre-methode/','Notre méthode'],['/a-propos/','B&M']];
export function header(path){const serviceLinks=services.map(s=>`<a href="/services/${s.slug}/" ${path==='/services/'+s.slug+'/'?'aria-current="page"':''}><strong>${s.name}</strong><span>${s.short==='Mobile'?'iOS & Android':s.short==='IA'?'Assistants & automatisation':s.short==='Métier'?'Processus & intégrations':'Plateformes & espaces clients'}</span></a>`).join('');return `<header class="site-header"><div class="header-inner wrap"><a class="brand" href="/" aria-label="B&M Digital Consulting, accueil"><span class="wordmark">B&M<span>.</span></span><span class="brand-caption">Digital<br>Consulting</span></a><nav class="desktop-nav" aria-label="Navigation principale">${nav.map(([href,label])=>href==='/solutions-sur-mesure/'?`<div class="nav-services"><button type="button" class="nav-services-toggle" aria-expanded="false" aria-controls="desktop-services">Nos services <span aria-hidden="true">⌄</span></button><div class="nav-services-panel" id="desktop-services" hidden>${serviceLinks}<a class="nav-services-all" href="/solutions-sur-mesure/">Tous nos services ↗</a></div></div>`:`<a href="${href}" ${path===href?'aria-current="page"':''}>${label}</a>`).join('')}</nav>${path.startsWith('/gestion-realisations')||path==='/404/'?'':`<nav class="language-switch" aria-label="Langue du site"><a data-locale-link="fr" href="${path}" lang="fr" hreflang="fr" aria-current="page" aria-label="Français">FR</a><a data-locale-link="en" href="/en${path}" lang="en" hreflang="en" aria-label="English">EN</a></nav>`}<a class="header-contact" href="/contact/">Parlons de votre projet<span>${icon()}</span></a><button class="menu-toggle" aria-expanded="false" aria-controls="mobile-navigation">Menu ${icon('plus')}</button></div><nav id="mobile-navigation" class="mobile-nav" aria-label="Navigation mobile" hidden>${[...nav,['/contact/','Parlons de votre projet']].map(([href,label])=>href==='/solutions-sur-mesure/'?`<details class="mobile-service-links"><summary>Nos services ${icon('plus')}</summary>${serviceLinks}<a href="/solutions-sur-mesure/">Tous nos services ↗</a></details>`:`<a href="${href}">${label}${icon()}</a>`).join('')}</nav></header>`}
export const finalCTA=(label='Une idée en tête ?')=>`<section class="closing compact-closing dark" data-atmosphere>${atmosphere()}<div class="wrap closing-inner" data-reveal><h2>${label}<br><em>Parlons-en.</em></h2>${button('Parlons de votre besoin','/contact/')}</div></section>`;
export function footer(){return `<footer class="site-footer dark"><div class="wrap"><div class="footer-top"><a class="brand" href="/"><span class="wordmark">B&M<span>.</span></span><span class="brand-caption">Digital<br>Consulting</span></a><p>Des experts. Des outils.<br><em>Du concret.</em></p><div class="footer-links"><a href="/profils-et-squads/">Profils & squads</a><a href="/solutions-sur-mesure/">Solutions sur mesure</a><a href="/realisations/">Nos réalisations</a><a href="/notre-methode/">Notre méthode</a><a href="/a-propos/">Découvrir B&M</a><a href="/contact/">Contact</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} B&M Digital Consulting</span><div><a href="/mentions-legales/">Mentions légales</a><a href="/confidentialite/">Confidentialité</a><a href="/cookies/">Cookies</a></div><a href="#main" class="back-top">Tout en haut ${icon('arrow')}</a></div></div></footer>`}
export function layout({path,title,description,body,dark=true,noindex=false}){const premium=!path.startsWith('/gestion-realisations/');return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${renderSEO({path,title,description,noindex})}<meta name="theme-color" content="#080a0b"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/fonts.css"><link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/studio.css"><link rel="stylesheet" href="/assets/collaboration.css"><link rel="stylesheet" href="/assets/mission-support.css"><link rel="stylesheet" href="/assets/home-editorial.css"><link rel="stylesheet" href="/assets/delivery-method.css"><link rel="stylesheet" href="/assets/palette.css"><link rel="stylesheet" href="/assets/finishing.css"><link rel="stylesheet" href="/assets/motion-design.css">${path.startsWith('/realisations/')?'<link rel="stylesheet" href="/assets/portfolio.css"><link rel="stylesheet" href="/assets/portfolio-gallery.css">':''}${path==='/'?'<script src="/assets/kinetic-core.js" defer></script><script src="/assets/kinetic-home.js" defer></script>':''}${path==='/notre-methode/'?'<link rel="stylesheet" href="/assets/method-page.css"><script src="/assets/method-page.js" defer></script>':''}${path==='/a-propos/'?'<link rel="stylesheet" href="/assets/about-page.css"><script src="/assets/about-page.js" defer></script>':''}${path.startsWith("/realisations/")&&path!=="/realisations/"?'<link rel="stylesheet" href="/assets/case-study.css">':''}${path.startsWith('/gestion-realisations')?'<link rel="stylesheet" href="/assets/admin.css"><script type="module" src="/assets/admin.mjs"></script>':''}<link rel="stylesheet" href="/assets/brand-signature.css"><link rel="stylesheet" href="/assets/advisory.css">${path==='/'||path==='/solutions-sur-mesure/'||path.startsWith('/services/')?'<link rel="stylesheet" href="/assets/services.css">':''}${path.startsWith('/realisations/')?'<script type="module" src="/assets/portfolio.js"></script>':''}<script src="/assets/site.js" defer></script><script src="/assets/motion-design.js" defer></script><link rel="stylesheet" href="/assets/site-refinements.css"><script src="/assets/site-refinements.js" defer></script>${premium?'<link rel="stylesheet" href="/assets/premium.css">':''}${premium&&path!=='/'&&path!=='/contact/'?'<link rel="stylesheet" href="/assets/premium-interior.css">':''}${path==='/contact/'?'<link rel="stylesheet" href="/assets/premium-contact.css">':''}${premium?'<link rel="stylesheet" href="/assets/kinetic-studio.css">':''}${path==='/'?'<link rel="stylesheet" href="/assets/kinetic-home.css"><link rel="stylesheet" href="/assets/home-atmosphere.css">':premium?'<link rel="stylesheet" href="/assets/studio-interior.css"><script src="/assets/studio-interior.js" defer></script>':''}${path==='/realisations/'?'<link rel="stylesheet" href="/assets/portfolio-index.css"><script type="module" src="/assets/portfolio-index.js"></script>':''}${path==='/notre-methode/'?'<link rel="stylesheet" href="/assets/method-scroll.css">':''}${premium?'<link rel="stylesheet" href="/assets/site-symbols.css">':''}</head><body class="${dark?'starts-dark':'starts-light'}${path==='/'?' home-page':''}${premium?' premium-site':''}"><a class="skip-link" href="#main">Aller au contenu</a>${header(path)}<main id="main">${body}</main>${footer()}</body></html>`}
export const faq=(items)=>`<div class="faq-list">${items.map(([q,a])=>`<details><summary>${q}<span>${icon('plus')}</span></summary><div class="faq-answer"><p>${a}</p></div></details>`).join('')}</div>`;
export const method=(compact=false)=>`<section class="method section ${compact?'compact':''}"><div class="wrap"><div class="section-heading" data-reveal>${eyebrow('NOTRE FAÇON DE FAIRE','04')}<h2>De la première question<br><em>aux premiers usages.</em></h2><p>Des étapes lisibles. Des décisions partagées.<br>Et quelque chose à voir à chaque étape.</p></div><div class="method-grid">${[['01','Cadrer','Poser les bonnes questions avant de chercher les bonnes réponses.','Une direction claire','file'],['02','Concevoir','Dessiner les parcours, tester les idées, faire les choix qui comptent.','Un prototype à discuter','layers'],['03','Construire','Avancer par incréments, montrer, ajuster et vérifier.','Des versions utilisables','code'],['04','Transmettre','Préparer la mise en service et vous donner les clés pour la suite.','Une solution à reprendre','spark']].map(([n,t,d,l,i])=>`<article class="method-item" data-reveal><div class="method-top"><span>${n}</span>${icon(i)}</div><h3>${t}</h3><p>${d}</p><div class="method-output"><span class="mini-dot"></span>${l}</div></article>`).join('')}</div></div></section>`;
export const demo=()=>`<div class="demo" data-demo><div class="demo-header"><span><span class="status-dot"></span> Un document. Une décision.</span><span class="demo-badge">DÉMONSTRATION</span></div><div class="demo-tabs" role="group" aria-label="Étapes de la démonstration"><button data-step="0" aria-current="step"><span>01</span>Recevoir</button><button data-step="1"><span>02</span>Vérifier</button><button data-step="2" disabled><span>03</span>Valider</button></div><div class="demo-workspace"><div class="demo-document">${icon('file')}<span>DOCUMENT REÇU</span><h4>Bon de livraison</h4><div class="document-lines"><i></i><i></i><i></i></div><div class="document-field"><span>Référence</span><strong>CMD-1042</strong></div><div class="document-field"><span>Quantité</span><strong>120 unités</strong></div><span class="document-stamp">Exemple Industrie · Données fictives</span></div><div class="demo-result"><span class="tiny-label" data-demo-label>TOUT COMMENCE ICI</span><h4 data-demo-title>Les bonnes pièces,<br>au même endroit.</h4><p data-demo-copy>Le document rejoint un dossier partagé. Les informations utiles sont rassemblées pour préparer le traitement.</p><div class="demo-warning" data-demo-warning hidden><span class="warning-dot"></span>Référence de dossier manquante</div><button class="demo-complete" data-demo-complete hidden>Compléter avec REF-DEMO-42 ${icon('plus')}</button><button class="demo-next" data-demo-next>Vérifier les informations ${icon('right')}</button><div class="demo-success" data-demo-success hidden>${icon('check')} Validation simulée</div></div></div><div class="demo-footer"><span>Données fictives · Aucun fichier envoyé</span><button data-demo-reset>Recommencer</button></div><p class="sr-only" data-demo-live aria-live="polite"></p></div>`;

export function home(){return renderHome({eyebrow,atmosphere,button,icon,arrowLink,demo,finalCTA,faq})}

const pageHero=({tag,title,description,links='',art='',light=false})=>`<section class="page-hero ${light?'paper':'dark'}" ${light?'':'data-atmosphere'}>${light?'':atmosphere()}<div class="wrap ${art?'page-hero-split':''}"><div>${eyebrow(tag)}<h1>${title}</h1><p>${description}</p><div class="page-hero-actions">${links}</div></div>${art}</div></section>`;
export function profiles(){return `${pageHero({tag:'OUTSOURCING IT · PROFILS & SQUADS',title:'Les bonnes compétences.<br><em>Dans votre équipe.</em>',description:'Développeur fullstack, architecte cloud, data engineer, ingénieur IA ou Product Owner : mobilisez les compétences nécessaires à votre projet, en renfort individuel ou en squad.',links:button('Décrire mon besoin','/contact/?besoin=profil')+arrowLink('Choisir un format','#formats')})}${outsourcingSection({eyebrow,arrowLink,button,icon},false)}${missionSupport({eyebrow,arrowLink})}<section class="section"><div class="wrap questions-grid"><h2>Et en<br><em>pratique ?</em></h2>${faq([['Qui accompagne le consultant pendant la mission ?','Un référent projet B&M est identifié au démarrage. Il accompagne le consultant tout au long de sa mission, échange avec votre interlocuteur et suit les points convenus.'],['Qui pilote les priorités au quotidien ?','Dans une mission de renfort, votre équipe conserve le pilotage opérationnel et la validation des travaux. Pour une squad, les responsabilités de coordination sont définies ensemble avant le démarrage. Le référent B&M assure le suivi de la collaboration.'],['À quelle fréquence se font les points de suivi ?','Le rythme est convenu au démarrage selon le contexte et les besoins de la mission. Les échanges permettent de faire le point sur l’intégration, l’avancement, les difficultés et les actions à engager.'],['Quand peut commencer une mission ?','Le démarrage dépend du besoin, du dispositif et des disponibilités confirmées au moment de votre demande. La composition, la durée et les modalités sont précisées dans la proposition.']])}</div></section>${finalCTA('Quel rôle vous manque ?')}`}

export function solutions(){return `${pageHero({tag:'SOLUTIONS SUR MESURE',title:'Votre métier a ses règles.<br><em>Votre outil aussi.</em>',description:'Une application à imaginer, un portail à construire, un processus à simplifier. Nous partons des usages pour donner forme à une solution qui vous ressemble.',links:button('Parler de mon projet','/contact/?besoin=solution')+arrowLink('Voir un parcours','#en-situation')})}${serviceCatalog({eyebrow,icon})}<section class="section" id="en-situation"><div class="wrap"><div class="split-heading" data-reveal><h2>Des documents à saisir ?<br><em>Préparez la validation.</em></h2><p>Exemple : une équipe reçoit un bon de livraison et doit reporter ses informations dans un dossier. Cet outil rassemble les données, signale une référence manquante et laisse un utilisateur valider. Essayez les trois étapes.</p></div>${demo()}<p class="small-note" style="margin-top:22px">Démonstration illustrative sur des données fictives. Ce parcours présente un usage possible ; il ne s’agit pas d’une réalisation client.</p></div></section>${deliveryMethod({eyebrow,button,arrowLink,icon})}<section class="section paper"><div class="wrap manifesto-grid"><div data-reveal>${eyebrow('LA LIVRAISON N’EST PAS LA FIN')}<h2>Les clés.<br><em>Pas une boîte noire.</em></h2></div><div data-reveal><p class="large-copy">Une solution doit pouvoir vivre après sa première mise en service.</p><ul class="check-list">${['Les parcours et règles de gestion retenus','Le code et la configuration du périmètre livré','Les résultats de recette et les anomalies connues','La documentation utile au déploiement et à l’utilisation','Les modalités de reprise et de maintenance'].map(t=>`<li>${icon('check')}${t}</li>`).join('')}</ul><p class="small-note">Le détail des livrables, des accès et des droits est défini dans la proposition et le contrat.</p></div></div></section><section class="section"><div class="wrap questions-grid"><h2>Avant de<br><em>construire.</em></h2>${faq([['Peut-on intégrer nos outils actuels ?','Nous examinons les accès, les API et les contraintes de votre environnement avant de proposer une architecture.'],['Comment le budget est-il défini ?','Il dépend du périmètre, des intégrations et des contraintes d’exploitation. Le premier échange permet de clarifier ces éléments avant une proposition.'],['Que deviennent les données dans un projet IA ?','Les fournisseurs, l’hébergement et les traitements sont définis au cadrage. Aucun envoi vers un service tiers ne doit se faire sans cadre adapté.'],['Qui maintient la solution ?','La reprise et la maintenance sont organisées selon vos équipes et le dispositif retenu.']])}</div></section>${finalCTA('Et si on simplifiait ça ?')}`}

export function methodPageView(){return methodPage({eyebrow,arrowLink,icon})}
export function about(){return aboutPage({eyebrow,arrowLink,icon})}

export function contact() {
  const companyPage = 'https://www.linkedin.com/company/bandmdigitalconsulting/';
  const profileNames = Object.fromEntries(profileCatalog.map(profile => [profile.slug, profile.name]));
  const serviceNames = Object.fromEntries(services.map(service => [service.slug, service.name]));
  const options = [
    ['solution', 'Un projet sur mesure'],
    ['profil', 'Un consultant IT'],
    ['squad', 'Une équipe dédiée'],
    ['autre', 'Un échange'],
  ];

  return `<section class="contact-page premium-contact section paper">
    <div class="wrap contact-grid">
      <div class="contact-intro">
        ${eyebrow('PREMIER ÉCHANGE')}
        <h1>Parlons de<br><em>votre projet.</em></h1>
        <p>Un objectif, un contexte et une échéance suffisent pour préparer le premier échange.</p>
        <div class="contact-channel">
          <span class="tiny-label">LE CONTACT DIRECT</span>
          ${arrowLink('B&M sur LinkedIn', companyPage)}
        </div>
      </div>
      <div class="contact-form-panel">
        <div class="form-heading">
          <span class="tiny-label">BRIEF PROJET</span>
          <h2>Décrivez votre besoin.</h2>
          <p>Préparez un résumé à partager avec notre équipe.</p>
        </div>
        <form data-contact data-profiles='${JSON.stringify(profileNames)}' data-services='${JSON.stringify(serviceNames)}' novalidate hidden>
          <fieldset>
            <legend>Type d’accompagnement <span aria-hidden="true">*</span></legend>
            <div class="need-options">${options.map(([value, label]) => `<label><input type="radio" name="besoin" value="${value}" required aria-describedby="error-besoin"><span>${label}</span></label>`).join('')}</div>
            <p class="field-error" data-error="besoin" id="error-besoin"></p>
          </fieldset>
          <p class="contact-topic" data-contact-topic hidden></p>
          <div class="contact-message-field">
            <label for="project-message">Votre projet <span aria-hidden="true">*</span></label>
            <textarea id="project-message" name="message" rows="5" minlength="20" maxlength="4000" required placeholder="Votre objectif, votre contexte, l’échéance envisagée…" aria-describedby="error-message"></textarea>
            <span class="field-error" data-error="message" id="error-message"></span>
          </div>
          <div class="form-row">
            <label>Votre nom <span class="optional">facultatif</span>
              <input name="nom" autocomplete="name" maxlength="100">
            </label>
            <label>Votre entreprise <span class="optional">facultatif</span>
              <input name="entreprise" autocomplete="organization" maxlength="150">
            </label>
          </div>
          <button class="button button-dark form-submit" type="submit"><span>Préparer mon brief</span><span class="button-icon">${icon()}</span></button>
          <p class="privacy-note">Le brief est préparé sur votre appareil. <a href="/confidentialite/">Confidentialité</a></p>
          <p class="form-status" aria-live="polite" role="status"></p>
          <div class="contact-brief" data-contact-result hidden>
            <label>Votre brief<textarea data-contact-brief rows="7" readonly></textarea></label>
            <div class="contact-brief-actions">
              <button type="button" class="button button-dark" data-contact-copy>Copier le brief</button>
              <button type="button" class="button contact-download" data-contact-download>Télécharger le brief</button>
            </div>
            ${arrowLink('B&M sur LinkedIn', companyPage)}
          </div>
        </form>
        <noscript><p class="contact-noscript">Retrouvez B&M sur LinkedIn pour présenter votre projet.</p></noscript>
      </div>
    </div>
  </section>`;
}

export function legal(type){const data={
'mentions-legales':['Mentions légales','Ce site présente les services de B&M Digital Consulting, sa méthode et des démonstrations de produits numériques.','Édition et hébergement','Le site est hébergé sur Vercel. Pour toute question concernant son édition, contactez B&M via la page Contact.'],
'confidentialite':['Confidentialité','Le formulaire de contact prépare un brief dans votre navigateur.','Votre brief de projet','Votre saisie reste dans la page ouverte. Rechargez-la pour effacer les champs. Vous pouvez copier ou télécharger le brief pour le partager. Si vous utilisez LinkedIn, ses règles s’appliquent à vos échanges.'],
'cookies':['Cookies','Ce site ne charge aucun outil marketing ou de mesure d’audience et ne dépose aucun cookie applicatif.','Ressources et préférences','Les polices et les ressources sont hébergées avec le site. La préférence de mouvement réduit du système est respectée. L’ajout éventuel de traceurs nécessitera une mise à jour de cette page et, le cas échéant, un dispositif de consentement.']
}[type];return `<section class="legal-page section paper"><div class="reading"><a class="back-link" href="/">← Retour à l’accueil</a>${eyebrow('INFORMATIONS DU SITE')}<h1>${data[0]}</h1><p class="large-copy">${data[1]}</p><h2>${data[2]}</h2><p>${data[3]}</p><p>Version du 25 octobre 2026.</p></div></section>`}
