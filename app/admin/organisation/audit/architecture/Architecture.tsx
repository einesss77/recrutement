"use client";

import { useState } from "react";
import Link from "next/link";
import { agents, infrastructure, process, scenarios, type Agent } from "./data";
import s from "./architecture.module.css";

const groups = ["Découvrir", "Collecter", "Analyser", "Décider", "Valider", "Livrer"];
const navigation = [["carte", "La carte"], ["agents", "Les agents"], ["process", "Le process"], ["humain", "L’humain"], ["infra", "L’infrastructure"], ["fiabilite", "La fiabilité"]];

function Heading({ index, title, text }: { index: string; title: string; text: string }) {
  return <header className={s.sectionHead}><span className={s.sectionIndex}>{index}</span><div><h2>{title}</h2><p>{text}</p></div></header>;
}

function AgentSheet({ agent, active }: { agent: Agent; active: boolean }) {
  const index = agents.indexOf(agent) + 1;
  return <article id={"fiche-" + agent.id} className={s.agentSheet} data-active={active} aria-labelledby={"titre-" + agent.id}>
    <header className={s.agentHeading}><span className={s.eyebrow}>AGENT {String(index).padStart(2, "0")} / {agent.group.toUpperCase()}</span><h3 id={"titre-" + agent.id}>{agent.name}</h3><p>{agent.mission}</p></header>
    <div className={s.io}><div><span>CE QU’IL REÇOIT</span><p>{agent.input}</p></div><div><span>CE QU’IL PRODUIT</span><p>{agent.output}</p></div></div>
    <h4>Ses compétences</h4><ul className={s.skillList}>{agent.skills.map(([name, text]) => <li key={name}><span aria-hidden="true">↳</span><div><strong>{name}</strong><p>{text}</p></div></li>)}</ul>
    <h4>Ses outils</h4><div className={s.tags}>{agent.tools.map(tool => <span key={tool}>{tool}</span>)}</div>
    <div className={s.humanBox}><span className={s.eyebrow}>PASSAGE À L’HUMAIN</span><strong>Quand il bloque</strong><p>{agent.blocker}</p><strong>Ce que tu peux faire</strong><p>{agent.human}</p></div>
    <div className={s.agentLimit}><strong>Sa limite</strong><p>{agent.limit}</p></div>
    <footer className={s.agentNext}><span>PASSAGE DE RELAIS</span><strong>{agent.next} <span aria-hidden="true">↗</span></strong></footer>
  </article>;
}

