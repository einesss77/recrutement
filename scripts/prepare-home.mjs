import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";

// Signature is the public consulting site; preserve docs/ as the previous version.
await import("../consulting-site/signature/scripts/build.mjs");
const source = new URL("../consulting-site/signature/dist/", import.meta.url);
const destination = new URL("../public/consulting/", import.meta.url);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, filter: (path) => !path.endsWith(".php") && !path.endsWith(".htaccess") && !path.endsWith("/api") && !path.endsWith("\\api") });
async function prepareAssets(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) await prepareAssets(target);
    else if (entry.name.endsWith(".html")) {
      const html = (await readFile(target, "utf8")).replaceAll('="/assets/', '="/consulting/assets/');
      await writeFile(target, html);
    }
  }
}
await prepareAssets(destination);
console.log("B&M Signature public pages prepared in public/consulting");
