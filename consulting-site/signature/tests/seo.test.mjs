import test from 'node:test';
import assert from 'node:assert/strict';
import {seoConfig,renderSEO,canIndex,canonicalPath,sitemap,sitemapPages,robots,commercialPages} from '../src/seo.mjs';
import {localiseHTML} from '../src/localization.mjs';

const production={origin:'https://seo.example',indexing:true};
test('preview builds cannot enable indexing, even with production flags',()=>{
 assert.equal(seoConfig({BM_SITE_URL:production.origin,BM_INDEXING:'true',VERCEL_ENV:'preview'}).indexing,false);
 assert.equal(seoConfig({BM_SITE_URL:production.origin,VERCEL_ENV:'production'}).indexing,true);
 assert.equal(seoConfig({BM_SITE_URL:production.origin,VERCEL_ENV:'production',BM_INDEXING:'false'}).indexing,false);
 assert.equal(seoConfig({BM_SITE_URL:production.origin}).indexing,false);
});
test('canonical origins reject private hosts, credentials, paths and insecure URLs',()=>{
 for(const value of ['http://seo.example','https://localhost','https://127.0.0.1','https://user:secret@seo.example','https://seo.example/subpage','https://seo.example?q=1'])assert.throws(()=>seoConfig({BM_SITE_URL:value}));
});
test('only genuine commercial routes can be indexed',()=>{
 for(const path of ['/gestion-realisations/','/en/gestion-realisations/','/realisations/exemple-web/','/realisations/test-demo/','/realisations/projet/','/404/','/confidentialite/']){
  assert.equal(canIndex(path),false,path);
  assert.match(renderSEO({path,title:'Private',description:'Private'},production),/noindex,follow/);
 }
 assert.match(renderSEO({path:'/',noindex:true},production),/noindex,follow/);
});
test('language pages have self canonicals and reciprocal hreflang links',()=>{
 for(const path of Object.keys(commercialPages))for(const locale of ['fr','en']){
  const html=renderSEO({path,locale},production);
  assert.ok(html.includes(`rel="canonical" href="${production.origin}${canonicalPath(path,locale)}"`));
  for(const lang of ['fr','en'])assert.ok(html.includes(`hreflang="${lang}" href="${production.origin}${canonicalPath(path,lang)}"`));
  assert.match(html,/index,follow,max-image-preview:large/);
 }
});
test('service structured data identifies the provider and language-specific service',()=>{
 for(const locale of ['fr','en']){
  const html=renderSEO({path:'/services/application-mobile/',locale},production);
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
  const provider=graph.find(item=>item['@type']==='Organization');
  const service=graph.find(item=>item['@type']==='Service');
  assert.equal(service.provider['@id'],provider['@id']);
  assert.equal(graph.find(item=>item['@type']==='WebPage').inLanguage,locale);
  assert.equal(graph.find(item=>item['@type']==='BreadcrumbList').itemListElement.length,3);
  assert.ok(!html.includes('aggregateRating'));
 }
});
test('sitemaps contain only canonical public routes and stay empty in preview',()=>{
 const xml=sitemapPages(production);const locations=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.equal(locations.length,Object.keys(commercialPages).length*2);
 assert.equal(new Set(locations).size,locations.length);
 assert.ok(locations.every(url=>!/(test-|exemple-|gestion|admin|projet\/|cookies)/.test(url)));
 assert.ok(!sitemapPages({...production,indexing:false}).includes('<loc>'));
 assert.match(sitemap(production),/sitemap-projects.xml/);
 assert.match(robots(production),/Sitemap: https:\/\/seo.example\/sitemap.xml/);
 assert.equal(robots({...production,indexing:false}),'User-agent: *\nDisallow: /\n');
});
test('English HTML regenerates its SEO block rather than retaining French metadata',()=>{
 const html='<html lang="fr"><head>'+renderSEO({path:'/services/application-mobile/'})+'</head><body><h1>Application mobile.</h1></body></html>';
 const english=localiseHTML(html,{'Application mobile.':'Mobile app.'},'/services/application-mobile/');
 assert.match(english,/<title>iOS &amp; Android Mobile App Development/);
 assert.match(english,/<html lang="en">/);
 assert.equal((english.match(/rel="canonical"/g)||[]).length,1);
 assert.ok(english.includes('/en/services/application-mobile'));
});
