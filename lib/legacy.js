import legacy2025Raw from '../data/legacy-2025.json';
import master2026Raw from '../data/master-2026.json';
import {localizeData} from './media';
const legacy2025=localizeData(legacy2025Raw);
const master2026=localizeData(master2026Raw);

export const LEGACY_2025 = legacy2025;
export const MASTER_2026 = master2026;

function totalRebounds(row){
  if(row && row.totalRebounds !== undefined && row.totalRebounds !== null && row.totalRebounds !== '') return Number(row.totalRebounds||0);
  if(row && row.rebounds !== undefined && row.rebounds !== null && row.rebounds !== '') return Number(row.rebounds||0);
  return Number(row?.offensiveRebounds||0)+Number(row?.defensiveRebounds||0);
}

function isHistorical2025Row(row){return String(row?.historicalStatsSource||'').includes('2025')}
function legacyEfficiency(row){
  if(row?.efficiency !== undefined && row?.efficiency !== null && row?.efficiency !== '' && Number.isFinite(Number(row.efficiency))) return Number(row.efficiency);
  const base=Number(row?.points||0)+totalRebounds(row)+Number(row?.assists||0)+Number(row?.steals||0)+Number(row?.blocks||0)-Number(row?.turnovers||0);
  const hasShooting=!isHistorical2025Row(row)&&Number(row?.fgAttempted||0)+Number(row?.ftAttempted||0)>0;
  if(!hasShooting)return base;
  return base-(Number(row?.fgAttempted||0)-Number(row?.fgMade||0))-(Number(row?.ftAttempted||0)-Number(row?.ftMade||0));
}
function rowAvailability(row){
  const historical=isHistorical2025Row(row);
  return {
    minutes:!historical&&row?.minutesSeconds!==null&&row?.minutesSeconds!==undefined,
    rebounds:true,
    offensiveRebounds:!historical,
    defensiveRebounds:!historical,
    assists:true,steals:true,blocks:true,turnovers:true,
    plusMinus:!historical&&row?.plusMinus!==null&&row?.plusMinus!==undefined,
    efficiency:true,
    fieldGoals:!historical,threePointers:!historical,freeThrows:!historical,
    shooting:!historical,
  };
}
function statLine(row){
  const a=rowAvailability(row);
  return {
    minutesSeconds:a.minutes?Number(row?.minutesSeconds||0):null,
    points:Number(row?.points||0),rebounds:totalRebounds(row),
    offensiveRebounds:a.offensiveRebounds?Number(row?.offensiveRebounds||0):null,
    defensiveRebounds:a.defensiveRebounds?Number(row?.defensiveRebounds||0):null,
    assists:Number(row?.assists||0),steals:Number(row?.steals||0),blocks:Number(row?.blocks||0),turnovers:Number(row?.turnovers||0),
    plusMinus:a.plusMinus?Number(row?.plusMinus||0):null,efficiency:legacyEfficiency(row),
    fgMade:a.shooting?Number(row?.fgMade||0):null,fgAttempted:a.shooting?Number(row?.fgAttempted||0):null,
    fg3Made:a.shooting?Number(row?.fg3Made||0):null,fg3Attempted:a.shooting?Number(row?.fg3Attempted||0):null,
    ftMade:a.shooting?Number(row?.ftMade||0):null,ftAttempted:a.shooting?Number(row?.ftAttempted||0):null,
    availability:a,
  };
}

