import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/ApplicationForm";
import { OfferChrome } from "@/components/OfferChrome";
import { offers } from "@/lib/offers";

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(offers).map((slug) => ({ slug }));
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = offers[slug];

  if (!offer) {
    notFound();
  }

  return (
    <OfferChrome offer={offer}>
      <ApplicationForm offer={offer} />
    </OfferChrome>
  );
}
