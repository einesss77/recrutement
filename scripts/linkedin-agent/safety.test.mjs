import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {automationHold,holdAutomation,holdFile,reserveBrowserVisit} from './safety.mjs';

async function sandbox(run){const root=await mkdtemp(path.join(tmpdir(),'bm-safety-'));try{await run(root);}finally{for(const file of ['linkedin-automation-hold.json','browser-visit-budget.json','browser-visit-budget.json.lock'])await unlink(path.join(root,file)).catch(()=>{});await rmdir(root);}}
test('un avertissement persiste, ne peut pas être écrasé et bloque avant toute visite',async()=>sandbox(async root=>{
 await holdAutomation(root,'Avertissement LinkedIn');await holdAutomation(root,'Autre motif');assert.equal((await automationHold(root)).reason,'Avertissement LinkedIn');
 await assert.rejects(reserveBrowserVisit(root),/Avertissement/);
 await assert.rejects(readFile(path.join(root,'browser-visit-budget.json')),e=>e.code==='ENOENT');
 await writeFile(holdFile(root),'{invalid');assert.match((await automationHold(root)).reason,/illisible/);await assert.rejects(reserveBrowserVisit(root),/illisible/);
}));
test('deux tentatives maximum par jour de Paris, y compris après redémarrage',async()=>sandbox(async root=>{
 await reserveBrowserVisit(root,new Date('2026-11-13T22:50:00Z'));await reserveBrowserVisit(root,new Date('2026-11-13T22:51:00Z'));
 await assert.rejects(reserveBrowserVisit(root,new Date('2026-11-13T22:52:00Z')),/deux sessions/);
 await reserveBrowserVisit(root,new Date('2026-11-13T23:01:00Z'));
 assert.deepEqual(JSON.parse(await readFile(path.join(root,'browser-visit-budget.json'),'utf8')).day,'2026-11-14');
}));
test('les ouvertures concurrentes ne dépassent pas le budget et un budget corrompu bloque',async()=>sandbox(async root=>{
 const results=await Promise.allSettled(Array.from({length:6},()=>reserveBrowserVisit(root,new Date('2026-11-13T12:00:00Z'))));
 assert.ok(results.filter(r=>r.status==='fulfilled').length<=2);
 const file=path.join(root,'browser-visit-budget.json');assert.ok(JSON.parse(await readFile(file,'utf8')).attempts<=2);
 await writeFile(file,'{}');await assert.rejects(reserveBrowserVisit(root),/invalide/);
}));
