import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const required=['app/team/[slug]/page.js','app/page.js','app/player/[slug]/page.js','app/event/[slug]/page.js','app/adriano/page.js','app/master/page.js','components/HomeCompetitionHub.js','components/SiteChrome.js','data/legacy-2025.json','data/legacy-2026.json','data/master-2026.json','public/assets/brand/adriano-ia.png','public/assets/brand/master-logo-v0518.png'];
let ok=true;
for(const f of required){if(!fs.existsSync(path.join(root,f))){console.error('FALTANDO',f);ok=false;}}
const datasets={};
for(const f of ['data/legacy-2025.json','data/legacy-2026.json','data/master-2026.json']){try{const d=JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));datasets[f]=d;console.log(`${f}: ${d.teams?.length||0} equipes, ${d.athletes?.length||0} atletas, ${d.games?.length||0} jogos`)}catch(e){console.error('JSON inválido',f,e.message);ok=false;}}
const slug=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const cassio='cassio-marcelo-goulart-david';
for(const [f,d] of Object.entries(datasets)){const athlete=(d.athletes||[]).find(a=>slug(a.name)===cassio);if(!athlete){console.error('CÁSSIO NÃO ENCONTRADO EM',f);ok=false;continue;}const boxGames=(d.games||[]).filter(g=>(g.boxScore||[]).some(r=>Number(r.wordpressAthleteId)===Number(athlete.wordpressId))).length;console.log(`${f}: Cássio OK · ${boxGames} jogos com boxscore`)}

const old25=datasets['data/legacy-2025.json'];
if(old25){
  const rows=(old25.games||[]).flatMap(g=>g.boxScore||[]);
  const reb=rows.reduce((n,r)=>n+Number(r.totalRebounds??0),0);
  const stl=rows.reduce((n,r)=>n+Number(r.steals??0),0);
  if(reb<=0){console.error('REBOTES 2025 NÃO RECUPERADOS');ok=false;} else console.log(`2025 REB: ${reb}`);
  if(stl<=0){console.error('ROUBOS 2025 NÃO RECUPERADOS');ok=false;} else console.log(`2025 STL: ${stl}`);
}

const playerPage=fs.readFileSync(path.join(root,'app/player/[slug]/page.js'),'utf8');
for(const token of ['Carreira e categorias','categoria=','temporada=','Master','Adulto'])if(!playerPage.includes(token)){console.error('Perfil carreira/categoria/temporada incompleto:',token);ok=false;}

// v0.5.12: vínculos reais por categoria; categorias sem participação não recebem placeholders.
for(const token of ['player-profile-v057','CareerHeroRelations','CategoryCareerCard','Vínculos por categoria','Equipe atual','Equipe anterior'])if(!playerPage.includes(token)){console.error('Perfil 0.5.12 incompleto:',token);ok=false;}
for(const forbidden of ['Sem vínculo atual','Nenhuma participação registrada','Sem participação'])if(playerPage.includes(forbidden)){console.error('Perfil 0.5.12 contém placeholder de categoria sem participação:',forbidden);ok=false;}
const andreSlug='andre-cesar-comparini-arcolino';
const adult26=datasets['data/legacy-2026.json'],adult25=datasets['data/legacy-2025.json'],master26=datasets['data/master-2026.json'];
const findAthlete=(d)=>{const a=(d?.athletes||[]).find(x=>slug(x.name)===andreSlug);if(!a)return null;const t=(d?.teams||[]).find(x=>Number(x.wordpressId)===Number(a.wordpressTeamId));return {athlete:a,team:t?.name||null};};
const a26=findAthlete(adult26),a25=findAthlete(adult25),am=findAthlete(master26);
if(a26?.team!=='Athletics'||a25?.team!=='XD Basketball'||am){console.error('Trajetória de André divergente',{a26:a26?.team,a25:a25?.team,master:am?.team});ok=false;}else console.log('André: equipe atual Athletics · anterior XD Basketball · sem participação Master');