export function archiveSlug(value=''){
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function editionKey(data){
  return archiveSlug(data?.target?.editionSlug || `${data?.target?.category||'liga'}-${data?.target?.year||''}`) || 'arquivo';
}

export function teamView(data, team){
  if(!team) return null;
  return {
    id:`legacy_team_${editionKey(data)}_${team.wordpressId}`,
    wpId:team.wordpressId,
    name:team.name,
    shortName:team.name,
    logoUrl:team.logoUrl||null,
    slug:team.slug||archiveSlug(team.name),
    city:'Franca',
    state:'SP',
  };
}

export function gameAliases(data){
  const counts=new Map();
  const out=new Map();
  for(const game of data?.games||[]){
    const base=archiveSlug(game.title || `${game.teams?.[0]?.name||'jogo'}-vs-${game.teams?.[1]?.name||'jogo'}`);
    const n=(counts.get(base)||0)+1; counts.set(base,n);
    out.set(game.source?.wordpressPostId, n===1?base:`${base}-${n}`);
  }
  return out;
}

export function gameView(data, raw){
  if(!raw) return null;
  const a=data.teams.find(t=>Number(t.wordpressId)===Number(raw.teams?.[0]?.wordpressTeamId));
  const b=data.teams.find(t=>Number(t.wordpressId)===Number(raw.teams?.[1]?.wordpressTeamId));
  return {
    id:`legacy_game_${editionKey(data)}_${raw.source?.wordpressPostId}`,
    wpId:raw.source?.wordpressPostId,
    slug:gameAliases(data).get(raw.source?.wordpressPostId),
    startsAt:String(raw.scheduledAtLegacy||'').replace(' ','T')+'-03:00',
    status:raw.status,
    scoreA:Number(raw.teams?.[0]?.score||0),
    scoreB:Number(raw.teams?.[1]?.score||0),
    round:raw.legacy?.phaseLabel||'',
    stage:{name:raw.legacy?.phaseLabel||''},
    venue:raw.legacy?.venue?{name:raw.legacy.venue}:null,
    teamA:teamView(data,a||{wordpressId:raw.teams?.[0]?.wordpressTeamId||0,name:raw.teams?.[0]?.name||'Equipe A',slug:archiveSlug(raw.teams?.[0]?.name||''),logoUrl:null}),
    teamB:teamView(data,b||{wordpressId:raw.teams?.[1]?.wordpressTeamId||0,name:raw.teams?.[1]?.name||'Equipe B',slug:archiveSlug(raw.teams?.[1]?.name||''),logoUrl:null}),
    competition:data?.target?.category||'',
    seasonYear:Number(data?.target?.year||0),
    editionSlug:data?.target?.editionSlug||'',
  };
}

export function allArchiveGames(data){ return (data?.games||[]).map(raw=>gameView(data,raw)); }

export function playerRows(data){
  const groups=new Map();
  for(const raw of data?.games||[]){
    for(const row of raw.boxScore||[]){
      const id=Number(row.wordpressAthleteId||0); if(!id) continue;
      let x=groups.get(id);
      if(!x){
        const athlete=data.athletes.find(a=>Number(a.wordpressId)===id)||{wordpressId:id,name:row.athleteName,slug:archiveSlug(row.athleteName),photoUrl:null,wordpressTeamId:row.wordpressTeamId,jerseyNumber:row.jerseyNumber};
        x={athlete,games:0,points:0,rebounds:0,assists:0,steals:0,blocks:0,turnovers:0,efficiency:0};
        groups.set(id,x);
      }
      x.games++;
      x.points+=Number(row.points||0);
      x.rebounds+=totalRebounds(row);
      x.assists+=Number(row.assists||0);
      x.steals+=Number(row.steals||0);
      x.blocks+=Number(row.blocks||0);
      x.turnovers+=Number(row.turnovers||0);
      x.efficiency+=legacyEfficiency(row);
    }
  }
  const avg=(v,g)=>g?+(v/g).toFixed(1):0;
  return [...groups.values()].map(x=>{
    const t=data.teams.find(t=>Number(t.wordpressId)===Number(x.athlete.wordpressTeamId));
    return {
      player:{id:`legacy_player_${editionKey(data)}_${x.athlete.wordpressId}`,personId:`legacy_person_${editionKey(data)}_${x.athlete.wordpressId}`,name:x.athlete.name,photoUrl:x.athlete.photoUrl||null,position:null,slug:x.athlete.slug||archiveSlug(x.athlete.name)},
      number:x.athlete.jerseyNumber,
      games:x.games,
      averages:{points:avg(x.points,x.games),rebounds:avg(x.rebounds,x.games),assists:avg(x.assists,x.games),steals:avg(x.steals,x.games),blocks:avg(x.blocks,x.games),turnovers:avg(x.turnovers,x.games),efficiency:avg(x.efficiency,x.games)},
      totals:{points:x.points,rebounds:x.rebounds,assists:x.assists,steals:x.steals,blocks:x.blocks,turnovers:x.turnovers,efficiency:x.efficiency},
      teams:t?[teamView(data,t)]:[],
    };
  }).sort((a,b)=>String(a.player.name).localeCompare(String(b.player.name),'pt-BR'));
}

export function campaignTable(data){
  const rows=new Map((data?.teams||[]).map(t=>[Number(t.wordpressId),{team:teamView(data,t),games:0,wins:0,losses:0,pointsFor:0,pointsAgainst:0,diff:0}]));
  for(const g of data?.games||[]){
    if(g.status!=='FINISHED'||!g.teams?.[0]||!g.teams?.[1]) continue;
    const a=rows.get(Number(g.teams[0].wordpressTeamId)); const b=rows.get(Number(g.teams[1].wordpressTeamId));
    if(!a||!b) continue;
    const sa=Number(g.teams[0].score||0), sb=Number(g.teams[1].score||0);
    a.games++;b.games++;a.pointsFor+=sa;a.pointsAgainst+=sb;b.pointsFor+=sb;b.pointsAgainst+=sa;
    if(sa>sb){a.wins++;b.losses++;} else if(sb>sa){b.wins++;a.losses++;}
  }
  for(const r of rows.values()) r.diff=r.pointsFor-r.pointsAgainst;
  return [...rows.values()].sort((a,b)=>b.wins-a.wins||b.diff-a.diff||b.pointsFor-a.pointsFor||a.team.name.localeCompare(b.team.name,'pt-BR'));
}

export function archiveOverview(data){
  const games=allArchiveGames(data), players=playerRows(data);
  const teams=(data?.teams||[]).map(t=>({team:teamView(data,t)}));
  return {
    identity:{season:{id:`legacy_season_${editionKey(data)}`,year:Number(data?.target?.year||0),officialName:data?.target?.officialName||''},competition:{name:data?.target?.category||''}},
    season:{id:`legacy_season_${editionKey(data)}`,year:Number(data?.target?.year||0)},
    summary:{teams:teams.length,games:games.length,finished:games.filter(g=>g.status==='FINISHED').length},
    upcoming:games.filter(g=>g.status!=='FINISHED').sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt)),
    recentResults:games.filter(g=>g.status==='FINISHED').sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)),
    legacyGames:games,
    teams,players,
    campaign:campaignTable(data),
  };
}

