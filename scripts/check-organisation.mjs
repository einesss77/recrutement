import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {readFile} from "node:fs/promises";
import {existsSync} from "node:fs";

if(existsSync(".env"))process.loadEnvFile(".env");
const origin=process.env.BM_ORGANISATION_TEST_URL||"http://127.0.0.1:3193";
assert(process.env.ADMIN_PASSWORD,"ADMIN_PASSWORD local requis pour le contrôle");
const session=createHmac("sha256",process.env.ADMIN_PASSWORD).update("bm-digital-consulting-admin").digest("hex");
const headers={Cookie:"bm_admin_session="+session};
for(const path of ["/admin/organisation","/admin/organisation/presentation"]){
 const response=await fetch(origin+path,{redirect:"manual"});
 assert.equal(response.status,307,"Protection "+path);
 assert.equal(response.headers.get("location"),"/admin");
}
for(const path of ["/admin/organisation/document","/admin/organisation/presentation/export?format=pdf","/admin/organisation/presentation/export?format=html"]){
 const response=await fetch(origin+path);
 assert.equal(response.status,401,"Protection "+path);
 assert(response.headers.get("cache-control").includes("no-store"));
}
const overview=await fetch(origin+"/admin/organisation",{headers});
assert.equal(overview.status,200);
const html=await overview.text();
for(const id of ["equipe","expertises","packs","catalogue","acquisition","objectifs","roadmap","decisions"])assert(html.includes('id="resume-'+id+'"'));
assert(!html.includes("2 400 TND"),"Pas de rémunérations dans la synthèse");
assert(!html.includes('id="partie-1"'),"Le document long est séparé");
assert(html.includes("Digital Start")&&html.includes("Digital Growth")&&html.includes("Digital 360"));
const full=await fetch(origin+"/admin/organisation?vue=document",{headers});
const fullHtml=await full.text();
for(let i=1;i<=13;i++)assert(fullHtml.includes('id="partie-'+i+'"'));
assert(fullHtml.includes("2 400 TND"));
const md=await fetch(origin+"/admin/organisation/document",{headers});
const document=await md.text();
assert(!/\bfondateur\b/i.test(document),"Eines remplace le rôle générique");
assert(!/\b(?:le|du|au) Eines\b/i.test(document),"Grammaire des mentions d’Eines");
assert(document.includes("590 €/mois")&&document.includes("890 €/mois")&&document.includes("1 290 €/mois"));
assert(!document.includes("490 à 690"),"Anciennes fourchettes remplacées");
const search=await fetch(origin+"/admin/organisation?vue=document&q=EspoCRM",{headers});
const filtered=await search.text();
assert(filtered.includes('id="partie-7"'));
assert(!filtered.includes('id="partie-2"'));
const slides=await fetch(origin+"/admin/organisation/presentation",{headers});
assert.equal(slides.status,200);
const slideHtml=await slides.text();
assert(slideHtml.includes("14")&&slideHtml.includes("L’équipe et ses responsabilités"));
for(const [format,type] of [["pdf","application/pdf"],["html","text/html"]]){
 const response=await fetch(origin+"/admin/organisation/presentation/export?format="+format,{headers});
 assert.equal(response.status,200);
 assert(response.headers.get("content-type").startsWith(type));
 assert(response.headers.get("cache-control").includes("no-store"));
 assert(response.headers.get("content-disposition").includes("attachment"));
 const data=Buffer.from(await response.arrayBuffer());
 assert(data.length>20000);
 if(format==="pdf")assert.equal(data.subarray(0,4).toString(),"%PDF");
 else {const text=data.toString();assert(!text.includes("2 400 TND"));assert(text.includes("data:font/ttf;base64,"));}
}
const invalid=await fetch(origin+"/admin/organisation/presentation/export?format=unknown",{headers});
assert.equal(invalid.status,400);
const config=JSON.parse(await readFile(".next/server/app/admin/organisation/presentation/export/route.js.nft.json","utf8"));
assert(config.files.some(file=>file.endsWith("/docs/organisation/BM-synthese-90-jours.pdf")),"PDF inclus dans le déploiement");
assert(config.files.some(file=>file.endsWith("/docs/organisation/BM-synthese-90-jours.html")),"HTML inclus dans le déploiement");
console.log("PASS : authentification, synthèse, 13 parties, packs, Eines, recherche, 14 slides, téléchargements PDF/HTML et traçage de déploiement.");
