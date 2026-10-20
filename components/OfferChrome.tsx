/* eslint-disable @next/next/no-html-link-for-pages -- The standalone HTML homepage requires full document navigation. */
import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import type { Offer } from "@/lib/offers";

type OfferChromeProps = {
  offer: Offer;
  children: React.ReactNode;
};

export function OfferChrome({ offer, children }: OfferChromeProps) {
  return (
    <main className="site-shell">
      <header className="header">
        <a className="brand" href="/" aria-label="B&M Digital Consulting — accueil">
          <Image
            src="/brand/bm-digital-consulting-logo.png"
            alt="B&M Digital Consulting"
            width={548}
            height={159}
            priority
          />
        </a>
        <div className="header-note">
          <MapPin size={17} aria-hidden="true" />
          <span>Télétravail ou Tunis</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <BriefcaseBusiness size={18} aria-hidden="true" />
            Recrutement
          </p>
          <h1>{offer.title}</h1>
          <p className="intro">{offer.summary}</p>
          <div className="work-mode">Télétravail ou depuis nos locaux à Tunis</div>
        </div>
      </section>

      <section className="content-grid" aria-label="Détails de l'offre et formulaire">
        <article className="offer-panel">
          <section>
            <h2>Annonce</h2>
            {offer.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section>
            <h2>Missions</h2>
            <ul>
              {offer.missions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Compétences recherchées</h2>
            <ul>
              {offer.skills.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Profil recherché</h2>
            <ul>
              {offer.profile.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="form-panel" aria-label="Formulaire de candidature">
          {children}
        </aside>
      </section>

      <footer className="footer">
        <span>B&M Digital Consulting</span>
        <Link href="/offres">Toutes les offres</Link>
      </footer>
    </main>
  );
}
