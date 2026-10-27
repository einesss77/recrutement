import './build.mjs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
const phpBinary=process.env.PHP_BINARY||(process.platform==='win32'?'C:/wamp64/bin/php/php8.2.0/php.exe':'php');
const port=Number(process.env.CMS_PORT||4348),root=resolve(import.meta.dirname,'../dist');
const php=spawn(phpBinary,['-d','upload_max_filesize=8M','-d','post_max_size=10M','-S',`127.0.0.1:${port}`,'-t',root,resolve(root,'router.php')],{windowsHide:true,stdio:'inherit',env:process.env});
php.on('error',e=>{console.error('PHP indisponible : configurez PHP_BINARY.',e.message);process.exitCode=1});php.on('exit',code=>{process.exitCode=code||0});process.on('SIGINT',()=>php.kill());process.on('SIGTERM',()=>php.kill());process.on('exit',()=>php.kill());console.log(`B&M CMS + site : http://127.0.0.1:${port} · admin : /gestion-realisations/`);
