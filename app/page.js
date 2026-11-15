import LiveRefresh from '../components/LiveRefresh';
import Link from 'next/link';
import {Sponsors} from '../components/SiteChrome';
import {GameCard,ResultRow,TeamLogo} from '../components/Cards';
import HomeCompetitionHub from '../components/HomeCompetitionHub';
import {liveWatch,
  getOverview,getDirectorySeasons,isLivePublicGame,isLiveOrUpcomingGame,liveFirst,championsFallback,standingsFallback,slugify,eventSlugForGame,newsFallback,
  seriesForTeam,teamLogo,isUpcomingPublicGame,isFinishedPublicGame,adrianoReviews,
} from '../lib/site';
import {BRAND} from '../lib/brand';
import PreSeasonHome from '../components/PreSeasonHome';
import ApprovedSeasonHome from '../components/ApprovedSeasonHome';
import {getScope} from '../lib/scopes';
import {homeMode} from '../lib/home-mode';

function teamFrom(data,name){return (data.teams||[]).find(x=>String(x.team?.name||'').toLowerCase()===String(name||'').toLowerCase())?.team||{name,logoUrl:teamLogo(name)}}

function TrophyIcon(){return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 8h28v8c0 12-5.7 20.7-14 23-8.3-2.3-14-11-14-23V8Z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M18 14H9v5c0 9 4.5 14 12 14M46 14h9v5c0 9-4.5 14-12 14M32 39v10M22 56h20M26 49h12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>}

function FinalCard({serie,champion,data,tone}){
  const team=teamFrom(data,champion);
  const label=`Série ${serie}`;
  return <article className={`final-rich-card home-v0513-final ${tone}`}>
    <div className="final-rich-top"><span>Campeão definido</span><b>{label}</b></div>
    <div className="final-rich-main"><div className="home-v0513-trophy"><TrophyIcon/></div><TeamLogo team={team} size={76}/><div><small>Campeão da {label} 2026</small><h3>{champion}</h3><p>Título confirmado.</p></div></div>
    <Link href={`/team/${slugify(champion)}/`}>Ver campanha →</Link>
  </article>
}

function compactResult(game){
  return <ResultRow key={game.id} game={game} href={`/event/${eventSlugForGame(game)}/`}/>;
}

