export class StudioConflict extends Error {
 constructor(){super('Le même contenu a été modifié ailleurs. Votre copie locale est conservée.');this.name='StudioConflict';}
}
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function equal(a,b){
 if(a===b)return true;
 if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>equal(v,b[i]));
 if(record(a)&&record(b)){const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));}
 return false;
}
function merge(base,local,remote){
 if(equal(local,remote)||equal(base,remote))return structuredClone(local);
 if(equal(base,local))return structuredClone(remote);
 if(record(base)&&record(local)&&record(remote)){
  const result={};for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){const value=merge(base[k],local[k],remote[k]);if(value!==undefined)result[k]=value;}return result;
 }
 if(Array.isArray(base)&&Array.isArray(local)&&Array.isArray(remote)&&base.length===local.length&&base.length===remote.length)return base.map((v,i)=>merge(v,local[i],remote[i]));
 throw new StudioConflict();
}
export function mergePosts(base,local,remote){
 const b=new Map(base.map(p=>[p.id,p])),l=new Map(local.map(p=>[p.id,p])),r=new Map(remote.map(p=>[p.id,p])),result=[];
 for(const id of new Set([...local.map(p=>p.id),...remote.map(p=>p.id),...base.map(p=>p.id)])){const post=merge(b.get(id),l.get(id),r.get(id));if(post!==undefined)result.push(post);}
 return result;
}
// Preserve the objects held by the editor's event handlers during a save.
export function reconcile(target,source){
 if(Array.isArray(target)&&Array.isArray(source)){for(let i=0;i<source.length;i++)target[i]=reconcile(target[i],source[i]);target.length=source.length;return target;}
 if(record(target)&&record(source)){for(const k of Object.keys(target))if(!Object.hasOwn(source,k))delete target[k];for(const [k,v]of Object.entries(source))target[k]=reconcile(target[k],v);return target;}
 return structuredClone(source);
}
export async function syncSnapshot({base,posts,revision,packs=[],write,read}){
 let desired=structuredClone(posts),ancestor=structuredClone(base),version=revision,appliedPacks=[...packs];
 for(let attempt=0;attempt<3;attempt++){
  const result=await write({posts:desired,revision:version,appliedPacks});
  if(result.ok)return{posts:desired,revision:result.revision,appliedPacks};
  if(!result.conflict)throw Error(result.error||'La sauvegarde en ligne est indisponible. Votre copie locale est conservée.');
  if(attempt===2)break;
  const latest=await read();if(latest.backend!=='cloud')throw Error('La sauvegarde en ligne est indisponible. Votre copie locale est conservée.');
  desired=mergePosts(ancestor,desired,latest.posts);ancestor=structuredClone(latest.posts);version=latest.revision;appliedPacks=[...new Set([...appliedPacks,...latest.appliedPacks||[]])];
 }
 throw new StudioConflict();
}
