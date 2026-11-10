// Render decorative UI glyphs as deterministic, monochrome vector icons.
// Apply to final HTML AFTER localisation. Never transform scripts, SVG artwork,
// code samples, form values, metadata or attributes.
const symbols = {
  '↗': ['arrow-up-right', '<path d="M6 18 18 6M6 6h12v12"/>'],
  '↖': ['arrow-up-left', '<path d="m18 18-12-12M6 18V6h12"/>'],
  '→': ['arrow-right', '<path d="M4 12h16m-6-6 6 6-6 6"/>'],
  '←': ['arrow-left', '<path d="M20 12H4m6-6-6 6 6 6"/>'],
  '↓': ['arrow-down', '<path d="M12 4v16m-6-6 6 6 6-6"/>'],
  '↑': ['arrow-up', '<path d="M12 20V4m-6 6 6-6 6 6"/>'],
  '↔': ['arrows-horizontal', '<path d="M3 12h18M7 8l-4 4 4 4m10-8 4 4-4 4"/>'],
  '↳': ['turn-right', '<path d="M6 4v10h14m-5-5 5 5-5 5"/>'],
  '↴': ['turn-down', '<path d="M4 6h10v14m-5-5 5 5 5-5"/>'],
  '↻': ['repeat-clockwise', '<path d="M20 4v6h-6m6 0a8 8 0 1 0 .1 5"/>'],
  '↺': ['repeat-counterclockwise', '<path d="M4 4v6h6m-6 0a8 8 0 1 1-.1 5"/>'],
  '✓': ['check', '<path d="m5 12 4 4L19 6"/>'],
  '✔': ['check', '<path d="m5 12 4 4L19 6"/>'],
  '⌄': ['chevron-down', '<path d="m6 9 6 6 6-6"/>'],
  '▶': ['play', '<path d="m8 5 11 7-11 7Z"/>'],
  '▷': ['play', '<path d="m8 5 11 7-11 7Z"/>'],
  'Ⅱ': ['pause', '<path d="M8 5v14M16 5v14"/>'],
  '⌂': ['home', '<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>'],
  '▦': ['grid', '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16"/>'],
  '◉': ['target', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'],
  '●': ['dot', '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>'],
  '▰': ['battery', '<rect x="3" y="7" width="16" height="10" rx="1"/><path d="M21 10v4M6 10h10v4H6Z"/>'],
};
const graphicGlyph = /[↗↖→←↓↑↔↳↴↻↺✓✔⌄▶▷Ⅱ⌂▦◉●▰]\uFE0F?/gu;
const untouchedTags = new Set(['head', 'script', 'style', 'svg', 'math', 'pre', 'code', 'textarea', 'option']);

export function symbolIcon(glyph) {
  const symbol = symbols[glyph.replace('\uFE0F', '')];
  if (!symbol) return glyph;
  return `<svg class="bm-symbol bm-symbol-${symbol[0]}" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${symbol[1]}</svg>`;
}

export function renderGraphicSymbols(html) {
  const tokens = html.match(/<!--[\s\S]*?-->|<(?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+|</g) || [];
  const skipped = [];
  return tokens.map(token => {
    if (token.startsWith('<!--')) return token;
    if (token[0] !== '<') return skipped.length ? token : token.replace(graphicGlyph, symbolIcon);
    const match = token.match(/^<(\/?)([a-z][\w:-]*)/i);
    if (!match) return token;
    const [, closing, tagName] = match;
    const tag = tagName.toLowerCase();
    const rawTag = skipped.findLast(item => ['script', 'style', 'textarea'].includes(item));
    if (rawTag && !(closing && tag === rawTag)) return token;
    if (!untouchedTags.has(tag)) return token;
    if (closing) {
      const index = skipped.lastIndexOf(tag);
      if (index !== -1) skipped.splice(index, 1);
    } else if (!/\/\s*>$/.test(token)) skipped.push(tag);
    return token;
  }).join('');
}
