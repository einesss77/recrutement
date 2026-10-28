import { get,put,BlobNotFoundError } from '@vercel/blob';
import { rankingSchema,type MarketingRanking } from '@/lib/marketingRankingModel';
const marketingRankingPath='bm-recruitment/marketing-ranking-v1.json';
const token=()=>process.env.BLOB_READ_WRITE_TOKEN??process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;
export async function readMarketingRanking(){
 if(!token())return null;
 try{const result=await get(marketingRankingPath,{access:'private',token:token(),useCache:false,headers:{'Accept-Encoding':'identity'}});if(result?.statusCode!==200)return null;return{document:rankingSchema.parse(JSON.parse(await new Response(result.stream).text())),etag:result.blob.etag};}
 catch(error){if(error instanceof BlobNotFoundError)return null;throw error;}
}
export async function saveMarketingRanking(document:MarketingRanking){
 if(!token())throw Error('Le stockage privé du classement est indisponible.');
 const current=await readMarketingRanking();
 await put(marketingRankingPath,JSON.stringify(document),{access:'private',token:token(),addRandomSuffix:false,contentType:'application/json',cacheControlMaxAge:60,...(current?{ifMatch:current.etag,allowOverwrite:true}:{allowOverwrite:false})});
}
