import {siteOrigin} from '../lib/site-origin';
import {getScopes,sectionPath,scopeHome,scopeHasRanking} from '../lib/scopes';
export default async function sitemap(){
  const base=siteOrigin();
  const paths=['/','/jogos/','/classificacao/','/lideres/','/equipes/','/atletas/','/fantasy/','/temporadas/','/noticias/','/sobre/','/master/','/master/jogos/','/master/classificacao/','/master/lideres/','/master/equipes/','/master/jogadores/','/arbitros/','/temporada-2027/'];
  try{
    for(const sc of await getScopes()){
      if(scopeHasRanking(sc))paths.push(sectionPath(sc,'ranking'));
      if(sc.key==='adulto'||sc.key==='master')continue;
      paths.push(scopeHome(sc),...['jogos','classificacao','lideres','equipes','atletas'].map(s=>sectionPath(sc,s)));
    }
  }catch{}
  return [...new Set(paths)].map(p=>({url:base+p,lastModified:new Date()}));
}
