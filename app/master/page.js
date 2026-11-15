import LiveRefresh from '../../components/LiveRefresh';
import Link from 'next/link';
import {Sponsors} from '../../components/SiteChrome';
import {GameCard,ResultRow,TeamLogo} from '../../components/Cards';
import {liveWatch,getMasterOverview,masterGameSlug,isUpcomingPublicGame,isFinishedPublicGame,isLivePublicGame,isLiveOrUpcomingGame,liveFirst,slugify,adrianoReviews} from '../../lib/site';

export const metadata={title:'Liga Master'};

const METRICS=[['points','PTS','Pontos'],['rebounds','REB','Rebotes'],['assists','AST','Assistências'],['steals','STL','Roubos'],['blocks','BLK','Tocos']];
function formFor(teamName,games=[]){return [...games].filter(isFinishedPublicGame).sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).map(g=>{const a=slugify(g.teamA?.name),b=slugify(g.teamB?.name),t=slugify(teamName);if(t!==a&&t!==b)return null;const own=t===a?Number(g.scoreA):Number(g.scoreB),opp=t===a?Number(g.scoreB):Number(g.scoreA);return own>opp?'W':own<opp?'L':'D'}).filter(Boolean).slice(0,5)}
function leaderCard(item,key,abbr,label){if(!item)return <div className="home-leader-card empty-card" key={key}><small>{abbr}</small><strong>{label}</strong><span>Sem dados</span></div>;return <Link className="home-leader-card" href={`/player/${slugify(item.player?.name)}/?context=master-2026`} key={key}><div className="home-leader-card-top"><span>{abbr}</span><b>{label}</b><em>Ver ranking →</em></div><div className="home-leader-person">{item.player?.photoUrl?<img src={item.player.photoUrl} alt=""/>:<div className="home-leader-placeholder">{item.player?.name?.[0]||'?'}</div>}<div><strong>{item.player?.name}</strong><small>{item.teams?.[0]?.name||''} · {item.games||0} jogos</small><div><b>{Number(item.value||0).toFixed(1).replace('.',',')}</b><span>{abbr}/JOGO</span></div></div></div></Link>}

