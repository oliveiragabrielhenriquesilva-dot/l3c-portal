import Link from 'next/link';
import LiveRefresh from './LiveRefresh';
import {Sponsors} from './SiteChrome';
import {GameCard,ResultRow,TeamLogo} from './Cards';
import {BRAND} from '../lib/brand';
import {loadSeason,gameHref,teamHref} from '../lib/scopes';
import {liveWatch,gamePublicStatus,newsFallback} from '../lib/site';

// Mesma composição e classes da inicial aprovada: hero, patrocinadores,
// agenda, equipes e editorial. Apenas os dados e vínculos mudam por temporada.
export default async function ApprovedSeasonHome({scope,season}){
 const {data,offline}=await loadSeason(season);
 const games=data.legacyGames||[];
 const entries=data.teams||[];
 const divisions=data.divisions||[];
 const q=`?temporada=${encodeURIComponent(season.key||season.id)}`;
 const news=newsFallback();
 const href=game=>gameHref(scope,season,game);
 return <main className="home-page home-v0513"><LiveRefresh {...liveWatch(games)}/>
  <section className="home-v0513-hero"><div className="wide-shell home-v0513-hero-grid">
   <div className="home-v0513-hero-copy"><small>Temporada {season.year}</small><h1>{BRAND.name}</h1><p>{BRAND.tagline}.</p><div className="home-v0513-actions"><Link className="btn primary" href={`/jogos/${q}`}>Ver jogos</Link><Link className="btn" href={`/classificacao/${q}`}>Ver classificação</Link></div></div>
   <div className="home-v0513-hero-art" aria-label={`Identidade oficial da temporada ${season.year}`}><div className="home-v0513-court-lines" aria-hidden="true"/><div className="home-v0513-ball-glow" aria-hidden="true"/><img src="/assets/brand/forjax-logo.png" alt={BRAND.name}/></div>
  </div></section>
  <Sponsors/>
  {offline&&<div className="wide-shell source-warning">Os dados estão temporariamente indisponíveis. Tente novamente em instantes.</div>}
  <section className="section home-v0513-agenda"><div className="wide-shell"><div className="home-v0513-split">
   {divisions.map(division=>{
    const members=entries.filter(e=>e.division?.id===division.id);
    const ids=new Set(members.map(e=>e.team?.id));
    const matches=games.filter(g=>ids.has(g.teamA?.id)&&ids.has(g.teamB?.id));
    const upcoming=matches.filter(g=>['LIVE','UPCOMING'].includes(gamePublicStatus(g))).sort((a,b)=>(gamePublicStatus(b)==='LIVE')-(gamePublicStatus(a)==='LIVE')||new Date(a.startsAt)-new Date(b.startsAt)).slice(0,2);
    const results=matches.filter(g=>gamePublicStatus(g)==='FINISHED').sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).slice(0,2);
    const dq=`${q}&serie=${encodeURIComponent(String(division.code||division.id).toLowerCase())}`;
    return <div className="home-v0513-panel" key={division.id}><div className="home-v0513-head"><div><h2>{division.displayName||division.name}</h2><p>{members.length} equipes · {matches.length} jogos</p></div><Link href={`/jogos/${dq}`}>Ver agenda →</Link></div>
     <h3>Próximos jogos</h3>{upcoming.length?<div className="home-v0513-upcoming-grid">{upcoming.map(g=><GameCard key={g.id} game={g} href={href(g)} compact/>)}</div>:<div className="empty">Nenhum jogo agendado.</div>}
     {results.length>0&&<><h3>Últimos resultados</h3><div className="home-v0513-results">{results.map(g=><ResultRow key={g.id} game={g} href={href(g)}/>)}</div></>}
     <div className="home-v0513-actions"><Link className="btn" href={`/classificacao/${dq}`}>Classificação</Link><Link className="btn" href={`/equipes/${dq}`}>Equipes</Link></div>
    </div>;
   })}
  </div></div></section>
  <section className="section home-v0513-teams"><div className="wide-shell"><div className="home-v0513-head"><div><h2>Equipes</h2><p>As franquias da temporada {season.year}.</p></div><Link href={`/equipes/${q}`}>Ver todas →</Link></div><div className="all-teams-home-grid home-v0513-team-grid">{entries.map(item=><Link key={item.team.id} href={teamHref(scope,season,item.team.name)} className={`all-team-home-card`}><TeamLogo team={item.team} size={66}/><b>{item.team.name}</b><span>{item.division?.displayName||item.division?.name||season.label}</span></Link>)}</div></div></section>
  <section className="section home-v0513-editorial"><div className="wide-shell home-v0513-editorial-grid"><div className="home-v0513-adriano"><img src="/assets/brand/adriano-ia.png" alt="AdrIAno — IA da Liga 3 Colinas"/><div><small>Jornalista virtual · IA da Liga 3 Colinas</small><h2>Adr<span>IA</span>no analisa</h2><p>Das estatísticas ao contexto. Análises automáticas produzidas a partir dos dados oficiais da Liga.</p><div className="home-v0513-actions"><Link className="btn primary" href={`/adriano/?categoria=adulto&temporada=${season.year}`}>Central do AdrIAno</Link></div></div></div><div className="home-v0513-news"><div className="home-v0513-head"><h2>Notícias em alta</h2><Link href="/noticias/">Ver todas →</Link></div><div className="home-v0513-news-grid">{news.length?news.slice(0,3).map(item=><Link className="home-v0513-news-card" href={`/noticias/${item.slug}/`} key={item.slug}><small>{item.date}</small><strong>{item.title}</strong><span>Ler notícia →</span></Link>):<div className="empty">Nenhuma notícia publicada.</div>}</div></div></div></section>
 </main>;
}