const home=fs.readFileSync(path.join(root,'app/page.js'),'utf8');
for(const token of ['home-v0513-hero','<Sponsors/>','Próximos jogos','Últimos resultados','Finais 2026','HomeCompetitionHub','home-v0513-team-grid','home-v0513-editorial','/assets/brand/forjax-logo.png'])if(!home.includes(token)){console.error('Home 0.5.13 incompleta:',token);ok=false;}
const adriano=fs.readFileSync(path.join(root,'app/adriano/page.js'),'utf8');
for(const token of ['Central editorial','Jornalista virtual','IA da Liga 3 Colinas','Arquivo do AdrIAno','Como funciona'])if(!adriano.includes(token)){console.error('Central AdrIAno incompleta:',token);ok=false;}
const chrome=fs.readFileSync(path.join(root,'components/SiteChrome.js'),'utf8');
for(const token of ['CommercialPartners','Forjax CT','Fotos Oficiais','Franca Esportes','commercial-partner-row three','commercial-partner-row four'])if(!chrome.includes(token)){console.error('Rodapé comercial incompleto:',token);ok=false;}
const event=fs.readFileSync(path.join(root,'app/event/[slug]/page.js'),'utf8');
if(!event.includes('game-adriano-rich')){console.error('Resenha rica do AdrIAno ausente da partida');ok=false;}
for(const token of ['mvp-v0511','mvp-card-v0511','game-leaders-list-v0511','game-leader-row v0511','Ver boxscore ↓','id="boxscore"'])if(!event.includes(token)){console.error('Página de partida 0.5.11 incompleta:',token);ok=false;}
// v0.5.5: auditoria estatística integral do Cássio em 2025.
if(old25){
  const athlete=(old25.athletes||[]).find(a=>slug(a.name)===cassio);
  const cassioRows=(old25.games||[]).flatMap(g=>(g.boxScore||[]).filter(r=>Number(r.wordpressAthleteId)===Number(athlete?.wordpressId)));
  const cReb=cassioRows.reduce((n,r)=>n+Number(r.totalRebounds??r.rebounds??0),0);
  const cStl=cassioRows.reduce((n,r)=>n+Number(r.steals||0),0);
  const cEff=cassioRows.reduce((n,r)=>n+Number(r.efficiency||0),0);
  if(cassioRows.length!==8||cReb!==60||cStl!==5||cEff!==97){console.error('Cássio 2025 divergente',{games:cassioRows.length,reb:cReb,stl:cStl,eff:cEff});ok=false;}else console.log('Cássio 2025: 8 jogos · 60 REB · 5 STL · 97 EFI · média EFI 12,1');
}
for(const token of ['Posição nos rankings','Melhores marcas ·','player-detail-grid','Jogos de','Carreira e categorias','player-profile-v056','Perfil único · carreira consolidada','Selecione uma temporada'])if(!playerPage.includes(token)){console.error('Perfil 0.5.6 incompleto:',token);ok=false;}
const css=fs.readFileSync(path.join(root,'app/globals.css'),'utf8');
for(const token of ['player-profile-v056','player-record-context','player-season-prompt','player-v056-quick','position:relative!important'])if(!css.includes(token)){console.error('CSS 0.5.6 incompleto:',token);ok=false;}
const teamPage=fs.readFileSync(path.join(root,'app/team/[slug]/page.js'),'utf8');
for(const token of ['Elenco completo','team-v057-roster-grid','seasonTab(2025)','Classificação da Série','Histórico da franquia','team-v057-bottom-grid','Resumo da franquia','Títulos da franquia','Temporadas vinculadas','Melhor resultado','team-v059-hero-honors','heroHonors','Bicampeão'])if(!teamPage.includes(token)){console.error('Página de equipe 0.5.7 incompleta:',token);ok=false;}
if(teamPage.includes('roster.slice(')){console.error('Elenco está sendo cortado na página de equipe');ok=false;}
const hnk26=datasets['data/legacy-2026.json'];
if(hnk26){const t=(hnk26.teams||[]).find(x=>slug(x.name)==='hnk');const count=(hnk26.athletes||[]).filter(a=>Number(a.wordpressTeamId)===Number(t?.wordpressId)).length;if(count!==18){console.error('HNK 2026 deveria ter 18 atletas, encontrado:',count);ok=false;}else console.log('HNK 2026: 18 atletas no elenco completo');}
const siteLib=fs.readFileSync(path.join(root,'lib/site.js'),'utf8');
for(const token of ['franchiseTitles','Wolves','Ducks','SJ Basquete'])if(!siteLib.includes(token)){console.error('Histórico de títulos incompleto:',token);ok=false;}
const homeHub=fs.readFileSync(path.join(root,'components/HomeCompetitionHub.js'),'utf8');
for(const token of ['home-v0513-table','Últimos 5','home-v0513-leaders'])if(!homeHub.includes(token)){console.error('Hub Home 0.5.13 incompleto:',token);ok=false;}
const homeCss=fs.readFileSync(path.join(root,'app/globals.css'),'utf8');
for(const token of ['v0.5.13 · HOME','home-v0513-hero','home-v0513-editorial-grid','O rodapé comercial'])if(!homeCss.includes(token)){console.error('CSS Home 0.5.13 incompleto:',token);ok=false;}
if(!ok)process.exit(1);
console.log('Estrutura essencial 0.5.13: OK');

