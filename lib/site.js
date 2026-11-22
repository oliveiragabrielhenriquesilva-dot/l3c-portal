import {resultReview,mergeReviews} from './adriano-live';
import {fetchPublicText} from './public-fetch';
import {matchesIdentity} from './season-team';
import {LEGACY_2025,MASTER_2026,archiveOverview,archiveTeam,archivePlayer,archiveGameBySlug,recordsFor,campaignTable,gameAliases,bestGamesByAthlete} from './legacy';
import {prettyName} from './format';
import legacyRaw from '../data/legacy-2026.json';
import {localMedia,localizeData} from './media';
const legacy=localizeData(legacyRaw);
export const API=(process.env.L3C_API_URL||'https://api-stats.liga3colinas.com.br/api').replace(/\/$/,'');
export const SEASON_ID=process.env.L3C_PUBLIC_SEASON_ID||'legacy_season_adulto_livre_2026';
export const ADULTO_2027_SEASON_ID=process.env.L3C_ADULTO_2027_SEASON_ID||'';
export const MASTER_SEASON_ID=process.env.L3C_MASTER_SEASON_ID||'legacy_season_master_2026';
export const YEAR=Number(process.env.L3C_PUBLIC_YEAR||2026);
export const BRAND={name:'Liga Forjax de Basquete',tagline:'Um novo tempo para o basquete amador',logo:'/assets/legacy/uploads/2026/08/logo-oficial-forjax.webp'};
export function slugify(value=''){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
export {localMedia};
// Deduplicacao de GETs simultaneos e cache explicito para dados publicos estaveis.
// Placares, jogos ao vivo e sumulas continuam sem cache persistente.
const _micro=new Map();
const _inflight=new Map();
const MAX_API_CACHE_ENTRIES=200;
// TTLs for public, unauthenticated requests only. A single SSR render can request
// the same resource multiple times; these bounds prevent fetching the same
// full-season statistics on every navigation or bot request.
// Never cache authenticated calls, mutations, live score details or operational APIs.
export function publicCacheTtl(path){
  const p=String(path).split('?')[0];
  if(p==='/v1/public/directory')return 300000;
  if(!p.startsWith('/v1/public/'))return 0;
  // Game detail and live play-by-play must remain close to real time.
  if(/\/games\/[^/]+(?:\/|$)/.test(p)||/\/live(?:\/|$)/.test(p)||/\/play-by-play(?:\/|$)/.test(p))return 0;
  if(p.includes('/legacy_season_adulto_livre_2025')||p.includes('/legacy_season_adulto_livre_2026'))return 300000;
  // Master 2026 may still have an active game; only a short cache is safe.
  if(p.includes('/legacy_season_master_2026'))return 15000;
  // Current seasons and public leaderboards are refreshed frequently, not per request.
  return 30000;
}
export function clearApiCache(){_micro.clear();_inflight.clear()}
export async function apiFetch(path,opts={}){
  const method=String(opts.method||'GET').toUpperCase();
  if(method!=='GET')return apiFetchRaw(path,opts);
  const ttl=Math.max(0,Number(opts.ttl===undefined?publicCacheTtl(path):opts.ttl)||0);
  // Evita compartilhar dados entre chamadas com headers, sinais ou opcoes diferentes.
  const shareable=Object.keys(opts).every(key=>key==='ttl');
  if(!shareable)return apiFetchRaw(path,opts);
  const key=String(path);
  const cached=_micro.get(key);
  if(ttl>0&&cached&&cached.exp>Date.now())return cached.value;
  if(_inflight.has(key))return _inflight.get(key);
  const request=apiFetchRaw(path,opts).then(value=>{
    // Falhas nao ficam em cache; TTL so comeca apos resposta concluida.
    if(ttl>0&&value!==null){
      _micro.set(key,{exp:Date.now()+ttl,value});
      for(const [k,entry] of _micro)if(entry.exp<=Date.now())_micro.delete(k);
      while(_micro.size>MAX_API_CACHE_ENTRIES)_micro.delete(_micro.keys().next().value);
    }
    return value;
  }).finally(()=>_inflight.delete(key));
  _inflight.set(key,request);
  return request;
}
async function apiFetchRaw(path,opts={}){const {ttl,...rest}=opts;try{const text=await fetchPublicText(`${API}${path}`,{...rest,cache:'no-store',headers:{'content-type':'application/json',...(rest.headers||{})}});return text===null?null:JSON.parse(localMedia(text))}catch{return null}}
function tview(t){return {id:`legacy_team_wp_${t.wordpressId}`,name:t.name,shortName:t.name,logoUrl:t.logoUrl,slug:t.slug}}
function gview(g){const a=legacy.teams.find(t=>Number(t.wordpressId)===Number(g.teams?.[0]?.wordpressTeamId));const b=legacy.teams.find(t=>Number(t.wordpressId)===Number(g.teams?.[1]?.wordpressTeamId));return {id:`legacy_game_adulto_livre_2026_${g.source.wordpressPostId}`,wpId:g.source.wordpressPostId,startsAt:String(g.scheduledAtLegacy||'').replace(' ','T')+'-03:00',status:g.status,scoreA:Number(g.source?.wordpressPostId===1132?62:(g.teams?.[0]?.score||0)),scoreB:Number(g.source?.wordpressPostId===1132?80:(g.teams?.[1]?.score||0)),round:g.legacy?.phaseLabel||'',stage:{name:g.legacy?.phaseLabel||''},venue:g.legacy?.venue?{name:g.legacy.venue}:null,teamA:tview(a||{wordpressId:0,name:g.teams?.[0]?.name||'Equipe A',slug:slugify(g.teams?.[0]?.name||''),logoUrl:null}),teamB:tview(b||{wordpressId:0,name:g.teams?.[1]?.name||'Equipe B',slug:slugify(g.teams?.[1]?.name||''),logoUrl:null})}}
function playerFallback(){const groups=new Map();for(const g of legacy.games){for(const row of g.boxScore||[]){let x=groups.get(row.wordpressAthleteId);if(!x){const a=legacy.athletes.find(a=>Number(a.wordpressId)===Number(row.wordpressAthleteId))||{wordpressId:row.wordpressAthleteId,name:row.athleteName,slug:slugify(row.athleteName),photoUrl:null};x={athlete:a,games:0,points:0,rebounds:0,assists:0,steals:0,blocks:0,efficiency:0};groups.set(row.wordpressAthleteId,x)}x.games++;x.points+=Number(row.points||0);x.rebounds+=Number(row.offensiveRebounds||0)+Number(row.defensiveRebounds||0);x.assists+=Number(row.assists||0);x.steals+=Number(row.steals||0);x.blocks+=Number(row.blocks||0);x.efficiency+=Number(row.efficiency||0)}}return [...groups.values()].map(x=>({player:{id:`legacy_player_wp_${x.athlete.wordpressId}`,personId:`legacy_person_wp_${x.athlete.wordpressId}`,name:x.athlete.name,photoUrl:x.athlete.photoUrl,position:null,slug:x.athlete.slug},games:x.games,averages:{points:+(x.points/x.games).toFixed(1),rebounds:+(x.rebounds/x.games).toFixed(1),assists:+(x.assists/x.games).toFixed(1),steals:+(x.steals/x.games).toFixed(1),blocks:+(x.blocks/x.games).toFixed(1),efficiency:+(x.efficiency/x.games).toFixed(1)},teams:(()=>{const t=legacy.teams.find(t=>Number(t.wordpressId)===Number(x.athlete.wordpressTeamId));return t?[tview(t)]:[]})()})).sort((a,b)=>b.averages.efficiency-a.averages.efficiency)}
export function fallbackOverview(){const games=legacy.games.map(gview);const players=playerFallback();const teams=legacy.teams.map(t=>({team:tview(t),games:0,wins:0,losses:0,pointDifferential:0}));return {identity:{season:{id:SEASON_ID,year:YEAR,officialName:'Liga Forjax'},competition:{name:'Adulto Livre'}},season:{id:SEASON_ID,year:YEAR},summary:{teams:teams.length,games:games.length,finished:games.filter(g=>g.status==='FINISHED').length},upcoming:games.filter(g=>g.status!=='FINISHED').sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt)).slice(0,8),recentResults:games.filter(g=>g.status==='FINISHED').sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).slice(0,8),teams,players,legacyGames:games}}
async function withApiGames(fb){
  const ids=[SEASON_ID,...(ADULTO_2027_SEASON_ID?[ADULTO_2027_SEASON_ID]:[])];
  const known=new Set((fb.legacyGames||[]).map(g=>g.id));
  const extra=[];
  for(const id of ids){const payload=await apiFetch(`/v1/public/seasons/${encodeURIComponent(id)}/games`);for(const g of (Array.isArray(payload?.games)?payload.games:[])){if(g?.id&&!String(g.id).startsWith('legacy_')&&!known.has(g.id)){known.add(g.id);extra.push(normalizeGame(g))}}}
  return extra.length?{...fb,legacyGames:[...(fb.legacyGames||[]),...extra]}:fb;
}
export async function getOverview(){const fb=await withApiGames(fallbackOverview());const api=await apiFetch(`/v1/public/seasons/${SEASON_ID}`);return normalizeOverview(api?{...api,legacyGames:fb.legacyGames}:fb)}
export function allGames(data){return data?.legacyGames||[...(data?.upcoming||[]),...(data?.recentResults||[])]}
export async function getAllGames(){const api=await apiFetch(`/v1/public/seasons/${SEASON_ID}`);if(api){const fb=await withApiGames(fallbackOverview());return normalizeOverview({...api,legacyGames:fb.legacyGames})}return normalizeOverview(fallbackOverview())}
function currentTeamFallback(slug){const lt=legacy.teams.find(t=>t.slug===slug||slugify(t.name)===slug);if(!lt)return null;const games=legacy.games.map(gview).map(normalizeGame).filter(g=>!HIDDEN_2026_GAME_IDS.has(g.id)).filter(g=>slugify(g.teamA?.name)===slug||slugify(g.teamB?.name)===slug);const roster=legacy.athletes.filter(a=>Number(a.wordpressTeamId)===Number(lt.wordpressId)).map(a=>({number:a.jerseyNumber,player:{id:`legacy_player_wp_${a.wordpressId}`,personId:`legacy_person_wp_${a.wordpressId}`,name:a.name,photoUrl:a.photoUrl,position:null,slug:a.slug}}));return {team:{...tview(lt),city:'Franca',state:'SP'},games,roster,position:null,series:seriesForTeam(lt.name)}}
function aggregateTeamHighlights(slug,games=[]){let wins=0,losses=0,pf=0,pa=0;for(const g of games){if(!isFinishedPublicGame(g))continue;const ownA=slugify(g.teamA?.name)===slug;const own=Number(ownA?g.scoreA:g.scoreB),opp=Number(ownA?g.scoreB:g.scoreA);if(!Number.isFinite(own)||!Number.isFinite(opp))continue;pf+=own;pa+=opp;if(own>opp)wins++;else if(own<opp)losses++;}return {wins,losses,pointsFor:pf,pointsAgainst:pa,pointDifferential:pf-pa,games:wins+losses}}
// Explicitly opt in to 2027 with the official season ID; never borrow 2026 roster or staff.
// Diretório público da API: tudo que está publicado no L3C Stats, sem variável de ambiente.
let _dir={t:0,v:null};
export async function getDirectorySeasons(){
  if(_dir.v&&Date.now()-_dir.t<300000)return _dir.v;
  const d=await apiFetch('/v1/public/directory',{ttl:300000});
  const v=Array.isArray(d?.seasons)?d.seasons:null;
  if(v){_dir={t:Date.now(),v};return v}
  return _dir.v||[];
}
// Chave de escopo (portal) de uma competição: 'adulto', 'master' ou o endereço da competição.
export function scopeKeyOf(competition){
  const text=String(competition?.category||competition?.name||'');
  if(/adulto/i.test(text))return 'adulto';
  if(/master/i.test(text))return 'master';
  return slugify(competition?.publicSlug||competition?.name||'competicao');
}
// Temporadas criadas no L3C Stats (ids que não são "legacy_*") de QUALQUER competição pública, da mais nova para a mais antiga.
export async function getExtraSeasons(){
  const list=await getDirectorySeasons();
  return list.filter(s=>s?.id&&!String(s.id).startsWith('legacy_')).map(s=>({
    id:s.id,year:Number(s.year)||null,name:s.name,officialName:s.officialName||null,logoUrl:s.logoUrl||null,status:s.status,featured:Boolean(s.featured),
    competitionName:s.competition?.name||'',competitionCategory:s.competition?.category||'',competitionLogo:s.competition?.logoUrl||null,
    scopeKey:scopeKeyOf(s.competition),
  })).sort((a,b)=>(b.year||0)-(a.year||0));
}
// Temporadas do Adulto Livre criadas no L3C Stats (compatibilidade).
export async function getAdultoExtraSeasons(){
  const out=(await getExtraSeasons()).filter(s=>s.scopeKey==='adulto');
  const fixed=ADULTO_2027_SEASON_ID||'l3c_season_adulto_livre_2027';
  if(!out.some(x=>x.id===fixed))out.push({id:fixed,year:2027,competitionName:'Adulto Livre',scopeKey:'adulto'});
  return out.sort((a,b)=>(b.year||0)-(a.year||0));
}
export async function getTeamInSeason(season,slug){
  const overview=await apiFetch(`/v1/public/seasons/${encodeURIComponent(season.id)}`);
  const item=(overview?.teams||[]).find(x=>matchesIdentity(x,slug,slugify));
  if(!item?.team?.id)return null;
  const api=await apiFetch(`/v1/public/seasons/${encodeURIComponent(season.id)}/teams/${encodeURIComponent(item.team.id)}`);
  if(!api?.team)return null;
  const games=Array.isArray(api.games)?api.games.map(normalizeGame):[];
  return {...api,team:api.team,games,roster:api.roster||[],
    highlights:aggregateTeamHighlights(slug,games),
    competition:season.competitionName||overview?.identity?.competition?.name||'Adulto Livre',seasonYear:season.year||2027,seasonId:season.id,scopeKey:season.scopeKey||'adulto',leagueName:overview?.identity?.season?.officialName||season.officialName||null,
    division:api.division||item.division||null,franchise:api.franchise||item.franchise||null,series:api.series||'',source:'l3c-stats'};
}
export async function getTeam2027BySlug(slug,year,seasonId){
  const all=seasonId?(await getExtraSeasons()).filter(s=>s.id===seasonId):(await getAdultoExtraSeasons()).filter(s=>!year||Number(s.year)===Number(year));
  for(const s of all){const t=await getTeamInSeason(s,slug);if(t)return t}
  return null;
}
export async function getTeamBySlug(slug){const base=currentTeamFallback(slug);const overview=await getOverview();const item=(overview.teams||[]).find(x=>slugify(x.team?.name)===slug||slugify(x.team?.shortName)===slug);let api=null;if(item?.team?.id)api=await apiFetch(`/v1/public/seasons/${SEASON_ID}/teams/${item.team.id}`);if(!base&&!api)return null;const apiGames=Array.isArray(api?.games)?api.games.map(normalizeGame).filter(g=>!HIDDEN_2026_GAME_IDS.has(g?.id)):[];const usableApiGames=apiGames.filter(g=>g?.teamA?.name&&g?.teamB?.name);const games=usableApiGames.length?usableApiGames:(base?.games||[]);const roster=Array.isArray(api?.roster)&&api.roster.length?api.roster:(base?.roster||[]);const team={...(base?.team||item?.team||{}),...(api?.team||{})};const highlights=aggregateTeamHighlights(slug,games);return {...base,...api,team,games,roster,highlights,position:api?.position??base?.position??null,series:api?.series||base?.series||seriesForTeam(team.name),source:api?'l3c-stats':'contingency'}}
function fallbackStatLine(br){
  const rebounds=br?.totalRebounds!=null?Number(br.totalRebounds||0):Number(br?.offensiveRebounds||0)+Number(br?.defensiveRebounds||0);
  return {minutesSeconds:br?.minutesSeconds==null?null:Number(br.minutesSeconds||0),points:Number(br?.points||0),rebounds,
    offensiveRebounds:br?.offensiveRebounds==null?null:Number(br.offensiveRebounds||0),defensiveRebounds:br?.defensiveRebounds==null?null:Number(br.defensiveRebounds||0),
    assists:Number(br?.assists||0),steals:Number(br?.steals||0),blocks:Number(br?.blocks||0),turnovers:Number(br?.turnovers||0),
    plusMinus:br?.plusMinus==null?null:Number(br.plusMinus||0),efficiency:Number(br?.efficiency||0),
    fgMade:br?.fgMade==null?null:Number(br.fgMade||0),fgAttempted:br?.fgAttempted==null?null:Number(br.fgAttempted||0),
    fg3Made:br?.fg3Made==null?null:Number(br.fg3Made||0),fg3Attempted:br?.fg3Attempted==null?null:Number(br.fg3Attempted||0),
    ftMade:br?.ftMade==null?null:Number(br.ftMade||0),ftAttempted:br?.ftAttempted==null?null:Number(br.ftAttempted||0),
    availability:{minutes:br?.minutesSeconds!=null,rebounds:true,offensiveRebounds:br?.offensiveRebounds!=null,defensiveRebounds:br?.defensiveRebounds!=null,assists:true,steals:true,blocks:true,turnovers:true,plusMinus:br?.plusMinus!=null,efficiency:br?.efficiency!=null,fieldGoals:br?.fgAttempted!=null,threePointers:br?.fg3Attempted!=null,freeThrows:br?.ftAttempted!=null,shooting:br?.fgAttempted!=null&&br?.ftAttempted!=null}
  };
}
function currentPlayerFallback(slug){const a=legacy.athletes.find(a=>a.slug===slug||slugify(a.name)===slug);if(!a)return null;const row=(fallbackOverview().players||[]).find(x=>x.player.personId===`legacy_person_wp_${a.wordpressId}`);const registeredTeam=legacy.teams.find(t=>Number(t.wordpressId)===Number(a.wordpressTeamId));const gameLog=[];for(const raw of legacy.games){const br=(raw.boxScore||[]).find(x=>Number(x.wordpressAthleteId)===Number(a.wordpressId));if(!br)continue;const g=normalizeGame(gview(raw));if(HIDDEN_2026_GAME_IDS.has(g.id))continue;const appearanceTeam=legacy.teams.find(t=>Number(t.wordpressId)===Number(br.wordpressTeamId));gameLog.push({game:g,team:appearanceTeam?tview(appearanceTeam):null,stats:fallbackStatLine(br)})}gameLog.sort((x,y)=>new Date(y.game.startsAt)-new Date(x.game.startsAt));const latestAppearanceTeam=gameLog.find(x=>x.team?.name)?.team||null;const team=latestAppearanceTeam||(registeredTeam?tview(registeredTeam):null);return {player:{id:`legacy_player_wp_${a.wordpressId}`,personId:`legacy_person_wp_${a.wordpressId}`,name:a.name,fullName:a.name,photoUrl:a.photoUrl,number:a.jerseyNumber,team},stats:{games:row?.games||0,averages:row?.averages||{},gameLog},rankings:{},source:'contingency'}}
function findFallbackLog(entry,fallbackLog=[]){const date=entry?.date||entry?.startsAt||entry?.playedAt||entry?.game?.startsAt||null;const id=entry?.id||entry?.game?.id||null;const oppName=entry?.opponent?.name||entry?.teamOpponent?.name||entry?.opponentTeam?.name||entry?.opponentName||'';return fallbackLog.find(x=>{if(id&&String(x.game?.id)===String(id))return true;const gd=x.game?.startsAt?String(x.game.startsAt).slice(0,10):'';const ed=date?String(date).slice(0,10):'';const names=[x.game?.teamA?.name,x.game?.teamB?.name].map(slugify);return gd&&ed&&gd===ed&&(!oppName||names.includes(slugify(oppName)));})||null}
function normalizeDetailedStats(entry,fallbackStats={}){const src=entry?.stats||entry||{};const own=(...keys)=>{for(const k of keys)if(src[k]!==undefined&&src[k]!==null&&src[k]!=='')return Number(src[k]);return undefined};const out={...fallbackStats};const map={minutesSeconds:['minutesSeconds'],points:['points'],rebounds:['rebounds'],offensiveRebounds:['offensiveRebounds'],defensiveRebounds:['defensiveRebounds'],assists:['assists'],steals:['steals'],blocks:['blocks'],turnovers:['turnovers'],plusMinus:['plusMinus'],efficiency:['efficiency'],fgMade:['fgMade'],fgAttempted:['fgAttempted'],fg3Made:['threeMade','fg3Made'],fg3Attempted:['threeAttempted','fg3Attempted'],ftMade:['ftMade'],ftAttempted:['ftAttempted']};for(const [key,aliases] of Object.entries(map)){const v=own(...aliases);if(v!==undefined)out[key]=v;}out.availability={...(fallbackStats?.availability||{}),minutes:out.minutesSeconds!=null,rebounds:out.rebounds!=null,offensiveRebounds:out.offensiveRebounds!=null,defensiveRebounds:out.defensiveRebounds!=null,assists:out.assists!=null,steals:out.steals!=null,blocks:out.blocks!=null,turnovers:out.turnovers!=null,plusMinus:out.plusMinus!=null,efficiency:out.efficiency!=null,fieldGoals:out.fgAttempted!=null,threePointers:out.fg3Attempted!=null,freeThrows:out.ftAttempted!=null,shooting:out.fgAttempted!=null&&out.ftAttempted!=null};return out}
function normalizePlayerGameLogEntry(entry,team,fallbackLog=[]){if(!entry)return null;const match=findFallbackLog(entry,fallbackLog);const rawGame=entry.game||null;let game=null;if(rawGame?.teamA?.name&&rawGame?.teamB?.name)game=normalizeGame(rawGame);else if(match)game=match.game;else{const date=entry.date||entry.startsAt||entry.playedAt||null;const opponent=entry.opponent||entry.teamOpponent||entry.opponentTeam||null;const oppName=opponent?.name||entry.opponentName||'';if(!date||!team||!oppName)return null;game=normalizeGame({id:entry.id||`log-${slugify(team.name)}-${String(date).slice(0,10)}-${slugify(oppName)}`,startsAt:String(date).includes('T')?date:`${date}T12:00:00-03:00`,status:'FINISHED',scoreA:Number(entry.scoreFor??entry.teamScore??0),scoreB:Number(entry.scoreAgainst??entry.opponentScore??0),teamA:team,teamB:{...opponent,name:oppName,logoUrl:opponent?.logoUrl||null},stage:{name:entry.stage?.name||entry.stage||entry.round||''},round:entry.round||''})}const directTeam=entry.team||entry.playerTeam||entry.rosterTeam||entry.club||entry.teamContext||null;const directTeamName=directTeam?.name||entry.teamName||entry.playerTeamName||entry.rosterTeamName||'';let appearanceTeam=directTeam?.name?directTeam:(match?.team||null);if(!appearanceTeam&&directTeamName){const candidates=[game?.teamA,game?.teamB].filter(Boolean);appearanceTeam=candidates.find(t=>slugify(t?.name)===slugify(directTeamName))||{name:directTeamName,slug:slugify(directTeamName),logoUrl:directTeam?.logoUrl||null};}if(!appearanceTeam&&team&&[game?.teamA,game?.teamB].some(t=>slugify(t?.name)===slugify(team?.name)))appearanceTeam=team;return {game,team:appearanceTeam||null,stats:normalizeDetailedStats(entry,match?.stats||{})}}
function computedRankings(players,personId,name){const out={};for(const field of ['points','rebounds','assists','steals','blocks','efficiency']){const sorted=[...(players||[])].filter(x=>Number(x.games||0)>0).sort((a,b)=>Number(b.averages?.[field]||0)-Number(a.averages?.[field]||0));const idx=sorted.findIndex(x=>(personId&&x.player?.personId===personId)||slugify(x.player?.name)===slugify(name));out[field]=idx>=0?{position:idx+1,total:sorted.length,value:Number(sorted[idx]?.averages?.[field]||0),games:Number(sorted[idx]?.games||0)}:null;}return out}
export async function getPlayerBySlug(slug){const base=currentPlayerFallback(slug);const overview=await getOverview();const item=(overview.players||[]).find(x=>slugify(x.player?.name)===slug);let api=null;if(item?.player?.personId)api=await apiFetch(`/v1/public/seasons/${SEASON_ID}/players/${item.player.personId}`);if(!base&&!api)return null;if(!api){const player=base?.player;return {...base,rankings:computedRankings(overview.players||[],player?.personId,player?.name)}}const seedTeam=api.player?.currentTeam||api.currentTeam||base?.player?.team||api.player?.team||item?.teams?.[0]||null;const rawLog=Array.isArray(api.stats?.gameLog)?api.stats.gameLog:Array.isArray(api.gameLog)?api.gameLog:[];const normalizedLog=rawLog.map(x=>normalizePlayerGameLogEntry(x,seedTeam,base?.stats?.gameLog||[])).filter(Boolean).sort((a,b)=>new Date(b.game?.startsAt||0)-new Date(a.game?.startsAt||0));const latestAppearanceTeam=normalizedLog.find(x=>x.team?.name)?.team||base?.stats?.gameLog?.find(x=>x.team?.name)?.team||null;const explicitCurrent=api.player?.currentTeam||api.currentTeam||api.activeMembership?.team||api.player?.activeMembership?.team||null;const team=explicitCurrent||latestAppearanceTeam||base?.player?.team||api.player?.team||item?.teams?.[0]||null;const apiAverages=api.stats?.averages||api.averages||item?.averages||{};const stats={...(base?.stats||{}),...(api.stats||{}),games:Number(api.stats?.games??api.games??item?.games??base?.stats?.games??0),averages:{...(base?.stats?.averages||{}),...apiAverages},gameLog:normalizedLog.length?normalizedLog:(base?.stats?.gameLog||[])};const player={...(base?.player||item?.player||{}),...(api.player||{}),team,currentTeam:team};const ranks=computedRankings(overview.players||[],player?.personId||item?.player?.personId,player?.name);return {...base,...api,player,stats,rankings:{...ranks,...(api.rankings||{})},source:'l3c-stats'}}
function legacyGameDetails(raw){if(!raw)return null;const game=normalizeGame(gview(raw));const rows=(raw.boxScore||[]).map(r=>{const a=legacy.athletes.find(x=>Number(x.wordpressId)===Number(r.wordpressAthleteId));const t=legacy.teams.find(x=>Number(x.wordpressId)===Number(r.wordpressTeamId));return {...r,rebounds:Number(r.offensiveRebounds||0)+Number(r.defensiveRebounds||0),player:{name:a?.name||r.athleteName,photoUrl:a?.photoUrl||null,slug:a?.slug||slugify(r.athleteName)},team:t?tview(t):null}});const score=(r)=>Number(r.efficiency??(Number(r.points||0)+Number(r.rebounds||0)+Number(r.assists||0)+Number(r.steals||0)+Number(r.blocks||0)));const best=[...rows].sort((a,b)=>(score(b)-score(a))||(Number(b.points||0)-Number(a.points||0)))[0]||null;const metricLead=(key)=>{const max=Math.max(...rows.map(r=>Number(r[key]||0)),0);return rows.filter(r=>Number(r[key]||0)===max&&max>0)};const side=(s)=>rows.filter(r=>r.side===s);const agg=(arr,key)=>arr.reduce((n,r)=>n+Number(r[key]||0),0);const teams={A:{points:agg(side('A'),'points'),rebounds:agg(side('A'),'rebounds'),assists:agg(side('A'),'assists'),steals:agg(side('A'),'steals'),blocks:agg(side('A'),'blocks'),turnovers:agg(side('A'),'turnovers')},B:{points:agg(side('B'),'points'),rebounds:agg(side('B'),'rebounds'),assists:agg(side('B'),'assists'),steals:agg(side('B'),'steals'),blocks:agg(side('B'),'blocks'),turnovers:agg(side('B'),'turnovers')}};return {game,periods:(raw.periods||[]).map(p=>({period:p.period,scoreA:p.sideAScore,scoreB:p.sideBScore})),boxScore:rows,bestPlayer:best?{player:best.player,team:best.team,points:best.points,rebounds:best.rebounds,assists:best.assists,steals:best.steals,blocks:best.blocks,efficiency:best.efficiency??score(best)}:null,leaders:{points:metricLead('points'),rebounds:metricLead('rebounds'),assists:metricLead('assists'),steals:metricLead('steals'),blocks:metricLead('blocks')},teamTotals:teams}}
export async function getGameBySlug(slug){const gameId=legacy.eventAliases[slug];let raw=null;if(gameId){raw=legacy.games.find(x=>`legacy_game_adulto_livre_2026_${x.source.wordpressPostId}`===gameId);const d=await apiFetch(`/v1/public/games/${gameId}`);if(d){const ld=legacyGameDetails(raw);return {...ld,...d,game:normalizeGame(d.game),periods:d.periods?.length?d.periods:ld?.periods||[],boxScore:d.boxScore?.length?d.boxScore:ld?.boxScore||[],bestPlayer:d.bestPlayer||ld?.bestPlayer||null,leaders:d.leaders||ld?.leaders||{},teamTotals:d.teamTotals||ld?.teamTotals||null}}if(raw){const ld=legacyGameDetails(raw);if(ld?.game&&!HIDDEN_2026_GAME_IDS.has(ld.game.id))return ld}}const baseSlug=slug.replace(/-\d+$/,'');const matches=legacy.games.filter(r=>slugify(`${r.teams?.[0]?.name}-vs-${r.teams?.[1]?.name}`)===baseSlug);const idx=Math.max(0,(Number((slug.match(/-(\d+)$/)||[])[1])||1)-1);raw=matches[idx]||matches[0];return legacyGameDetails(raw)}

