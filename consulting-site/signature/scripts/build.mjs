import {sitemap,sitemapPages,robots,seoConfig,commercialPages,canonicalPath} from '../src/seo.mjs';
import {localiseHTML} from '../src/localization.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {services,servicePage} from '../src/services.mjs';
import {adminPage} from '../src/admin.mjs';
import {portfolioIndex,projectPage,projects,dynamicProjectShell} from '../src/portfolio.mjs';
import {mkdir,writeFile,cp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {layout,home,profiles,solutions,methodPageView,about,contact,legal,eyebrow,button,arrowLink,icon,faq} from '../src/site.mjs';
const root=resolve(import.meta.dirname,'..');
const portfolioAPI={eyebrow,button,arrowLink,icon};
const pages=[
['/gestion-realisations/','Gestion des réalisations','Espace éditorial privé B&M.',adminPage],
['/realisations/projet/','Réalisation B&M','Découvrez le projet.',dynamicProjectShell],
['/','Des talents pour avancer. Des idées qui prennent vie.','Profils, squads, applications et outils métier. B&M relie les bonnes compétences à vos projets digitaux.',home],
['/profils-et-squads/','Les bonnes personnes. Le même cap.','Un profil ciblé ou une squad pour compléter vos compétences et faire avancer votre projet.',profiles],
['/solutions-sur-mesure/','Votre métier a ses règles. Votre outil aussi.','Applications, portails, intégrations et automatisations conçus autour de votre métier.',solutions],
...services.map(service=>['/services/'+service.slug+'/',service.name+' sur mesure',service.description,()=>servicePage(service,{eyebrow,button,arrowLink,icon,faq})]),
['/realisations/','Nos réalisations','Découvrez les modèles de présentation des réalisations B&M.',()=>portfolioIndex(portfolioAPI)],
...projects.map(project=>['/realisations/'+project.slug+'/',project.plainTitle,'Exemple de fiche projet : '+project.category+'.',()=>projectPage(project,portfolioAPI)]),
['/notre-methode/','Notre méthode agile, du cadrage à la mise en service','Cadrage, itérations, responsabilités, démonstrations et livraison : découvrez comment nous organisons votre projet.',methodPageView],
['/a-propos/','Des compétences, des projets et une façon de travailler.','Comprendre B&M : renfort IT, réalisation sur mesure, étapes de collaboration et responsabilités.',about],
['/contact/','Tout commence par un échange.','Décrivez votre besoin de renfort ou votre projet digital.',contact],
...['mentions-legales','confidentialite','cookies'].map(p=>[`/${p}/`,p==='mentions-legales'?'Mentions légales':p==='confidentialite'?'Confidentialité':'Cookies','Informations relatives à cette préproduction B&M.',()=>legal(p)]),
];
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist'),{recursive:true});
await cp(resolve(root,'public/assets'),resolve(root,'dist/assets'),{recursive:true});
await cp(resolve(root,'public/api'),resolve(root,'dist/api'),{recursive:true});
await cp(resolve(root,'public/router.php'),resolve(root,'dist/router.php'));
await cp(resolve(root,'public/.htaccess'),resolve(root,'dist/.htaccess'));
await writeFile(resolve(root,'dist/assets/project-examples.mjs'),'export const projects='+JSON.stringify(projects)+';');
for(const [path,title,description,render] of pages){const dest=resolve(root,'dist',path.slice(1));await mkdir(dest,{recursive:true});await writeFile(resolve(dest,'index.html'),layout({path,title,description,body:render(),dark:!path.startsWith('/services/')&&!path.startsWith('/gestion-realisations/')&&!path.startsWith('/realisations/')&&!['/notre-methode/','/a-propos/','/contact/','/mentions-legales/','/confidentialite/','/cookies/'].includes(path)}));}
await writeFile(resolve(root,'dist/404.html'),layout({path:'/404/',title:'Page introuvable',description:'Retrouvez nos accompagnements.',noindex:true,dark:false,body:'<section class="section paper not-found"><div class="reading"><p class="eyebrow">PETIT DÉTOUR</p><h1>Cette page a pris<br><em>un autre chemin.</em></h1><p>Retrouvez nos accompagnements ou revenez à l’accueil.</p><a class="button button-dark" href="/">Revenir à l’accueil ↗</a></div></section>'}));
const dictionary=JSON.parse(await readFile(resolve(root,'src/locales/en.json'),'utf8'));
await writeFile(resolve(root,'dist/assets/en-translations.js'),'window.BMEnglish='+JSON.stringify(dictionary)+';');
await mkdir(resolve(root,'dist/assets/en'),{recursive:true});
for(const entry of await readdir(resolve(root,'dist/assets'))){if(entry.endsWith('.svg')){const svg=await readFile(resolve(root,'dist/assets',entry),'utf8');await writeFile(resolve(root,'dist/assets/en',entry),localiseHTML(svg,dictionary,'/'))}}
for(const [path] of pages){if(path.startsWith('/gestion-realisations'))continue;const original=await readFile(resolve(root,'dist',path.slice(1),'index.html'),'utf8');const dest=resolve(root,'dist/en',path.slice(1));await mkdir(dest,{recursive:true});await writeFile(resolve(dest,'index.html'),localiseHTML(original,dictionary,path))}
const notFound=await readFile(resolve(root,'dist/404.html'),'utf8');await writeFile(resolve(root,'dist/en/404.html'),localiseHTML(notFound,dictionary,'/404/'));
await writeFile(resolve(root,'dist/robots.txt'),robots());
await writeFile(resolve(root,'dist/sitemap.xml'),sitemap());
await writeFile(resolve(root,'dist/sitemap-pages.xml'),sitemapPages());
await writeFile(resolve(root,'dist/assets/seo-settings.json'),JSON.stringify({...seoConfig(),commercialPaths:Object.keys(commercialPages),version:1}));
console.log(`Built ${pages.length} pages + 404 in ${resolve(root,'dist')}`);