function HumanSimulation() {
  const [scenarioId, setScenarioId] = useState("instagram");
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const scenario = scenarios.find(item => item.id === scenarioId)!;
  const choice = scenario.choices.find(item => item.id === choiceId);
  const needsLink = scenarioId === "instagram" && choiceId === "link";
  const resolved = Boolean(choice && (!needsLink || submitted));
  function changeScenario(value: string) { setScenarioId(value); setChoiceId(null); setLink(""); setSubmitted(false); setError(""); }
  function provideLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const url = new URL(link);
      if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname) || !/^\/[A-Za-z0-9._]+\/?$/.test(url.pathname) || url.username || url.password) throw new Error("invalid");
      setSubmitted(true); setError("");
    } catch { setError("Saisis un lien de compte Instagram en HTTPS, par exemple https://www.instagram.com/exemple/."); }
  }
  return <div className={s.simulation}>
    <div className={s.scenarioPicker}><label htmlFor="audit-scenario">Choisis un cas de blocage</label><select id="audit-scenario" value={scenarioId} onChange={event => changeScenario(event.target.value)}>{scenarios.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><span className={s.simLabel}>Simulation pédagogique · aucune connexion ni collecte réelle</span></div>
    <div className={s.simGrid}>
      <div className={s.decisionCard}>
        <span className={s.eyebrow}>LE SYSTÈME TE SOLLICITE</span><h3>{scenario.question}</h3><p>{scenario.attempts}</p><div className={s.scope}><strong>Ce qui attend / ce qui continue</strong><p>{scenario.scope}</p></div>
        <div className={s.choiceList}>{scenario.choices.map(item => <button key={item.id} type="button" aria-pressed={choiceId === item.id} onClick={() => { setChoiceId(item.id); setSubmitted(false); setError(""); }}><span>{item.label}</span><span aria-hidden="true">{choiceId === item.id ? "●" : "↗"}</span></button>)}</div>
        {needsLink && !submitted && <form onSubmit={provideLink} className={s.linkForm} noValidate><label htmlFor="instagram-link">Lien de compte à simuler</label><input id="instagram-link" type="url" value={link} onChange={event => setLink(event.target.value)} placeholder="https://www.instagram.com/exemple/" autoComplete="off" /><button type="submit" className={s.primaryButton}>Voir la reprise →</button></form>}
        {error && <p className={s.error} role="alert">{error}</p>}
      </div>
      <div className={s.resumeCard} aria-live="polite">
        <span className={s.eyebrow}>APRÈS TA RÉPONSE</span><h3>{resolved ? choice!.status : needsLink ? "Le système attend le lien" : "Une réponse, une reprise ciblée"}</h3>
        {resolved ? <><dl className={s.resultSteps}><div><dt>01 · Décision enregistrée</dt><dd>{choice!.action}</dd></div><div><dt>02 · Reprise du travail</dt><dd>{choice!.resume}</dd></div><div><dt>03 · Conséquence sur le rapport</dt><dd>{choice!.report}</dd></div></dl><div className={s.savedWork}><strong>Règle de reprise</strong><p>Les résultats indépendants restent conservés. Seules les dépendances affectées sont recalculées. Une nouvelle version doit être relue.</p></div></> : <><div className={s.resumeIllustration} aria-hidden="true"><span>Travail acquis <b>✓</b></span><span>Branche bloquée <b>…</b></span><span>Ta décision <b>↳</b></span></div><p>{needsLink ? "Fournir un lien permettra de montrer les étapes à reprendre. L’identité du compte et son accessibilité resteront à vérifier." : "Choisis une réponse à gauche pour voir l’état enregistré, les étapes relancées et la formulation autorisée dans le rapport."}</p></>}
      </div>
    </div>
    <div className={s.statusStrip}><span><b>Introuvable</b> Recherche sans résultat fiable</span><span><b>Absent déclaré</b> Information fournie par un humain</span><span><b>Inaccessible</b> Compte connu, données bloquées</span><span><b>Inconnu</b> Aucune conclusion possible</span></div>
  </div>;
}