const HIDDEN_2026_GAME_IDS=new Set(['legacy_game_adulto_livre_2026_1131','legacy_game_adulto_livre_2026_1133']);
export function normalizeGame(game){if(!game)return game;const g={...game};const nameA=String(g.teamA?.name||'').toLowerCase(),nameB=String(g.teamB?.name||'').toLowerCase();const dt=String(g.startsAt||'');if(nameA==='brewers'&&nameB==='athletics'&&dt.startsWith('2026-09-19')){g.scoreA=62;g.scoreB=80;g.displayScoreA=62;g.displayScoreB=80;}g.publicStatus=gamePublicStatus(g);return g}
export function gamePublicStatus(game,now=new Date()){if(!game)return 'UNKNOWN';if(HIDDEN_2026_GAME_IDS.has(game.id))return 'HIDDEN';const raw=String(game.status||'').toUpperCase();const starts=game.startsAt?new Date(game.startsAt):null;const validDate=starts&&!Number.isNaN(starts.getTime());const a=Number(game.scoreA),b=Number(game.scoreB);const hasScore=Number.isFinite(a)&&Number.isFinite(b)&&(a>0||b>0);if(raw==='LIVE'||raw==='IN_PROGRESS')return 'LIVE';if(raw==='FINISHED'||raw==='FINAL'||raw==='COMPLETED'||raw==='ENDED'||hasScore)return 'FINISHED';if(validDate&&starts>now)return 'UPCOMING';if(raw==='LIVE'||raw==='IN_PROGRESS')return 'LIVE';if(validDate&&starts<=now)return 'PENDING_RESULT';if(raw==='SCHEDULED'||raw==='PENDING')return 'UPCOMING';return raw||'UNKNOWN'}
export function isFinishedPublicGame(game){return gamePublicStatus(game)==='FINISHED'}
export function isLivePublicGame(game){return gamePublicStatus(game)==='LIVE'}
export function isLiveOrUpcomingGame(game){const x=gamePublicStatus(game);return x==='LIVE'||x==='UPCOMING'}
export function liveWatch(games=[]){const now=Date.now();const api=(games||[]).filter(g=>g?.id&&!String(g.id).startsWith('legacy_'));return {games:api.filter(isLivePublicGame).slice(0,6).map(g=>({id:g.id,status:gamePublicStatus(g),scoreA:g.scoreA??0,scoreB:g.scoreB??0})),soon:api.some(g=>gamePublicStatus(g)==='UPCOMING'&&g.startsAt&&new Date(g.startsAt).getTime()-now<2*3600*1000)}}
export function liveFirst(list=[]){return [...list].sort((a,b)=>(Number(isLivePublicGame(b))-Number(isLivePublicGame(a)))||(new Date(a.startsAt)-new Date(b.startsAt)))}
export function isUpcomingPublicGame(game){return gamePublicStatus(game)==='UPCOMING'}
export function isPendingResultGame(game){return gamePublicStatus(game)==='PENDING_RESULT'}
export function normalizeOverview(data){if(!data)return data;const out={...data};const clean=(arr=[])=>arr.map(normalizeGame).filter(g=>!HIDDEN_2026_GAME_IDS.has(g?.id));const all=clean(out.legacyGames||[...(out.upcoming||[]),...(out.recentResults||[]),...(out.liveGames||[])]);out.legacyGames=all;out.upcoming=liveFirst(all.filter(isLiveOrUpcomingGame));out.recentResults=all.filter(isFinishedPublicGame).sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt));out.pendingResults=all.filter(isPendingResultGame).sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt));if(out.liveGames)out.liveGames=clean(out.liveGames).filter(g=>gamePublicStatus(g)==='LIVE');out.summary={...(out.summary||{}),games:all.length,finished:out.recentResults.length,upcoming:out.upcoming.length,pendingResults:out.pendingResults.length};out.teams=[...(out.teams||[])].sort((a,b)=>String(a.team?.name||'').localeCompare(String(b.team?.name||''),'pt-BR'));if(Array.isArray(out.players))out.players=out.players.map(x=>x?.player?{...x,player:{...x.player,name:prettyName(x.player.name)}}:x);return out}
export function qualifiedPlayers(players,minGames=7){return [...(players||[])].filter(x=>Number(x.games||0)>=minGames)}
export function seriesForTeam(name){const n=String(name||'').toLowerCase();for(const [serie,rows] of Object.entries(legacy.standings||{})){if((rows||[]).some(x=>String(x.name||'').toLowerCase()===n))return `Série ${serie[0].toUpperCase()+serie.slice(1)}`}return ''}
function adrianoRebounds(row){
  if(row?.totalRebounds!==undefined&&row?.totalRebounds!==null&&row?.totalRebounds!=='')return Number(row.totalRebounds||0);
  if(row?.rebounds!==undefined&&row?.rebounds!==null&&row?.rebounds!=='')return Number(row.rebounds||0);
  return Number(row?.offensiveRebounds||0)+Number(row?.defensiveRebounds||0);
}
function adrianoEfficiency(row){
  if(row?.efficiency!==undefined&&row?.efficiency!==null&&row?.efficiency!==''&&Number.isFinite(Number(row.efficiency)))return Number(row.efficiency);
  const basic=Number(row?.points||0)+adrianoRebounds(row)+Number(row?.assists||0)+Number(row?.steals||0)+Number(row?.blocks||0)-Number(row?.turnovers||0);
  const fga=Number(row?.fgAttempted||0),fgm=Number(row?.fgMade||0),fta=Number(row?.ftAttempted||0),ftm=Number(row?.ftMade||0);
  return basic-((fga>0)?Math.max(0,fga-fgm):0)-((fta>0)?Math.max(0,fta-ftm):0);
}
function adrianoDate(raw=''){
  const m=String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:'';
}
function adrianoTeamTotals(rows=[],teamId){
  const list=rows.filter(r=>Number(r.wordpressTeamId)===Number(teamId));
  const sum=key=>list.reduce((n,r)=>n+Number(r?.[key]||0),0);
  return {rebounds:list.reduce((n,r)=>n+adrianoRebounds(r),0),assists:sum('assists'),steals:sum('steals'),blocks:sum('blocks'),turnovers:sum('turnovers')};
}
function generatedAdrianoReviews(data,category='adulto'){
  const aliases=gameAliases(data);const year=Number(data?.target?.year||2026);
  const out=[];
  for(const raw of data?.games||[]){
    if(String(raw?.status||'').toUpperCase()!=='FINISHED'||!raw?.teams?.[0]||!raw?.teams?.[1])continue;
    const a=raw.teams[0],b=raw.teams[1],sa=Number(a.score||0),sb=Number(b.score||0);if(!Number.isFinite(sa)||!Number.isFinite(sb)||sa===sb)continue; // basquete não tem empate: placar igual é erro de registro, sem resenha
    const winner=sa>=sb?a:b,loser=winner===a?b:a,margin=Math.abs(sa-sb);
    const slug=aliases.get(raw.source?.wordpressPostId)||slugify(`${a.name}-vs-${b.name}`);
    const rows=raw.boxScore||[];
    const best=[...rows].sort((x,y)=>(adrianoEfficiency(y)-adrianoEfficiency(x))||(Number(y.points||0)-Number(x.points||0)))[0]||null;
    const ta=adrianoTeamTotals(rows,a.wordpressTeamId),tb=adrianoTeamTotals(rows,b.wordpressTeamId);
    const periods=(raw.periods||[]).map((p,i)=>({period:p.period||i+1,a:Number(p.sideAScore||0),b:Number(p.sideBScore||0)}));
    let decisive=null;
    if(periods.length){decisive=[...periods].sort((x,y)=>Math.abs(y.a-y.b)-Math.abs(x.a-x.b))[0];}
    const stage=raw.legacy?.phaseLabel||raw.legacy?.series||(category==='master'?'Liga Master':'Temporada regular');
    const text=`${winner.name} venceu ${loser.name} por ${winner===a?sa:sb} a ${winner===a?sb:sa}${margin?`, com ${margin} ponto${margin===1?'':'s'} de diferença`:''}. ${decisive?`O ${decisive.period}º período foi um dos trechos de maior separação no placar, com parcial de ${decisive.a} a ${decisive.b}.`:''}`.trim();
    const controlA=`${a.name}: ${ta.rebounds} rebotes, ${ta.assists} assistências e ${ta.turnovers} turnovers.`;
    const controlB=`${b.name}: ${tb.rebounds} rebotes, ${tb.assists} assistências e ${tb.turnovers} turnovers.`;
    const fullText=[text,`Na leitura coletiva, ${controlA} ${controlB}`];
    const nameOfGame=best?`${best.athleteName||'O destaque'} terminou com ${Number(best.points||0)} pontos, ${adrianoRebounds(best)} rebotes, ${Number(best.assists||0)} assistências e eficiência ${adrianoEfficiency(best)}.`:null;
    const moment=decisive?`O ${decisive.period}º período teve a maior diferença entre as parciais do jogo (${decisive.a} a ${decisive.b}).`:null;
    out.push({date:adrianoDate(raw.scheduledAtLegacy),timestamp:String(raw.scheduledAtLegacy||''),year,category,series:stage,stage,score:`${sa} × ${sb}`,teamA:a.name,teamB:b.name,slug,title:`${winner.name} vence ${loser.name} por ${winner===a?sa:sb} a ${winner===a?sb:sa}`,text,fullText,nameOfGame,moment,generated:true});
  }
  return out;
}
const ADRIANO_CURATED=[
 {date:'26/09/2026',timestamp:'2026-09-26 16:00:00',year:2026,category:'adulto',series:'Série Ouro',stage:'Final · Jogo 2 de 3',score:'76 × 58',teamA:'Athletics',teamB:'Brewers',slug:'athletics-vs-brewers-2',title:'Athletics controla o terceiro quarto e assume o comando da final',text:'No Jogo 2 de 3 da final da Série Ouro, Athletics venceu Brewers por 76 a 58 e soube controlar os momentos mais importantes da partida. O 3º quarto foi o trecho mais determinante, com parcial de 23 a 10 para Athletics.',fullText:[
  'No Jogo 2 de 3 da final da Série Ouro, Athletics venceu Brewers por 76 a 58 e soube controlar os momentos mais importantes da partida. O 3º quarto foi o trecho mais determinante, com parcial de 23 a 10 para Athletics.',
  'Os números coletivos que mais ajudam a explicar essa vitória são a eficiência nas bolas de três, 29,7% contra 13,3%, e o melhor controle da bola: 11 turnovers do Athletics contra 15 do Brewers. A combinação desses dois fatores deu ao Athletics mais controle sobre as posses e reduziu as oportunidades de reação do Brewers.',
  'Em uma leitura mais ampla, também vale destacar a melhor circulação da bola, com 16 assistências contra 11. Esse fundamento complementou a atuação coletiva e ajudou o Athletics a manter o controle da partida durante os momentos de maior pressão.'
 ],nameOfGame:'Ederson Eduardo Da Silva foi a principal referência estatística do Athletics, com 19 pontos, 8 rebotes, 6 assistências e eficiência 23.',moment:'O 3º quarto foi o trecho em que o Athletics abriu a vantagem com mais clareza e passou a controlar o andamento da partida.'},
 {date:'26/09/2026',timestamp:'2026-09-26 14:00:00',year:2026,category:'adulto',series:'Série Prata',stage:'Final · Jogo 2 de 3',score:'82 × 79',teamA:'The Bronx',teamB:'Ballers',slug:'the-bronx-vs-ballers',title:'The Bronx cresce nos momentos decisivos e confirma vantagem na Série Prata',text:'No Jogo 2 de 3 da final da Série Prata, The Bronx foi mais eficiente nos momentos decisivos e venceu Ballers por 82 a 79 em uma partida equilibrada por boa parte do tempo. O 1º quarto foi o trecho mais determinante, com parcial de 26 a 17 para The Bronx.',fullText:['No Jogo 2 de 3 da final da Série Prata, The Bronx foi mais eficiente nos momentos decisivos e venceu Ballers por 82 a 79 em uma partida equilibrada por boa parte do tempo. O 1º quarto foi o trecho mais determinante, com parcial de 26 a 17 para The Bronx.'],moment:'O 1º quarto foi o principal ponto de separação no placar, com parcial de 26 a 17 para The Bronx.'}
];
export function adrianoReviews(){
  const generated=[...generatedAdrianoReviews(legacy,'adulto'),...generatedAdrianoReviews(MASTER_2026,'master'),...generatedAdrianoReviews(LEGACY_2025,'adulto')];
  const curated=new Map(ADRIANO_CURATED.map(x=>[`${x.category}:${x.year}:${x.slug}`,x]));
  const merged=generated.map(x=>curated.get(`${x.category}:${x.year}:${x.slug}`)||x);
  for(const item of ADRIANO_CURATED)if(!merged.some(x=>x.category===item.category&&x.year===item.year&&x.slug===item.slug))merged.push(item);
  return merged.sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')));
}

