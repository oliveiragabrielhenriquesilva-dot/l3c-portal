import {resultReview} from '../../../lib/adriano-live';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Sponsors } from '../../../components/SiteChrome';
import PreGame, { PreGameActions } from '../../../components/PreGame';
import { Countdown } from '../../../components/PreGameClient';
import LiveGame from '../../../components/LiveGame';
import { TeamLogo, gameDate } from '../../../components/Cards';
import { apiFetch, getAnyGameBySlug, getPublicOfficials, CREW_ROLE_LABEL, slugify, adrianoReviews, gamePublicStatus, championsFallback } from '../../../lib/site';

const fmt = (n) => Number(n || 0);
const sameName = (a,b) => slugify(a || '') === slugify(b || '');

function playerHref(name, isMaster, seasonYear) {
  if (!name) return '#';
  if (isMaster) return `/player/${slugify(name)}/?context=master-${seasonYear}`;
  if (seasonYear === 2025) return `/player/${slugify(name)}/?context=adulto-2025`;
  return `/player/${slugify(name)}/`;
}

function seriesKeyFromStage(value='') {
  const text=String(value||'').toLocaleLowerCase('pt-BR');
  if(text.includes('ouro')) return 'ouro';
  if(text.includes('prata')) return 'prata';
  if(text.includes('bronze')) return 'bronze';
  return null;
}

function statCard(label, abbr, rows = [], isMaster = false, seasonYear = 2026) {
  const top = rows?.[0];
  const valueKey = abbr === 'PTS' ? 'points' : abbr === 'REB' ? 'rebounds' : abbr === 'AST' ? 'assists' : abbr === 'STL' ? 'steals' : 'blocks';
  const icon = abbr === 'PTS' ? '★' : abbr === 'REB' ? '↕' : abbr === 'AST' ? '↗' : abbr === 'STL' ? '◆' : '▲';
  const name = top?.player?.name || 'Atleta';
  const href = playerHref(name, isMaster, seasonYear);
  return (
    <div className="game-leader-row v0511" key={abbr}>
      <div className={`game-leader-icon stat-${abbr.toLowerCase()}`} aria-hidden="true">{icon}</div>
      <div className="game-leader-label"><strong>{label}</strong></div>
      {top ? (
        <Link className="game-leader-person" href={href}>
          {top.player?.photoUrl ? <img src={top.player.photoUrl} alt="" /> : <div className="highlight-avatar">{name?.[0] || '?'}</div>}
          <div><strong>{name}</strong><span>{top.team?.name || ''}</span></div>
        </Link>
      ) : <div className="game-leader-empty">Sem destaque</div>}
      <em>{top ? fmt(top[valueKey]) : '—'}</em>
      {top ? <span className="game-leader-arrow" aria-hidden="true">›</span> : null}
    </div>
  );
}

const shoot = (m, a) => (Number(a || 0) > 0 || Number(m || 0) > 0 ? `${fmt(m)}/${fmt(a)}` : '—');
const sumOf = (rows, key) => rows.reduce((t, r) => t + Number(r[key] || 0), 0);

