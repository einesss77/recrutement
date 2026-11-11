import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,unlink,access,rmdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {redact} from './quality.mjs';

export function subscriptionEnvironment(source=process.env){
 const allowed=['PATH','Path','PATHEXT','SystemRoot','WINDIR','COMSPEC','TEMP','TMP','TMPDIR','HOME','USERPROFILE','LOCALAPPDATA','APPDATA','USERNAME','USERDOMAIN','SYSTEMDRIVE','NUMBER_OF_PROCESSORS','PROCESSOR_ARCHITECTURE','CODEX_HOME','SSL_CERT_FILE','SSL_CERT_DIR','HTTP_PROXY','HTTPS_PROXY','NO_PROXY'];
 return Object.fromEntries(allowed.filter(k=>source[k]).map(k=>[k,source[k]]));
}

export async function codexCommand(){
 if(process.env.STUDIO_CODEX_BINARY)return {command:process.env.STUDIO_CODEX_BINARY,prefix:[]};
 if(process.platform==='win32'){
  const entry=path.join(process.env.APPDATA||path.join(os.homedir(),'AppData','Roaming'),'npm','node_modules','@openai','codex','bin','codex.js');
  try{await access(entry);return {command:process.execPath,prefix:[entry]};}catch{}
 }
 return {command:'codex',prefix:[]};
}

export async function runCodex(args,{cwd,input='',timeoutMs=240000,onEvent,env=subscriptionEnvironment()}={}){
 const {command,prefix}=await codexCommand();
 return await new Promise((resolve,reject)=>{
  let stdout='',stderr='',pending='',settled=false,overflow=false,stopReason='';
  const child=spawn(command,[...prefix,...args],{cwd,env,windowsHide:true,stdio:['pipe','pipe','pipe']});
  const stop=()=>{if(!child.pid)return;if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else child.kill('SIGKILL');};
  const timer=setTimeout(()=>{stopReason='Codex n’a pas terminé dans le délai prévu. Le travail pourra être relancé.';stop();},timeoutMs);
  child.stdout.on('data',chunk=>{
   const str=chunk.toString();stdout+=str;pending+=str;
   if(stdout.length>4_000_000){overflow=true;stop();}
   const lines=pending.split('\n');pending=lines.pop();
   for(const line of lines)try{const event=JSON.parse(line);onEvent?.(event);if(['command_execution','file_change','mcp_tool_call','web_search'].includes(event.item?.type)){stopReason='La rédaction a demandé un outil externe, hors du périmètre autorisé de ce worker.';stop();}}catch{}
  });
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-24000);});
  child.on('error',error=>{clearTimeout(timer);if(!settled){settled=true;reject(Error(error.code==='ENOENT'?'Codex CLI est absent. Installez et connectez Codex avec votre compte ChatGPT.':redact(error.message)));}});
  child.on('close',code=>{
   clearTimeout(timer);if(settled)return;settled=true;
   if(stopReason||overflow)return reject(Error(stopReason||'La sortie Codex dépasse la limite attendue.'));
   if(code!==0){const raw=stderr+'\n'+stdout;return reject(Error(/usage limit|rate.limit|quota|out of.*credits|exceeded.*limit/i.test(raw)?'Quota ChatGPT/Codex atteint. Aucune facturation API de secours n’a été utilisée.':`Codex a interrompu le travail (${code}). ${redact(stderr.slice(-900))}`));}
   resolve({stdout,stderr});
  });
  child.stdin.end(input);
 });
}

export async function subscriptionStatus(){
 try{const result=await runCodex(['login','status'],{timeoutMs:20000});const text=result.stdout+'\n'+result.stderr;return {available:true,chatgpt:/logged in using chatgpt/i.test(text),message:/logged in using chatgpt/i.test(text)?'Codex connecté avec ChatGPT.':'Codex doit être connecté avec ChatGPT, pas avec une clé API.'};}
 catch(error){return {available:false,chatgpt:false,message:redact(error.message)};}
}

export async function generateStructured({schema,prompt,workingRoot,timeoutMs=300000}){
 const auth=await subscriptionStatus();if(!auth.chatgpt)throw Error(auth.message);
 const dir=path.join(workingRoot,'generation-'+randomUUID());await mkdir(dir,{recursive:true,mode:0o700});
 const schemaPath=path.join(dir,'schema.json'),outputPath=path.join(dir,'result.json');await writeFile(schemaPath,JSON.stringify(schema),{mode:0o600});
 let usage;
 try{
  await runCodex(['exec','--ignore-user-config','--ignore-rules','--ephemeral','--sandbox','read-only','--skip-git-repo-check','--disable','shell_tool','--color','never','--json','--output-schema',schemaPath,'--output-last-message',outputPath,'-'],{cwd:dir,input:prompt,timeoutMs,onEvent:event=>{if(event.type==='turn.completed')usage=event.usage;}});
  const output=await readFile(outputPath,'utf8');if(output.length>100000)throw Error('Réponse éditoriale trop volumineuse.');
  return {data:JSON.parse(output),usage};
 }finally{await Promise.allSettled([unlink(schemaPath),unlink(outputPath)]);await rmdir(dir).catch(()=>{});}
}
