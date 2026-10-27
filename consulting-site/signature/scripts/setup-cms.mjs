import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'.local/cms');
await mkdir(dir,{recursive:true,mode:0o700});
try{await readFile(resolve(dir,'config.json'));console.log('Administration déjà configurée. Le code local se trouve dans .local/admin-access.txt.');process.exit(0)}catch{}
const php=process.env.PHP_BINARY||(process.platform==='win32'?'C:/wamp64/bin/php/php8.2.0/php.exe':'php');
const code=randomBytes(15).toString('base64url');
const hashed=spawnSync(php,['-r',"echo password_hash(trim(stream_get_contents(STDIN)), PASSWORD_DEFAULT);"],{input:code,encoding:'utf8',windowsHide:true});
if(hashed.status!==0||!hashed.stdout.startsWith('$2'))throw new Error('Impossible de créer le code avec PHP. Configurez PHP_BINARY.');
await writeFile(resolve(dir,'config.json'),JSON.stringify({codeHash:hashed.stdout.trim()}),{mode:0o600});
await writeFile(resolve(root,'.local/admin-access.txt'),`Administration B&M (local)\nAdresse : http://127.0.0.1:4348/gestion-realisations/\nCode : ${code}\n`,{mode:0o600});
console.log('Administration configurée. Code enregistré dans .local/admin-access.txt (non publié).');