export function archiveTeam(data,slug){
  const t=(data?.teams||[]).find(t=>(t.slug||archiveSlug(t.name))===slug||archiveSlug(t.name)===slug); if(!t)return null;
  const team=teamView(data,t);
  const games=allArchiveGames(data).filter(g=>g.teamA?.id===team.id||g.teamB?.id===team.id);
  const roster=(data?.athletes||[]).filter(a=>Number(a.wordpressTeamId)===Number(t.wordpressId)).map(a=>({number:a.jerseyNumber,player:{id:`legacy_player_${editionKey(data)}_${a.wordpressId}`,personId:`legacy_person_${editionKey(data)}_${a.wordpressId}`,name:a.name,photoUrl:a.photoUrl||null,slug:a.slug||archiveSlug(a.name)}}));
  let wins=0,losses=0,pf=0,pa=0;
  for(const g of games){if(g.status!=='FINISHED')continue;const sideA=g.teamA.id===team.id;const own=sideA?g.scoreA:g.scoreB,opp=sideA?g.scoreB:g.scoreA;pf+=own;pa+=opp;if(own>opp)wins++;else if(own<opp)losses++;}
  return {team,games,roster,highlights:{wins,losses,pointsFor:pf,pointsAgainst:pa},competition:data?.target?.category||'',seasonYear:Number(data?.target?.year||0),archive:true};
}

