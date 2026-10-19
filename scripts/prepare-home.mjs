import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

// Keep docs/ as the single source of the B&M homepage, also used by GitHub Pages.
const source = new URL("../docs/", import.meta.url);
const destination = new URL("../public/consulting/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
const html = (await readFile(new URL("index.html", source), "utf8"))
  .replaceAll('href="styles.css"', 'href="/consulting/styles.css"')
  .replaceAll('src="interactions.js"', 'src="/consulting/interactions.js"')
  .replaceAll('src="assets/', 'src="/consulting/assets/');
await writeFile(new URL("index.html", destination), html);
console.log("B&M homepage prepared in public/consulting");
