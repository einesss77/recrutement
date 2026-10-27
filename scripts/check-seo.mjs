import {readFile,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {commercialPages,canonicalPath,canIndex} from '../consulting-site/signature/src/seo.mjs';

const root=new URL('../public/consulting/',import.meta.url);
const settings=JSON.parse(await readFile(new URL('assets/seo-settings.json',root),'utf8'));
const titles=new Set();
for(const path of Object.keys(commercialPages))for(const locale of ['fr','en']){
 const directory=locale==='en'?'en'+path:path.slice(1);
 const html=await readFile(new URL(directory.replace(/^\//,'')+'index.html',root),'utf8');
 const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
 assert(title&&!titles.has(title),`Distinct title: ${locale} ${path}`);titles.add(title);
 const robots=html.match(/<meta name="robots" content="([^"]*)"/)?.[1];
 assert.equal(robots,settings.indexing?'index,follow,max-image-preview:large':'noindex,follow');
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.ok(html.includes(`rel="canonical" href="${settings.origin}${canonicalPath(path,locale)}"`));
 for(const language of ['fr','en'])assert.ok(html.includes(`hreflang="${language}" href="${settings.origin}${canonicalPath(path,language)}"`));
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1]||'{}');
 assert.equal(graph['@context'],'https://schema.org');
 assert.ok(graph['@graph'].some(item=>item.inLanguage===locale));
 const image=html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
 assert.equal(image,`${settings.origin}/assets/opengraph-${locale}.png`);
 assert.ok((await stat(new URL(`assets/opengraph-${locale}.png`,root))).size>1000);
}
const xml=await readFile(new URL('sitemap-pages.xml',root),'utf8');
const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
assert.equal(locations.length,settings.indexing?Object.keys(commercialPages).length*2:0);
for(const url of locations){assert(url.startsWith(settings.origin));assert(canIndex(new URL(url).pathname));}
for(const path of ['gestion-realisations/','realisations/exemple-web/','en/realisations/exemple-mobile/','realisations/projet/']){
 const html=await readFile(new URL(path+'index.html',root),'utf8');assert.match(html,/content="noindex,follow"/);
}
const robotFile=await readFile(new URL('robots.txt',root),'utf8');
if(settings.indexing)assert.ok(robotFile.includes(`Sitemap: ${settings.origin}/sitemap.xml`));else assert.match(robotFile,/Disallow: \/\n/);
console.log(`SEO passed: ${titles.size} FR/EN commercial pages, canonical URLs, hreflang, JSON-LD, social images and sitemap policy.`);