function courtColumn({ side, game, data, isMaster, seasonYear }) {
  const team = side === 'A' ? game.teamA : game.teamB;
  const five = (data.boxScore || []).filter((r) => r.side === side && r.related !== false && r.onCourt);
  return (
    <div className="court-team" key={side}>
      <div className="court-team-head"><TeamLogo team={team} size={30} /><strong>{team?.name || `Equipe ${side}`}</strong></div>
      {five.length ? (
        <ul>
          {five.map((row, index) => {
            const name = row.player?.name || row.athleteName || 'Atleta';
            return (
              <li key={`${side}-${index}-${name}`}>
                <Link href={playerHref(name, isMaster, seasonYear)}>
                  <b className="court-num">{row.jerseyNumber || row.number || '–'}</b>
                  <span className="court-name">{name}</span>
                  <span className="court-stat"><em>{fmt(row.points)}</em> pts</span>
                  <span className="court-stat"><em>{fmt(row.foulsCommitted)}</em> flt</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="court-empty">Quinteto ainda não definido pela Mesa.</p>}
    </div>
  );
}

function boxTable({ side, game, data, isMaster, seasonYear, bestPlayerName, live = false }) {
  const rows = (data.boxScore || []).filter((row) => row.side === side && row.related !== false);
  const team = side === 'A' ? game.teamA : game.teamB;
  const teamName = team?.name;
  const sorted = live ? [...rows].sort((a, b) => Number(Boolean(b.onCourt)) - Number(Boolean(a.onCourt))) : rows;
  return (
    <div className="box-team" key={side}>
      <div className="box-team-title"><TeamLogo team={team} size={38}/><div><small>Boxscore</small><h3>{teamName || `Equipe ${side}`}</h3></div></div>
      <div className="table-scroll">
        <table className="box-full">
          <thead><tr><th>Atleta</th><th>MIN</th><th>PTS</th><th>FG</th><th>3P</th><th>LL</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>FLT</th><th>EFF</th></tr></thead>
          <tbody>
            {sorted.map((row, index) => {
              const name = row.player?.name || row.athleteName || 'Atleta';
              const href = playerHref(name, isMaster, seasonYear);
              const isMvp = !live && sameName(name,bestPlayerName);
              return (
                <tr className={`${isMvp?'boxscore-mvp-row':''}${live && row.onCourt?' box-on-court':''}`} key={`${side}-${index}-${name}`}>
                  <td><Link href={href}>{live && row.onCourt ? <i className="box-court-dot" title="Em quadra" /> : null}<span className="boxscore-player-name">{name}</span>{row.jerseyNumber || row.number ? <small>#{row.jerseyNumber || row.number}</small>:null}{isMvp?<b className="boxscore-mvp-badge">MVP</b>:null}</Link></td>
                  <td>{row.minutes || '—'}</td><td><b>{fmt(row.points)}</b></td><td>{shoot(row.fgMade,row.fgAttempted)}</td><td>{shoot(row.threeMade,row.threeAttempted)}</td><td>{shoot(row.ftMade,row.ftAttempted)}</td>
                  <td>{fmt(row.rebounds)}</td><td>{fmt(row.assists)}</td><td>{fmt(row.steals)}</td><td>{fmt(row.blocks)}</td><td>{fmt(row.turnovers)}</td><td>{fmt(row.foulsCommitted)}</td><td>{fmt(row.efficiency)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr><th>Equipe</th><th></th><th>{sumOf(rows,'points')}</th><th>{shoot(sumOf(rows,'fgMade'),sumOf(rows,'fgAttempted'))}</th><th>{shoot(sumOf(rows,'threeMade'),sumOf(rows,'threeAttempted'))}</th><th>{shoot(sumOf(rows,'ftMade'),sumOf(rows,'ftAttempted'))}</th><th>{sumOf(rows,'rebounds')}</th><th>{sumOf(rows,'assists')}</th><th>{sumOf(rows,'steals')}</th><th>{sumOf(rows,'blocks')}</th><th>{sumOf(rows,'turnovers')}</th><th>{sumOf(rows,'foulsCommitted')}</th><th>{sumOf(rows,'efficiency')}</th></tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function documentLinks(data, game) {
  const docs=data?.dossier?.documents || data?.documents || {};
  const official=data?.officialDocument || {};
  const raw=[
    ['Súmula oficial', official.url || official.pdfUrl || official.documentUrl || data?.officialDocumentUrl],
    ['Súmula / Boxscore', docs.scoreSheetUrl || docs.boxScoreUrl || docs.pdfUrl],
    ['GoChamps', game?.webUrl || game?.web_url || data?.webUrl || data?.web_url || docs.webUrl || docs.goChampsUrl],
  ];
  const seen=new Set();
  return raw.filter(([,href])=>{
    if(!href || typeof href!=='string' || !/^https?:\/\//i.test(href) || seen.has(href)) return false;
    seen.add(href); return true;
  });
}

export default async function EventPage({ params, viaMaster = false }) {
  const { slug } = await params;
  const data = await getAnyGameBySlug(slug);
  const crewRaw = (Array.isArray(data?.crew) ? data.crew : []).filter((x) => CREW_ROLE_LABEL[x?.role] && String(x?.displayName || '').trim());
  const knownOfficials = crewRaw.length ? new Set((await getPublicOfficials()).map((o) => slugify(o.name))) : new Set();
  const crewRows = crewRaw.map((x) => {
    const name = String(x.displayName).trim();
    const s = slugify(name);
    return { role: x.role, label: CREW_ROLE_LABEL[x.role], name, href: knownOfficials.has(s) ? `/arbitro/${s}/` : null };
  });
  if (!data?.game) notFound();

  let game = data.game;
  // Jogo novo (API): o estado ao vivo manda no status/placar, para a página não ficar presa em "Agendado".
  const isApiGame = Boolean(game.id) && !String(game.id).startsWith('legacy_');
  if (isApiGame) {
    const live = await apiFetch(`/v1/public/games/${encodeURIComponent(game.id)}/live`);
    if (live?.game) game = { ...game, status: live.game.status, scoreA: live.game.displayScoreA ?? live.game.scoreA, scoreB: live.game.displayScoreB ?? live.game.scoreB };
  }
  const dt = gameDate(game);
  const state = gamePublicStatus(game);
  const finished = state === 'FINISHED';
  const startMs = game.startsAt ? new Date(game.startsAt).getTime() : NaN;
  const watchLive = isApiGame && !finished && (state === 'LIVE' || Number.isNaN(startMs) || startMs - Date.now() < 2 * 3600 * 1000);
  const isMaster = data.competition === 'Master';
  // Cada competição fica no seu próprio endereço (e cabeçalho): Master em /master/event/, Adulto em /event/.
  if (isMaster && !viaMaster) redirect(`/master/event/${slug}/`);
  if (!isMaster && viaMaster) redirect(`/event/${slug}/`);
  const seasonYear=Number(data.seasonYear || 2026);
  const reviewCategory=isMaster?'master':'adulto';
  const historicalReview = adrianoReviews().find((r) => r.slug === slug && r.category === reviewCategory && Number(r.year) === seasonYear) || null;
  const officialReview=resultReview(game,{category:reviewCategory,year:seasonYear,slug});
  const review=finished?(officialReview&&historicalReview?.score===officialReview.score?historicalReview:officialReview):null;
  const totals = data.teamTotals;
  const stageLabel=game.stage?.name || game.round || (isMaster?'Liga Master':'Liga Forjax');
  const contextLabel=review?.stage || stageLabel;
  const venue=game.venue?.name || game.venue || data?.venue?.name || data?.venue || null;
  const champions=championsFallback()||{};
  const seriesKey=seriesKeyFromStage(stageLabel);
  const championName=seriesKey?champions[seriesKey]:null;
  const winner=finished ? (Number(game.scoreA)>Number(game.scoreB)?game.teamA:Number(game.scoreB)>Number(game.scoreA)?game.teamB:null) : null;
  const titleConfirmed=Boolean(review && championName && winner && sameName(championName,winner.name) && String(contextLabel).toLowerCase().includes('final'));
  const titleSeries=seriesKey ? `Série ${seriesKey[0].toUpperCase()+seriesKey.slice(1)}` : '';
  const docs=documentLinks(data,game);
  const bestName=data.bestPlayer?.player?.name || '';

  return (
    <main className="game-page redesign-game-page game-page-v0510">
      {/* Patrocinadores são cláusula permanente do portal: permanecem em todas as telas públicas. */}
      <Sponsors />

      <section className="section shell match-top-section">
        <Link className="back-link" href={isMaster ? '/master/jogos/' : '/jogos/'}>{isMaster ? '← Voltar para Liga Master' : '← Voltar para jogos'}</Link>

        <section className="match-hero-redesign match-hero-v0510">
          <div className="match-hero-top">
            <div className="match-stage-context"><span>{stageLabel}</span>{review?.stage && review.stage!==stageLabel?<b>{review.stage}</b>:null}</div>
            <div className="match-status-meta"><i className={`match-status-pill ${state.toLowerCase()}`}>{finished?'Finalizado':state==='PENDING_RESULT'?'Aguardando resultado':state==='LIVE'?'Ao vivo':'Agendado'}</i><em>{dt ? `${dt.date} · ${dt.time}` : 'Data a definir'}</em></div>
          </div>
          <div className="match-hero-main">
            <Link href={`/team/${slugify(game.teamA?.name)}/`} className="match-side-card"><TeamLogo team={game.teamA} size={118} /><strong>{game.teamA?.name || 'Equipe A'}</strong></Link>
            <div className="match-score-center">
              {watchLive
                ? <LiveGame gameId={game.id} initialStatus={state} initialScoreA={game.scoreA} initialScoreB={game.scoreB} />
                : <h1>{finished || state === 'LIVE' ? `${game.scoreA ?? 0} × ${game.scoreB ?? 0}` : '×'}</h1>}
              <div className="match-meta-chips"><span>{data.competition || 'Adulto Livre'} · {seasonYear}</span>{venue?<span>📍 {venue}</span>:null}</div>
            </div>
            <Link href={`/team/${slugify(game.teamB?.name)}/`} className="match-side-card"><TeamLogo team={game.teamB} size={118} /><strong>{game.teamB?.name || 'Equipe B'}</strong></Link>
          </div>

          {state === 'UPCOMING' && game.startsAt ? (
            <>
              <Countdown startsAt={game.startsAt} />
              <PreGameActions game={game} venue={venue} title={`${game.teamA?.name || 'Equipe A'} × ${game.teamB?.name || 'Equipe B'} · ${stageLabel} · ${data.competition || 'Adulto Livre'} ${seasonYear}`} />
            </>
          ) : null}

          {titleConfirmed && <div className="match-title-confirmed"><span>🏆</span><div><small>Título confirmado nesta partida</small><strong>{championName} · Campeão da {titleSeries} {seasonYear}</strong></div></div>}

          {data.periods?.length > 0 && finished && data.periods.some((x) => Number(x.scoreA ?? x.teamAScore ?? 0) > 0 || Number(x.scoreB ?? x.teamBScore ?? 0) > 0) && (
            <div className="period-board-wrap"><div className="period-board-title"><strong>Parciais por período</strong><span>Placar oficial</span></div><div className="period-board-redesign table-scroll">
              <table>
                <thead><tr><th></th>{data.periods.map((period, index) => <th key={index}>{period.period || `${index + 1}Q`}</th>)}<th>Total</th></tr></thead>
                <tbody>
                  <tr><th>{game.teamA?.name || 'Equipe A'}</th>{data.periods.map((period, index) => <td key={index}>{period.scoreA ?? period.teamAScore ?? '-'}</td>)}<td className="total">{game.scoreA}</td></tr>
                  <tr><th>{game.teamB?.name || 'Equipe B'}</th>{data.periods.map((period, index) => <td key={index}>{period.scoreB ?? period.teamBScore ?? '-'}</td>)}<td className="total">{game.scoreB}</td></tr>
                </tbody>
              </table>
            </div></div>
          )}
        </section>
      </section>

      {state === 'UPCOMING' ? <PreGame game={game} isMaster={isMaster} seasonYear={seasonYear} venue={venue} /> : null}

      {state === 'LIVE' && data.boxScore?.length > 0 && (
        <section className="section shell court-section">
          <section className="panel-box">
            <div className="panel-box-head"><div><small className="panel-eyebrow">Ao vivo</small><h3>Em quadra agora</h3></div><span>Atualiza a cada jogada</span></div>
            <div className="court-grid">{courtColumn({ side: 'A', game, data, isMaster, seasonYear })}{courtColumn({ side: 'B', game, data, isMaster, seasonYear })}</div>
          </section>
        </section>
      )}

      {state !== 'UPCOMING' && (
      <section className="section shell game-summary-grid game-summary-v0510">
        <div className="game-summary-main">
          {data.bestPlayer && (
            <section className="panel-box mvp-redesign-box mvp-v0511">
              <div className="panel-box-head"><h3>{state === 'LIVE' ? 'Destaque até agora' : 'MVP da partida'}</h3><span>Eficiência + pontos</span></div>
              <div className="mvp-card-v0511">
                <div className="mvp-photo-v0511">
                  {data.bestPlayer.player?.photoUrl ? <img src={data.bestPlayer.player.photoUrl} alt="" /> : <div className="mvp-placeholder">{data.bestPlayer.player?.name?.[0] || '?'}</div>}
                </div>
                <div className="mvp-copy-v0511">
                  <span className="mvp-kicker-v0511">{state === 'LIVE' ? '★ Destaque até agora' : '★ MVP da partida'}</span>
                  <Link href={playerHref(data.bestPlayer.player?.name, isMaster, seasonYear)}><h3>{data.bestPlayer.player?.name || 'Atleta'}</h3></Link>
                  <div className="mvp-team-v0511">{data.bestPlayer.team && <TeamLogo team={data.bestPlayer.team} size={34} />}<span>{data.bestPlayer.team?.name || ''}</span></div>
                  <div className="mvp-stats-v0511">
                    {[['PTS', data.bestPlayer.points], ['REB', data.bestPlayer.rebounds], ['AST', data.bestPlayer.assists], ['EFF', data.bestPlayer.efficiency]].map(([key, value]) => <div className={key==='EFF'?'is-eff':''} key={key}><b>{fmt(value)}</b><small>{key}</small></div>)}
                  </div>
                </div>
              </div>
            </section>
          )}

          {review && (
            <section className="panel-box game-adriano-rich game-adriano-v0510">
              <div className="game-adriano-rich-head"><img src="/assets/brand/adriano-ia.png" alt="AdrIAno"/><div><small>Jornalista virtual</small><b>IA da Liga 3 Colinas</b><h3>Resenha do AdrIAno</h3><span>O AdrIAno conta o que rolou no jogo</span></div><em>Pós-jogo</em></div>
              <div className="game-adriano-rich-copy">{(review.fullText||[review.text]).map((paragraph,index)=><p key={index}>{paragraph}</p>)}{review.nameOfGame&&<p><b>Nome do jogo:</b> {review.nameOfGame}</p>}{review.moment&&<p><b>O momento do jogo:</b> {review.moment}</p>}</div>
              <div className="game-adriano-disclaimer">A resenha do AdrIAno é gerada automaticamente a partir dos dados disponíveis no portal. O conteúdo pode ser revisado pela organização da Liga 3 Colinas.</div>
            </section>
          )}
        </div>

        <aside className="game-summary-side">
          <section className="panel-box highlights-v0511">
            <div className="panel-box-head"><h3>Destaques da partida</h3><a href="#boxscore">Ver boxscore ↓</a></div>
            <div className="game-leaders-list-v0511">
              {statCard('Pontos', 'PTS', data.leaders?.points, isMaster, seasonYear)}
              {statCard('Rebotes', 'REB', data.leaders?.rebounds, isMaster, seasonYear)}
              {statCard('Assistências', 'AST', data.leaders?.assists, isMaster, seasonYear)}
              {statCard('Roubos', 'STL', data.leaders?.steals, isMaster, seasonYear)}
              {statCard('Tocos', 'BLK', data.leaders?.blocks, isMaster, seasonYear)}
            </div>
          </section>

          {totals && (
            <section className="panel-box comparison-v0510">
              <div className="panel-box-head"><h3>Comparativo das equipes</h3></div>
              <div className="compare-team-head"><div><TeamLogo team={game.teamA} size={34}/><b>{game.teamA?.name}</b></div><span>×</span><div><b>{game.teamB?.name}</b><TeamLogo team={game.teamB} size={34}/></div></div>
              <div className="comparison">
                {[['Pontos', 'points'], ['Rebotes', 'rebounds'], ['Assistências', 'assists'], ['Roubos', 'steals'], ['Tocos', 'blocks'], ['Turnovers', 'turnovers']].map(([label, key]) => {
                  const a = fmt(totals.A?.[key]); const b = fmt(totals.B?.[key]); const max = Math.max(a, b, 1);
                  return <div className="compare-row" key={key}><strong>{a}</strong><div><small>{label}</small><div className="bars"><i style={{ width: `${(a / max) * 50}%` }}></i><i style={{ width: `${(b / max) * 50}%` }}></i></div></div><strong>{b}</strong></div>;
                })}
              </div>
            </section>
          )}
        </aside>
      </section>
      )}

      {data.boxScore?.length > 0 && (finished || state === 'LIVE') && (
        <section id="boxscore" className="section shell game-boxscore-section-v0510">
          <section className="panel-box full-boxscore-panel">
            <div className="panel-box-head"><div><small className="panel-eyebrow">{state === 'LIVE' ? 'Estatísticas ao vivo' : 'Estatísticas oficiais'}</small><h3>{state === 'LIVE' ? 'Boxscore ao vivo' : 'Boxscore completo'}</h3></div><span>{data.boxScore.length} atletas registrados</span></div>
            <div className="boxscore-two-teams">{boxTable({ side: 'A', game, data, isMaster, seasonYear, bestPlayerName:bestName, live: state === 'LIVE' })}{boxTable({ side: 'B', game, data, isMaster, seasonYear, bestPlayerName:bestName, live: state === 'LIVE' })}</div>
          </section>
        </section>
      )}

      {finished && (
        <section className="section shell game-documents-section-v0510">
          <section className="panel-box game-documents-v0510">
            <div className="panel-box-head"><div><small className="panel-eyebrow">Registro da partida</small><h3>Documentação oficial</h3></div><span>{data.officialDocument?.frozen?'Documento congelado':'Dados oficiais preservados'}</span></div>
            <div className="game-documents-grid">
              <div className="game-document-status"><b>✓</b><div><strong>Boxscore oficial</strong><span>{data.boxScore?.length ? `${data.boxScore.length} atletas registrados` : 'Dados preservados no L3C Stats'}</span></div></div>
              {data.officialDocument?.version ? <div className="game-document-status"><b>✓</b><div><strong>Súmula L3C</strong><span>Versão oficial {data.officialDocument.version}</span></div></div>:null}
              {docs.map(([label,href])=><a className="game-document-link" href={href} target="_blank" rel="noopener noreferrer" key={href}><span>{label}</span><b>Abrir ↗</b></a>)}
              {!docs.length && !data.officialDocument?.version ? <div className="game-document-note">Os dados oficiais da partida estão no boxscore público desta página.</div>:null}
            </div>
          </section>
        </section>
      )}
      {crewRows.length ? (
        <section className="section shell game-crew-section">
          <section className="panel-box">
            <div className="panel-box-head"><div><small className="panel-eyebrow">Equipe da partida</small><h3>Arbitragem e mesa</h3></div></div>
            <ul className="crew-list">{crewRows.map((x) => <li key={x.role + x.name}><span>{x.label}</span>{x.href ? <Link href={x.href}>{x.name}</Link> : <b>{x.name}</b>}</li>)}</ul>
          </section>
        </section>
      ) : null}
    </main>
  );
}
