const DAY=86400000;
const accountOf=value=>value==='person'?'person':'organization';
const valueOf=(value,values,fallback)=>values.includes(value)?value:fallback;
const dateValue=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value?value:null;
const dayTime=day=>Date.parse(day+'T12:00:00Z');
const addDays=(day,count)=>new Date(dayTime(day)+count*DAY).toISOString().slice(0,10);
function civilDay(now,timezone){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}
const count=value=>Number.isInteger(value)&&value>=0&&value<=999?value:0;
const offers=['consulting','build'];

function commercialReview(playbook,queue,now,campaignStart,reviewAt){
 const policy=playbook.measurement,nowTime=now.getTime(),earliest=nowTime-policy.windowDays*DAY;
 const published=queue.filter(q=>q.status==='published'&&Number.isFinite(Date.parse(q.publishedAt))&&Date.parse(q.publishedAt)>=earliest&&Date.parse(q.publishedAt)<=nowTime);
 const observed=published.filter(q=>nowTime-Date.parse(q.publishedAt)>=policy.maturityDays*DAY&&q.salesFeedback?.source==='manual'&&Number.isFinite(Date.parse(q.salesFeedback.updatedAt))&&Date.parse(q.salesFeedback.updatedAt)<=nowTime&&Date.parse(q.salesFeedback.updatedAt)-Date.parse(q.publishedAt)>=policy.maturityDays*DAY);
 const byOffer=offers.map(offer=>{const all=published.filter(q=>q.editorial?.offer===offer),sample=observed.filter(q=>q.editorial?.offer===offer);const sum=key=>sample.reduce((n,q)=>n+count(q.salesFeedback[key]),0);return {offer,label:playbook.offers[offer].label,publishedCount:all.length,observedCount:sample.length,qualifiedConversations:sum('qualifiedConversations'),meetings:sum('meetings'),opportunities:sum('opportunities'),conversationsPerObservedPost:sample.length?Number((sum('qualifiedConversations')/sample.length).toFixed(2)):null};});
 const oldest=published.length?Math.min(...published.map(q=>Date.parse(q.publishedAt))):nowTime;
 const enough=observed.length>=policy.minimumObserved&&nowTime-oldest>=policy.minimumDays*DAY;
 const sum=key=>observed.reduce((n,q)=>n+count(q.salesFeedback[key]),0);
 const totalQualifiedConversations=sum('qualifiedConversations'),totalMeetings=sum('meetings'),totalOpportunities=sum('opportunities');
 let recommendation='Conserver le mix de départ et renseigner les retours des publications. Aucun thème gagnant n’est établi.';
 if(enough){
  const ranked=[...byOffer].sort((a,b)=>(b.conversationsPerObservedPost||0)-(a.conversationsPerObservedPost||0));
  if(ranked.every(x=>x.observedCount>=4)&&ranked[0].qualifiedConversations>0&&(ranked[0].conversationsPerObservedPost||0)>(ranked[1].conversationsPerObservedPost||0))recommendation=`Les publications ${ranked[0].label.toLowerCase()} ont davantage de conversations déclarées par post observé dans cet échantillon. Examiner les conversations avant de modifier la priorité commerciale ; ce constat ne prouve pas une cause.`;
  else recommendation=totalQualifiedConversations?'Relire les échanges qualifiés pour préciser les problèmes qui ont suscité une discussion. Garder le mix tant que les deux offres ne sont pas comparables.':'Revoir la précision de la cible et du problème dans les accroches avant d’augmenter la fréquence. Tester une seule modification sur le prochain cycle.';
 }
 return {status:enough?'observations':'collecting',label:enough?'Des observations à examiner':'Construire une base de comparaison',summary:enough?`${observed.length} publications avec retours saisis sont assez anciennes pour une première lecture descriptive.`:`${observed.length} publication(s) avec retours saisis après ${policy.maturityDays} jours. Repère de travail : ${policy.minimumObserved} publications observées et ${policy.minimumDays} jours de recul.`,publishedCount:published.length,observedCount:observed.length,minimumObserved:policy.minimumObserved,totalQualifiedConversations,totalMeetings,totalOpportunities,byOffer,recommendation,nextExperiment:{variable:'opening',label:'Tester deux façons d’ouvrir le sujet',hypothesis:'Une accroche qui nomme un problème précis peut susciter des échanges différents d’une accroche centrée sur une décision.',metric:'Conversations qualifiées déclarées par publication',assessment:'Alterner problème et décision entre les semaines ; conserver cadence et mix. Comparer les retours à la revue sans attribuer l’écart à la seule accroche.'},limitations:[...policy.limitations],dataSource:'manual',nextReviewAt:reviewAt};
}

