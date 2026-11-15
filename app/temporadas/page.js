import Link from 'next/link';
import {PageHero,Sponsors} from '../../components/SiteChrome';
import {ArchiveSummary,ArchiveGames,ArchiveTeams,CampaignTable} from '../../components/ArchiveViews';
import {ContextNav,KpiStrip,PageIntro} from '../../components/PortalDirectory';
import {getArchive2025Overview,archive2025GameSlug,getOverview,getMasterOverview} from '../../lib/site';
import {getScopes,seasonHubHref,statusLabel} from '../../lib/scopes';
export const metadata={title:'Temporadas'};

export default async function Temporadas({searchParams}){
  const sp=(await searchParams)||{};
  const year=String(sp.temporada||'');
  if(year==='2025'){
    const d=getArchive2025Overview();
    return <main className="portal-directory-page seasons-v0515"><Sponsors/><PageHero title="Temporada 2025" subtitle="Arquivo histórico preservado da Liga." eyebrow="Arquivo oficial"/><section className="section shell"><ContextNav items={[[`/temporadas/`,'Todas',false],['/temporadas/?temporada=2025','2025',true],['/temporada/2026/','2026',false],['/temporada-2027/','2027',false]]}/><ArchiveSummary overview={d} label="2025"/><PageIntro title="Arquivo 2025" description="Jogos, equipes e estatísticas da temporada 2025, preservados como foram registrados." aside={<div className="portal-inline-actions"><Link className="btn" href="/lideres/?temporada=2025">Líderes</Link><Link className="btn" href="/recordes/?temporada=2025">Recordes</Link></div>}/><CampaignTable rows={d.campaign} title="Campanha 2025" note="Calculado a partir dos resultados preservados da temporada."/><div className="section-heading portal-section-spaced"><h2>Jogos de 2025</h2></div><ArchiveGames games={d.legacyGames} slugForGame={archive2025GameSlug}/><div className="section-heading portal-section-spaced"><h2>Equipes</h2></div><ArchiveTeams overview={d}/></section></main>
  }
  const current=await getOverview();
  const master=await getMasterOverview();
  const scopes=await getScopes();
  return <main className="portal-directory-page seasons-v0515"><Sponsors/><PageHero title="Temporadas" subtitle="Arquivo histórico e acesso às competições da Liga." eyebrow="Histórico oficial"/><section className="section shell"><KpiStrip items={[[current.summary?.games||0,'Jogos em 2026'],[current.teams?.length||0,'Equipes Adulto 2026'],[master.teams?.length||0,'Equipes Master 2026'],['2027','Próxima temporada']]}/><PageIntro title="Uma linha do tempo, sem apagar o passado" description="Acompanhe a próxima temporada e reviva as anteriores: 2025 e 2026 continuam acessíveis com jogos, equipes, líderes, recordes e perfis."/>
  <div className="portal-season-grid">
    {scopes.flatMap(sc=>sc.allSeasons.map(se=>({sc,se}))).sort((x,y)=>(y.se.year||0)-(x.se.year||0)||x.sc.name.localeCompare(y.sc.name,'pt-BR')).map(({sc,se})=><Link key={se.id} className={`portal-season-card ${se.status==='FINISHED'?'archive':se.status==='ACTIVE'?'current':se.status==='PLANNING'||se.status==='REGISTRATION_OPEN'?'upcoming':''} ${sc.key==='master'?'master':''}`} href={seasonHubHref(sc,se)}>
      <small>{statusLabel(se.status)}</small><strong>{se.year||se.name}</strong><h3>{se.officialName||sc.name}</h3><p>{sc.competition?.name||sc.name} · jogos, classificação, líderes, equipes e atletas.</p><span>Abrir temporada →</span>
    </Link>)}
  </div>
  </section></main>
}