export default function Architecture() {
  const [activeAgent, setActiveAgent] = useState("identite");
  function selectAgent(id: string) { setActiveAgent(id); }
  const agentLink = (id: string, label: string, detail: string) => <a href="#agents" onClick={() => selectAgent(id)} className={s.flowNode}><strong>{label}</strong><span>{detail}</span><small>Voir l’agent ↗</small></a>;
  return <main className={s.shell}>
    <a className={s.skip} href="#carte">Aller à l’architecture</a>
    <header className={s.topbar}><Link href="/admin/organisation" className={s.brand}>B&M<span>LE SYSTÈME D’AUDIT</span></Link><div className={s.topLinks}><Link href="/admin/organisation">Organisation</Link><Link href="/admin/organisation/audit">Présentation audit ↗</Link><button type="button" onClick={() => window.print()}>Imprimer / PDF ↓</button></div></header>
    <div className={s.hero}><div><span className={s.eyebrow}>ARCHITECTURE AGENTIQUE / DOCUMENT DE CONCEPTION</span><h1>Un audit qui avance.<br /><em>Un humain qui décide.</em></h1><p>De l’entreprise au rapport commercial : comprendre chaque agent, ce qu’il sait faire, ses outils et les moments où il a besoin de toi.</p><div className={s.heroActions}><a href="#carte" className={s.primaryButton}>Explorer le système ↓</a><a href="#humain" className={s.secondaryButton}>Tester un blocage ↗</a></div></div><div className={s.heroDiagram} aria-label="Trois responsabilités : cadrer, exécuter et valider"><div><span>01 / TOI</span><strong>Tu donnes le cap.</strong><small>Entreprise · objectif · périmètre</small></div><i aria-hidden="true">↓</i><div><span>02 / LE SYSTÈME</span><strong>Les agents travaillent.</strong><small>Collecter · analyser · recommander</small></div><i aria-hidden="true">↓</i><div><span>03 / L’ÉQUIPE</span><strong>Tu gardes la décision.</strong><small>Compléter · arbitrer · valider</small></div></div></div>
    <div className={s.introStrip}><span><strong>{agents.length}</strong> agents spécialisés</span><span><strong>1</strong> orchestrateur durable</span><span><strong>{scenarios.length}</strong> cas humains à explorer</span><span className={s.designStatus}>Architecture cible · moteur à construire</span></div>
    <nav className={s.sectionNav} aria-label="Explorer l’architecture">{navigation.map(([id, label], index) => <a href={"#" + id} key={id}><span>{String(index + 1).padStart(2, "0")}</span>{label}</a>)}</nav>
    <div className={s.content}>
      <section id="carte" className={s.section}>
        <Heading index="01" title="La carte du système" text="Lis de haut en bas. Les branches collectent en parallèle ; toutes alimentent le même dossier de preuves." />
        <div className={s.systemMap}>
          <div className={s.mapEntry}><span className={s.miniLabel}>ENTRÉE</span><strong>Nom + ville + site éventuel + objectif</strong><span>Audit public ou données client connectées</span></div>
          <div className={s.downArrow} aria-hidden="true">↓</div>
          <div className={s.mapPreparation}>{agentLink("identite", "Identifier la bonne entreprise", "Un doute sur la cible ? Tu confirmes.")}<span aria-hidden="true">→</span>{agentLink("decouverte", "Trouver ses canaux", "Site, comptes sociaux et présence locale")}</div>
          <div className={s.downArrow} aria-hidden="true">↓</div>
          <div className={s.orchestrator}><div><span className={s.miniLabel}>ORCHESTRATEUR / TEMPORAL</span><strong>Planifier · distribuer · attendre · reprendre</strong><p>Il conserve l’état, les dépendances et le budget. Les décisions du workflow sont définies dans le code.</p></div><a href="#humain">Une information manque ?<br /><strong>Boîte de décisions humaines ↗</strong></a></div>
          <div className={s.parallelLabel}>↓ <span>BRANCHES EN PARALLÈLE</span> ↓</div>
          <div className={s.branchGrid}>{agentLink("collecte", "Site web", "Collecte → technique & SEO → UX")}{agentLink("social", "Réseaux sociaux", "Comptes → contenus → diagnostic")}{agentLink("local", "Présence locale", "Établissement → cohérence → réputation")}{agentLink("concurrence", "Concurrence", "Candidats → comparaison → positionnement")}{agentLink("analytics", "Données connectées", "Accès client → mesures → acquisition")}</div>
          <div className={s.mapMerge}><span aria-hidden="true">↓</span><div><span className={s.miniLabel}>MÉMOIRE COMMUNE</span><strong>Sources → preuves → constats</strong><span>Identité · date · périmètre · limites · provenance</span></div><span aria-hidden="true">↓</span></div>
          <div className={s.finalFlow}>{agentLink("strategie", "Prioriser", "Stratégie + catalogue B&M")}<span aria-hidden="true">→</span>{agentLink("qualite", "Vérifier", "Qualité + rédaction")}<span aria-hidden="true">→</span><a className={s.humanNode} href="#humain"><span className={s.miniLabel}>HUMAIN</span><strong>Approuver la version</strong><span>Corriger ou valider</span></a><span aria-hidden="true">→</span>{agentLink("livraison", "Livrer", "Rapport + synthèse + CRM")}</div>
        </div>
        <div className={s.modeGrid}><article><span className={s.miniLabel}>MODE 01</span><h3>Audit prospect public</h3><p>Présence et parcours visibles, contenus accessibles, mesures publiques et limites explicites.</p><strong>Les statistiques privées restent non évaluées.</strong></article><article><span className={s.miniLabel}>MODE 02</span><h3>Audit client connecté</h3><p>Même socle, enrichi avec les outils et exports que le client autorise effectivement.</p><strong>Les conclusions suivent les permissions et données obtenues.</strong></article></div>
      </section>

      <section id="agents" className={s.section}>
        <Heading index="02" title="Chaque agent, en détail" text="Sélectionne un agent : sa mission, ses compétences, ses outils, ses livrables et son passage à l’humain." />
        <p className={s.smallNote}>Les compétences ci-dessous définissent les skills métier à implémenter. Elles décrivent la conception proposée et ne sont pas des intégrations déjà actives.</p>
        <div className={s.agentExplorer}><nav className={s.agentList} aria-label="Choisir un agent">{groups.map(group => <div key={group}><span className={s.agentGroup}>{group}</span>{agents.filter(agent => agent.group === group).map(agent => <button type="button" key={agent.id} onClick={() => selectAgent(agent.id)} aria-pressed={activeAgent === agent.id} aria-controls={"fiche-" + agent.id}><span>{String(agents.indexOf(agent) + 1).padStart(2, "0")}</span>{agent.name}<b aria-hidden="true">↗</b></button>)}</div>)}</nav><div className={s.agentDetails}>{agents.map(agent => <AgentSheet agent={agent} active={activeAgent === agent.id} key={agent.id} />)}</div></div>
      </section>

      <section id="process" className={s.section}>
        <Heading index="03" title="Le process, du début à la fin" text="Chaque étape a un résultat attendu. Les validations humaines sont visibles dans le parcours." />
        <ol className={s.timeline}>{process.map((step, index) => <li key={step.name}><span className={s.timelineNumber}>{String(index + 1).padStart(2, "0")}</span><div><span className={s.eyebrow}>{step.agent}</span><h3>{step.name}</h3><p>{step.work}</p><div className={s.stepResult}><strong>Livrable</strong><span>{step.result}</span></div><div className={s.checkpoint}><span aria-hidden="true">↳</span><p><strong>Intervention humaine</strong> {step.gate}</p></div></div></li>)}</ol>
      </section>

      <section id="humain" className={s.section}>
        <Heading index="04" title="Quand le système a besoin de toi" text="Teste une réponse. Tu vois ce que le système enregistre, ce qu’il reprend et ce qu’il peut écrire dans le rapport." />
        <HumanSimulation />
        <div className={s.humanRules}><article><span>UNE QUESTION COMPLÈTE</span><h3>Tu sais pourquoi tu interviens.</h3><p>Entreprise, recherches déjà faites, preuves, choix possibles, branche affectée, responsable et échéance.</p></article><article><span>UNE DÉCISION TRAÇABLE</span><h3>Ta réponse a une portée précise.</h3><p>Auteur, date, question et version. Une réponse à une ancienne identité ne reprend pas un nouvel audit.</p></article><article><span>UNE ATTENTE MAÎTRISÉE</span><h3>Le silence ne vaut pas accord.</h3><p>Après échéance : limite explicite pour un point facultatif ; maintien du blocage pour une décision indispensable.</p></article></div>
      </section>

      <section id="infra" className={s.section}>
        <Heading index="05" title="Où tourne chaque composant" text="L’interface reste sur ton site. Les traitements longs tournent dans des workers séparés ; les décisions et les preuves sont persistées." />
        <div className={s.infraStack}>{infrastructure.map((layer, index) => <article key={layer.layer}><div className={s.infraLabel}><span>{String(index + 1).padStart(2, "0")} / {layer.layer.toUpperCase()}</span><h3>{layer.title}</h3></div><div className={s.infraItems}>{layer.items.map(item => <div key={item.name}><h4>{item.name}</h4><p>{item.role}</p></div>)}</div></article>)}</div>
        <div className={s.infraFoot}><div><strong>Frontière de confiance</strong><p>Web et documents externes sont traités comme des données non fiables. Leurs instructions ne peuvent pas changer les règles ni obtenir des secrets.</p></div><div><strong>Répartition claire</strong><p>Temporal pilote. PostgreSQL conserve le métier. S3 conserve les documents autorisés. n8n peut connecter les outils périphériques.</p></div></div>
      </section>

      <section id="fiabilite" className={s.section}>
        <Heading index="06" title="Ce qui rend le système fiable" text="Un audit doit rester explicable, reprendre après une panne et conserver ses limites jusqu’au rapport final." />
        <div className={s.reliabilityGrid}>
          <article><span>01 / PREUVES</span><h3>Chaque conclusion a une origine.</h3><p>URL ou document, date, méthode, périmètre observé et limites. La conservation suit les règles de chaque fournisseur.</p></article>
          <article><span>02 / REPRISE CIBLÉE</span><h3>Une correction ne relance pas tout.</h3><p>Nouveau lien Instagram → vérification → collecte sociale → analyse → synthèse. Les résultats web indépendants restent valides.</p></article>
          <article><span>03 / VERSION</span><h3>Une validation concerne un contenu précis.</h3><p>Code, modèle, instructions, grilles, catalogue et données sont référencés. Un rapport modifié revient en validation.</p></article>
          <article><span>04 / PANNES</span><h3>Réessayer sans créer de doublons.</h3><p>Délais maximums, reprises limitées, clés d’idempotence et réconciliation des écritures incertaines. Le journal d’exécution conserve les tentatives.</p></article>
          <article><span>05 / BUDGET</span><h3>La dépense a une limite.</h3><p>Plafonds par audit et campagne ; réservations avant appels. Bornes sur pages, requêtes, images, tokens et cycles de correction.</p></article>
          <article><span>06 / CONTRÔLE HUMAIN</span><h3>Un modèle ne s’auto-certifie pas.</h3><p>Assertions sans preuve retirées ou qualifiées. Désaccords importants soumis au relecteur. Aucun envoi implicite depuis un brouillon.</p></article>
        </div>
        <div className={s.qualityDimensions}><h3>Quatre dimensions séparées</h3><div><span><b>Fiabilité</b> Solidité de la preuve</span><span><b>Couverture</b> Part réellement examinée</span><span><b>État observé</b> Qualités et problèmes constatés</span><span><b>Priorité</b> Action à traiter en premier</span></div><p>Inconnu ne veut pas dire mauvais. Un contrôle non réalisé reste visible dans la couverture ; seul un contrôle non applicable justifié est exclu du périmètre.</p></div>
        <details className={s.technicalDetails}><summary>Voir le registre de données et les règles d’exploitation <span aria-hidden="true">＋</span></summary><div><h3>Les objets à conserver</h3><p>Entreprise → audit → canaux → sources et preuves → observations → constats → recommandations → rapport et approbation. Les tâches humaines, décisions, exécutions, coûts et livraisons possèdent leur propre historique.</p><h3>Les règles de reprise</h3><p>Chaque résultat référence ses entrées. Une correction invalide seulement ses descendants. Une décision enregistrée est transmise au workflow par un mécanisme transactionnel avec nouvelle tentative ; les réponses en double et obsolètes sont détectées.</p><h3>Les protections</h3><p>Droits par rôle et client, URL et redirections contrôlées, destinations privées bloquées, secrets hors prompts, jetons masqués dans les traces et liens documentaires temporaires. Accès et autorisation sont revérifiés au moment d’une action externe.</p><h3>L’exploitation</h3><p>Développement, préproduction et production séparés. Migrations compatibles, workers versionnés, sauvegardes avec restauration testée, alertes sur erreurs et budgets, arrêt d’urgence des collectes ou transmissions.</p><h3>La capacité</h3><p>Files séparées pour navigateur, analyse, PDF et intégrations ; limites par domaine et fournisseur. Le dimensionnement et le coût par audit validé se mesurent sur un pilote représentatif avant montée en charge.</p><h3>Les sources techniques</h3><ul><li><a href="https://docs.temporal.io/workflow-execution" target="_blank" rel="noreferrer">Temporal · exécution durable ↗</a></li><li><a href="https://docs.temporal.io/develop/typescript/workflows/message-passing" target="_blank" rel="noreferrer">Temporal · réponses et reprise par messages ↗</a></li><li><a href="https://developers.google.com/speed/docs/insights/v5/about" target="_blank" rel="noreferrer">PageSpeed · mesures de laboratoire et données réelles ↗</a></li><li><a href="https://developers.google.com/maps/documentation/places/web-service/policies" target="_blank" rel="noreferrer">Google Places · conservation et attribution ↗</a></li><li><a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html" target="_blank" rel="noreferrer">AWS · exécution des conteneurs ↗</a></li></ul></div></details>
      </section>
      <section className={s.buildOrder} aria-label="Ordre de construction"><span className={s.eyebrow}>ORDRE DE CONSTRUCTION PROPOSÉ</span><h2>Faire fonctionner le parcours.<br /><em>Puis l’approfondir.</em></h2><div>{[["1", "Le socle", "Identité, site, Instagram, preuves, décisions et rapport relu."], ["2", "La profondeur", "SEO, local, concurrence, vision et catalogue B&M."], ["3", "Les données réelles", "Connexions client, exports et performances internes."], ["4", "Le volume", "Campagnes, quotas partagés, capacité et suivi qualité."]].map(([n, title, text]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    </div>
    <footer className={s.footer}><strong>B&M / Architecture des audits IA</strong><span>Conception proposée · Novembre 2026 · Cette page explique le système à construire.</span><a href="#top" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Retour en haut ↑</a></footer>
  </main>;
}
