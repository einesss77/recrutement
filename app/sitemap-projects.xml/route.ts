const empty = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';

export const dynamic = "force-dynamic";

export async function GET() {
  let xml = empty;
  try {
    const origin = process.env.BM_CMS_ORIGIN || "http://127.0.0.1:4348";
    const response = await fetch(`${origin}/sitemap-projects.xml`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const content = await response.text();
      if (content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) xml = content;
    }
  } catch {
    // The commercial-page sitemap remains available if the editorial CMS is offline.
  }
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
