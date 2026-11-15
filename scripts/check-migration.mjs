import {domainSettings} from '../lib/domain-config.mjs';
const cfg=domainSettings();
const api=new URL(process.env.L3C_API_URL||'https://api-stats.liga3colinas.com.br/api');
if(api.origin===cfg.origin)throw new Error('A API deve permanecer em sua própria origem.');
const cutover=process.argv.includes('--cutover');
if(cutover){
 if(!cfg.main)throw new Error('A virada exige o domínio principal configurado.');
 if(process.env.L3C_PUBLIC_INDEXING!=='true')throw new Error('Defina L3C_PUBLIC_INDEXING=true no domínio principal.');
 if(!cfg.wordpress)throw new Error('Valide e configure a instalação legada do WordPress antes da virada.');
}
console.log('Configuração de domínio, API e redirecionamentos: OK');
if(process.argv.includes('--online')){
 for(const path of ['/','/robots.txt','/sitemap.xml','/entrar','/minha-conta','/transmissao','/master/jogos','/equipes?temporada=2027']){
  const response=await fetch(cfg.origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  if(response.status>=400)throw new Error(`${path}: HTTP ${response.status}`);
  if(path==='/sitemap.xml'&&!(await response.text()).includes(cfg.origin))throw new Error('O sitemap não contém a origem canônica.');
  if(response.status>=300){const target=new URL(response.headers.get('location')||'',cfg.origin);if(target.origin!==cfg.origin)throw new Error(`${path}: redirecionamento inesperado para outro domínio.`)}
  console.log(`${path}: HTTP ${response.status}`);
 }
 if(cfg.wordpress){const response=await fetch(cfg.wordpress+'/wp-json/',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('WordPress legado indisponível.');console.log('WordPress legado: responde ao endpoint público. Automações precisam de ensaio próprio.');}
 if(cfg.main&&cfg.redirectOld){
  const source='https://liga3colinas.com.br/master/jogos?temporada=2026';
  const response=await fetch(source,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  const location=response.headers.get('location');
  if(![301,308].includes(response.status)||!location)throw new Error('O host novo ainda não redireciona permanentemente.');
  const destination=new URL(location,source);
  if(destination.origin!==cfg.origin||destination.pathname!=='/master/jogos'||destination.search!=='?temporada=2026')throw new Error('O redirecionamento perdeu caminho ou temporada.');
  console.log('Host novo → principal: preserva caminho e parâmetros.');
 }
}