export async function getAdrianoReviews(){
  const overview=await getMasterOverview();
  const seen=new Set();
  const current=(overview.legacyGames||[]).filter(g=>{if(seen.has(g.id))return false;seen.add(g.id);return true;}).map(g=>{
    const slug=masterGameSlug(g);
    const existing=adrianoReviews().find(r=>r.category==='master'&&r.slug===slug);
    const review=resultReview(g,{category:'master',year:2026,slug});
    // Mantém a análise estatística histórica se o placar oficial continua igual.
    return review&&existing?.score===review.score?{...existing,gameId:g.id,stage:review.stage,series:review.series}:review;
  }).filter(Boolean);
  return mergeReviews(adrianoReviews(),current);
}

export function eventSlugForGame(game){const gid=game?.id;for(const [slug,id] of Object.entries(legacy.eventAliases||{})){if(id===gid)return slug}return slugify(`${game?.teamA?.name||'jogo'}-vs-${game?.teamB?.name||'jogo'}`)}
export function standingsFallback(){return legacy.standings}
export function championsFallback(){return legacy.champions}

// Histórico oficial recuperado do portal WordPress.
// 2025: Ouro Wolves · Prata Ducks · Bronze SJ Basquete.
// 2026: usa o registro de campeões da base atual.
export function franchiseTitles(teamName=''){
  const current=championsFallback()||{};
  const rows=[
    {year:2026,series:'Série Ouro',team:current.ouro||''},
    {year:2026,series:'Série Prata',team:current.prata||''},
    {year:2026,series:'Série Bronze',team:current.bronze||''},
    {year:2025,series:'Série Ouro',team:'Wolves'},
    {year:2025,series:'Série Prata',team:'Ducks'},
    {year:2025,series:'Série Bronze',team:'SJ Basquete'},
  ];
  const target=slugify(teamName);
  return rows.filter(x=>x.team&&slugify(x.team)===target).sort((a,b)=>b.year-a.year);
}
export function newsFallback(){return legacy.news}
export function teamLogo(name){return legacy.teams.find(t=>t.name.toLowerCase()===String(name).toLowerCase())?.logoUrl||null}


