import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:Request) {
  const headers={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"};
  if(!(await isAdminAuthenticated()))return new Response("Connexion administrateur requise.",{status:401,headers});
  const format=new URL(request.url).searchParams.get("format")||"pdf";
  if(!["pdf","html"].includes(format))return new Response("Format inconnu.",{status:400,headers});
  try {
    const data=await readFile(join(process.cwd(),"docs","organisation","BM-synthese-90-jours."+format));
    return new Response(new Uint8Array(data),{headers:{...headers,"Content-Type":format==="pdf"?"application/pdf":"text/html; charset=utf-8","Content-Disposition":'attachment; filename="BM-synthese-90-jours.'+format+'"'}});
  } catch {
    return new Response("Export momentanément indisponible.",{status:503,headers});
  }
}