// v0.5.14 — Home Master replica a arquitetura homologada e AdrIAno cobre todas as partidas finalizadas.
const masterHome=fs.readFileSync(path.join(root,'app/master/page.js'),'utf8');
for(const token of ['home-v0513-hero','Liga Master · Temporada 2026','Próximos jogos','Últimos resultados','Classificação','Líderes da temporada','master-v0514-team-grid','categoria=master&temporada=2026'])if(!masterHome.includes(token)){console.error('Home Master 0.5.14 incompleta:',token);ok=false;}
const currentSiteLib=fs.readFileSync(path.join(root,'lib/site.js'),'utf8');
for(const token of ['generatedAdrianoReviews','ADRIANO_CURATED','MASTER_2026','LEGACY_2025','category:\'adulto\''])if(!currentSiteLib.includes(token)){console.error('AdrIAno 0.5.14 incompleto:',token);ok=false;}
if(event.includes("!isMaster && seasonYear === 2026")){console.error('AdrIAno ainda está restrito a Adulto 2026 na página de partida');ok=false;}
for(const [f,d] of Object.entries(datasets)){
  const finished=(d.games||[]).filter(g=>String(g.status||'').toUpperCase()==='FINISHED').length;
  if(finished<=0){console.error('Dataset sem jogos finalizados para AdrIAno:',f);ok=false;} else console.log(`${f}: ${finished} jogos finalizados elegíveis ao AdrIAno`);
}
if(!ok)process.exit(1);
console.log('Estrutura adicional 0.5.14: OK');

