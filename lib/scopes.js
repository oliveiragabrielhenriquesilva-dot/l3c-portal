// Catálogo de portais do SITE, montado a partir do cadastro do L3C Stats (API pública /v1/public/directory).
//
// Regra de ouro: NENHUMA competição ou temporada é cadastrada aqui. Quando uma temporada pública é criada
// (ou ativada) no L3C Stats, ela aparece sozinha nos menus e ganha todas as páginas-modelo:
// Jogos, Classificação, Líderes e Recordes, Equipes, Atletas, página da equipe, do atleta e a súmula.
//
// Os únicos casos especiais são as temporadas históricas que vieram do WordPress (arquivos JSON do SITE):
// Adulto 2025, Adulto 2026 e Master 2026. Elas entram no mesmo modelo por meio de "source".
import {
  getDirectorySeasons,scopeKeyOf,slugify,SEASON_ID,MASTER_SEASON_ID,
  getOverview,getArchive2025Overview,getArchive2025Campaign,getMasterOverview,getSeasonOverviewById,
  standingsFallback,teamLogo,getBestGames,getMasterBestGames,getSeasonHighs,mergeBests,mergeRecords,
  getArchive2025Records,getArchive2026Records,getMasterRecords,
  eventSlugForGame,archive2025GameSlug,masterGameSlug,
} from './site';
import {homeMode} from './home-mode';
import {brandForSeason} from './season-brand';

const ARCHIVE_2025_ID='legacy_season_adulto_livre_2025';

// Seções (páginas-modelo) de todo portal.
export const SECTIONS=[['jogos','Jogos'],['classificacao','Classificação'],['lideres','Líderes'],['equipes','Equipes'],['atletas','Atletas']];

// Endereços dos portais que já existiam antes do catálogo (mantidos para não quebrar links).
const BASES={adulto:'/',master:'/master/'};
const SECTION_PATH={
  adulto:{jogos:'/jogos/',classificacao:'/classificacao/',lideres:'/lideres/',ranking:'/ranking/',equipes:'/equipes/',atletas:'/atletas/'},
  master:{jogos:'/master/jogos/',classificacao:'/master/classificacao/',lideres:'/master/lideres/',ranking:'/master/ranking/',equipes:'/master/equipes/',atletas:'/master/jogadores/'},
};
import {RANKING_MIN_YEAR} from './site-config';
// O ranking oficial só vale para temporadas do L3C Stats a partir de RANKING_MIN_YEAR.
export function rankingAvailable(season){return Boolean(season)&&season.source==='api'&&Number(season.year||0)>=RANKING_MIN_YEAR}
export function scopeHasRanking(scope){return (scope?.seasons||[]).some(rankingAvailable)}
export function sectionPath(scope,section){
  const known=SECTION_PATH[scope?.key];
  if(known)return known[section]||known.jogos;
  return `/c/${scope.key}/${section}/`;
}
export function scopeHome(scope){return BASES[scope?.key]||`/c/${scope.key}/`}

function sourceOf(id){
  if(id===ARCHIVE_2025_ID)return 'archive2025';
  if(id===SEASON_ID)return 'adulto2026';
  if(id===MASTER_SEASON_ID)return 'master';
  return 'api';
}
const STATUS_RANK={ACTIVE:3,REGISTRATION_OPEN:2,PLANNING:1};

// Temporadas históricas que precisam existir mesmo se a API estiver fora do ar.
const FALLBACK=[
  {id:ARCHIVE_2025_ID,year:2025,officialName:'Liga 3 Colinas',status:'FINISHED',scopeKey:'adulto',competition:{name:'Adulto Livre',category:'Adulto Livre'}},
  {id:SEASON_ID,year:2026,officialName:'Liga Forjax de Basquete',status:'FINISHED',scopeKey:'adulto',featured:true,competition:{name:'Adulto Livre',category:'Adulto Livre'}},
  {id:MASTER_SEASON_ID,year:2026,officialName:'Liga Master',status:'ACTIVE',scopeKey:'master',featured:true,competition:{name:'Master',category:'Master'}},
];

