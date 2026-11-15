import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Sponsors} from '../../../components/SiteChrome';
import {TeamLogo} from '../../../components/Cards';
import {getUnifiedPlayerProfile,eventSlugForGame,archive2025GameSlug,masterGameSlug} from '../../../lib/site';

const BASIC=[['points','PTS','Pontos'],['rebounds','REB','Rebotes'],['assists','AST','Assistências'],['steals','STL','Roubos'],['blocks','BLK','Tocos'],['efficiency','EFI','Eficiência']];
const DETAIL=[['games','J','Jogos'],['minutesSeconds','MIN','Min média'],['points','PTS','Pts média'],['rebounds','REB','Reb média'],['offensiveRebounds','ORB','Orb média'],['defensiveRebounds','DRB','Drb média'],['assists','AST','Ast média'],['steals','STL','Stl média'],['blocks','BLK','Blk média'],['plusMinus','+/-','+/- média'],['efficiency','EFI','Efi média']];
const RECORDS=[['minutesSeconds','Minutos'],['points','Pontos'],['rebounds','Rebotes'],['offensiveRebounds','Reb. ofensivos'],['defensiveRebounds','Reb. defensivos'],['assists','Assistências'],['steals','Roubos de bola'],['blocks','Tocos'],['plusMinus','+/-'],['efficiency','Eficiência']];