// v0.4.1 — WordPress real + L3C Stats como fonte oficial única da Liga Master

// Identidade pública da temporada, lida do cadastro do painel (logo da temporada, nome oficial, selo = logo da competição).
const SEASON_IDS_ADULTO={'2025':'legacy_season_adulto_livre_2025','2026':SEASON_ID,'master':MASTER_SEASON_ID};
export async function getSeasonBrand(year){
  const id=SEASON_IDS_ADULTO[String(year)]||SEASON_ID;
  const api=await apiFetch(`/v1/public/seasons/${id}`);
  const se=api?.identity?.season,co=api?.identity?.competition;
  return {league:se?.officialName||null,logo:se?.logoUrl||null,seal:co?.logoUrl||null};
}
export function getArchive2025Overview(){return archiveOverview(LEGACY_2025)}
export function getMasterLegacyOverview(){return archiveOverview(MASTER_2026)}
export function getArchive2025Records(){return recordsFor(LEGACY_2025)}
export function getArchive2026Records(){return recordsFor(legacy)}
export function getMasterRecords(){return recordsFor(MASTER_2026)}
export function getArchive2025Campaign(){return campaignTable(LEGACY_2025)}
export function getMasterCampaign(){return campaignTable(MASTER_2026)}
export function getArchive2025Team(slug){return archiveTeam(LEGACY_2025,slug)}
export function getArchive2025Player(slug){return archivePlayer(LEGACY_2025,slug)}
export function getArchive2025Game(slug){return archiveGameBySlug(LEGACY_2025,slug)}