// v0.5.15 — unificação das páginas públicas restantes sem redesenhar páginas homologadas.
const portalFiles={
  classificacao:'app/classificacao/page.js',
  jogos:'app/jogos/page.js',
  equipes:'app/equipes/page.js',
  atletas:'app/atletas/page.js',
  lideres:'app/lideres/page.js',
  recordes:'app/recordes/page.js',
  temporadas:'app/temporadas/page.js',
  temporada2027:'app/temporada-2027/page.js',
  noticias:'app/noticias/page.js',
  sobre:'app/sobre/page.js',
  busca:'app/buscar/page.js',
  masterClassificacao:'app/master/classificacao/page.js',
  masterJogos:'app/master/jogos/page.js',
  masterEquipes:'app/master/equipes/page.js',
  masterJogadores:'app/master/jogadores/page.js',
  masterLideres:'app/master/lideres/page.js',
};
for(const [name,file] of Object.entries(portalFiles)){
  const full=path.join(root,file);
  if(!fs.existsSync(full)){console.error('Página 0.5.15 ausente:',name,file);ok=false;continue;}
  const body=fs.readFileSync(full,'utf8');
  const delegatedViews={classificacao:'ClassificacaoView',jogos:'JogosView',equipes:'EquipesView',atletas:'AtletasView',lideres:'LideresView',masterClassificacao:'ClassificacaoView',masterJogos:'JogosView',masterEquipes:'EquipesView',masterJogadores:'AtletasView',masterLideres:'LideresView',temporada2027:'PreSeasonHome'};
  const delegated=delegatedViews[name];
  const validDelegation=delegated&&body.includes(`<${delegated}`)&&body.includes(`components/${delegated==='PreSeasonHome'?'PreSeasonHome':delegated==='LideresView'?'LideresView':'PortalViews'}`);
  const recordsRedirect=name==='recordes'&&body.includes("redirect(category==='master'?'/master/lideres/?aba=recordes':'/lideres/?aba=recordes')");
  if(!body.includes('portal-directory-page')&&!validDelegation&&!recordsRedirect){console.error('Página fora da arquitetura unificada:',name);ok=false;}
}
const portalDirectory=fs.readFileSync(path.join(root,'components/PortalDirectory.js'),'utf8');
for(const token of ['ContextNav','KpiStrip','FilterBar','TeamDirectoryCard','AthleteDirectoryCard','PageIntro','EmptyPortal'])if(!portalDirectory.includes(token)){console.error('Componente público 0.5.15 incompleto:',token);ok=false;}
const finalCss=fs.readFileSync(path.join(root,'app/globals.css'),'utf8');
for(const token of ['0.5.15 · remaining public pages','portal-context-nav','portal-filter-form','portal-team-directory-grid','portal-athlete-directory-grid','portal-season-grid','portal-2027-hero','portal-search-results'])if(!finalCss.includes(token)){console.error('CSS 0.5.15 incompleto:',token);ok=false;}
for(const token of ['Jogo · Adulto Livre 2026','Jogo · Liga Master 2026','Notícia'])if(!currentSiteLib.includes(token)){console.error('Busca unificada 0.5.15 incompleta:',token);ok=false;}
if(!ok)process.exit(1);
console.log('Estrutura adicional 0.5.15: OK');


// v0.5.18 — logo Master com URL nova para invalidar cache + atleta transferido na mesma temporada.
const masterLogoPath='/assets/brand/master-logo-v0518.png';
if(!masterHome.includes(masterLogoPath)){console.error('Home Master não usa logo cache-busted 0.5.18');ok=false;}
if(!chrome.includes(masterLogoPath)){console.error('Chrome Master não usa logo cache-busted 0.5.18');ok=false;}
if(!finalCss.includes('.master-v0514-art>img{width:min(390px,85%);max-height:330px;object-fit:contain;image-rendering:auto}')){console.error('Logo Master não espelha dimensões do portal WordPress');ok=false;}
for(const token of ['contextTeamStints','contextTeamsLabel','Transferência na temporada','selectedHasTransfer','player-game-team'])if(!playerPage.includes(token)){console.error('Perfil com transferência 0.5.18 incompleto:',token);ok=false;}

if(adult26){
  const mateus=(adult26.athletes||[]).find(a=>slug(a.name)==='mateus-mata-de-sousa');
  if(!mateus){console.error('Mateus Mata não encontrado no Adulto 2026');ok=false;}
  else{
    const teamById=new Map((adult26.teams||[]).map(t=>[Number(t.wordpressId),t.name]));
    const appearances=(adult26.games||[]).flatMap(g=>(g.boxScore||[]).filter(r=>Number(r.wordpressAthleteId)===Number(mateus.wordpressId)).map(r=>({date:g.scheduledAtLegacy,team:teamById.get(Number(r.wordpressTeamId))||'',game:g.title}))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const teams=[...new Set(appearances.map(x=>x.team).filter(Boolean))];
    const latest=appearances[appearances.length-1]?.team||'';
    if(!teams.includes('Wolves')||!teams.includes('Brewers')||latest!=='Brewers'){
      console.error('Transferência de Mateus 2026 divergente',{teams,latest,appearances});ok=false;
    }else console.log(`Mateus 2026: ${appearances.length} jogos · Wolves → Brewers · equipe atual Brewers`);
  }
}
if(!ok)process.exit(1);
console.log('Estrutura adicional 0.5.18: OK');
