import type { Metadata } from "next";
import Link from "next/link";
import { offers } from "@/lib/offers";

export const metadata: Metadata = {
  title: "Nos offres de recrutement — B&M Digital Consulting",
  description: "Découvrez les postes proposés par B&M Digital Consulting et déposez votre candidature.",
};

export default function OffersPage() {
  return (
    <main className="site-shell">
      <header className="header">
        <a className="brand" href="/" aria-label="B&M Digital Consulting — accueil">
          {/* Use a normal link to open the standalone B&M homepage. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bm-digital-consulting-logo.png" alt="B&M Digital Consulting" width="190" height="55" />
        </a>
        <a href="/">Retour au site B&M</a>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Recrutement</p>
          <h1>Rejoignez B&M Digital Consulting.</h1>
          <p className="intro">Découvrez nos offres et choisissez le poste qui correspond à votre parcours.</p>
        </div>
      </section>
      <section className="jobs-list" aria-label="Offres de recrutement">
        {Object.values(offers).map((offer) => (
          <article className="offer-panel" key={offer.slug}>
            <h2><Link href={`/${offer.slug}`}>{offer.title}</Link></h2>
            <p>{offer.summary}</p>
            <Link href={`/${offer.slug}`}>Voir l’offre et postuler →</Link>
          </article>
        ))}
      </section>
      <footer className="footer"><a href="/">B&M Digital Consulting</a><Link href="/admin">Administration</Link></footer>
    </main>
  );
}
