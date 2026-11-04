import "server-only";
import { renderSlide, type StrategySlide } from "./bmStrategyVisual";

const note = "Processus cible · Système partiellement existant ; architecture à affiner avec Sabrina.";
export const auditSlides: StrategySlide[] = [
  {id:"audit-cap",kind:"audit",title:"De l’entreprise au rendez-vous",subtitle:"Transformer des observations en une prochaine action commerciale.",note,items:[
    {title:"Observer",text:"Collecter des preuves"},{title:"Comprendre",text:"Repérer les freins"},{title:"Prioriser",text:"Choisir les actions utiles"},{title:"Valider",text:"Relire avant transmission"},{title:"Échanger",text:"Qualifier le besoin réel"},
  ]},
  {id:"audit-parcours",kind:"pipeline",title:"Le parcours complet en 8 étapes",subtitle:"Chaque étape produit un livrable qui alimente la suivante.",note:"Collecte et préparation automatisables. Revue humaine avant transmission commerciale.",items:[
    {title:"Identifier",text:"Une entreprise cible"},{title:"Enrichir",text:"Un dossier de sources"},{title:"Analyser",text:"Des constats documentés"},{title:"Recommander",text:"Des priorités argumentées"},{title:"Relier aux offres",text:"Des prestations adaptées"},{title:"Produire",text:"Rapport + synthèse relus"},{title:"Mettre au CRM",text:"Priorité + prochaine action"},{title:"Prospecter",text:"Relais vers Soheyl / Lorry"},
  ]},
  {id:"audit-entrees",kind:"cards",title:"01–02 · Construire le dossier",subtitle:"Point de départ : un nom, un site ou des coordonnées publiques.",note:"Chaque source conserve son URL et sa date de consultation. Les informations absentes restent signalées.",items:[
    {title:"L’entreprise",tag:"IDENTITÉ",text:"Activité, zone, site et coordonnées publiques. Vérifier que les sources concernent la bonne entreprise."},
    {title:"Sa présence",tag:"POINTS DE CONTACT",text:"Site, réseaux sociaux, fiche Google et avis disponibles : rassembler les éléments observables."},
    {title:"Son contexte",tag:"MARCHÉ",text:"Positionnement, visibilité et concurrents pertinents. Ne pas combler les données manquantes par des suppositions."},
  ]},
  {id:"audit-analyse",kind:"cards",title:"03 · Lire le parcours du client",subtitle:"Trois questions pour rendre l’analyse compréhensible et exploitable.",note:"Analyse selon les données disponibles. Les performances privées ne se déduisent pas de la seule présence publique.",items:[
    {title:"On vous trouve ?",tag:"VISIBILITÉ",text:"SEO, présence locale, réseaux et fréquence de publication. Où l’entreprise est-elle visible ?"},
    {title:"On vous comprend ?",tag:"CONFIANCE",text:"Clarté de l’offre, cohérence graphique, contenus, avis et expérience mobile. La valeur proposée est-elle lisible ?"},
    {title:"On passe à l’action ?",tag:"CONVERSION",text:"Appel, devis, réservation, e-commerce : repérer les frictions. Étudier publicité, automatisation et IA selon les accès disponibles."},
  ]},
  {id:"audit-priorites",kind:"cards",title:"04–05 · Du constat à la solution",subtitle:"Preuve → enjeu → action priorisée → prestation B&M.",note:"Exemple fictif. Impact potentiel, complexité et coût estimé à confirmer ; aucune promesse de résultat.",items:[
    {title:"Le constat",tag:"PREUVE",text:"Sur la page mobile consultée, aucun accès direct au devis n’a été repéré. Conserver l’URL et la date."},
    {title:"La recommandation",tag:"PRIORITÉ À VALIDER",text:"Faciliter le contact avec un bouton visible et un formulaire court. Comparer impact potentiel, complexité et coût estimé."},
    {title:"La prestation",tag:"BUILD · AUTOMATE",text:"Amélioration de la page et du formulaire ; connexion au CRM si utile. Périmètre et coût précisés au devis."},
  ]},
  {id:"audit-validation",kind:"audit",title:"06 · La validation est un vrai passage",subtitle:"Un brouillon généré devient un rapport commercial après contrôle humain.",note:"Répartition proposée : Eines pour le moteur et la technique, Sabrina pour la pertinence marketing. Modalités à confirmer.",items:[
    {title:"Générer",text:"Rapport et synthèse courte"},{title:"Vérifier",text:"Identité, sources et dates"},{title:"Relire",text:"Séparer faits, estimations et hypothèses"},{title:"Corriger",text:"Compléter ou régénérer ; garder l’historique"},{title:"Valider",text:"Autoriser la transmission"},
  ]},
  {id:"audit-livrables",kind:"cards",title:"Deux livrables, deux usages",subtitle:"Le rapport explique. La synthèse ouvre la discussion.",note:"Sources traçables, limites explicites et historique de version. Collecte, accès et conservation des données à encadrer.",items:[
    {title:"Le rapport",tag:"COMPRENDRE",text:"Contexte, sources, constats et recommandations classées par impact potentiel, complexité et coût estimé ; prestations associées."},
    {title:"La synthèse courte",tag:"PRÉPARER LE RENDEZ-VOUS",text:"Les points essentiels, les opportunités prioritaires et les questions à poser. Un support commercial facile à parcourir."},
  ]},
  {id:"audit-commercial",kind:"audit",title:"07–08 · Passer le relais au commercial",subtitle:"Le CRM relie le diagnostic à un responsable et à une prochaine action datée.",note:"Le score de priorité est une aide interne avec des critères explicites, jamais un fait sur l’entreprise. Circuit de transmission à confirmer.",items:[
    {title:"Centraliser",text:"Créer ou actualiser le prospect"},{title:"Préparer",text:"Joindre rapport, priorité et prochaine action"},{title:"Transmettre",text:"Soheyl / Lorry selon qualification"},{title:"Qualifier",text:"Confirmer besoin, budget et calendrier"},{title:"Proposer",text:"Devis adapté, relance et décision au CRM"},
  ]},
  {id:"audit-pilotage",kind:"cards",title:"Le résultat : un audit exploitable",subtitle:"Mesurer la qualité du passage de relais et la progression commerciale.",note:"90 audits exploitables à J90 : objectif proposé, sans garantie. Les conversions d’audits sont incluses dans les signatures globales.",items:[
    {title:"Qualité",tag:"AVANT TRANSMISSION",text:"Sources présentes, limites visibles, recommandations pertinentes et validation humaine. Toute anomalie renvoie le rapport en correction."},
    {title:"Suivi",tag:"APRÈS TRANSMISSION",text:"Audits validés, prospects contactés, rendez-vous, propositions et signatures. Conserver aussi les motifs de refus."},
    {title:"Amélioration",tag:"EINES + SABRINA + COMMERCIAL",text:"Les retours affinent le moteur, les priorités et les offres. Confirmer l’architecture avant industrialisation."},
  ]},
];

export function renderAuditSlide(slide: StrategySlide, index: number) {
  if (slide.kind !== "pipeline") return renderSlide(slide, index);
  const html = renderSlide({...slide,kind:"audit"}, index);
  return html.replace('class="bv-flow "','class="bv-flow ba-pipeline"');
}

export const auditCss = `.ba-pipeline{grid-template-columns:repeat(4,1fr);gap:2.8cqw 2cqw;margin-top:0}.ba-pipeline>li{background:#e4ece1;padding:1.2cqw;border-top:2px solid #6b9476}.ba-pipeline>li:nth-child(n+5){background:#d7e9da}.ba-pipeline>li:before,.ba-pipeline>li:after{display:none}.ba-pipeline h3{margin:.6cqw 0;font-size:1.65cqw}.ba-pipeline p{font-size:1.1cqw}.bv-present-top button.bv-button{color:#173e32}`;
