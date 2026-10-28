import { z } from 'zod';
export const CRITERIA=[
 {key:'google',label:'Google Ads',weight:15}, {key:'meta',label:'Meta Ads',weight:15},
 {key:'tiktok',label:'TikTok Ads',weight:10}, {key:'tracking',label:'Tracking & analyse',weight:20},
 {key:'clients',label:'Comptes & coordination',weight:15}, {key:'content',label:'Contenu & briefs',weight:15},
 {key:'languages',label:'Français & anglais',weight:5}, {key:'automation',label:'IA & automatisation',weight:5},
] as const;
export const rankingRowSchema=z.object({
 applicationId:z.string().regex(/^[a-z0-9]{20,40}$/),
 levels:z.tuple([z.number().int().min(0).max(4),z.number().int().min(0).max(4),z.number().int().min(0).max(4),z.number().int().min(0).max(4),z.number().int().min(0).max(4),z.number().int().min(0).max(4),z.number().int().min(0).max(4),z.number().int().min(0).max(4)]),
 summary:z.string().min(10).max(500),strengths:z.array(z.string().min(5).max(600)).min(1).max(5),gaps:z.array(z.string().min(5).max(600)).min(1).max(5),questions:z.array(z.string().min(5).max(600)).min(1).max(5),needsEvidence:z.boolean().default(false),
});
export const rankingSchema=z.object({version:z.literal(1),jobSlug:z.literal('growth-manager'),sourceCapturedAt:z.iso.datetime(),reviewedAt:z.iso.datetime(),sourceCount:z.number().int().min(1).max(1000),rows:z.array(rankingRowSchema).min(1).max(1000)})
 .refine(x=>x.rows.length===x.sourceCount&&new Set(x.rows.map(r=>r.applicationId)).size===x.rows.length,{message:'Dossiers incomplets ou identifiants dupliqués.'});
export type RankingRow=z.infer<typeof rankingRowSchema>;
export type MarketingRanking=z.infer<typeof rankingSchema>;
export function alignmentScore(levels:readonly number[]){return Math.round(CRITERIA.reduce((sum,c,i)=>sum+c.weight*(levels[i]||0)/4,0)*10)/10;}
export function priority(row:RankingRow){if(row.needsEvidence)return'complete';const score=alignmentScore(row.levels);return score>=70&&row.levels[6]>=2?'first':score>=50?'explore':score>=30?'secondary':'different';}
export const PRIORITIES={first:'Entretiens à prioriser',explore:'Profils à approfondir',secondary:'Adéquation partielle',different:'Autre périmètre / peu étayé',complete:'Dossier à compléter',new:'Non analysé'};
export type RankingCandidate={id:string;name:string;salary:number;availability:string;status:string;lastSubmittedAt:string;answer:string;review:RankingRow|null;stale:boolean};
