import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/assets/:path*", destination: "/consulting/assets/:path*" },
        { source: "/api/content.php", destination: `${process.env.BM_CMS_ORIGIN || "http://127.0.0.1:4348"}/api/content.php` },
        { source: "/gestion-realisations", destination: "/consulting/gestion-realisations/index.html" },
        { source: "/", destination: "/consulting/index.html" },
        { source: "/en", destination: "/consulting/en/index.html" },
        ...[
          "profils-et-squads", "solutions-sur-mesure", "realisations",
          "realisations/exemple-web", "realisations/exemple-mobile",
          "services/application-mobile", "services/application-web-saas",
          "services/logiciel-metier", "services/intelligence-artificielle",
          "a-propos", "notre-methode", "contact", "mentions-legales", "confidentialite", "cookies",
        ].flatMap((route) => [
          { source: `/${route}`, destination: `/consulting/${route}/index.html` },
          { source: `/en/${route}`, destination: `/consulting/en/${route}/index.html` },
        ]),
        { source: "/robots.txt", destination: "/consulting/robots.txt" },
      ],
      afterFiles: [
        { source: "/en/realisations/:slug", destination: `${process.env.BM_CMS_ORIGIN || "http://127.0.0.1:4348"}/en/realisations/:slug` },
        { source: "/realisations/:slug", destination: `${process.env.BM_CMS_ORIGIN || "http://127.0.0.1:4348"}/realisations/:slug` },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
