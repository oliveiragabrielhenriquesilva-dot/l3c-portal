const SECTIONS=new Set(['jogos','classificacao','lideres','equipes','atletas','ranking']);
export function navigationContext(path,search,scope){
 const explicit=search?.get('temporada')||search?.get('s');
 const pathYear=path.match(/^\/temporada\/(20\d{2})(?:\/|$)/)?.[1];
 const context=String(search?.get('context')||'').match(/-(20\d{2})$/)?.[1];
 return {scopeKey:scope?.key||'adulto',base:scope?.base||'/',season:explicit||context||pathYear||scope?.defaultSeasonKey||'',division:search?.get('serie')||''};
}
export function navigationHref(href,context={}){
 if(!href.startsWith('/')||href.startsWith('//'))return href;
 const url=new URL(href,'https://navigation.invalid');
 const parts=url.pathname.split('/').filter(Boolean);
 let section=parts.at(-1);
 if(section==='jogadores')section='atletas';
 if(!SECTIONS.has(section))return href;
 const base=context.base||'/';
 const leaf=context.scopeKey==='master'&&section==='atletas'?'jogadores':section;
 url.pathname=`${base}${leaf}/`;
 if(context.season)url.searchParams.set('temporada',context.season);
 if(context.division)url.searchParams.set('serie',context.division);
 return url.pathname+url.search+url.hash;
}
