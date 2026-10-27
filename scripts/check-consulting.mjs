import "../consulting-site/signature/scripts/check.mjs";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const root = new URL("../public/consulting/", import.meta.url);
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(![".local", "config.json", "projects.json"].includes(entry.name), `Excluded public entry: ${entry.name}`);
    assert(!entry.name.endsWith(".php"), `Excluded PHP endpoint: ${entry.name}`);
    const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) await check(target);
    else if (entry.name.endsWith(".html")) {
      const html = await readFile(target, "utf8");
      assert(!html.includes('="/assets/'), `Unmapped Signature asset: ${target}`);
      for (const match of html.matchAll(/(?:src|href)="\/consulting\/([^"?#]+)/g)) {
        await readFile(new URL(match[1], root));
      }
    }
  }
}
await check(root);
console.log("Integrated public assets resolve; private data and PHP runtime excluded from Next.js static files.");
