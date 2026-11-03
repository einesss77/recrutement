import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { planSections } from "@/lib/bmOrganizationPlan";
import styles from "./plan.module.css";

export const metadata: Metadata = {
  title: "Organisation & plan 90 jours — B&M",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function Blocks({ content }: { content: string }) {
  const lines = content.trim().split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={i}>{line.slice(4)}</h3>);
    } else if (line.startsWith("|")) {
      const rows: string[][] = [];
      const key = i;
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").slice(1, -1).map(cell => cell.trim()));
        i++;
      }
      i--;
      blocks.push(<div className={styles.tableScroll} key={key} tabIndex={0} role="region" aria-label={rows[0].join(" · ")}>
        <table><caption className={styles.srOnly}>{rows[0].join(" · ")}</caption>
          <thead><tr>{rows[0].map((cell, j) => <th scope="col" key={j}>{cell}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>);
    } else if (line.startsWith("- ")) {
      const items = [];
      const key = i;
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(lines[i].slice(2)); i++; }
      i--;
      blocks.push(<ul key={key}>{items.map((item, j) => <li key={j}>{item}</li>)}</ul>);
    } else {
      blocks.push(<p key={i}>{line}</p>);
    }
  }
  return <>{blocks}</>;
}

export default async function OrganizationPage({ searchParams }: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 150) : "";
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const sections = query ? planSections.filter(section => normalize(section.title + " " + section.content).includes(normalize(query))) : planSections;
  return <main className={styles.shell} id="top">
    <a className={styles.skip} href="#document">Aller au document</a>
    <header className={styles.topbar}>
      <Link href="/admin" className={styles.brand}>B&M<span> / PILOTAGE INTERNE</span></Link>
      <nav aria-label="Administration"><Link href="/admin">Candidatures</Link><Link href="/admin/classement-marketing">Classement marketing</Link><Link href="/studio-social">Studio social</Link></nav>
    </header>
    <div className={styles.hero}>
      <p className={styles.kicker}>DIRECTION & ÉQUIPE · NOVEMBRE 2026 · V2.0</p>
      <h1>Une organisation.<br /><em>Un cap commun.</em></h1>
      <p className={styles.lead}>Plan directeur d’organisation, d’acquisition et de développement commercial de B&M Digital Consulting.</p>
      <div className={styles.heroFooter}><span className={styles.badge}>Document préparatoire · à discuter</span><a href="/admin/organisation/document">Télécharger la référence ↓</a></div>
    </div>
    <section className={styles.metrics} aria-label="Ambitions proposées à 90 jours">
      <div><span>HORIZON DE TRAVAIL</span><strong>90 jours</strong><p>J1 reste à définir collectivement.</p></div>
      <div><span>OBJECTIF AGENCY</span><strong>8–10 clients</strong><p>Signatures cumulées, sans garantie.</p></div>
      <div><span>AMBITION MENSUELLE</span><strong>7 200–12 000 €</strong><p>Si tous les contrats sont actifs et récurrents.</p></div>
      <div><span>DEUX BRANCHES</span><strong>Agency / IT</strong><p>Pipelines séparés, pilotage centralisé.</p></div>
    </section>
    <aside className={styles.notice}><strong>Une base de discussion, pas des décisions acquises.</strong><p>Prix, budgets, commissions, outils et répartition des responsabilités restent à valider. Les objectifs affichés ne représentent pas les résultats réalisés. Les rémunérations et informations internes sont réservées à cet espace administrateur.</p></aside>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.kicker}>LE PLAN DIRECTEUR</p>
        <form action="/admin/organisation" role="search"><label htmlFor="plan-search">Rechercher dans le plan</label><div className={styles.search}><input id="plan-search" name="q" type="search" maxLength={150} defaultValue={query} placeholder="Rôle, offre, canal…" /><button type="submit" aria-label="Rechercher">→</button></div>{query && <Link href="/admin/organisation">Tout afficher</Link>}</form>
        <nav aria-label="Sommaire du plan">{sections.map(section => <a key={section.id} href={`#${section.id}`}><span>{section.number}</span>{section.title}</a>)}</nav>
        <p className={styles.sideNote}>Pour la direction, Soheyl, Syrine, Sabrina, Manar, Lorry et Mohamed (IT).</p>
      </aside>
      <article className={styles.document} id="document" aria-label="Plan directeur B&M">
        {query && <p role="status" className={styles.results}>{sections.length} partie(s) contenant « {query} ».</p>}
        {sections.length === 0 && <div className={styles.empty}><h2>Aucune partie trouvée.</h2><p>Essayez un nom, un outil ou un canal d’acquisition.</p><Link href="/admin/organisation">Revenir au plan complet</Link></div>}
        {sections.map(section => <section className={styles.section} id={section.id} key={section.id}>
          <div className={styles.sectionHeading}><span>{section.number}</span><h2>{section.title}</h2><a href="#top" aria-label="Revenir en haut">↑</a></div>
          <Blocks content={section.content} />
        </section>)}
        <footer className={styles.documentFooter}>Référence initiale fournie par la direction · Version 2.0 · Novembre 2026.<br />Les évolutions et décisions validées devront faire l’objet d’une mise à jour explicite de cette référence.</footer>
      </article>
    </div>
  </main>;
}