export function archivePlayer(data,slug){
  const athlete=(data?.athletes||[]).find(a=>(a.slug||archiveSlug(a.name))===slug||archiveSlug(a.name)===slug); if(!athlete)return null;
  const summary=playerRows(data).find(x=>Number(x.player.id.split('_').pop())===Number(athlete.wordpressId));
  const team=(data?.teams||[]).find(t=>Number(t.wordpressId)===Number(athlete.wordpressTeamId));
  const gameLog=[];
  for(const raw of data?.games||[]){
    const row=(raw.boxScore||[]).find(x=>Number(x.wordpressAthleteId)===Number(athlete.wordpressId)); if(!row)continue;
    gameLog.push({game:gameView(data,raw),stats:statLine(row)});
  }
  gameLog.sort((a,b)=>new Date(b.game.startsAt)-new Date(a.game.startsAt));
  const all=playerRows(data); const rankings={};
  for(const key of ['points','rebounds','assists','steals','blocks','efficiency']){
    const sorted=[...all].filter(x=>Number(x.games||0)>0).sort((a,b)=>Number(b.averages?.[key]||0)-Number(a.averages?.[key]||0));
    const idx=sorted.findIndex(x=>x.player?.id===summary?.player?.id);
    rankings[key]=idx>=0?{position:idx+1,total:sorted.length,value:Number(sorted[idx].averages?.[key]||0),games:Number(sorted[idx].games||0)}:null;
  }
  return {player:{id:`legacy_player_${editionKey(data)}_${athlete.wordpressId}`,personId:`legacy_person_${editionKey(data)}_${athlete.wordpressId}`,name:athlete.name,fullName:athlete.name,photoUrl:athlete.photoUrl||null,number:athlete.jerseyNumber,team:team?teamView(data,team):null},stats:{games:summary?.games||0,averages:summary?.averages||{},totals:summary?.totals||{},gameLog},rankings,competition:data?.target?.category||'',seasonYear:Number(data?.target?.year||0),archive:true};
}

export function archiveGameBySlug(data,slug){
  const aliases=gameAliases(data);
  const raw=(data?.games||[]).find(g=>aliases.get(g.source?.wordpressPostId)===slug); if(!raw)return null;
  const game=gameView(data,raw);
  const rows=(raw.boxScore||[]).map(r=>{
    const athlete=data.athletes.find(a=>Number(a.wordpressId)===Number(r.wordpressAthleteId));
    const team=data.teams.find(t=>Number(t.wordpressId)===Number(r.wordpressTeamId));
    const rebounds=totalRebounds(r);
    return {...r,rebounds,player:{name:athlete?.name||r.athleteName,photoUrl:athlete?.photoUrl||null,slug:athlete?.slug||archiveSlug(r.athleteName)},team:team?teamView(data,team):null};
  });
  const score=r=>legacyEfficiency(r);
  const best=[...rows].sort((a,b)=>(score(b)-score(a))||(Number(b.points||0)-Number(a.points||0)))[0]||null;
  const metricLead=(key)=>{const max=Math.max(...rows.map(r=>Number(r[key]||0)),0);return rows.filter(r=>max>0&&Number(r[key]||0)===max)};
  const side=s=>rows.filter(r=>r.side===s), agg=(arr,key)=>arr.reduce((n,r)=>n+Number(r[key]||0),0);
  const totals={A:{points:agg(side('A'),'points'),rebounds:agg(side('A'),'rebounds'),assists:agg(side('A'),'assists'),steals:agg(side('A'),'steals'),blocks:agg(side('A'),'blocks'),turnovers:agg(side('A'),'turnovers')},B:{points:agg(side('B'),'points'),rebounds:agg(side('B'),'rebounds'),assists:agg(side('B'),'assists'),steals:agg(side('B'),'steals'),blocks:agg(side('B'),'blocks'),turnovers:agg(side('B'),'turnovers')}};
  return {game,periods:(raw.periods||[]).map(p=>({period:p.period,scoreA:p.sideAScore,scoreB:p.sideBScore})),boxScore:rows,bestPlayer:best?{player:best.player,team:best.team,points:best.points,rebounds:best.rebounds,assists:best.assists,steals:best.steals,blocks:best.blocks,efficiency:legacyEfficiency(best)}:null,leaders:{points:metricLead('points'),rebounds:metricLead('rebounds'),assists:metricLead('assists'),steals:metricLead('steals'),blocks:metricLead('blocks')},teamTotals:totals,competition:data?.target?.category||'',seasonYear:Number(data?.target?.year||0),archive:true};
}