function masterCampaignFromApi(data){
  const rows=data?.standings?.mode==='CLASSIFICATION'&&Array.isArray(data.standings.rows)?data.standings.rows:null;
  if(rows?.length)return rows.map((x,i)=>({team:x.team,games:Number(x.played||0),wins:Number(x.wins||0),losses:Number(x.losses||0),pointsFor:Number(x.pointsFor||0),pointsAgainst:Number(x.pointsAgainst||0),diff:Number(x.difference||0),classificationPoints:Number(x.classificationPoints||0),position:Number(x.position||i+1)}));
  return (data?.teams||[]).map((x,i)=>({team:x.team,games:Number(x.games||0),wins:Number(x.wins||0),losses:Number(x.losses||0),pointsFor:Number(x.pointsFor||0),pointsAgainst:Number(x.pointsAgainst||0),diff:Number(x.pointDifferential??(Number(x.pointsFor||0)-Number(x.pointsAgainst||0))),classificationPoints:null,position:i+1}));
}

// Visão geral de QUALQUER temporada do L3C Stats (jogos, atletas, equipes, classificação), já normalizada.
export async function getSeasonOverviewById(seasonId){
  const [portal,gamesPayload,playersPayload]=await Promise.all([
    apiFetch(`/v1/public/seasons/${encodeURIComponent(seasonId)}`),
    apiFetch(`/v1/public/seasons/${encodeURIComponent(seasonId)}/games`),
    apiFetch(`/v1/public/seasons/${encodeURIComponent(seasonId)}/players`),
  ]);
  if(!portal)return null;
  const d=normalizeOverview(portal);
  const apiGames=Array.isArray(gamesPayload?.games)?gamesPayload.games.map(normalizeGame):[...(d.upcoming||[]),...(d.recentResults||[])];
  const players=Array.isArray(playersPayload?.players)?playersPayload.players:(d.players||[]);
  return {...d,season:d.identity?.season||d.season||{id:seasonId},legacyGames:apiGames,players,campaign:masterCampaignFromApi(d),source:gamesPayload?'l3c-stats':'l3c-stats-partial'};
}
export async function getMasterOverview(){
  const d=await getSeasonOverviewById(MASTER_SEASON_ID);
  if(d)return {...d,season:d.identity?.season||d.season||{id:MASTER_SEASON_ID,year:2026}};
  return {...getMasterLegacyOverview(),source:'contingency'};
}

