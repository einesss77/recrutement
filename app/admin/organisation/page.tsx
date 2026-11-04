import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { planSections } from "@/lib/bmOrganizationPlan";
import styles from "./plan.module.css";
import {renderSlide,strategySlides,overviewIds} from "@/lib/bmStrategyVisual";
import {strategyCss} from "@/lib/bmStrategyStyles";

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
  searchParams: Promise<{ q?: string; vue?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  const { q, vue } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 150) : "";
  const full = vue === "document" || Boolean(query);
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const sections = query ? planSections.filter(section => normalize(section.title + " " + section.content).includes(normalize(query))) : planSections;
  return <main className={styles.shell} id="top">
    <style>{strategyCss}</style>
    <a className={styles.skip} href={full ? "#document" : "#synthese"}>Aller au contenu</a>
    <header className={styles.topbar}>
      <Link href="/admin" className={styles.brand}>B&M<span> / PILOTAGE INTERNE</span></Link>
      <nav aria-label="Administration"><Link href="/admin">Candidatures</Link><Link href="/admin/classement-marketing">Classement marketing</Link><Link href="/studio-social">Studio social</Link></nav>
    </header>
    <div className={styles.hero}>
      <p className={styles.kicker}>EINES & ÉQUIPE · NOVEMBRE 2026 · V2.1</p>
      <h1>B&M,<br /><em>en un coup d’œil.</em></h1>
      <p className={styles.lead}>Qui fait quoi, ce que l’on vend et comment développer l’activité en 90 jours.</p>
      <div className={styles.heroFooter}><span className={styles.badge}>Organisation & objectifs proposés · packs du catalogue</span><a download href="/admin/organisation/document">Télécharger le document complet ↓</a></div>
    </div>
    <nav className="bv bv-tabs" aria-label="Vues du plan directeur">
      <Link href="/admin/organisation" aria-current={!full ? "page" : undefined}>Vue d’ensemble</Link>
      <Link href="/admin/organisation?vue=document" aria-current={full ? "page" : undefined}>Document complet · 13 parties</Link>
      <Link href="/admin/organisation/presentation">Présenter les 14 slides ↗</Link>
      <Link href="/admin/organisation/audit">Comprendre le process audit ↗</Link>
    </nav>
    {!full ? <div className="bv bv-overview" id="synthese">
      <div className="bv-overview-intro"><div><h2>La synthèse pour toute l’équipe</h2><p>Huit vues visuelles pour comprendre l’essentiel. Les objectifs restent à valider ; les tarifs et volumes reprennent les packs déjà définis.</p></div><div className="bv-actions"><Link className="bv-button bv-button-primary" href="/admin/organisation/presentation">Lancer la présentation ↗</Link><a download className="bv-button" href="/admin/organisation/presentation/export?format=pdf">Télécharger le PDF ↓</a><a download className="bv-button" href="/admin/organisation/presentation/export?format=html">Slides hors ligne ↓</a></div></div>
      <nav className="bv-overview-nav" aria-label="Synthèse visuelle">{overviewIds.map(id => <a href={"#resume-" + id} key={id}>{({equipe:"Organigramme",expertises:"Agency",packs:"Packs",catalogue:"Catalogue",acquisition:"Stratégie",objectifs:"Objectifs",roadmap:"90 jours",decisions:"Décisions"} as Record<string,string>)[id]}</a>)}</nav>
      {strategySlides.filter(slide => overviewIds.includes(slide.id)).map(slide => <section id={"resume-" + slide.id} className="bv-frame" key={slide.id} aria-label={slide.title}><div className="bv-slide" dangerouslySetInnerHTML={{__html:renderSlide(slide,strategySlides.indexOf(slide))}} /></section>)}
      <p className="bv-detail-link">Besoin des rôles détaillés, des 13 canaux ou des hypothèses financières ? <Link href="/admin/organisation?vue=document">Ouvrir la référence complète →</Link></p>
    </div> : <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.kicker}>LE PLAN DIRECTEUR</p>
        <form action="/admin/organisation" role="search"><input type="hidden" name="vue" value="document" /><label htmlFor="plan-search">Rechercher dans le plan</label><div className={styles.search}><input id="plan-search" name="q" type="search" maxLength={150} defaultValue={query} placeholder="Rôle, offre, canal…" /><button type="submit" aria-label="Rechercher">→</button></div>{query && <Link href="/admin/organisation?vue=document">Tout afficher</Link>}</form>
        <nav aria-label="Sommaire du plan">{sections.map(section => <a key={section.id} href={"#" + section.id}><span>{section.number}</span>{section.title}</a>)}</nav>
        <p className={styles.sideNote}>Pour Eines, Soheyl, Syrine, Sabrina, Manar, Lorry et Mohamed (IT).</p>
      </aside>
      <article className={styles.document} id="document" aria-label="Plan directeur B&M">
        <aside className={styles.notice}><strong>Référence interne de travail.</strong><p>Organisation, budgets, commissions et objectifs restent à arbitrer. Les packs Digital Start, Digital Growth et Digital 360 remplacent les anciennes fourchettes préparatoires. Les conditions du catalogue s’appliquent.</p></aside>
        {query && <p role="status" className={styles.results}>{sections.length} partie(s) contenant « {query} ».</p>}
        {sections.length === 0 && <div className={styles.empty}><h2>Aucune partie trouvée.</h2><p>Essayez un nom, un outil ou un canal.</p><Link href="/admin/organisation?vue=document">Revenir au plan complet</Link></div>}
        {sections.map(section => <section className={styles.section} id={section.id} key={section.id}>
          <div className={styles.sectionHeading}><span>{section.number}</span><h2>{section.title}</h2><a href="#top" aria-label="Revenir en haut">↑</a></div>
          <Blocks content={section.content} />
        </section>)}
        <footer className={styles.documentFooter}>Référence d’Eines · Version 2.1 · Novembre 2026.<br />Les décisions collectives devront faire l’objet d’une mise à jour explicite.</footer>
      </article>
    </div>}
  </main>;
}
