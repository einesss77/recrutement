export type EditorialBrief={
 id:string;day:string;campaignWeek:number;audienceId:'it'|'business';audience:string;
 offer:'consulting'|'build';purpose:'educate'|'method'|'proof'|'objection'|'conversion';purposeLabel:string;
 series:string;angle:string;problem:string;takeAway:string;topicKey:string;proofRequirement:string;suggestedTemplate:string;
 ctaKind:'none'|'question'|'conversation'|'contact';ctaGuidance:string;destinationUrl:string;
 experiment:{variable:string;variant:string;hypothesis:string;metric:string};
};
export type EditorialStrategy={
 version:number;positioning:string;primaryGoal:string;accountRole:string;
 campaign:{startDate:string;week:number;cycle:number;label:string;objective:string;reviewAt:string;weeks:{number:number;label:string;objective:string}[]};
 audiences:{id:string;label:string;problem:string;decision:string}[];
 weeklyMix:{purpose:string;label:string;count:number}[];briefs:EditorialBrief[];proofRules:string[];assumption:string;
 review:{status:'collecting'|'observations';label:string;summary:string;publishedCount:number;observedCount:number;minimumObserved:number;totalQualifiedConversations:number;totalMeetings:number;totalOpportunities:number;byOffer:{offer:string;label:string;publishedCount:number;observedCount:number;qualifiedConversations:number;meetings:number;opportunities:number;conversationsPerObservedPost:number|null}[];recommendation:string;nextExperiment:{variable:string;label:string;hypothesis:string;metric:string;assessment:string};limitations:string[];dataSource:string;nextReviewAt:string};
};
export function buildEditorialStrategy(input:{playbook:unknown;accountId?:string;config?:Record<string,unknown>;slots?:{day:string;publishAt?:string}[];recentPosts?:Record<string,unknown>[];queue?:Record<string,unknown>[];now?:Date|string}):EditorialStrategy;