function masterRawBySlug(slug){
  const aliases=gameAliases(MASTER_2026);
  return (MASTER_2026.games||[]).find(g=>aliases.get(g.source?.wordpressPostId)===slug)||null;
}
function masterWpIdFromGame(game){
  if(game?.wpId!=null)return Number(game.wpId);
  const m=String(game?.id||'').match(/^legacy_game_master_2026_(\d+)$/);
  return m?Number(m[1]):null;
}
export function masterGameSlug(game){
  const wpId=masterWpIdFromGame(game);
  const raw=(MASTER_2026.games||[]).find(g=>Number(g.source?.wordpressPostId)===Number(wpId));
  return raw?gameAliases(MASTER_2026).get(raw.source.wordpressPostId):`master-id-${encodeURIComponent(game.id)}`;
}
export function archive2025GameSlug(game){const raw=(LEGACY_2025.games||[]).find(g=>Number(g.source?.wordpressPostId)===Number(game?.wpId));return raw?gameAliases(LEGACY_2025).get(raw.source.wordpressPostId):eventSlugForGame(game)}

export async function getMasterTeam(slug){
  const overview=await getMasterOverview();
  const item=(overview?.teams||[]).find(x=>slugify(x.team?.name)===slug||slugify(x.team?.shortName)===slug);
  if(item?.team?.id){
    const d=await apiFetch(`/v1/public/seasons/${MASTER_SEASON_ID}/teams/${item.team.id}`);
    if(d)return {...d,competition:'Master',seasonYear:2026,source:'l3c-stats'};
  }
  const fb=archiveTeam(MASTER_2026,slug);
  return fb?{...fb,competition:'Master',seasonYear:2026,source:'contingency'}:null;
}

export async function getMasterPlayer(slug){
  const overview=await getMasterOverview();
  const canonical=String(slug||'').replace(/-\d+$/,'');
  const fb=archivePlayer(MASTER_2026,canonical);
  const item=(overview?.players||[]).find(x=>slugify(x.player?.name)===slug||slugify(x.player?.name)===canonical);
  if(item?.player?.personId){
    const d=await apiFetch(`/v1/public/seasons/${MASTER_SEASON_ID}/players/${item.player.personId}`);
    if(d){
      const team=d.player?.team||item.teams?.[0]||fb?.player?.team||null;
      const raw=d.stats?.gameLog||[];
      const log=raw.map(x=>normalizePlayerGameLogEntry(x,team,fb?.stats?.gameLog||[])).filter(Boolean);
      const ranks=computedRankings(overview.players||[],d.player?.personId||item.player.personId,d.player?.name||item.player?.name);
      return {...fb,...d,stats:{...(fb?.stats||{}),...(d.stats||{}),gameLog:log.length?log:(fb?.stats?.gameLog||[])},rankings:{...ranks,...(d.rankings||{})},competition:'Master',seasonYear:2026,source:'l3c-stats'};
    }
  }
  return fb?{...fb,competition:'Master',seasonYear:2026,source:'contingency'}:null;
}