function scopeName(key,competition){
  if(key==='adulto')return 'Adulto Livre';
  if(key==='master')return 'Liga Master';
  return competition?.name||key;
}

// Cache curto por processo para evitar refazer a mesma montagem de menus em
// renderizacoes simultaneas. Nao guarda dados de usuario/sessao e nao interfere
// no placar ao vivo. Expira automaticamente; falhas nao ficam memorizadas.
let _scopesCache={expires:0,value:null,pending:null};
export async function getScopes(){
  const now=Date.now();
  if(_scopesCache.value&&now<_scopesCache.expires)return _scopesCache.value;
  if(_scopesCache.pending)return _scopesCache.pending;
  const pending=buildScopes();
  _scopesCache.pending=pending;
  try{
    const value=await pending;
    _scopesCache.value=value;
    _scopesCache.expires=Date.now()+30000;
    return value;
  }finally{
    if(_scopesCache.pending===pending)_scopesCache.pending=null;
  }
}
async function buildScopes(){
  const dir=await getDirectorySeasons();
  const rows=[...dir];
  for(const fb of FALLBACK)if(!rows.some(r=>r.id===fb.id))rows.push(fb);
  const byScope=new Map();
  for(const row of rows){
    if(!row?.id)continue;
    const key=row.scopeKey||scopeKeyOf(row.competition);
    const scope=byScope.get(key)||{key,name:scopeName(key,row.competition),competition:{name:row.competition?.name||'',category:row.competition?.category||'',logoUrl:null},seasons:[]};
    scope.competition.logoUrl=scope.competition.logoUrl||row.competition?.logoUrl||null;
    scope.seasons.push({
      id:row.id,year:Number(row.year)||null,name:row.name||String(row.year||''),officialName:row.officialName||null,
      logoUrl:row.logoUrl||null,status:row.status||'PLANNING',featured:Boolean(row.featured),featuredManual:Boolean(row.featuredManual),preSeason:row.preSeason||null,startDate:row.startDate||null,endDate:row.endDate||null,
      source:sourceOf(row.id),scopeKey:key,
      competitionName:row.competition?.name||'',competitionLogo:row.competition?.logoUrl||null,
    });
    byScope.set(key,scope);
  }
  const scopes=[];
  for(const scope of byScope.values()){
    // Menu: temporadas do mais novo para o mais antigo; temporada ainda em planejamento só aparece se for a destacada.
    const sorted=[...scope.seasons].sort((a,b)=>(b.year||0)-(a.year||0));
    const years=new Map();
    for(const s of sorted){const n=sorted.filter(x=>x.year===s.year).length;s.key=n>1?s.id:String(s.year)}
    // Temporada em planejamento aparece como PRÉ-TEMPORADA (página própria) quando é a destacada.
    const visible=sorted.filter(s=>s.status!=='PLANNING'||s.featured||s.featuredManual||typeof s.preSeason?.enabled==='boolean'||s.source!=='api');
    const labeled=s=>({...s,label:`${s.officialName||scope.name} ${s.year||''}`.trim()});
    scope.seasons=(visible.length?visible:sorted).map(labeled);
    scope.allSeasons=sorted.map(labeled);
    const candidate2027=scope.seasons.find(s=>s.year===2027);
    const featured=(scope.key==='adulto'&&homeMode(candidate2027,process.env.L3C_HOME_MODE)!=='legacy2026'?candidate2027:null)||scope.seasons.find(s=>s.featured);
    const open=[...scope.seasons].sort((a,b)=>(STATUS_RANK[b.status]||0)-(STATUS_RANK[a.status]||0)||(b.year||0)-(a.year||0))[0];
    scope.defaultSeasonKey=(featured||open||scope.seasons[0]).key;
    scope.base=scopeHome(scope);
    scope.logo=scope.seasons.find(s=>s.competitionLogo)?.competitionLogo||scope.competition.logoUrl||null;
    scopes.push(scope);
  }
  // Ordem fixa para os dois portais históricos; os demais por nome.
  const order=k=>k==='adulto'?0:k==='master'?1:2;
  return scopes.sort((a,b)=>order(a.key)-order(b.key)||a.name.localeCompare(b.name,'pt-BR'));
}

