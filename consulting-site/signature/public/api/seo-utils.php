<?php
declare(strict_types=1);
if(!defined('BM_SEO_INTERNAL')){http_response_code(404);exit;}
function bmSeoEscape(string $value): string {return htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function bmSeoSettings(string $root): array {return json_decode((string)@file_get_contents($root.'/assets/seo-settings.json'),true)?:['origin'=>'','indexing'=>false];}
function bmSeoEnglish(array $project): bool {foreach(['summary','need','response'] as $field)if(trim((string)($project['translations']['en'][$field]??''))==='')return false;return true;}
function bmSeoTest(array $project): bool {return !empty($project['isTest'])||preg_match('/^(?:test-|exemple-)/',(string)($project['slug']??''))===1;}
function bmProjectSeo(array $project,array $settings,bool $english,bool $preview,string $slug): array {
 $hasEnglish=bmSeoEnglish($project);if($english&&$hasEnglish)$project=array_replace($project,$project['translations']['en']);
 $origin=rtrim((string)($settings['origin']??''),'/');$url=$origin.($english?'/en':'').'/realisations/'.$slug;
 $index=!empty($settings['indexing'])&&!bmSeoTest($project)&&!$preview&&(!$english||$hasEnglish);
 $name=preg_replace('/^TEST\s*[—-]\s*/u','',(string)($project['name']??'B&M'));$description=(string)($project['summary']??'');
 $head='<title>'.bmSeoEscape($name.' | B&M Digital Consulting').'</title><meta name="description" content="'.bmSeoEscape($description).'"><meta name="robots" content="'.($index?'index,follow,max-image-preview:large':'noindex,follow').'">';
 $head.='<meta property="og:title" content="'.bmSeoEscape($name.' | B&M Digital Consulting').'"><meta property="og:description" content="'.bmSeoEscape($description).'"><meta property="og:type" content="article"><meta property="og:site_name" content="B&M Digital Consulting"><meta property="og:locale" content="'.($english?'en_GB':'fr_FR').'"><meta name="twitter:card" content="summary_large_image">';
 if($origin!==''){$head.='<link rel="canonical" href="'.bmSeoEscape($url).'"><meta property="og:url" content="'.bmSeoEscape($url).'"><meta property="og:image" content="'.bmSeoEscape($origin.'/assets/opengraph-'.($english?'en':'fr').'.png').'">';
  if(!$preview&&!bmSeoTest($project)&&$hasEnglish)foreach(['fr','en'] as $lang)$head.='<link rel="alternate" hreflang="'.$lang.'" href="'.bmSeoEscape($origin.($lang==='en'?'/en':'').'/realisations/'.$slug).'">';
 }
 $fallback='<section class="folio-loading wrap"><h1>'.bmSeoEscape($name).'</h1><p>'.bmSeoEscape($description).'</p>';
 foreach(['need'=>$english?'Context':'Contexte','response'=>$english?'Our contribution':'Notre intervention','outcome'=>$english?'Results':'Résultats'] as $field=>$label)if(!empty($project[$field]))$fallback.='<h2>'.$label.'</h2><p>'.nl2br(bmSeoEscape((string)$project[$field])).'</p>';
 return ['head'=>'<!--seo:start-->'.$head.'<!--seo:end-->','fallback'=>$fallback.'</section>','index'=>$index];
}
function bmProjectsSitemap(array $projects,array $settings): string {
 $xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
 if(!empty($settings['indexing']))foreach($projects as $item){$live=$item['live']??(($item['status']??'')==='published'&&!array_key_exists('live',$item)?$item:null);if(!$live||bmSeoTest($live)||!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/',(string)($live['slug']??'')))continue;
  foreach(bmSeoEnglish($live)?['fr','en']:['fr'] as $lang)$xml.='<url><loc>'.bmSeoEscape(rtrim((string)$settings['origin'],'/').($lang==='en'?'/en':'').'/realisations/'.$live['slug']).'</loc></url>';
 }
 return $xml.'</urlset>';
}