export function recordsFor(data){
  const defs={points:'Pontos',rebounds:'Rebotes',assists:'Assistências',steals:'Roubos',blocks:'Tocos'};
  const best={};
  for(const [key,label] of Object.entries(defs)) best[key]={key,label,value:-Infinity,row:null,game:null};
  for(const raw of data?.games||[]){
    for(const r of raw.boxScore||[]){
      const values={points:Number(r.points||0),rebounds:totalRebounds(r),assists:Number(r.assists||0),steals:Number(r.steals||0),blocks:Number(r.blocks||0)};
      for(const [key,value] of Object.entries(values)) if(value>best[key].value) best[key]={...best[key],value,row:r,game:gameView(data,raw)};
    }
  }
  return Object.values(best).map(x=>{
    const athlete=data.athletes.find(a=>Number(a.wordpressId)===Number(x.row?.wordpressAthleteId));
    const teamOfRecord=(data.teams||[]).find(t=>Number(t.wordpressId)===Number(x.row?.wordpressTeamId));return {...x,teamName:teamOfRecord?.name||'',player:athlete?{name:athlete.name,photoUrl:athlete.photoUrl||null,slug:athlete.slug||archiveSlug(athlete.name)}:{name:x.row?.athleteName||'',photoUrl:null,slug:archiveSlug(x.row?.athleteName||'')}};
  });
}


// Melhor jogo de cada atleta em cada fundamento (para o destaque dos líderes).
const BEST_KEYS=['points','rebounds','assists','steals','blocks','efficiency'];
function rowMetric(r,key){
  if(key==='rebounds')return totalRebounds(r);
  if(key==='efficiency')return legacyEfficiency(r);
  return Number(r?.[key]||0);
}
const _bestCache=new WeakMap();
export function bestGamesByAthlete(data){
  if(!data)return new Map();
  if(_bestCache.has(data))return _bestCache.get(data);
  const out=new Map();
  for(const raw of data.games||[]){
    for(const r of raw.boxScore||[]){
      const athlete=(data.athletes||[]).find(a=>Number(a.wordpressId)===Number(r.wordpressAthleteId));
      const slug=archiveSlug(athlete?.name||r.athleteName||'');
      if(!slug)continue;
      const entry=out.get(slug)||{};
      for(const key of BEST_KEYS){
        const value=rowMetric(r,key);
        if(!(value>0)&&key!=='efficiency')continue;
        if(!entry[key]||value>entry[key].value)entry[key]={value,raw,teamId:r.wordpressTeamId};
      }
      out.set(slug,entry);
    }
  }
  for(const entry of out.values())for(const key of Object.keys(entry)){
    const e=entry[key];
    entry[key]={value:e.value,game:gameView(data,e.raw),teamId:e.teamId};
  }
  _bestCache.set(data,out);
  return out;
}
