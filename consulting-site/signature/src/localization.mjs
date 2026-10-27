export const normalise = value => value.replace(/\s+/g,' ').trim();
const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
export const decode=value=>value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(whole,key)=>key[0]==='#'?String.fromCodePoint(key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10)):entities[key]??whole);
const escapeText=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const escapeAttribute=value=>escapeText(value).replaceAll('"','&quot;');
export function translate(value,dictionary){const key=normalise(decode(value));return Object.hasOwn(dictionary,key)?dictionary[key]:null}
export function englishURL(value){if(!value.startsWith('/')||value.startsWith('//')||/^\/(?:en(?:\/|$)|assets\/|consulting\/|api\/|gestion-realisations)/.test(value))return value;return '/en'+value}
export function localiseHTML(html,dictionary,path='/'){
 let skipped=0;
 // Preserve markup, IDs, data contracts and scripts; translate only text and human-facing attributes.
 html=html.replace('<em>Pour faire avancer<br>les bonnes idées.</em>','<em>To bring<br>the right ideas to life.</em>').replace('<h3>Un besoin <em>sur mesure ?</em></h3>','<h3>Looking for <em>specific expertise?</em></h3>');
 const tokens=html.match(/<(?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+/g)||[];
 const result=tokens.map(token=>{
  if(token[0]!=='<'){
   if(skipped)return token;
   const translated=translate(token,dictionary);
   return translated===null?token:token.match(/^\s*/)[0]+escapeText(translated)+token.match(/\s*$/)[0];
  }
  const tag=token.match(/^<\/?([a-z][\w:-]*)/i)?.[1]?.toLowerCase();
  if(!tag)return token;
  if(['script','style'].includes(tag)){skipped+=token.startsWith('</')?-1:1;return token}
  if(tag==='html')token=token.replace('lang="fr"','lang="en"');
  const language=token.match(/data-locale-link="(fr|en)"/)?.[1];
  if(language){token=token.replace(/\saria-current="[^"]*"/g,'').replace(/href="[^"]*"/,`href="${language==='en'?'/en'+path:path}"`);if(language==='en')token=token.replace(/>$/,' aria-current="page">')}
  token=token.replace(/\b(aria-label|alt|placeholder|title|content)="([^"]*)"/g,(whole,attr,value)=>{
   const translated=translate(value,dictionary);return translated===null?whole:`${attr}="${escapeAttribute(translated)}"`;
  });
  if(tag==='link'&&token.includes('rel="canonical"'))token=token.replace(/href="(https?:\/\/[^/"]+)([^"]*)"/,(_,origin,route)=>`href="${origin}${englishURL(route||'/')}"`);
  if(tag==='a'&&!language)token=token.replace(/\bhref="([^"]*)"/,(_,url)=>`href="${englishURL(url)}"`);
  if(tag==='img')token=token.replace(/\bsrc="(\/assets\/[^"?]+\.svg)"/,(_,url)=>`src="${url.replace('/assets/','/assets/en/')}"`);
  return token;
 }).join('');
 return result.replace('</head>','<script src="/assets/en-translations.js" defer></script><script src="/assets/i18n.js" defer></script></head>');
}
