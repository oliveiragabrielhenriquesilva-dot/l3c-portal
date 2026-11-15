import Link from 'next/link';
import {TeamLogo,gameDate} from './Cards';
import {slugify,gamePublicStatus} from '../lib/site';

export function ArchiveTeams({overview,master=false}){
  return <div className="team-grid">{(overview?.teams||[]).map(x=><Link className="team-card" href={`/team/${slugify(x.team.name)}/`} key={x.team.id}><TeamLogo team={x.team} size={62}/><b>{x.team.name}</b><span>{master?'Liga Master':'Temporada histórica'}</span></Link>)}</div>
}

export function ArchiveGames({games=[],slugForGame,limit=0}){
  const rows=[...games].sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt));
  const show=limit?rows.slice(0,limit):rows;
  if(!show.length)return <div className="empty">Nenhum jogo encontrado.</div>;
  return <div className="archive-game-list">{show.map(g=>{const dt=gameDate(g);const state=gamePublicStatus(g);return <Link className={`archive-game-row state-${state.toLowerCase()}`} href={`/event/${slugForGame(g)}/`} key={g.id}><span className="archive-game-date"><b>{dt?.date||'A definir'}</b><small>{dt?.time||''} · {g.stage?.name||g.round||''}</small></span><span className="archive-game-team"><TeamLogo team={g.teamA} size={36}/><b>{g.teamA?.name}</b></span><strong className="archive-game-score">{state==='FINISHED'?`${g.scoreA} × ${g.scoreB}`:'×'}</strong><span className="archive-game-team right"><b>{g.teamB?.name}</b><TeamLogo team={g.teamB} size={36}/></span></Link>})}</div>
}

export function CampaignTable({rows=[],title='Classificação',note=''}){
  return <section className="portal-card"><div className="portal-title"><div><h2>{title}</h2>{note&&<p className="archive-note">{note}</p>}</div></div><div className="table-scroll"><table><thead><tr><th>#</th><th>Equipe</th><th>J</th><th>V</th><th>D</th><th>PF</th><th>PA</th><th>Saldo</th></tr></thead><tbody>{rows.map((x,i)=><tr key={x.team.id}><td>{i+1}</td><td><Link className="team-cell" href={`/team/${slugify(x.team.name)}/`}><TeamLogo team={x.team} size={30}/><b>{x.team.name}</b></Link></td><td>{x.games}</td><td>{x.wins}</td><td>{x.losses}</td><td>{x.pointsFor}</td><td>{x.pointsAgainst}</td><td className={x.diff>=0?'positive':'negative'}>{x.diff>0?'+':''}{x.diff}</td></tr>)}</tbody></table></div></section>
}

const METRICS=[['points','PTS','Pontos'],['rebounds','REB','Rebotes'],['assists','AST','Assistências'],['steals','STL','Roubos'],['blocks','BLK','Tocos']];
export function ArchiveLeaders({players=[],master=false,limit=10}){
  return <div className="archive-leader-stack">{METRICS.map(([key,abbr,label])=><section className="portal-card" key={key}><div className="portal-title"><h2>{abbr} · {label}</h2></div><div className="table-scroll"><table><thead><tr><th>#</th><th>Atleta</th><th>Equipe</th><th>J</th><th>Média</th></tr></thead><tbody>{[...players].sort((a,b)=>Number(b.averages?.[key]||0)-Number(a.averages?.[key]||0)).slice(0,limit).map((x,i)=><tr key={x.player.id}><td>{i+1}</td><td><Link className="team-cell" href={master?`/player/${slugify(x.player.name)}/?context=master-2026`:`/player/${slugify(x.player.name)}/`}>{x.player.photoUrl?<img src={x.player.photoUrl} alt=""/>:<span className="mini-avatar">{x.player.name?.[0]}</span>}<b>{x.player.name}</b></Link></td><td>{x.teams?.[0]?.name||'—'}</td><td>{x.games}</td><td><b>{Number(x.averages?.[key]||0).toFixed(1).replace('.',',')}</b></td></tr>)}</tbody></table></div></section>)}</div>
}

export function ArchiveRecords({records=[],master=false,context=''}){
  return <div className="record-grid-v4">{records.map(r=><article className="record-card-v4" key={r.key}><small>{r.label}</small>{r.player?.photoUrl?<img src={r.player.photoUrl} alt=""/>:<div className="record-avatar">{r.player?.name?.[0]||'?'}</div>}<strong>{r.value}</strong>{r.teamName&&<em className="record-meta">{r.teamName}{r.game?.startsAt?` · ${new Date(r.game.startsAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})}`:''}</em>}<Link href={master?`/player/${slugify(r.player?.name)}/?context=master-2026`:context?`/player/${slugify(r.player?.name)}/?context=${context}`:`/player/${slugify(r.player?.name)}/`}>{r.player?.name}</Link>{r.game&&<Link className="record-game" href={`/event/${r.game.slug||slugify(`${r.game.teamA?.name}-vs-${r.game.teamB?.name}`)}/`}>Jogo: {r.game.teamA?.name} {r.game.scoreA} × {r.game.scoreB} {r.game.teamB?.name}</Link>}</article>)}</div>
}

export function ArchiveSummary({overview,label}){
  return <div className="archive-kpis"><div><strong>{overview?.summary?.games||0}</strong><span>Jogos</span></div><div><strong>{overview?.summary?.teams||0}</strong><span>Equipes</span></div><div><strong>{overview?.players?.length||0}</strong><span>Atletas</span></div><div><strong>{overview?.summary?.finished||0}</strong><span>Finalizados</span></div><div><strong>{label}</strong><span>Temporada</span></div></div>
}
