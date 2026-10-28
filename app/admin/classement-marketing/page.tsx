import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {isAdminAuthenticated} from '@/lib/adminAuth';
import {prisma} from '@/lib/db';
import {readMarketingRanking} from '@/lib/marketingRankingStore';
import RankingBoard from './RankingBoard';
export const metadata:Metadata={title:'Classement Marketing & Ads — B&M',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page(){
 if(!(await isAdminAuthenticated()))redirect('/admin');
 const [applications,stored]=await Promise.all([prisma.application.findMany({where:{jobSlug:'growth-manager'},orderBy:{lastSubmittedAt:'desc'},select:{id:true,fullName:true,salaryExpectation:true,availability:true,status:true,lastSubmittedAt:true,specificAnswer:true}}),readMarketingRanking()]);
 const reviews=new Map(stored?.document.rows.map(r=>[r.applicationId,r]));
 return <RankingBoard reviewedAt={stored?.document.reviewedAt||null} candidates={applications.map(a=>({id:a.id,name:a.fullName,salary:a.salaryExpectation,availability:a.availability,status:a.status,lastSubmittedAt:a.lastSubmittedAt.toISOString(),answer:a.specificAnswer,review:reviews.get(a.id)||null,stale:reviews.has(a.id)&&!!stored&&a.lastSubmittedAt>new Date(stored.document.sourceCapturedAt)}))}/>;
}
