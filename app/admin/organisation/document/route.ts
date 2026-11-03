import { isAdminAuthenticated } from "@/lib/adminAuth";
import { planDocument } from "@/lib/bmOrganizationPlan";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new Response("Connexion administrateur requise.", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(planDocument, { headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": 'attachment; filename="BM-plan-directeur-v2-novembre-2026.md"',
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
  } });
}
