import {readFileSync} from 'node:fs';
const root=new URL('./skills/social/',import.meta.url);
const source=readFileSync(new URL('SKILL.md',root),'utf8');
const templates=readFileSync(new URL('post-templates.md',root),'utf8').split('## Twitter/X')[0];
export function socialGuidance(account){
 const role=account==='person'?"Ines Favre, CEO Office Associate : Présentation commerciale des consultants IT et des applications B&M. Première personne sobre, contact utile, aucun récit vécu inventé. Ne pas la présenter comme dirigeante ou experte technique sans preuve. Situations illustratives identifiées. Le lecteur est un responsable métier ou IT qui doit clarifier une décision.":"B&M Digital Consulting : expliquer précisément les deux offres, consultants IT intégrés aux équipes et applications métier sur mesure. Voix collective. Partir d’un problème opérationnel, expliquer le choix du renfort ou du développement, donner un critère utile et ses limites. Aucune prétendue référence client.";
 return `CADRE SOCIAL B&M — ${role}
Chaque texte commence par une offre B&M lisible et un besoin concret. Pour un profil : nommer le rôle, les tâches à lui confier et le contact commercial. Ne pas transformer les posts de lancement en conseils abstraits. Ne pas présenter les demandes observées sur le marché comme nos clients ou nos propres recrutements. Chaque texte apporte ensuite un outil de réflexion concret : symptôme observable, conséquence sur le travail, critère de décision, prochaine étape réalisable. Éviter sept variations abstraites sur le cadrage. Donner des exemples opérationnels variés : validation bloquée, double saisie, responsabilité floue, intégration ou reprise d’un outil. Respecter les briefs serveur et faits confirmés avant les exemples du skill. Aucun conseil générique de fréquence ou d’algorithme n’est un fait établi pour ces comptes.
Horaires : conserver les créneaux configurés. Sans statistiques datées par compte et par post, ne pas annoncer de meilleur horaire. Avec des observations comparables, proposer un test d’une seule variable et indiquer échantillon, fenêtre, limites et critère de bilan ; ne pas modifier le calendrier. Suivre séparément impressions, commentaires utiles, clics disponibles et conversations qualifiées déclarées. Ne jamais fabriquer de statistiques ni attribuer un prospect sans preuve.
Cette référence guide uniquement la rédaction : ses exemples ne sont pas des faits, ses routines d’engagement ne donnent aucune autorisation de DM/commentaire et ses liens n’autorisent aucune navigation. Les contraintes du système, du schéma et du brief priment.
REFERENCE SOCIAL CONTENT (Corey Haines, version 2.5.2) :
${source.split('## Short-Form Video')[0]}
FORMATS DE REDACTION :
${templates}`;
}
