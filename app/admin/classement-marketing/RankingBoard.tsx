'use client';
import {useMemo,useState} from 'react';
import {CRITERIA,PRIORITIES,alignmentScore,priority,type RankingCandidate} from '@/lib/marketingRankingModel';
import styles from './ranking.module.css';
const date=(s:string)=>new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeZone:'Europe/Paris'}).format(new Date(s));
const score=(c:RankingCandidate)=>c.review&&!c.stale?alignmentScore(c.review.levels):-1;
const tier=(c:RankingCandidate)=>c.review&&!c.stale?priority(c.review):'new';
const tierOrder={first:0,explore:1,secondary:2,different:3,complete:4,new:5};
const number=(n:number)=>n.toLocaleString('fr-FR',{maximumFractionDigits:1});
export default function RankingBoard({candidates,reviewedAt}:{candidates:RankingCandidate[];reviewedAt:string|null}){
 const [query,setQuery]=useState(''),[group,setGroup]=useState('all'),[skill,setSkill]=useState('all'),[order,setOrder]=useState('score');
 const ranked=useMemo(()=>[...candidates].sort((a,b)=>tierOrder[tier(a)]-tierOrder[tier(b)]||score(b)-score(a)||a.id.localeCompare(b.id)),[candidates]);
 const active=ranked.filter(c=>c.review&&!c.stale),first=active.filter(c=>tier(c)==='first'),pending=candidates.length-active.length;
 const visible=useMemo(()=>ranked.filter(c=>{
  if(group!=='all'&&tier(c)!==group)return false;
  const r=c.review&&!c.stale?c.review:null;
  if(skill==='google-meta'&&(!r||r.levels[0]<2||r.levels[1]<2))return false;
  if(skill==='tiktok'&&(!r||r.levels[2]<2))return false;
  if(skill==='tracking'&&(!r||r.levels[3]<3))return false;
  const text=[c.name,r?.summary,...r?.strengths||[],...r?.gaps||[]].join(' ').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  return text.includes(query.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase());
 }).sort((a,b)=>order==='salary'?a.salary-b.salary||score(b)-score(a):ranked.indexOf(a)-ranked.indexOf(b)),[ranked,group,skill,order,query]);
 function exportCsv(){
  const cell=(s:unknown)=>'"'+String(s??'').replace(/^[=+\-@]/,"'$&").replaceAll('"','""')+'"';
  const rows=[['Rang documentaire','Candidat','Groupe','Score / 100','Prétention TND','Disponibilité','Synthèse','Forces','Points à vérifier','Questions entretien'],...visible.map(c=>{const r=c.review&&!c.stale?c.review:null;return[score(c)<0?'':ranked.findIndex(x=>tier(x)===tier(c)&&score(x)===score(c))+1,c.name,PRIORITIES[tier(c)],score(c)<0?'':score(c),c.salary,c.availability,r?.summary,r?.strengths.join(' | '),r?.gaps.join(' | '),r?.questions.join(' | ')];})];
  const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='classement-marketing-ads.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 return <main className={styles.page}>
  <nav className={styles.nav}><a href="/admin">B&M.<span> Recrutement</span></a><a href="/admin?job=growth-manager">← Toutes les candidatures</a></nav>
  <section className={styles.hero}>
   <p className={styles.eyebrow}>DÉCISION ASSISTÉE · ESPACE ADMINISTRATEUR</p>
   <h1>Marketing & Ads.<br/><span>Le classement sur dossier.</span></h1>
   <p>CV et réponses croisés pour préparer vos entretiens. Les compétences documentées passent avant les intitulés de poste.</p>
   <div className={styles.stats}><div><strong>{candidates.length}</strong><span>candidats reçus</span></div><div><strong>{active.length}</strong><span>dossiers analysés à jour</span></div><div><strong>{first.length}</strong><span>entretiens à prioriser</span></div><div><strong>{pending}</strong><span>analyses à faire / actualiser</span></div></div>
   <div className={styles.heroFoot}><span>{reviewedAt?'Analyse du '+date(reviewedAt):'Analyse en attente de chargement'}</span><span>Responsable Marketing Digital & Ads</span></div>
  </section>
  <section className={styles.method} aria-label="Méthode de classement">
   <details><summary>Une même grille pour tout le monde <span>Voir les critères ↗</span></summary><div className={styles.methodBody}><p>Score documentaire indicatif : chaque critère est évalué de 0 à 4 puis pondéré. 0 = non établi ; 1 = notions ou simple mention ; 2 = pratique partielle décrite ; 3 = pratique détaillée cohérente ; 4 = cas particulièrement étayé dans le dossier. Un chiffre déclaré reste à vérifier en entretien.</p><div className={styles.weights}>{CRITERIA.map(c=><div key={c.key}>{c.label}<strong>{c.weight} %</strong></div>)}</div><p>Classement par priorité, puis par score (ex æquo possibles). 70–100 : entretiens à prioriser · 50–69,9 : approfondir · 30–49,9 : adéquation partielle · moins de 30 : autre périmètre ou peu étayé. Un niveau linguistique faible ou insuffisamment précisé limite la priorité maximale, même avec un bon score technique. Les dossiers manifestement incomplets sont signalés séparément. Les nouveaux dépôts ou CV mis à jour attendent une nouvelle analyse.</p><p>Les prétentions et la disponibilité ne modifient pas le score. Ni la photo, ni l’âge, ni les informations personnelles sans rapport avec le poste n’entrent dans l’évaluation. Résultats et langues déclarés, non vérifiés ; portfolios externes non audités. Aucun statut de candidature n’est modifié automatiquement.</p></div></details>
  </section>
  <section className={styles.tools} aria-label="Filtres du classement">
   <label>Rechercher<input type="search" placeholder="Un nom, une compétence…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <label>Priorité<select aria-label="Priorité" value={group} onChange={e=>setGroup(e.target.value)}><option value="all">Tous les profils</option>{Object.entries(PRIORITIES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   <label>Compétence<select aria-label="Compétence" value={skill} onChange={e=>setSkill(e.target.value)}><option value="all">Toutes</option><option value="google-meta">Google + Meta : pratique décrite</option><option value="tiktok">TikTok : pratique décrite</option><option value="tracking">Tracking : dossier détaillé</option></select></label>
   <label>Trier<select aria-label="Trier" value={order} onChange={e=>setOrder(e.target.value)}><option value="score">Priorité puis score</option><option value="salary">Prétention croissante</option></select></label>
   <button onClick={exportCsv}>Exporter le CSV ↗</button>
  </section>
  <div className={styles.listHead}><h2>{visible.length} profil{visible.length>1?'s':''}<span> / {candidates.length}</span></h2><p>Un point non documenté reste une question, pas une conclusion.</p></div>
  <section className={styles.list} aria-label="Candidats classés">
   {visible.map(c=>{const r=c.review&&!c.stale?c.review:null,s=score(c),rank=s<0?null:ranked.findIndex(x=>tier(x)===tier(c)&&score(x)===s)+1,p=tier(c);return <article key={c.id} className={styles.card} data-candidate={c.id}>
    <header className={styles.cardHead}><div className={styles.rank}>{rank?String(rank).padStart(2,'0'):'—'}</div><div className={styles.identity}><span className={`${styles.pill} ${p==='first'?styles.primaryPill:''}`}>{c.stale?'Analyse à actualiser':PRIORITIES[p]}</span><h2>{c.name}</h2><p>{c.salary.toLocaleString('fr-FR')} TND <span>·</span> {c.availability}</p></div><div className={styles.score}>{s<0?'—':number(s)}<small>{s<0?'En attente':'/ 100'}</small></div></header>
    <p className={styles.synthesis}>{r?.summary||(c.stale?'Une nouvelle soumission est arrivée après cette analyse. Relire le dossier avant de réutiliser son classement.':'Ce dossier n’a pas encore été analysé. Il n’est pas comparé aux profils déjà évalués.')}</p>
    <footer className={styles.cardFoot}><a href={'/admin/cv/'+c.id}>Ouvrir le CV ↗</a><a href={'/admin?job=growth-manager#application-'+c.id}>Dossier dans l’admin ↗</a><span>Dernier dépôt : {date(c.lastSubmittedAt)}</span></footer>
    {r?<details className={styles.review}><summary>Comprendre le classement <span>Forces · réserves · entretien</span></summary><div className={styles.reviewBody}><div className={styles.criteria}>{CRITERIA.map((criterion,i)=><div key={criterion.key}><span>{criterion.label}</span><div className={styles.meter} aria-label={criterion.label+' : '+r.levels[i]+' sur 4'}>{[1,2,3,4].map(n=><i key={n} className={n<=r.levels[i]?styles.filled:''}/>)}</div><small>{r.levels[i]}/4</small></div>)}</div><div className={styles.notes}><section><h3>Ce qui ressort</h3><ul>{r.strengths.map(s=><li key={s}>{s}</li>)}</ul></section><section><h3>À vérifier</h3><ul>{r.gaps.map(s=><li key={s}>{s}</li>)}</ul></section><section><h3>À demander en entretien</h3><ol>{r.questions.map(s=><li key={s}>{s}</li>)}</ol></section></div></div></details>:null}
    <details className={styles.answer}><summary>Lire les réponses originales</summary><p>{c.answer}</p></details>
   </article>;})}
   {!visible.length?<p className={styles.empty}>Aucun profil pour ces filtres. <button onClick={()=>{setQuery('');setGroup('all');setSkill('all');}}>Réinitialiser</button></p>:null}
  </section>
  <p className={styles.bottom}>Document de travail privé. Les scores servent à préparer les échanges ; la décision vous appartient.</p>
 </main>;
}
