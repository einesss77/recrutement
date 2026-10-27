/* English content is rendered at build time. This also localises UI updates and CMS-rendered content. */
(()=>{
 if(document.documentElement.lang!=='en')return;
 const dictionary=window.BMEnglish||{};
 const normalise=value=>String(value).replace(/\s+/g,' ').trim();
 function t(value){const key=normalise(value);if(Object.hasOwn(dictionary,key))return dictionary[key];
  const testName=key.match(/^TEST\s*[—-]\s*(.+)$/i);if(testName)return 'TEST — '+t(testName[1]);
  const pageTitle=key.match(/^(.*?)( \| B&M(?: Digital Consulting)?)$/);if(pageTitle)return t(pageTitle[1])+pageTitle[2];
  const step=key.match(/^Étape (\d+) sur (\d+)\.(.*)$/);if(step)return `Step ${step[1]} of ${step[2]}. ${normalise(t(step[3]))}`;
  const enlarge=key.match(/^Agrandir : (.+)$/);if(enlarge)return 'Enlarge: '+t(enlarge[1]);
  const screenshot=key.match(/^Capture (\d+) sur (\d+)$/);if(screenshot)return `Screenshot ${screenshot[1]} of ${screenshot[2]}`;
  const profile=key.match(/^Je recherche un profil (.+) pour renforcer mon équipe\. Voici mon contexte :$/);if(profile)return `I am looking for a ${t(profile[1])} to reinforce my team. Here is my context:`;
  return value;
 }
 function url(value){if(!value||!value.startsWith('/')||value.startsWith('//')||/^\/(?:en(?:\/|$)|assets\/|consulting\/|api\/|gestion-realisations)/.test(value))return value;return '/en'+value}
 function text(node){if(!node.parentElement||node.parentElement.closest('script,style,textarea,input,[contenteditable]'))return;const original=node.nodeValue,translated=t(original);if(translated!==original)node.nodeValue=original.match(/^\s*/)[0]+translated+original.match(/\s*$/)[0]}
 function attributes(el){if(!el.getAttribute||el.matches('script,style'))return;
  for(const name of (el.matches('meta[name=description],meta[property="og:title"],meta[property="og:description"]')?['content']:['aria-label','alt','placeholder','title']))if(el.hasAttribute(name)){const before=el.getAttribute(name),after=t(before);if(after!==before)el.setAttribute(name,after)}
  if(el.matches('a[href]:not([data-locale-link])')){const before=el.getAttribute('href'),after=url(before);if(before!==after)el.setAttribute('href',after)}
  if(el.matches('img[src]')){const src=el.getAttribute('src');if(/^\/(?:consulting\/)?assets\/(?!en\/)[^?]+\.svg$/.test(src))el.setAttribute('src',src.replace('/assets/','/assets/en/'))}
 }
 function walk(root){if(root.nodeType===Node.TEXT_NODE){text(root);return}if(root.nodeType!==Node.ELEMENT_NODE&&root!==document)return;if(root.nodeType===Node.ELEMENT_NODE)attributes(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())text(walker.currentNode);root.querySelectorAll?.('[aria-label],[alt],[placeholder],[title],a[href],img[src],meta[content]').forEach(attributes)}
 window.BMI18N={t,url,walk};
 walk(document);
 const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')attributes(record.target);else record.addedNodes.forEach(walk)}});
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','alt','placeholder','title','href','src','content']});
 function updateSwitch(){document.querySelectorAll('[data-locale-link]').forEach(link=>{const base=location.pathname.replace(/^\/en(?=\/|$)/,'')||'/';link.href=(link.dataset.localeLink==='en'?'/en'+base:base)+location.search+location.hash})}
 updateSwitch();addEventListener('hashchange',updateSwitch);
 // Translate generated default prompts without touching user-entered form content.
 document.addEventListener('DOMContentLoaded',()=>{const form=document.querySelector('[data-contact]');if(form?.elements.message?.value)form.elements.message.value=t(form.elements.message.value)});
})();