function categoryKey(ctx){const c=String(ctx?.competition||'').toLowerCase();if(c.includes('master'))return 'master';if(c.includes('base'))return 'base';if(ctx?.scopeKey&&ctx.scopeKey!=='adulto')return ctx.scopeKey;return 'adulto'}
function categoryLabel(key){return key==='master'?'Master':key==='base'?'Base':key==='adulto'?'Adulto':String(key||'').replace(/-/g,' ').replace(/^./,m=>m.toUpperCase())}
function safeDate(value){if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';try{return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}catch{return '—'}}
function shortDate(value){const x=safeDate(value);return x==='—'?x:x.slice(0,5)}
function fmt(value,digits=1){if(value===null||value===undefined||Number.isNaN(Number(value)))return '—';return Number(value).toFixed(digits).replace('.',',')}
function fmtSmart(value){if(value===null||value===undefined||Number.isNaN(Number(value)))return '—';const n=Number(value);return Number.isInteger(n)?String(n):fmt(n,1)}
function fmtTime(seconds){if(seconds===null||seconds===undefined||Number.isNaN(Number(seconds)))return '—';const s=Math.max(0,Math.round(Number(seconds)));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
function fmtPm(value){if(value===null||value===undefined||Number.isNaN(Number(value)))return '—';const n=Number(value);return `${n>0?'+':''}${fmt(n,1)}`}
function pct(made,attempted){if(attempted===null||attempted===undefined||Number(attempted)<=0)return null;return +(Number(made||0)/Number(attempted)*100).toFixed(1)}
function gameLabel(game){if(!game)return 'Jogo';const a=game.teamA?.name||game.homeTeam?.name||'';const b=game.teamB?.name||game.awayTeam?.name||'';return a&&b?`${a} × ${b}`:(game.opponent?.name?`vs ${game.opponent.name}`:'Jogo')}
function gameHref(item,ctx){const game=item?.game;if(!game)return '/jogos/';if(categoryKey(ctx)==='master')return `/event/${masterGameSlug(game)}/`;if(Number(ctx.year)===2025)return `/event/${archive2025GameSlug(game)}/`;return `/event/${eventSlugForGame(game)}/`}
function availability(stats,key){
  const a=stats?.availability||{};
  if(['points','assists','steals','blocks','rebounds','turnovers','efficiency'].includes(key))return stats?.[key]!==undefined&&stats?.[key]!==null;
  if(key==='minutesSeconds')return a.minutes??(stats?.minutesSeconds!=null);
  if(key==='offensiveRebounds')return a.offensiveRebounds??(stats?.offensiveRebounds!=null);
  if(key==='defensiveRebounds')return a.defensiveRebounds??(stats?.defensiveRebounds!=null);
  if(key==='plusMinus')return a.plusMinus??(stats?.plusMinus!=null);
  if(['fgMade','fgAttempted'].includes(key))return a.fieldGoals??a.shooting??(stats?.fgAttempted!=null);
  if(['fg3Made','fg3Attempted'].includes(key))return a.threePointers??a.shooting??(stats?.fg3Attempted!=null);
  if(['ftMade','ftAttempted'].includes(key))return a.freeThrows??a.shooting??(stats?.ftAttempted!=null);
  return stats?.[key]!=null;
}
function contextualLogs(contexts){const out=[];for(const ctx of contexts){for(const item of (ctx.data?.stats?.gameLog||[])){if(item?.game&&item?.stats)out.push({...item,context:ctx})}}return out}
function aggregateContexts(contexts){
  const logs=contextualLogs(contexts);const sums={},counts={};
  for(const key of ['minutesSeconds','points','rebounds','offensiveRebounds','defensiveRebounds','assists','steals','blocks','turnovers','plusMinus','efficiency']){sums[key]=0;counts[key]=0}
  const shot={fgMade:0,fgAttempted:0,fg3Made:0,fg3Attempted:0,ftMade:0,ftAttempted:0};
  for(const item of logs){
    const st=item.stats||{};
    for(const key of Object.keys(sums)){if(availability(st,key)){sums[key]+=Number(st[key]||0);counts[key]++}}
    for(const key of Object.keys(shot)){if(availability(st,key))shot[key]+=Number(st[key]||0)}
  }
  const avg={};for(const key of Object.keys(sums))avg[key]=counts[key]?+(sums[key]/counts[key]).toFixed(1):null;
  const shooting={fgPct:pct(shot.fgMade,shot.fgAttempted),threePct:pct(shot.fg3Made,shot.fg3Attempted),ftPct:pct(shot.ftMade,shot.ftAttempted),...shot};
  return {games:logs.length||contexts.reduce((n,c)=>n+Number(c.data?.stats?.games||0),0),logs,averages:avg,counts,shooting};
}
function recordFor(logs,key){let best=null;for(const item of logs){const st=item.stats||{};if(!availability(st,key))continue;const v=Number(st[key]);if(!Number.isFinite(v))continue;if(!best||v>best.value)best={value:v,item};}return best}
function opponentFor(item){const ctx=item?.context;const game=item?.game;const team=item?.team?.name||ctx?.data?.player?.currentTeam?.name||ctx?.data?.player?.team?.name;if(!game)return '—';if(team&&String(game.teamA?.name||'').toLowerCase()===String(team).toLowerCase())return game.teamB?.name||'—';if(team&&String(game.teamB?.name||'').toLowerCase()===String(team).toLowerCase())return game.teamA?.name||'—';return game.teamB?.name||game.teamA?.name||'—'}
function seasonSpan(contexts){const years=[...new Set(contexts.map(x=>Number(x.year)).filter(Boolean))].sort((a,b)=>a-b);return years.length>1?`${years[0]}–${years[years.length-1]}`:String(years[0]||'')}
function statValue(agg,key){if(key==='games')return agg.games;if(key==='minutesSeconds')return fmtTime(agg.averages.minutesSeconds);if(key==='plusMinus')return fmtPm(agg.averages.plusMinus);return fmt(agg.averages[key])}
function contextTag(ctx){return `${categoryLabel(categoryKey(ctx))} ${ctx?.year||''}`.trim()}
function contextTeamStints(ctx){
  if(!ctx)return [];
  const logs=[...(ctx?.data?.stats?.gameLog||[])].sort((a,b)=>new Date(a.game?.startsAt||0)-new Date(b.game?.startsAt||0));
  const map=new Map();
  for(const item of logs){const team=item?.team;if(!team?.name)continue;const key=String(team.name).toLowerCase();const at=item.game?.startsAt||null;const prev=map.get(key)||{team,games:0,firstAt:at,lastAt:at};prev.team={...prev.team,...team};prev.games++;if(at&&(!prev.firstAt||new Date(at)<new Date(prev.firstAt)))prev.firstAt=at;if(at&&(!prev.lastAt||new Date(at)>new Date(prev.lastAt)))prev.lastAt=at;map.set(key,prev);}
  const explicit=ctx?.data?.player?.currentTeam||ctx?.data?.currentTeam||null;
  const registered=ctx?.data?.player?.team||null;
  const latest=[...map.values()].sort((a,b)=>new Date(b.lastAt||0)-new Date(a.lastAt||0))[0]?.team||null;
  const current=explicit||latest||registered||null;
  if(current?.name&&!map.has(String(current.name).toLowerCase()))map.set(String(current.name).toLowerCase(),{team:current,games:0,firstAt:null,lastAt:null});
  if(!map.size&&registered?.name)map.set(String(registered.name).toLowerCase(),{team:registered,games:Number(ctx?.data?.stats?.games||0),firstAt:null,lastAt:null});
  const currentKey=String(current?.name||'').toLowerCase();
  return [...map.values()].map(x=>({...x,current:String(x.team?.name||'').toLowerCase()===currentKey})).sort((a,b)=>Number(b.current)-Number(a.current)||(new Date(b.lastAt||0)-new Date(a.lastAt||0)));
}
function contextCurrentTeam(ctx){const stints=contextTeamStints(ctx);return stints.find(x=>x.current)?.team||ctx?.data?.player?.currentTeam||ctx?.data?.player?.team||null}
function contextTeamsLabel(ctx){const stints=contextTeamStints(ctx);if(!stints.length)return ctx?.data?.player?.team?.name||'Equipe';const ordered=[...stints].sort((a,b)=>new Date(a.firstAt||0)-new Date(b.firstAt||0));return ordered.map(x=>x.team?.name).filter(Boolean).join(' → ')}
function uniqueTeams(contexts){const seen=new Set();const out=[];for(const ctx of contexts){for(const stint of contextTeamStints(ctx)){const t=stint.team;if(!t?.name||seen.has(String(t.name).toLowerCase()))continue;seen.add(String(t.name).toLowerCase());out.push(t)}}return out}
function contextNumber(contexts){const values=[...new Set(contexts.map(x=>x?.data?.player?.number).filter(v=>v!==null&&v!==undefined&&String(v)!==''))];return values.length===1?values[0]:null}
function teamSlug(team){if(team?.slug)return team.slug;return String(team?.name||'equipe').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function categoryCareerInfo(contexts,key){
  const rows=contexts.filter(ctx=>categoryKey(ctx)===key).sort((a,b)=>Number(b.year)-Number(a.year));
  if(!rows.length)return null;
  const currentContext=rows[0];const currentStints=contextTeamStints(currentContext);const currentTeam=contextCurrentTeam(currentContext);const currentName=String(currentTeam?.name||'').toLowerCase();
  const previousTeams=[];const seen=new Set();
  for(const stint of currentStints.filter(x=>!x.current)){const team=stint.team;const name=String(team?.name||'').trim();const norm=name.toLowerCase();if(!name||norm===currentName||seen.has(norm))continue;seen.add(norm);previousTeams.push({team,year:currentContext.year,context:currentContext,games:stint.games,sameSeason:true});}
  for(const ctx of rows.slice(1)){for(const stint of contextTeamStints(ctx)){const team=stint.team;const name=String(team?.name||'').trim();const norm=name.toLowerCase();if(!name||norm===currentName||seen.has(norm))continue;seen.add(norm);previousTeams.push({team,year:ctx.year,context:ctx,games:stint.games,sameSeason:false});}}
  return {key,label:categoryLabel(key),contexts:rows,currentContext,currentTeam,currentYear:currentContext?.year||null,currentStints,previousTeams};
}
function TeamCareerLink({team,category,year,kind='current',games=null,sameSeason=false}){if(!team?.name)return null;return <Link className={`player-team-career-link ${kind}`} href={`/team/${teamSlug(team)}/`}><TeamLogo team={team} size={42}/><span><strong>{team.name}</strong><small>{category}{year?` · ${year}`:''}</small>{(sameSeason||games!=null)&&<em className="transfer-meta">{sameSeason?'Transferência na temporada':games!=null?`${games} jogo${games===1?'':'s'}`:''}</em>}</span><b aria-hidden="true">→</b></Link>}
function CareerHeroRelations({infos}){
  const current=infos.filter(x=>x?.currentTeam?.name);const currentNames=new Set(current.map(x=>String(x.currentTeam.name).toLowerCase()));const previous=[];const seen=new Set();
  for(const info of infos){for(const p of info.previousTeams||[]){const key=String(p.team?.name||'').toLowerCase();if(!key||currentNames.has(key)||seen.has(key))continue;seen.add(key);previous.push({...p,category:info.label});}}
  return <div className={`player-career-relations ${previous.length?'has-previous':''} ${current.length>1?'has-multi-category':''}`}>
    <div className="player-career-relation-card"><small>{current.length>1?'Equipes atuais':'Equipe atual'}</small><div className="player-team-career-list">{current.map(info=><TeamCareerLink key={`${info.key}-${info.currentYear}`} team={info.currentTeam} category={info.label} year={info.currentYear}/>)}</div></div>
    {previous.length>0&&<div className="player-career-relation-card"><small>{previous.length>1?'Equipes anteriores':'Equipe anterior'}</small><div className="player-team-career-list">{previous.map((p,i)=><TeamCareerLink key={`${p.category}-${p.year}-${i}`} team={p.team} category={p.category} year={p.year} kind="previous"/>)}</div></div>}
    {current.length>1&&<div className="player-career-relation-card category-status"><small>Situação por categoria</small><div className="player-category-status-list">{current.map(info=><Link key={info.key} href={`?categoria=${info.key}`}><span>{info.label}</span><strong>{info.currentTeam.name}</strong><b>→</b></Link>)}</div></div>}
  </div>;
}
function CategoryHeroRelations({info,selectedContext}){
  if(!info)return null;
  if(selectedContext){
    const stints=contextTeamStints(selectedContext);const isCurrent=selectedContext.key===info.currentContext?.key;const current=stints.find(x=>x.current)||stints[0]||null;const previous=stints.filter(x=>x!==current);
    return <div className={`player-career-relations ${previous.length?'has-previous':''}`}>
      <div className="player-career-relation-card"><small>{isCurrent?'Equipe atual':'Equipe'} em {selectedContext.year}</small><div className="player-team-career-list"><TeamCareerLink team={current?.team||contextCurrentTeam(selectedContext)} category={info.label} year={selectedContext.year} games={current?.games??null}/></div></div>
      {previous.length>0&&<div className="player-career-relation-card"><small>{previous.length>1?`Equipes anteriores em ${selectedContext.year}`:`Equipe anterior em ${selectedContext.year}`}</small><div className="player-team-career-list">{previous.map((x,i)=><TeamCareerLink key={`${selectedContext.year}-${x.team?.name}-${i}`} team={x.team} category={info.label} year={selectedContext.year} games={x.games} sameSeason kind="previous"/>)}</div></div>}
    </div>
  }
  return <div className={`player-career-relations ${info.previousTeams.length?'has-previous':''}`}><div className="player-career-relation-card"><small>Equipe atual</small><div className="player-team-career-list"><TeamCareerLink team={info.currentTeam} category={info.label} year={info.currentYear}/></div></div>{info.previousTeams.length>0&&<div className="player-career-relation-card"><small>{info.previousTeams.length>1?'Equipes anteriores':'Equipe anterior'}</small><div className="player-team-career-list">{info.previousTeams.map((p,i)=><TeamCareerLink key={`${p.year}-${p.team?.name}-${i}`} team={p.team} category={info.label} year={p.year} games={p.games??null} sameSeason={p.sameSeason} kind="previous"/>)}</div></div>}</div>;
}
function CategoryCareerCard({info,profileSlug}){if(!info)return null;return <article className={`player-category-career-card category-${info.key}`}><header><div><small>Categoria</small><h3>{info.label}</h3><p>{info.contexts.length} temporada{info.contexts.length===1?'':'s'} registrada{info.contexts.length===1?'':'s'}</p></div><Link href={`/player/${profileSlug}/?categoria=${info.key}`}>Abrir categoria →</Link></header><div className={`player-category-career-body ${info.previousTeams.length?'has-previous':''}`}><div><small>Equipe atual</small><TeamCareerLink team={info.currentTeam} category={info.label} year={info.currentYear}/></div>{info.previousTeams.length>0&&<div><small>{info.previousTeams.length>1?'Equipes anteriores':'Equipe anterior'}</small><div className="player-team-career-list">{info.previousTeams.map((p,i)=><TeamCareerLink key={`${p.year}-${p.team?.name}-${i}`} team={p.team} category={info.label} year={p.year} games={p.games??null} sameSeason={p.sameSeason} kind="previous"/>)}</div></div>}<div className="player-category-seasons"><small>Temporadas</small><div>{info.contexts.map(ctx=>{const stints=contextTeamStints(ctx);return <Link key={ctx.key} href={`/player/${profileSlug}/?categoria=${info.key}&temporada=${ctx.year}`}><strong>{ctx.year}{stints.length>1&&<i className="player-transfer-badge">Transferência</i>}</strong><span className={stints.length>1?'transfer-path':''}>{contextTeamsLabel(ctx)}</span></Link>})}</div></div></div></article>}
function RecordCard({label,record}){if(!record)return <div className="player-record-card unavailable"><strong>—</strong><span>{label}</span><small>Não disponível neste histórico</small></div>;const key=RECORDS.find(x=>x[1]===label)?.[0];const v=key==='minutesSeconds'?fmtTime(record.value):key==='plusMinus'?fmtPm(record.value):fmt(record.value);return <div className="player-record-card"><i className={`player-record-context category-${categoryKey(record.item.context)}`}>{contextTag(record.item.context)}</i><strong>{v}</strong><span>{label}</span><small>vs <b>{opponentFor(record.item)}</b></small><em>{safeDate(record.item.game?.startsAt)}</em></div>}
function RankingGrid({ctx}){const r=ctx?.data?.rankings||{};const items=[['points','Pontos'],['rebounds','Rebotes'],['assists','Assistências'],['steals','Roubos'],['blocks','Tocos']];return <div className="player-ranking-grid">{items.map(([key,label])=>{const x=r[key];return <Link key={key} className="player-ranking-card" href={categoryKey(ctx)==='master'?'/master/lideres/':`/lideres/?metric=${key}&temporada=${ctx.year}`}><small>{label}</small><strong>{x?.position?`#${x.position}`:'—'}</strong><span>{x?.position?`${fmt(x.value)} média`:'Sem ranking'}</span><em>{x?.games?`${x.games} jogos`:''}</em></Link>})}</div>}
function DetailStats({title,agg,active=false}){return <section className={`panel-box player-detail-stats ${active?'active-season':''}`}><div className="panel-box-head"><h3>{title}</h3><span>{agg.games} jogos</span></div><small className="player-stat-eyebrow">Produção por jogo</small><div className="player-detail-grid">{DETAIL.map(([key,abbr,label])=><div key={key} className="player-detail-cell"><strong>{statValue(agg,key)}</strong><small>{abbr}</small><span>{label}</span></div>)}</div><small className="player-stat-eyebrow">Aproveitamento</small><div className="player-shooting-grid"><div><strong>{agg.shooting?.fgPct==null?'—':`${fmt(agg.shooting.fgPct)}%`}</strong><span>FG%</span></div><div><strong>{agg.shooting?.threePct==null?'—':`${fmt(agg.shooting.threePct)}%`}</strong><span>3P%</span></div><div><strong>{agg.shooting?.ftPct==null?'—':`${fmt(agg.shooting.ftPct)}%`}</strong><span>FT%</span></div></div><p className="player-data-note">Campos não preservados na fonte histórica aparecem como “—”. MIN, ORB, DRB e +/- usam somente jogos que possuem esses campos. Aproveitamentos são calculados por acertos ÷ tentativas somadas, nunca pela média simples das porcentagens.</p></section>}
export default async function PlayerPage({params,searchParams}){
  const {slug}=await params;const query=(await searchParams)||{};const profile=await getUnifiedPlayerProfile(slug);if(!profile)notFound();
  const legacyContext=typeof query.context==='string'?profile.contexts.find(x=>x.key===query.context):null;
  let requestedCategory=typeof query.categoria==='string'?query.categoria.toLowerCase():legacyContext?categoryKey(legacyContext):'carreira';
  const availableCategories=[...new Set(profile.contexts.map(categoryKey))];if(requestedCategory!=='carreira'&&!availableCategories.includes(requestedCategory))requestedCategory='carreira';
  const categoryInfos=availableCategories.map(key=>categoryCareerInfo(profile.contexts,key)).filter(Boolean);
  const categoryContexts=requestedCategory==='carreira'?profile.contexts:profile.contexts.filter(ctx=>categoryKey(ctx)===requestedCategory);
  const requestedYear=Number(query.temporada||legacyContext?.year||0);
  const selectedContext=requestedCategory==='carreira'?null:(requestedYear?categoryContexts.find(ctx=>Number(ctx.year)===requestedYear)||null:null);
  const preferred=selectedContext||categoryContexts.find(x=>x.key==='adulto-2026')||profile.contexts.find(x=>x.key==='adulto-2026')||profile.contexts[0];
  const player=preferred?.data?.player||profile.identity;const canonicalName=profile.identity?.name||player?.name||slug;const displayPhoto=profile.identity?.photoUrl||player?.photoUrl||null;
  const careerAgg=aggregateContexts(profile.contexts);const categoryAgg=aggregateContexts(categoryContexts);const selectedAgg=selectedContext?aggregateContexts([selectedContext]):null;const heroAgg=selectedAgg||(requestedCategory==='carreira'?careerAgg:categoryAgg);
  const allTeams=uniqueTeams(profile.contexts).map(t=>t.name);const categoryTeams=uniqueTeams(categoryContexts).map(t=>t.name);
  const recordLogs=requestedCategory==='carreira'?careerAgg.logs:categoryAgg.logs;const records=Object.fromEntries(RECORDS.map(([key])=>[key,recordFor(recordLogs,key)]));
  const categoryTitle=requestedCategory==='carreira'?'Carreira':categoryLabel(requestedCategory);const selectedLogs=selectedContext?selectedAgg.logs:[];const selectedHasTransfer=selectedContext?contextTeamStints(selectedContext).length>1:false;
  const currentCategoryInfo=requestedCategory==='carreira'?null:categoryInfos.find(x=>x.key===requestedCategory)||null;
  const selectedNumber=selectedContext?contextNumber([selectedContext]):null;
  const heroEyebrow=selectedContext?`${selectedNumber!=null?`#${selectedNumber} · `:''}Perfil único · ${categoryLabel(categoryKey(selectedContext))} ${selectedContext.year}`:requestedCategory==='carreira'?'Perfil único · carreira consolidada':`Perfil único · ${categoryTitle} consolidado`;
  const heroMeta=selectedContext?`${categoryTitle} · ${selectedContext.year}`:requestedCategory==='carreira'?`${profile.contexts.length} participações · ${seasonSpan(profile.contexts)}`:`${categoryContexts.length} participação(ões) · ${seasonSpan(categoryContexts)}`;

  return <main className={`player-page player-profile-v055 player-profile-v056 player-profile-v057 career-mode-${requestedCategory}`}>
    <Sponsors/>
    <section className="player-v055-hero player-v056-hero"><div className="shell player-v055-hero-grid player-v056-hero-grid">
      <div className="player-v055-photo player-v056-photo">{displayPhoto?<img src={displayPhoto} alt={canonicalName}/>:<div className="player-placeholder xl">{canonicalName?.[0]||'?'}</div>}</div>
      <div className="player-v055-copy player-v056-copy player-v057-copy"><small>{heroEyebrow}</small><h1>{canonicalName}</h1><p className="player-v057-meta">{heroMeta}</p>
        <div className="player-v055-quick player-v056-quick">{BASIC.map(([key,abbr])=><div key={key}><strong>{fmt(heroAgg.averages?.[key])}</strong><span>{abbr}/J</span></div>)}</div>
        {requestedCategory==='carreira'?<CareerHeroRelations infos={categoryInfos}/>:<CategoryHeroRelations info={currentCategoryInfo} selectedContext={selectedContext}/>}
      </div>
    </div></section>

    <section className="section shell player-career-navigation player-v056-navigation"><div className="section-heading compact"><div><h2>Carreira e categorias</h2><p className="section-subtitle">Um único perfil, com vínculos organizados por categoria, equipe e temporada.</p></div><span className="unified-profile-badge">Perfil consolidado</span></div>
      <div className="player-category-tabs"><Link className={requestedCategory==='carreira'?'active':''} href={`/player/${profile.slug}/`}>Carreira</Link>{availableCategories.map(key=><Link key={key} className={requestedCategory===key?'active':''} href={`/player/${profile.slug}/?categoria=${key}`}>{categoryLabel(key)}</Link>)}</div>
      {requestedCategory!=='carreira'&&<div className="category-history-panel player-v056-context-panel"><div><small>{categoryTitle} · histórico geral</small><h3>{categoryAgg.games} jogos</h3><p>{categoryTeams.join(' · ')||'Histórico da categoria'} · {seasonSpan(categoryContexts)}</p></div><div className="category-season-selector">{[...categoryContexts].sort((a,b)=>b.year-a.year).map(ctx=><Link key={ctx.key} className={selectedContext?.key===ctx.key?'active':''} href={`/player/${profile.slug}/?categoria=${requestedCategory}&temporada=${ctx.year}`}><small>{ctx.year}</small><b>{contextTeamsLabel(ctx)}</b><span>{ctx.data?.stats?.games||0} jogos{contextTeamStints(ctx).length>1?' · transferência':''}</span></Link>)}</div></div>}
    </section>

    {requestedCategory==='carreira'?<>
      <section className="section shell player-v056-section player-v057-category-section"><div className="section-heading compact"><div><h2>Vínculos por categoria</h2><p className="section-subtitle">Equipe atual, equipes anteriores e temporadas registradas em cada categoria disputada pelo atleta.</p></div></div><div className="player-category-career-stack">{categoryInfos.map(info=><CategoryCareerCard key={info.key} info={info} profileSlug={profile.slug}/>)}</div></section>
      <section className="section shell player-v056-section"><div className="panel-box"><div className="panel-box-head"><h3>Melhores marcas da carreira</h3><span>{seasonSpan(profile.contexts)}</span></div><div className="player-record-grid">{RECORDS.map(([key,label])=><RecordCard key={key} label={label} record={records[key]}/>)}</div></div></section>
      <section className="section shell player-v056-section"><DetailStats title={`Estatísticas · carreira (${seasonSpan(profile.contexts)})`} agg={careerAgg}/></section>
    </>:<>
      {selectedContext&&<section className="section shell player-v056-section"><div className="panel-box player-rankings-panel"><div className="panel-box-head"><h3>Posição nos rankings de {selectedContext.year}</h3><span>{categoryTitle}</span></div><p className="player-data-note top-note">Posição considerando o ranking oficial disponível para a temporada selecionada.</p><RankingGrid ctx={selectedContext}/></div></section>}
      <section className="section shell player-v056-section"><div className="panel-box"><div className="panel-box-head"><h3>Melhores marcas · {categoryTitle}</h3><span>{seasonSpan(categoryContexts)}</span></div><div className="player-record-grid">{RECORDS.map(([key,label])=><RecordCard key={key} label={label} record={records[key]}/>)}</div></div></section>
      <section className="section shell player-stats-stack player-v056-section">{selectedContext?<><DetailStats title={`Estatísticas · ${categoryTitle} ${selectedContext.year}`} agg={selectedAgg} active/>{categoryContexts.length>1&&<DetailStats title={`Estatísticas · histórico ${categoryTitle} (${seasonSpan(categoryContexts)})`} agg={categoryAgg}/>}</>:<DetailStats title={`Estatísticas · histórico ${categoryTitle} (${seasonSpan(categoryContexts)})`} agg={categoryAgg}/>}</section>
      {selectedContext?<section className="section shell player-v056-section"><div className="panel-box"><div className="panel-box-head"><h3>Jogos de {selectedContext.year}</h3><span>{selectedLogs.length} registro(s)</span></div>{selectedLogs.length?<div className="table-scroll"><table className="player-games-table"><thead><tr><th>Data</th>{selectedHasTransfer&&<th>Equipe</th>}<th>Jogo</th><th>Fase</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>+/-</th><th>EFI</th></tr></thead><tbody>{selectedLogs.map((item,index)=><tr key={`${selectedContext.key}-${index}`}><td>{shortDate(item.game?.startsAt)}</td>{selectedHasTransfer&&<td className="player-game-team">{item.team?.name?<Link href={`/team/${teamSlug(item.team)}/`}><TeamLogo team={item.team} size={22}/><span>{item.team.name}</span></Link>:'—'}</td>}<td><Link href={gameHref(item,selectedContext)}>{gameLabel(item.game)}</Link></td><td>{item.game?.stage?.name||item.game?.round||'—'}</td><td>{availability(item.stats,'minutesSeconds')?fmtTime(item.stats.minutesSeconds):'—'}</td><td>{fmtSmart(item.stats?.points)}</td><td>{fmtSmart(item.stats?.rebounds)}</td><td>{fmtSmart(item.stats?.assists)}</td><td>{fmtSmart(item.stats?.steals)}</td><td>{fmtSmart(item.stats?.blocks)}</td><td>{availability(item.stats,'plusMinus')?fmtPm(item.stats.plusMinus):'—'}</td><td>{fmtSmart(item.stats?.efficiency)}</td></tr>)}</tbody></table></div>:<div className="empty">Ainda não há boxscores disponíveis para esta temporada.</div>}</div></section>:<section className="section shell player-v056-section"><div className="player-season-prompt"><strong>Selecione uma temporada</strong><span>Escolha 2026, 2025 ou outra temporada disponível acima para abrir rankings e jogos daquele período.</span></div></section>}
    </>}
  </main>
}