/** Pure editorial planning: never publishes, fetches data or changes saved settings. */
export function buildEditorialStrategy({playbook,accountId,config={},slots=[],recentPosts=[],queue=[],now=new Date()}){
 const instant=now instanceof Date?now:new Date(now);if(!Number.isFinite(instant.getTime()))throw Error('Date de stratégie invalide.');
 if(!playbook?.weeks?.length||!playbook?.sequence?.length)throw Error('Le guide éditorial B&M est absent.');
 const account=accountOf(accountId||config.targetType),today=civilDay(instant,config.timezone),startDate=dateValue(config.campaignStart)||today;
 const currentDay=Math.max(0,Math.floor((dayTime(today)-dayTime(startDate))/DAY)),currentWeek=Math.floor(currentDay/7)%4,cycle=Math.floor(currentDay/28)+1;
 const activeWeek=playbook.weeks[currentWeek],reviewAt=addDays(startDate,cycle*28);
 const focus=valueOf(config.commercialFocus,offers,'balanced'),target=valueOf(config.targetAudience,['it','business'],'mixed');
 const history=(recentPosts||[]).filter(p=>p.status!=='rejected').map(p=>p.editorial).filter(Boolean);
 const plannedTopics=new Set();
 const briefs=slots.slice(0,7).map(slot=>{
  const day=dateValue(slot.day);if(!day)throw Error('Créneau éditorial invalide.');
  const absoluteDay=Math.max(0,Math.floor((dayTime(day)-dayTime(startDate))/DAY)),weekIndex=Math.floor(absoluteDay/7)%4,dayIndex=absoluteDay%7,cycleIndex=Math.floor(absoluteDay/28)+1;
  const week=playbook.weeks[weekIndex],sequence=playbook.sequence[dayIndex],person=account==='person';
  // Balanced accounts divide seven topics per offer, rather than echoing the same week's posts.
  const defaultOffer=(dayIndex+(person?1:0)+weekIndex)%2===0?'consulting':'build',offer=focus==='balanced'?defaultOffer:focus;
  const earlier=Array.from({length:dayIndex},(_,d)=>(d+(person?1:0)+weekIndex)%2===0?'consulting':'build').filter(x=>x===offer).length;
  const companyCount=Array.from({length:7},(_,d)=>(d+weekIndex)%2===0?'consulting':'build').filter(x=>x===offer).length;
  let topicIndex=focus==='balanced'?earlier+(person?companyCount:0):(dayIndex+(person?3:0))%7;
  const topics=week[offer];topicIndex%=topics.length;
  const baseKey=`w${weekIndex+1}-${offer}`;
  for(let attempt=0;attempt<topics.length;attempt++){
   const used=plannedTopics.has(`${baseKey}-${topicIndex}`)||history.some(h=>h.topicKey===`${baseKey}-${topicIndex}`&&h.day&&Math.abs(dayTime(day)-dayTime(h.day))<21*DAY);
   if(!used)break;topicIndex=(topicIndex+1)%topics.length;
  }
  plannedTopics.add(`${baseKey}-${topicIndex}`);
  const [baseAngle,problem,takeAway]=topics[topicIndex],audienceId=target==='mixed'?(offer==='consulting'?'it':'business'):target;
  const cycleLenses=['','Revisiter sous l’angle de la coordination entre équipes','Revisiter sous l’angle de la transmission et de la continuité','Revisiter sous l’angle des exceptions et des décisions difficiles'];
  const angle=cycleIndex===1?baseAngle:`${baseAngle} — ${cycleLenses[(cycleIndex-2)%3+1]}. Choisir une situation différente de l’historique fourni.`;
  const audience=playbook.audiences.find(a=>a.id===audienceId),variant=weekIndex%2===0?'problem':'decision';
  const url=new URL(playbook.offers[offer].url);url.search=new URLSearchParams({utm_source:'linkedin',utm_medium:'organic_social',utm_campaign:`bm-${startDate}-c${cycleIndex}-s${weekIndex+1}`,utm_content:`${account}-${day}`}).toString();
  const ctaGuidance={none:'Terminer sur une idée utile. Aucune invitation à commenter, aucun lien ni prise de contact forcée.',question:'Poser une seule question précise sur l’arbitrage du lecteur. Aucun mot-clé à commenter, tag demandé ou promesse de ressource.',conversation:'Inviter à confronter le mémo à une situation de travail, sans imposer une réponse ni promettre de prestation gratuite.',contact:'Proposer un échange autour du besoin décrit et utiliser le lien fourni une seule fois. Ne promettre ni devis immédiat, ni délai, ni disponibilité, ni audit gratuit.'}[sequence.ctaKind];
  return {id:`${account}-${day}-v${playbook.version}`,day,campaignWeek:weekIndex+1,audienceId,audience:audience.label,offer,purpose:sequence.purpose,purposeLabel:playbook.weeklyMix.find(m=>m.purpose===sequence.purpose).label,series:sequence.series,angle,problem,takeAway,topicKey:`${baseKey}-${topicIndex}`,proofRequirement:(sequence.purpose==='proof'?'Produire un scénario explicitement fictif ou illustratif ; décrire des éléments observables, sans résultat client revendiqué. ':'')+playbook.offers[offer].proof,suggestedTemplate:sequence.template,ctaKind:sequence.ctaKind,ctaGuidance,destinationUrl:sequence.ctaKind==='contact'?url.toString():'',experiment:{variable:'opening',variant,hypothesis:'Comparer une entrée par le problème à une entrée par la décision, sans changer la cible ou la cadence.',metric:'qualifiedConversations'}};
 });
 return {version:playbook.version,positioning:playbook.positioning,primaryGoal:config.objective||playbook.primaryGoal,accountRole:playbook.accountRoles[account],campaign:{startDate,week:currentWeek+1,cycle,label:activeWeek.label,objective:activeWeek.objective,reviewAt,weeks:playbook.weeks.map(({number,label,objective})=>({number,label,objective}))},audiences:playbook.audiences.filter(a=>target==='mixed'||a.id===target),weeklyMix:playbook.weeklyMix,briefs,proofRules:playbook.proofRules,assumption:playbook.assumption,review:commercialReview(playbook,queue,instant,startDate,reviewAt)};
}