function richGameFromApi(d,fallback){
  if(!d?.game)return fallback;
  const sideRows=(block,side)=>((block?.players||[]).map(r=>({...r,side,rebounds:Number(r.rebounds||0),player:{...(r.player||{}),slug:slugify(r.player?.name||'')},team:block?.team||null})));
  const rows=[...sideRows(d.teamA,'A'),...sideRows(d.teamB,'B')];
  const metricLead=(key)=>{const max=Math.max(...rows.map(r=>Number(r[key]||0)),0);return rows.filter(r=>max>0&&Number(r[key]||0)===max)};
  const totals={A:d.teamA?.totals||fallback?.teamTotals?.A||null,B:d.teamB?.totals||fallback?.teamTotals?.B||null};
  let best=d.bestPlayer||fallback?.bestPlayer||null;
  if(best?.player?.id){const r=rows.find(x=>x.player?.id===best.player.id);if(r)best={...best,steals:r.steals,blocks:r.blocks,rebounds:r.rebounds,assists:r.assists,points:r.points,efficiency:r.efficiency,team:r.team};}
  return {...fallback,...d,game:normalizeGame(d.game),periods:d.periods?.length?d.periods:(fallback?.periods||[]),boxScore:rows.length?rows:(fallback?.boxScore||[]),bestPlayer:best,leaders:{points:metricLead('points'),rebounds:metricLead('rebounds'),assists:metricLead('assists'),steals:metricLead('steals'),blocks:metricLead('blocks')},teamTotals:totals,competition:'Master',seasonYear:2026,source:'l3c-stats'};
}

export async function getMasterGame(slug){
  if(slug.startsWith('master-id-')){
    const id=decodeURIComponent(slug.slice(10));
    const overview=await getMasterOverview();
    if(!(overview.legacyGames||[]).some(g=>g.id===id))return null;
    const d=await apiFetch(`/v1/public/games/${encodeURIComponent(id)}`);
    return d?.game?richGameFromApi(d,null):null;
  }
  const raw=masterRawBySlug(slug);
  const fb=raw?archiveGameBySlug(MASTER_2026,slug):null;
  const wpId=raw?.source?.wordpressPostId;
  if(wpId){
    const d=await apiFetch(`/v1/public/games/legacy_game_master_2026_${wpId}`);
    if(d)return richGameFromApi(d,fb);
  }
  return fb?{...fb,competition:'Master',seasonYear:2026,source:'contingency'}:null;
}

export async function getAnyTeamBySlug(slug){
  const current=await getTeamBySlug(slug); if(current)return {...current,competition:current.competition||'Adulto Livre',seasonYear:current.seasonYear||2026};
  const master=await getMasterTeam(slug); if(master)return master;
  return getArchive2025Team(slug);
}
export async function getAnyPlayerBySlug(slug){
  const canonical=String(slug||'').replace(/-\d+$/,'');
  const current=await getPlayerBySlug(canonical); if(current)return {...current,competition:current.competition||'Adulto Livre',seasonYear:current.seasonYear||2026};
  const master=await getMasterPlayer(canonical); if(master)return master;
  return getArchive2025Player(canonical);
}

export async function getUnifiedPlayerProfile(slug){
  const canonical=String(slug||'').replace(/-\d+$/,'');
  const [adult2026,master2026]=await Promise.all([
    getPlayerBySlug(canonical),
    getMasterPlayer(canonical),
  ]);
  const adult2025=getArchive2025Player(canonical);
  const extraCtx=[];
  for(const s of (await getExtraSeasons())){
    if(s.id===SEASON_ID||s.id===MASTER_SEASON_ID)continue;
    try{
      // A lista estatística do resumo contém somente atletas com jogo registrado.
      // A lista oficial de inscrições também inclui atletas recém-homologados, com 0 jogos.
      // Isso permite criar o perfil público automaticamente após a aprovação da Liga.
      const [rosterDirectory,ov]=await Promise.all([
        apiFetch(`/v1/public/seasons/${encodeURIComponent(s.id)}/players`),
        apiFetch(`/v1/public/seasons/${encodeURIComponent(s.id)}`),
      ]);
      const matching=(row)=>slugify(row?.player?.name)===canonical||slugify(row?.player?.fullName)===canonical;
      const item=(rosterDirectory?.players||[]).find(matching)||(ov?.players||[]).find(matching);
      if(!item?.player?.personId)continue;
      const api=await apiFetch(`/v1/public/seasons/${encodeURIComponent(s.id)}/players/${encodeURIComponent(item.player.personId)}`);
      if(!api)continue;
      const seedTeam=api.player?.currentTeam||api.currentTeam||item.teams?.[0]||null;
      const rawLog=Array.isArray(api.stats?.gameLog)?api.stats.gameLog:Array.isArray(api.gameLog)?api.gameLog:[];
      const gameLog=rawLog.map(x=>normalizePlayerGameLogEntry(x,seedTeam,[])).filter(Boolean).sort((a,b)=>new Date(b.game?.startsAt||0)-new Date(a.game?.startsAt||0));
      const team=seedTeam||gameLog.find(x=>x.team?.name)?.team||null;
      const data={...api,player:{...(item.player||{}),...(api.player||{}),team,currentTeam:team},stats:{...(api.stats||{}),games:Number(api.stats?.games??api.games??item.games??0),averages:{...(item.averages||{}),...(api.stats?.averages||api.averages||{})},gameLog},competition:s.competitionName||'Adulto Livre',seasonYear:s.year||2027};
      const isAdulto=s.scopeKey==='adulto';const compLabel=isAdulto?'Adulto':(s.competitionName||s.scopeKey);
      extraCtx.push({scopeKey:s.scopeKey,key:`${s.scopeKey}-${s.year}`,label:`${compLabel} ${s.year}`,shortLabel:`${s.year} · ${s.competitionName||'Adulto Livre'}`,competition:s.competitionName||'Adulto Livre',year:s.year||2027,data});
    }catch{}
  }
  const contexts=[];
  if(adult2026)contexts.push({key:'adulto-2026',label:'Adulto 2026',shortLabel:'2026 · Adulto Livre',competition:'Adulto Livre',year:2026,data:{...adult2026,competition:'Adulto Livre',seasonYear:2026}});
  if(master2026)contexts.push({key:'master-2026',label:'Master 2026',shortLabel:'2026 · Liga Master',competition:'Master',year:2026,data:{...master2026,competition:'Master',seasonYear:2026}});
  for(const x of extraCtx)contexts.push(x);
  if(adult2025)contexts.push({key:'adulto-2025',label:'Adulto 2025',shortLabel:'2025 · Adulto Livre',competition:'Adulto Livre',year:2025,data:{...adult2025,competition:'Adulto Livre',seasonYear:2025}});
  if(!contexts.length)return null;
  const preferred=contexts.find(x=>x.key==='adulto-2026')||contexts[0];
  const identityCandidates=contexts.map(x=>x.data?.player).filter(Boolean);
  const identity={
    name:preferred.data?.player?.name||identityCandidates[0]?.name||canonical,
    slug:canonical,
    photoUrl:identityCandidates.find(x=>x?.photoUrl)?.photoUrl||null,
  };
  return {slug:canonical,identity,contexts};
}
export async function getAnyGameBySlug(slug){
  const current=await getGameBySlug(slug); if(current)return {...current,competition:current.competition||'Adulto Livre',seasonYear:current.seasonYear||2026};
  const master=await getMasterGame(slug); if(master)return master;
  const archived=getArchive2025Game(slug); if(archived)return archived;
  return getGameFromApiBySlug(slug);
}

// Jogos criados diretamente no L3C Stats (ids que não são "legacy_*") não existem nos arquivos
// históricos do SITE. Esta busca de último recurso procura o jogo nas temporadas públicas da API
// pelo slug "equipeA-vs-equipeB" (com sufixo -N quando as mesmas equipes se enfrentam mais de uma vez).
async function getGameFromApiBySlug(slug){
  const clean=String(slug||'').toLowerCase();
  if(!/^[a-z0-9-]{3,160}$/.test(clean))return null;
  const base=clean.replace(/-\d+$/,'');
  const nth=Math.max(1,Number((clean.match(/-(\d+)$/)||[])[1])||1);
  const extra=await getExtraSeasons();
  const seasons=[
    {id:MASTER_SEASON_ID,competition:'Master'},
    {id:SEASON_ID,competition:'Adulto Livre'},
    ...extra.filter(s=>s.id!==SEASON_ID&&s.id!==MASTER_SEASON_ID).map(s=>({id:s.id,competition:s.competitionName||'Adulto Livre'})),
  ];
  for(const season of seasons){
    const payload=await apiFetch(`/v1/public/seasons/${encodeURIComponent(season.id)}/games`);
    const list=(Array.isArray(payload?.games)?payload.games:[])
      .filter(g=>g?.id&&!String(g.id).startsWith('legacy_'))
      .filter(g=>slugify(`${g.teamA?.name||''}-vs-${g.teamB?.name||''}`)===base||slugify(`${g.teamA?.name||''}-vs-${g.teamB?.name||''}`)===clean)
      .sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
    if(!list.length)continue;
    const exact=list.find(g=>slugify(`${g.teamA?.name||''}-vs-${g.teamB?.name||''}`)===clean);
    const found=exact||list[Math.min(nth,list.length)-1];
    const d=await apiFetch(`/v1/public/games/${encodeURIComponent(found.id)}?_=${Date.now()}`);
    if(!d?.game)continue;
    const rich=richGameFromApi(d,null);
    const year=Number(d.game?.season?.year||found?.season?.year||2026);
    return {...rich,competition:season.competition,seasonYear:year};
  }
  return null;
}