export const metadata={title:{absolute:'Liga Forjax de Basquete · Liga 3 Colinas'},description:'Site oficial: equipes, jogos, classificação, estatísticas e cadastros da temporada 2027.'};
export default async function Home(){
  let season2027=null;
  try{season2027=(await getDirectorySeasons()).find(x=>x?.id===(process.env.L3C_ADULTO_2027_SEASON_ID||'l3c_season_adulto_livre_2027'))}catch{}
  const mode=homeMode(season2027,process.env.L3C_HOME_MODE);
  if(mode==='pre2027')return <PreSeasonHome/>;
  if(mode==='season2027'){
    const scope=await getScope('adulto');
    const target=(scope?.allSeasons||scope?.seasons||[]).find(s=>s.id===season2027?.id||Number(s.year)===2027);
    if(scope&&target)return <ApprovedSeasonHome scope={scope} season={target}/>;
  }
  const data=await getOverview();
  const standings=standingsFallback();
  const champions=championsFallback();
  const players=[...(data.players||[])];
  const news=newsFallback();
  const reviews=adrianoReviews().filter(r=>r.category==='adulto'&&Number(r.year)===2026);
  const visibleGames=data.legacyGames||[];
  const upcoming=liveFirst(visibleGames.filter(isLiveOrUpcomingGame)).slice(0,3);
  const hasLive=upcoming.some(isLivePublicGame);
  const results=visibleGames.filter(isFinishedPublicGame).sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).slice(0,3);
  const metricLeaders={};
  for(const metric of ['points','rebounds','assists','steals','blocks']){
    const item=[...players].sort((a,b)=>(b.averages?.[metric]||0)-(a.averages?.[metric]||0))[0];
    metricLeaders[metric]=item?{...item,value:item.averages?.[metric]||0}:null;
  }
  const officialOrder=[...(standings.ouro||[]),...(standings.prata||[]),...(standings.bronze||[])].map(row=>row.name);
  const teamByName=new Map((data.teams||[]).map(item=>[String(item.team?.name||'').toLocaleLowerCase('pt-BR'),item.team]));
  const allTeams=officialOrder.map(name=>teamByName.get(String(name).toLocaleLowerCase('pt-BR'))||{name,logoUrl:teamLogo(name)}).filter(Boolean);
  const logos=Object.fromEntries(allTeams.map(t=>[t.name,t.logoUrl||teamLogo(t.name)]));
  const featuredReview=reviews[0]||null;

  return <main className="home-page home-v0513"><LiveRefresh {...liveWatch(visibleGames)}/>
    <section className="home-v0513-hero">
      <div className="wide-shell home-v0513-hero-grid">
        <div className="home-v0513-hero-copy">
          <small>Temporada 2026</small>
          <h1>{BRAND.name}</h1>
          <p>{BRAND.tagline}.</p>
          <div className="home-v0513-actions">
            <Link className="btn primary" href="/jogos/">Ver jogos</Link>
            <Link className="btn" href="/classificacao/">Ver classificação</Link>
          </div>
        </div>
        <div className="home-v0513-hero-art" aria-label="Identidade oficial da temporada 2026">
          <div className="home-v0513-court-lines" aria-hidden="true"></div>
          <div className="home-v0513-ball-glow" aria-hidden="true"></div>
          <img src="/assets/brand/forjax-logo.png" alt="Liga Forjax de Basquete 2026"/>
        </div>
      </div>
    </section>

    <Sponsors/>

    <section className="section home-v0513-agenda"><div className="wide-shell">
      <div className="home-v0513-split">
        <div className="home-v0513-panel">
          <div className="home-v0513-head"><h2>{hasLive?'Ao vivo e próximos jogos':'Próximos jogos'}</h2><Link href="/jogos/">Ver agenda completa →</Link></div>
          {upcoming.length?<div className="home-v0513-upcoming-grid">{upcoming.map(g=><GameCard key={g.id} game={g} compact/>)}</div>:<div className="home-v0513-ended compact"><strong>Temporada 2026 encerrada</strong><span>Não há partidas futuras cadastradas.</span><Link href="/jogos/">Consultar todos os jogos →</Link></div>}
        </div>
        <div className="home-v0513-panel">
          <div className="home-v0513-head"><h2>Últimos resultados</h2><Link href="/jogos/">Ver todos →</Link></div>
          <div className="home-v0513-results">{results.length?results.map(compactResult):<div className="empty">Nenhum resultado recente.</div>}</div>
        </div>
      </div>
    </div></section>

    <section className="section finals-rich-section home-v0513-finals"><div className="wide-shell">
      <div className="finals-rich-heading"><div><small>Reta final da temporada</small><h2>Finais 2026</h2><p>Ouro, Prata e Bronze com campeões definidos no histórico oficial.</p></div><Link className="outline-small" href="/temporadas/">Central da temporada</Link></div>
      <div className="final-rich-grid"><FinalCard serie="Ouro" champion={champions.ouro} data={data} tone="gold"/><FinalCard serie="Prata" champion={champions.prata} data={data} tone="silver"/><FinalCard serie="Bronze" champion={champions.bronze} data={data} tone="bronze"/></div>
    </div></section>

    <section className="section home-v0513-competition"><div className="wide-shell"><HomeCompetitionHub standings={standings} leaders={metricLeaders} teamLogos={logos} games={visibleGames}/></div></section>

    <section className="section home-v0513-teams"><div className="wide-shell">
      <div className="home-v0513-head"><div><h2>Equipes</h2><p>As 16 franquias da temporada 2026.</p></div><Link href="/equipes/">Ver todas →</Link></div>
      <div className="all-teams-home-grid home-v0513-team-grid">{allTeams.map(team=><Link key={team.name} href={`/team/${slugify(team.name)}/`} className={`all-team-home-card team-tone-${slugify(team.name)}`}><TeamLogo team={team} size={66}/><b>{team.name}</b><span>{seriesForTeam(team.name)||'Liga Forjax 2026'}</span></Link>)}</div>
    </div></section>

    <section className="section home-v0513-editorial"><div className="wide-shell home-v0513-editorial-grid">
      <div className="home-v0513-adriano">
        <img src="/assets/brand/adriano-ia.png" alt="AdrIAno — IA da Liga 3 Colinas"/>
        <div><small>Jornalista virtual · IA da Liga 3 Colinas</small><h2>Adr<span>IA</span>no analisa</h2><p>Das estatísticas ao contexto. Análises automáticas produzidas a partir dos dados oficiais da Liga.</p><div className="home-v0513-actions"><Link className="btn primary" href="/adriano/">Central do AdrIAno</Link>{featuredReview&&<Link className="btn" href={`/event/${featuredReview.slug}/`}>Última análise</Link>}</div></div>
      </div>
      <div className="home-v0513-news">
        <div className="home-v0513-head"><h2>Notícias em alta</h2><Link href="/noticias/">Ver todas →</Link></div>
        <div className="home-v0513-news-grid">{news.length?news.slice(0,3).map(item=><Link className="home-v0513-news-card" href={`/noticias/${item.slug}/`} key={item.slug}><small>{item.date}</small><strong>{item.title}</strong><span>Ler notícia →</span></Link>):<div className="empty">Nenhuma notícia publicada.</div>}</div>
      </div>
    </div></section>
  </main>
}