export async function getScope(key){
  const scopes=await getScopes();
  return scopes.find(s=>s.key===String(key))||null;
}
export function pickSeason(scope,wanted){
  if(!scope)return null;
  const w=String(wanted||'');
  return scope.seasons.find(s=>s.key===w||s.id===w)||scope.seasons.find(s=>s.key===scope.defaultSeasonKey)||scope.seasons[0]||null;
}

// Identidade pública da temporada: logo cadastrada da temporada, nome oficial e selo (logo cadastrada da competição).
export function brandOf(scope,season){
  const fb=brandForSeason(season?.source==='master'?'master':season?.year);
  const compLogo=season?.competitionLogo||scope?.logo||null;
  const logo=season?.logoUrl||compLogo||fb.logo;
  const seal=season?.logoUrl&&compLogo&&compLogo!==season.logoUrl?compLogo:null;
  return {league:season?.officialName||scope?.name||fb.league,logo,seal,sealAlt:`Selo ${scope?.name||''}`.trim()};
}

// ------- Dados da temporada, no mesmo formato para qualquer origem -------
const EMPTY={players:[],teams:[],legacyGames:[],campaign:[],summary:{}};
function rowsFromCampaign(list=[]){
  return list.map(x=>({
    team:x.team,games:Number(x.games||0),wins:Number(x.wins||0),losses:Number(x.losses||0),
    pointsFor:Number(x.pointsFor||0),pointsAgainst:Number(x.pointsAgainst||0),diff:Number(x.diff??(Number(x.pointsFor||0)-Number(x.pointsAgainst||0))),
    points:x.classificationPoints!=null?Number(x.classificationPoints):Number(x.wins||0)*2+Number(x.losses||0),
  }));
}
function rowsFromSeries(list=[]){
  return list.map(x=>({
    team:{id:x.name,name:x.name,logoUrl:teamLogo(x.name)},games:Number(x.j||0),wins:Number(x.v||0),losses:Number(x.d||0),
    pointsFor:Number(x.pf||0),pointsAgainst:Number(x.pa||0),diff:Number(x.saldo||0),points:Number(x.pts||0),
  }));
}
export async function loadSeason(season){
  if(!season)return {data:EMPTY,groups:[]};
  if(season.source==='archive2025'){
    const rows=rowsFromCampaign(getArchive2025Campaign());
    return {data:getArchive2025Overview(),groups:[{key:'geral',label:'Classificação',rows}]};
  }
  if(season.source==='adulto2026'){
    const st=standingsFallback()||{};
    const groups=[['ouro','Série Ouro'],['prata','Série Prata'],['bronze','Série Bronze']].filter(([k])=>(st[k]||[]).length).map(([k,label])=>({key:k,label,rows:rowsFromSeries(st[k])}));
    return {data:await getOverview(),groups};
  }
  const data=season.source==='master'?await getMasterOverview():await getSeasonOverviewById(season.id);
  const d=data||EMPTY;
  const campaign=d.campaign||d.teams||[];
  const divisions=d.divisions||[];
  const teamDivision=new Map((d.teams||[]).map(item=>[item.team?.id,item.division?.id]));
  const groups=divisions.length?divisions.map(division=>{
    const official=(d.divisionStandings||[]).find(item=>item.divisionId===division.id)?.data;
    const normalize=rows=>rows.map(row=>({team:row.team,games:row.played,wins:row.wins,losses:row.losses,pointsFor:row.pointsFor,pointsAgainst:row.pointsAgainst,diff:row.difference,classificationPoints:row.classificationPoints}));
    const rows=official?.mode==='CLASSIFICATION'&&Array.isArray(official.rows)?normalize(official.rows):[];
    return {key:String(division.code||division.id).toLowerCase(),label:division.displayName||division.name,rows:rowsFromCampaign(rows)};
  }):[{key:'geral',label:'Classificação',rows:rowsFromCampaign(campaign)}];
  const unassigned=divisions.length?campaign.filter(item=>!teamDivision.get(item.team?.id)):[];
  if(unassigned.length)groups.push({key:'sem-divisao',label:'Sem divisão definida',rows:rowsFromCampaign(unassigned)});
  return {data:d,groups,offline:!data};
}