// Busca nas temporadas criadas no L3C Stats (qualquer competição pública): equipes e atletas.
export async function publicSearchExtra(query=''){
  const q=String(query||'').trim().toLocaleLowerCase('pt-BR');if(!q)return [];
  const out=[];
  for(const season of await getExtraSeasons()){
    const [ov,rosterDirectory]=await Promise.all([
      apiFetch(`/v1/public/seasons/${encodeURIComponent(season.id)}`),
      apiFetch(`/v1/public/seasons/${encodeURIComponent(season.id)}/players`),
    ]);
    if(!ov&&!rosterDirectory)continue;
    const label=`${season.competitionName||'Competição'} ${season.year||''}`.trim();
    const hit=(...parts)=>parts.filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q);
    for(const x of ov?.teams||[])if(hit(x.team?.name,x.team?.city))out.push({type:`Equipe · ${label}`,name:x.team.name,photoUrl:x.team.logoUrl,href:`/team/${slugify(x.team.name)}/?temporada=${season.year||''}&s=${encodeURIComponent(season.id)}`});
    const publicPlayers=Array.isArray(rosterDirectory?.players)?rosterDirectory.players:(ov?.players||[]);
    for(const x of publicPlayers)if(x.player?.name&&hit(x.player.name,...(x.teams||[]).map(t=>t.name)))out.push({type:`Atleta · ${label}`,name:prettyName(x.player.name),photoUrl:x.player.photoUrl,href:`/player/${slugify(x.player.name)}/?context=${season.scopeKey}-${season.year}`});
  }
  return out.slice(0,60);
}
export function publicSearch(query=''){
  const q=String(query||'').trim().toLocaleLowerCase('pt-BR'); if(!q)return [];
  const out=[]; const seen=new Set();
  const add=(item)=>{const k=`${item.type}:${item.href}`;if(seen.has(k))return;seen.add(k);out.push(item)};
  const hit=(...parts)=>parts.filter(Boolean).join(' ').toLocaleLowerCase('pt-BR').includes(q);
  const cur=fallbackOverview();
  for(const x of cur.teams||[]) if(hit(x.team?.name,x.team?.city)) add({type:'Equipe · Adulto Livre 2026',name:x.team.name,photoUrl:x.team.logoUrl,href:`/team/${slugify(x.team.name)}/`});
  for(const x of cur.players||[]) if(hit(x.player?.name,...(x.teams||[]).map(t=>t.name))) add({type:'Atleta · Adulto Livre 2026',name:x.player.name,photoUrl:x.player.photoUrl,href:`/player/${slugify(x.player.name)}/`});
  for(const g of cur.legacyGames||[]) if(hit(g.teamA?.name,g.teamB?.name,g.stage?.name,g.round)) add({type:'Jogo · Adulto Livre 2026',name:`${g.teamA?.name||''} × ${g.teamB?.name||''}`,photoUrl:g.teamA?.logoUrl||null,href:`/event/${eventSlugForGame(g)}/`});
  const master=getMasterLegacyOverview();
  for(const x of master.teams||[]) if(hit(x.team?.name,x.team?.city)) add({type:'Equipe · Liga Master 2026',name:x.team.name,photoUrl:x.team.logoUrl,href:`/team/${slugify(x.team.name)}/`});
  for(const x of master.players||[]) if(hit(x.player?.name,...(x.teams||[]).map(t=>t.name))) add({type:'Atleta · Liga Master 2026',name:x.player.name,photoUrl:x.player.photoUrl,href:`/player/${slugify(x.player.name)}/?context=master-2026`});
  for(const g of master.legacyGames||[]) if(hit(g.teamA?.name,g.teamB?.name,g.stage?.name,g.round)) add({type:'Jogo · Liga Master 2026',name:`${g.teamA?.name||''} × ${g.teamB?.name||''}`,photoUrl:g.teamA?.logoUrl||null,href:`/master/event/${masterGameSlug(g)}/`});
  const old=getArchive2025Overview();
  for(const x of old.teams||[]) if(hit(x.team?.name,x.team?.city)) add({type:'Equipe · 2025',name:x.team.name,photoUrl:x.team.logoUrl,href:`/team/${slugify(x.team.name)}/`});
  for(const x of old.players||[]) if(hit(x.player?.name,...(x.teams||[]).map(t=>t.name))) add({type:'Atleta · 2025',name:x.player.name,photoUrl:x.player.photoUrl,href:`/player/${slugify(x.player.name)}/?context=adulto-2025`});
  for(const g of old.legacyGames||[]) if(hit(g.teamA?.name,g.teamB?.name,g.stage?.name,g.round)) add({type:'Jogo · Adulto Livre 2025',name:`${g.teamA?.name||''} × ${g.teamB?.name||''}`,photoUrl:g.teamA?.logoUrl||null,href:`/event/${archive2025GameSlug(g)}/`});
  for(const n of newsFallback()||[]) if(hit(n.title)) add({type:'Notícia',name:n.title,photoUrl:null,href:`/noticias/${n.slug}/`});
  return out.slice(0,80);
}


// Arbitragem pública (somente profissionais com cadastro aprovado; sem documento, contato ou valores).
export const CREW_ROLE_LABEL={REFEREE_1:'Árbitro principal',REFEREE_2:'Árbitro auxiliar',REFEREE_3:'Árbitro auxiliar',COMMISSIONER:'Comissário',SCORER:'Apontador',TIMEKEEPER:'Cronometrista',SHOT_CLOCK:'Operador dos 24s',TABLE_ASSISTANT:'Auxiliar de mesa',STATISTICIAN:'Estatístico'};
export async function getPublicOfficials(){const d=await apiFetch('/v1/public/officials');return Array.isArray(d?.officials)?d.officials:[]}
export async function getPublicOfficialBySlug(slug){
  const list=await getPublicOfficials();const o=list.find(x=>slugify(x.name)===slug);if(!o)return null;
  const d=await apiFetch(`/v1/public/officials/${encodeURIComponent(o.id)}`);
  return d?.official?{official:d.official,games:Array.isArray(d.games)?d.games:[]}:{official:o,games:[]};
}

// Líderes: melhor jogo por atleta e recordes de toda a história do Adulto.
export function getBestGames(year){return bestGamesByAthlete(String(year)==='2025'?LEGACY_2025:legacy)}
export function getMasterBestGames(){return bestGamesByAthlete(MASTER_2026)}
export function getMasterRecordsTagged(){return getMasterRecords().map(r=>({...r,season:'2026'}))}

// Marcas individuais de qualquer temporada, calculadas pela API a partir das súmulas finalizadas.
const HIGH_LABELS={points:'Pontos',rebounds:'Rebotes',assists:'Assistências',steals:'Roubos',blocks:'Tocos'};
export async function getSeasonHighs(seasonId){
  const d=await apiFetch(`/v1/public/seasons/${encodeURIComponent(seasonId)}/highs`,{ttl:20000});
  const bests=new Map();
  for(const p of Object.values(d?.players||{})){
    const entry={};
    for(const [k,b] of Object.entries(p.bests||{}))entry[k]={value:Number(b.value),game:normalizeGame(b.game),teamId:b.teamId};
    bests.set(slugify(p.name),entry);
  }
  const records=Object.keys(HIGH_LABELS).map(k=>(d?.records||[]).find(r=>r.key===k)).filter(Boolean).map(r=>({key:r.key,label:HIGH_LABELS[r.key],value:Number(r.value),player:{name:r.player?.name,photoUrl:r.player?.photoUrl||null},teamName:r.team?.name||'',game:normalizeGame(r.game)}));
  return {bests,records};
}
export function mergeBests(...maps){
  const out=new Map();
  for(const m of maps){
    for(const [slug,entry] of (m||new Map()).entries()){
      const cur=out.get(slug)||{};
      for(const [k,b] of Object.entries(entry||{}))if(!cur[k]||Number(b.value)>Number(cur[k].value))cur[k]=b;
      out.set(slug,cur);
    }
  }
  return out;
}
export function mergeRecords(...lists){
  const by=new Map();
  for(const list of lists)for(const r of (list||[])){const old=by.get(r.key);if(!old||Number(r.value)>Number(old.value))by.set(r.key,r)}
  return ['points','rebounds','assists','steals','blocks'].map(k=>by.get(k)).filter(Boolean);
}
export function getAllTimeRecords(){
  const tag=(rows,season)=>rows.map(r=>({...r,season}));
  const by=new Map();
  for(const r of [...tag(getArchive2025Records(),'2025'),...tag(getArchive2026Records(),'2026')]){
    const old=by.get(r.key);
    if(!old||Number(r.value)>Number(old.value))by.set(r.key,r);
  }
  return [...by.values()];
}
