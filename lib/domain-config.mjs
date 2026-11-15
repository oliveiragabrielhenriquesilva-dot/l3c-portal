export function domainSettings(env=process.env){
 const raw=env.NEXT_PUBLIC_SITE_URL||'https://liga3colinas.com.br';
 const site=new URL(raw);
 if(site.protocol!=='https:'||site.username||site.password||!['liga3colinas.com.br','liga3colinas.com.br'].includes(site.hostname)||site.pathname!=='/'||site.search||site.hash)throw new Error('NEXT_PUBLIC_SITE_URL deve ser a origem HTTPS do portal novo ou do domínio principal.');
 const redirectOld=env.L3C_REDIRECT_OLD_DOMAIN==='true';
 if(redirectOld&&site.hostname!=='liga3colinas.com.br')throw new Error('Ative o redirecionamento do novo somente com o domínio principal configurado.');
 let wordpress=null;
 if(env.L3C_LEGACY_WORDPRESS_ORIGIN){
  const wp=new URL(env.L3C_LEGACY_WORDPRESS_ORIGIN);
  if(wp.protocol!=='https:'||wp.username||wp.password||wp.pathname!=='/'||wp.search||wp.hash||['liga3colinas.com.br','liga3colinas.com.br','www.liga3colinas.com.br'].includes(wp.hostname))throw new Error('O WordPress legado precisa de uma origem HTTPS separada do portal.');
  wordpress=wp.origin;
 }
 if(env.L3C_REQUIRE_LEGACY_WORDPRESS==='true'&&!wordpress)throw new Error('Configure o WordPress legado antes de ativar a mudança de domínio.');
 return {origin:site.origin,main:site.hostname==='liga3colinas.com.br',redirectOld,wordpress};
}
export function canonicalRedirects(env=process.env){
 const cfg=domainSettings(env);
 return [
  ...(cfg.main?[{source:'/:path*',has:[{type:'host',value:'www.liga3colinas.com.br'}],destination:`${cfg.origin}/:path*`,permanent:true}]:[]),
  ...(cfg.redirectOld?[{source:'/:path*',has:[{type:'host',value:'liga3colinas.com.br'}],destination:`${cfg.origin}/:path*`,permanent:true}]:[]),
 ];
}
