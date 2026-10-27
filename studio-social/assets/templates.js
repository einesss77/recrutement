export const templates = { editorial:'Le point de vue', steps:'La méthode', squad:'Le collectif', checklist:'Le mémo', case:'Le cas concret', focus:'L’expertise' };
export const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={editorial:'↗',steps:'↳',squad:'◌',checklist:'✓',case:'↗',focus:'✳'};
export function artwork(post, index=0){
 const s=post.slides[index]||post.slides[0];
 const list=(s.points||[]).map((p,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(p)}</li>`).join('');
 const visual=post.template==='squad'?'<div class="people"><i></i><i></i><i></i><i></i></div>':`<div class="symbol">${icons[post.template]||'↗'}</div>`;
 return `<article class="art ${esc(post.template)} ${post.theme==='light'?'light':'dark'}"><header><b>B&M<span>Digital<br>Consulting</span></b><span>${esc(post.category)}</span></header><div class="art-body"><div class="eyebrow">${esc(s.label||'LE REGARD B&M')}</div><h1>${esc(s.title)}</h1><p>${esc(s.body)}</p>${list?`<ul>${list}</ul>`:''}${post.image?`<img class="post-image" src="${esc(post.image)}" alt="Visuel du post">`:visual}</div><div class="arc"></div><footer><span>Conseil. Produit. Ingénierie.</span><span>${String(index+1).padStart(2,'0')} / ${String(post.slides.length).padStart(2,'0')}</span></footer></article>`;
}
