import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recrutement - B&M Digital Consulting",
  description: "Pages de candidature B&M Digital Consulting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