export default async function MasterHome(){
  const data=await getMasterOverview();
  const games=data.legacyGames||[];
  const upcoming=liveFirst(games.filter(isLiveOrUpcomingGame)).slice(0,3);
  const hasLive=upcoming.some(isLivePublicGame);
  const results=games.filter(isFinishedPublicGame).sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).slice(0,3);
  const campaign=[...(data.campaign||[])].sort((a,b)=>(Number(a.position||999)-Number(b.position||999))||(Number(b.wins||0)-Number(a.wins||0))||(Number(b.diff||0)-Number(a.diff||0)));
  const players=[...(data.players||[])];
  const leaders={}; for(const [key] of METRICS){const item=[...players].sort((a,b)=>Number(b.averages?.[key]||0)-Number(a.averages?.[key]||0))[0];leaders[key]=item?{...item,value:Number(item.averages?.[key]||0)}:null}
  const masterReviews=adrianoReviews().filter(r=>r.category==='master'&&Number(r.year)===2026);
  const featuredReview=masterReviews[0]||null;
  return <main className="home-page home-v0513 master-home-v0514"><LiveRefresh {...liveWatch(games)}/>
    <section className="home-v0513-hero master-v0514-hero"><div className="wide-shell home-v0513-hero-grid">
      <div className="home-v0513-hero-copy"><small>Liga Master · Temporada 2026</small><h1>Liga Master</h1><p>Experiência, competitividade e história dentro de quadra.</p><div className="home-v0513-actions"><Link className="btn master-primary" href="/master/jogos/">Ver jogos</Link><Link className="btn" href="/master/classificacao/">Ver classificação</Link></div></div>
      <div className="home-v0513-hero-art master-v0514-art"><div className="home-v0513-court-lines"/><div className="home-v0513-ball-glow"/><img src="/assets/brand/master-logo-v0518.png" alt="Liga Master 2026"/></div>
    </div></section>
    <Sponsors/>
    <section className="section home-v0513-agenda"><div className="wide-shell"><div className="home-v0513-split">
      <div className="home-v0513-panel"><div className="home-v0513-head"><h2>{hasLive?'Ao vivo e próximos jogos':'Próximos jogos'}</h2><Link href="/master/jogos/">Ver agenda completa →</Link></div>{upcoming.length?<div className="home-v0513-upcoming-grid">{upcoming.map(g=><GameCard key={g.id} game={g} href={`/master/event/${masterGameSlug(g)}/`} compact/>)}</div>:<div className="home-v0513-ended compact"><strong>Sem partidas futuras cadastradas</strong><span>A agenda volta a aparecer automaticamente quando novos jogos forem publicados.</span><Link href="/master/jogos/">Consultar todos os jogos →</Link></div>}</div>
      <div className="home-v0513-panel"><div className="home-v0513-head"><h2>Últimos resultados</h2><Link href="/master/jogos/">Ver todos →</Link></div><div className="home-v0513-results">{results.map(g=><ResultRow key={g.id} game={g} href={`/master/event/${masterGameSlug(g)}/`}/>)}</div></div>
    </div></div></section>
    <section className="section home-v0513-competition master-v0514-competition"><div className="wide-shell home-competition-hub home-v0513-hub">
      <div className="home-standings-block"><div className="home-v0513-head"><h2>Classificação</h2><Link href="/master/classificacao/">Ver classificação completa →</Link></div><div className="table-scroll home-standings-table-wrap"><table className="home-standings-table home-v0513-table"><thead><tr><th>#</th><th>Equipe</th><th>J</th><th>V</th><th>D</th><th>Saldo</th><th>Últimos 5</th></tr></thead><tbody>{campaign.slice(0,5).map((row,i)=><tr key={row.team?.name}><td>{row.position||i+1}</td><td><Link className="home-table-team" href={`/team/${slugify(row.team?.name)}/`}>{row.team?.logoUrl&&<img src={row.team.logoUrl} alt=""/>}<span>{row.team?.name}</span></Link></td><td>{row.games}</td><td>{row.wins}</td><td>{row.losses}</td><td className={Number(row.diff)>=0?'positive':'negative'}>{Number(row.diff)>0?'+':''}{row.diff}</td><td><div className="home-v0513-form">{formFor(row.team?.name,games).map((r,j)=><i key={j} className={r==='W'?'win':r==='L'?'loss':'draw'}>{r}</i>)}</div></td></tr>)}</tbody></table></div></div>
      <div className="home-leaders-block"><div className="home-v0513-head"><h2>Líderes da temporada</h2><Link href="/master/lideres/">Ver todos os líderes →</Link></div><div className="home-leaders-five home-v0513-leaders">{METRICS.map(([key,abbr,label])=>leaderCard(leaders[key],key,abbr,label))}</div></div>
    </div></section>
    <section className="section home-v0513-teams"><div className="wide-shell"><div className="home-v0513-head"><div><h2>Equipes</h2><p>As {data.teams?.length||0} equipes da Liga Master 2026.</p></div><Link href="/master/equipes/">Ver todas →</Link></div><div className="all-teams-home-grid home-v0513-team-grid master-v0514-team-grid">{(data.teams||[]).map(item=>{const team=item.team||item;return <Link key={team.name} href={`/team/${slugify(team.name)}/`} className="all-team-home-card master-v0514-team-card"><TeamLogo team={team} size={66}/><b>{team.name}</b><span>Liga Master 2026</span></Link>})}</div></div></section>
    <section className="section home-v0513-editorial"><div className="wide-shell home-v0513-editorial-grid">
      <div className="home-v0513-adriano"><img src="/assets/brand/adriano-ia.png" alt="AdrIAno — IA da Liga 3 Colinas"/><div><small>Jornalista virtual · Liga Master</small><h2>Adr<span>IA</span>no analisa</h2><p>Resenhas automáticas de todas as partidas finalizadas com dados oficiais disponíveis.</p><div className="home-v0513-actions"><Link className="btn master-primary" href="/adriano/?categoria=master&temporada=2026">Central do AdrIAno</Link>{featuredReview&&<Link className="btn" href={`/master/event/${featuredReview.slug}/`}>Última análise</Link>}</div></div></div>
      <div className="home-v0513-news"><div className="home-v0513-head"><h2>Últimas análises</h2><Link href="/adriano/?categoria=master&temporada=2026">Ver todas →</Link></div><div className="home-v0513-news-grid">{masterReviews.slice(0,2).map(r=><Link className="home-v0513-news-card" href={`/master/event/${r.slug}/`} key={r.slug}><small>{r.date}</small><strong>{r.title}</strong><span>Ler análise →</span></Link>)}</div></div>
    </div></section>
  </main>
}
