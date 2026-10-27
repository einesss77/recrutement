# Audit SEO B&M — 27 octobre 2026

## Modifications livrées

- Titres et descriptions propres aux 11 pages commerciales, en français et en anglais.
- H1 des quatre services explicitant mobile, web, logiciel métier et IA, avec traductions associées.
- Canonical unique par page, avec sa propre langue ; hreflang FR/EN réciproques et x-default.
- Données structurées Organization, WebSite, WebPage, BreadcrumbList et Service, sans adresse, avis, chiffre ou engagement inventés.
- Métadonnées Open Graph, cartes de partage FR/EN de 1 200 × 630 px et image de marque.
- Indexation pilotée par l’environnement. Vercel Production indexable ; previews et développement non indexables. Pour un build de production hors Vercel, définir BM_INDEXING=true.
- Admin, aperçus, erreurs, mentions provisoires et démonstrations exclus de l’indexation et des sitemaps.
- `/sitemap.xml` référence les pages commerciales FR/EN et les réalisations véritablement publiées. Les cas marqués test ou fictifs n’y figurent pas.
- Métadonnées, canonical et contenu initial des réalisations produits côté PHP. Les variantes anglaises sans contenu traduit restent non indexables.
- Robots HTTP et balises noindex sur les espaces privés. L’authentification reste le contrôle d’accès ; robots.txt ne sert pas de protection des données.

## Poids des images et ressources

L’image abstraite conserve sa composition, ses dimensions et son texte alternatif. Elle est servie via srcset en WebP :

| Ressource | Poids |
| --- | ---: |
| PNG source | 2 177 620 octets |
| WebP 640 px | 20 764 octets |
| WebP 960 px | 41 612 octets |
| WebP 1 536 px | 99 192 octets |

Les CSS et le module de rendu du portfolio ne sont plus chargés sur la home et les pages services. Les animations demandées sont conservées. Aucun score Lighthouse ou gain de position non mesuré n’est revendiqué.

## Domaine et activation

L’origine par défaut est `https://www.bandmdigitalconsulting.com`, indiquée dans le catalogue. L’URL sans www redirige vers cette variante, mais le site public n’a pas pu être audité intégralement à distance. Une éventuelle autre origine se configure via BM_SITE_URL avant reconstruction.

Configuration d’hébergement :

```env
BM_SITE_URL=https://www.bandmdigitalconsulting.com
BM_INDEXING=true
```

Les paramètres de production doivent être définis avant le build. Le travail local ne constitue ni un déploiement ni une confirmation d’indexation par Google. Après publication, vérifier le domaine et soumettre `/sitemap.xml` dans la propriété Google Search Console appropriée.

Les nouveaux cas clients nécessitent un contenu réel et leur traduction anglaise : les exemples ne sont pas transformés en références clients. Le CMS doit être joignable via BM_CMS_ORIGIN pour alimenter son sitemap.

## Validation effectuée

- Build Next.js de production réussi, TypeScript compris.
- 7 tests Node ciblés : indexation selon l’environnement, origines, exclusion des pages privées/fictives, canonical/hreflang, JSON-LD, sitemaps et métadonnées anglaises.
- Contrôle statique des 37 pages ; vérification SEO détaillée de 22 pages commerciales FR/EN.
- HTTP en mode production : pages commerciales indexables, exemples et admin non indexables, XML servis avec le type adapté, accès direct aux HTML générés non indexable.
- 24 mises en page vérifiées sur ordinateur et mobile, de 320 à 1 440 px, sans débordement ni erreur JavaScript relevés.
- Tests PHP sur données fictives isolées : publication réelle, test, aperçu et absence de traduction. Aucune donnée CMS locale modifiée.
- Préversion locale remise en noindex après les tests de production.

## Références

Les variantes de langue s’appuient sur des hreflang réciproques et des canonicals dans la même langue, conformément à [Google Search Central — versions localisées](https://developers.google.com/search/docs/specialty/international/localized-versions) et aux [recommandations sur les URL canoniques](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

Le sitemap ne contient que les URL canoniques destinées à l’indexation : [Google Search Central — création des sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Les données structurées décrivent uniquement les informations connues : [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) et [BreadcrumbList](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).
