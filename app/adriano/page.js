import Link from 'next/link';
import {Sponsors} from '../../components/SiteChrome';
import {KpiStrip} from '../../components/PortalDirectory';
import {getAdrianoReviews} from '../../lib/site';

import {reviewHref} from '../../lib/adriano-live';

export const metadata={title:'AdrIAno'};

const CATEGORIES=[['adulto','Adulto'],['master','Master'],['base','Base']];

export default async function Adriano({searchParams}){
  const query=(await searchParams)||{};
  const category=typeof query.categoria==='string'?query.categoria:'adulto';
  const year=Number(query.temporada||2026);
  const all=await getAdrianoReviews();
  const reviews=all.filter(r=>(r.category||'adulto')===category&&Number(r.year||2026)===year);
  const featured=reviews[0]||null;
  return <main className="adriano-page-v053">
    <Sponsors/>

    <section className="adriano-hero-v053">
      <div className="wide-shell adriano-hero-grid-v053">
        <div className="adriano-hero-art"><div className="adriano-glow"></div><img src="/assets/brand/adriano-ia.png" alt="AdrIAno — IA da Liga 3 Colinas"/></div>
        <div className="adriano-hero-copy-v053"><small>Jornalista virtual · IA da Liga 3 Colinas</small><h1>Adr<span>IA</span>no</h1><p>O jornalista virtual do portal. As análises são produzidas automaticamente a partir dos dados oficiais das partidas, preservando placar, estatísticas, contexto da competição e os momentos que ajudam a explicar cada jogo.</p><div className="hero-cta-row"><a className="btn primary" href="#ultima-analise">Última análise</a><a className="btn" href="#arquivo">Todas as resenhas</a><a className="btn" href="#como-funciona">Como funciona</a></div><div className="adriano-transparency"><b>Transparência editorial</b><span>Conteúdo gerado automaticamente a partir dos dados oficiais do L3C Stats e sujeito à revisão da organização.</span></div></div>
      </div>
    </section>

    <section className="section shell adriano-filter-section"><KpiStrip items={[[reviews.length,'Resenhas neste filtro'],[all.filter(r=>(r.category||'adulto')==='adulto'&&Number(r.year||0)===2026).length,'Adulto 2026'],[all.filter(r=>r.category==='master'&&Number(r.year||0)===2026).length,'Master 2026'],[all.length,'Resenhas no acervo']]}/><div className="section-heading compact"><div><h2>Central editorial</h2><p className="section-subtitle">Escolha a categoria e a temporada. O arquivo inclui todas as partidas finalizadas com dados oficiais disponíveis.</p></div></div><div className="adriano-filter-row"><div className="player-category-tabs">{CATEGORIES.map(([key,label])=><Link key={key} className={category===key?'active':''} href={`/adriano/?categoria=${key}&temporada=${year}`}>{label}</Link>)}</div><div className="adriano-season-tabs"><Link className={year===2026?'active':''} href={`/adriano/?categoria=${category}&temporada=2026`}>2026</Link><Link className={year===2025?'active':''} href={`/adriano/?categoria=${category}&temporada=2025`}>2025</Link></div></div></section>

    <section id="ultima-analise" className="section shell">
      {featured?<article className="adriano-feature-analysis">
        <div className="adriano-feature-header"><div><small>Jornalista virtual · pós-jogo</small><h2>{featured.title||`${featured.teamA} ${featured.score} ${featured.teamB}`}</h2><p>{featured.series} · {featured.stage||''} · {featured.date}</p></div><img src="/assets/brand/adriano-ia.png" alt="AdrIAno"/></div>
        <div className="adriano-feature-score"><strong>{featured.teamA}</strong><b>{featured.score}</b><strong>{featured.teamB}</strong></div>
        <div className="adriano-feature-text">{(featured.fullText||[featured.text]).map((p,i)=><p key={i}>{p}</p>)}{featured.nameOfGame&&<p><b>Nome do jogo:</b> {featured.nameOfGame}</p>}{featured.moment&&<p><b>O momento do jogo:</b> {featured.moment}</p>}</div>
        <div className="adriano-feature-actions"><Link className="btn primary" href={reviewHref(featured)}>Abrir partida completa</Link><span>A resenha pode ser revisada pela organização da Liga 3 Colinas.</span></div>
      </article>:<div className="panel-box adriano-empty-state"><img src="/assets/brand/adriano-ia.png" alt="AdrIAno"/><div><h2>Ainda não há resenhas publicadas</h2><p>O AdrIAno já está preparado para receber análises de {category==='master'?'Liga Master':category==='base'?'Base':'Adulto'} {year} assim que houver conteúdo oficial disponível.</p></div></div>}
    </section>

    <section id="arquivo" className="section shell">
      <div className="section-heading compact"><div><h2>Arquivo do AdrIAno</h2><p className="section-subtitle">Resenhas e leituras automáticas do contexto selecionado.</p></div></div>
      <div className="adriano-archive-grid">{reviews.length?reviews.map(r=><Link className="adriano-archive-card" href={reviewHref(r)} key={r.slug}><div className="adriano-archive-meta"><span>{r.series}</span><small>{r.date}</small></div><h3>{r.title||`${r.teamA} ${r.score} ${r.teamB}`}</h3><div className="adriano-archive-score"><b>{r.teamA}</b><strong>{r.score}</strong><b>{r.teamB}</b></div><p>{r.text}</p><span className="review-read">Ler análise →</span></Link>):<div className="empty">Nenhuma resenha encontrada neste filtro.</div>}</div>
    </section>

    <section className="section shell adriano-editorial-grid">
      <article className="panel-box"><div className="panel-box-head"><h3>AdrIAno na rodada</h3><span>Resumo automático</span></div><p className="adriano-editorial-copy">Uma área preparada para concentrar as leituras dos jogos do fim de semana e apontar os momentos que mais mexeram com a rodada.</p>{reviews.slice(0,2).map(r=><Link className="adriano-editorial-link" href={reviewHref(r)} key={r.slug}>{r.teamA} {r.score} {r.teamB}<span>→</span></Link>)}</article>
      <article className="panel-box"><div className="panel-box-head"><h3>AdrIAno nos números</h3><span>Dados oficiais</span></div><p className="adriano-editorial-copy">A leitura estatística usa placar, parciais, eficiência, rebotes, assistências, roubos, tocos, turnovers e o contexto da competição quando esses dados estão disponíveis.</p></article>
      <article id="como-funciona" className="panel-box"><div className="panel-box-head"><h3>Como funciona</h3><span>IA + L3C Stats</span></div><p className="adriano-editorial-copy">O AdrIAno transforma os dados oficiais do L3C Stats em texto editorial. O conteúdo é identificado como automatizado, mantém vínculo com a partida original e pode ser revisado pela organização.</p></article>
    </section>
  </main>
}
