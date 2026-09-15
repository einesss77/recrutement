import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Mail, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { offers } from "@/lib/offers";

type SuccessPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(offers).map((slug) => ({ slug }));
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { slug } = await params;
  const offer = offers[slug];

  if (!offer) {
    notFound();
  }

  return (
    <main className="site-shell success-shell">
      <header className="header">
        <Link className="brand" href={`/${offer.slug}`} aria-label="B&M Digital Consulting">
          <Image
            src="/brand/bm-digital-consulting-logo.png"
            alt="B&M Digital Consulting"
            width={548}
            height={159}
            priority
          />
        </Link>
        <div className="header-note">
          <MapPin size={17} aria-hidden="true" />
          <span>Télétravail ou Tunis</span>
        </div>
      </header>

      <section className="success-panel">
        <div className="success-icon">
          <CheckCircle2 size={34} aria-hidden="true" />
        </div>
        <p className="eyebrow">Candidature envoyée</p>
        <h1>Merci pour votre candidature.</h1>
        <p className="intro">
          Votre candidature au poste de {offer.title} a bien été prise en compte.
          Notre équipe recrutement reviendra vers vous si votre profil correspond à la suite du processus.
        </p>
        <div className="success-note">
          <Mail size={18} aria-hidden="true" />
          <span>Aucun e-mail de confirmation candidat n’est envoyé pour le moment.</span>
        </div>
        <Link className="secondary-action" href={`/${offer.slug}`}>
          Revenir à l’offre
        </Link>
      </section>

      <footer className="footer">
        <span>B&M Digital Consulting</span>
        <span>Recrutement</span>
      </footer>
    </main>
  );
}