// Melhor jogo de cada atleta (Líderes) e recordes (Recordes) — arquivos históricos + súmulas do L3C Stats.
export async function seasonBests(season){
  let legacy=new Map();
  if(season.source==='archive2025')legacy=getBestGames('2025');
  else if(season.source==='adulto2026')legacy=getBestGames('2026');
  else if(season.source==='master')legacy=getMasterBestGames();
  let api=new Map();
  try{api=(await getSeasonHighs(season.id)).bests}catch{}
  return mergeBests(legacy,api);
}
const okRecord=r=>r&&Number.isFinite(Number(r.value))&&Number(r.value)>0;
export async function scopeRecords(scope){
  const lists=[];
  for(const s of scope.seasons){
    const tag=r=>({...r,season:String(s.year||''),seasonKey:s.key,seasonId:s.id});
    let legacy=[];
    if(s.source==='archive2025')legacy=getArchive2025Records();
    else if(s.source==='adulto2026')legacy=getArchive2026Records();
    else if(s.source==='master')legacy=getMasterRecords();
    lists.push(legacy.filter(okRecord).map(tag));
    try{lists.push((await getSeasonHighs(s.id)).records.filter(okRecord).map(tag))}catch{}
  }
  return mergeRecords(...lists);
}

// ------- Endereços (equipe, atleta, jogo) coerentes com o tipo de temporada -------
export function teamHref(scope,season,name){
  const slug=slugify(name);
  if(season?.source==='archive2025')return `/team/${slug}/?temporada=2025`;
  if(season?.source==='master')return `/team/${slug}/?categoria=master&temporada=${season.year||2026}`;
  if(season?.source==='adulto2026')return `/team/${slug}/?temporada=2026`;
  return `/team/${slug}/?temporada=${season?.year||''}&s=${encodeURIComponent(season?.id||'')}`;
}
export function playerHref(scope,season,name){
  const slug=slugify(name);
  if(season?.source==='adulto2026')return `/player/${slug}/`;
  if(season?.source==='archive2025')return `/player/${slug}/?context=adulto-2025`;
  if(season?.source==='master')return `/player/${slug}/?context=master-2026`;
  return `/player/${slug}/?context=${scope?.key}-${season?.year}`;
}
export function gameHref(scope,season,game){
  if(!game)return sectionPath(scope,'jogos');
  if(season?.source==='archive2025')return `/event/${archive2025GameSlug(game)}/`;
  if(season?.source==='master')return `/master/event/${masterGameSlug(game)}/`;
  return `/event/${eventSlugForGame(game)}/`;
}
export function playerContext(scope,season){
  if(season?.source==='archive2025')return 'adulto-2025';
  if(season?.source==='master')return 'master-2026';
  if(season?.source==='adulto2026')return '';
  return `${scope?.key}-${season?.year}`;
}

const STATUS_LABEL={ACTIVE:'Em andamento',REGISTRATION_OPEN:'Inscrições abertas',PLANNING:'Em preparação',FINISHED:'Encerrada',ARCHIVED:'Arquivada'};
export function statusLabel(status){return STATUS_LABEL[status]||'Temporada'}
// Página de entrada de cada temporada na lista "Temporadas".
export function seasonHubHref(scope,season){
  if(season.source==='archive2025')return '/temporadas/?temporada=2025';
  if(season.source==='adulto2026')return '/temporada/2026/';
  if(season.source==='master')return '/master/';
  if(scope.key==='adulto')return season.year===2027?'/temporada-2027/':`/jogos/?temporada=${season.key}`;
  if(scope.key==='master')return `/master/jogos/?temporada=${season.key}`;
  return `/c/${scope.key}/?temporada=${season.key}`;
}
