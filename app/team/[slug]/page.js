import {divisionLabel,participationHref} from '../../../lib/season-team';
import {jogosLabel} from '../../../lib/format';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TeamLogo, gameDate } from '../../../components/Cards';
import { resolveTeamAccent } from '../../../lib/accent';
import {
  getAnyTeamBySlug,
  getMasterTeam,
  getTeamBySlug,
  getTeam2027BySlug,
  slugify,
  standingsFallback,
  teamLogo,
  seriesForTeam,
  getArchive2025Team,
  getArchive2025Campaign,
  getAllGames,
  masterGameSlug,
  archive2025GameSlug,
  eventSlugForGame,
  isUpcomingPublicGame,
  isFinishedPublicGame,
  franchiseTitles,
} from '../../../lib/site';

function percent(wins = 0, losses = 0) {
  const total = Number(wins || 0) + Number(losses || 0);
  return total ? `${Math.round((Number(wins || 0) / total) * 100)}%` : '0%';
}

function accentForTeam(name = '') {
  const map = {
    hnk: '#0b7b50', athletics: '#f28a1b', brewers: '#81786c', jussara: '#29a8df', ducks: '#438eb1',
    apol: '#d62c21', wolves: '#777b80', 'the-bronx': '#b9b9b9', ballers: '#c58a2b', guara: '#1976d2',
    manoel: '#b35f36', patriots: '#568ac7', segantini: '#d86b28', 'sharks-ribeirao-corrente': '#b6633a',
    'sj-basquete': '#8e4ab0', 'xd-basketball': '#2985cc'
  };
  return map[slugify(name)] || null;
}

function rgba(hex, alpha) {
  const h = String(hex || '#ed1b2f').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function gameStage(game) {
  const raw = game?.stage?.name || game?.round || '';
  if (!raw) return 'Primeira fase';
  if (/fase principal/i.test(raw)) return 'Primeira fase';
  return raw;
}

function resultForTeam(game, slug) {
  if (!isFinishedPublicGame(game)) return null;
  const ownA = slugify(game?.teamA?.name) === slug;
  const own = Number(ownA ? game?.scoreA : game?.scoreB);
  const opp = Number(ownA ? game?.scoreB : game?.scoreA);
  if (!Number.isFinite(own) || !Number.isFinite(opp) || own === opp) return null;
  return own > opp ? 'V' : 'D';
}

// Public presentation accepts only season-scoped data from the official public API.
// Do not use the authenticated team portal or expose private contact details.
function publicCommission(data) {
  const list = Array.isArray(data?.staff) ? data.staff : Array.isArray(data?.technicalStaff) ? data.technicalStaff : [];
  const active = list.filter(x => (x?.status == null || String(x.status).toUpperCase() === 'ACTIVE') && !x?.endedAt);
  const normalized = active.map(x => ({
    id: x.id || x.personId || x.staff?.person?.id,
    name: x.staff?.person?.displayName || x.staff?.person?.fullName || x.person?.displayName || x.person?.fullName || x.name || '',
    role: x.role || x.function || 'Comissão técnica',
    photoUrl: x.staff?.person?.photoUrl || x.person?.photoUrl || x.photoUrl || null,
  })).filter(x => x.name);
  if (normalized.length) return normalized;
  // Legacy public endpoint provides a match-specific coach rather than the season staff roster.
  if (data?.coach?.name) return [{id:data.coach.personId || 'coach',name:data.coach.name,role:'Técnico informado em partida',photoUrl:data.coach.photoUrl || null}];
  return [];
}

function sortRoster(roster = []) {
  return [...roster].sort((a, b) => {
    const an = a?.number === null || a?.number === undefined || a?.number === '' ? 9999 : Number(a.number);
    const bn = b?.number === null || b?.number === undefined || b?.number === '' ? 9999 : Number(b.number);
    if (an !== bn) return an - bn;
    return String(a?.player?.name || '').localeCompare(String(b?.player?.name || ''), 'pt-BR');
  });
}

function enrichSeriesStandings(rows = [], allGames = [], series = '') {
  const names = new Set(rows.map(x => slugify(x.name)));
  const lateSeriesGames = (allGames || []).filter(g => {
    if (!isFinishedPublicGame(g)) return false;
    const a = slugify(g?.teamA?.name), b = slugify(g?.teamB?.name);
    if (!names.has(a) || !names.has(b)) return false;
    const d = new Date(g?.startsAt || 0);
    return Number.isFinite(d.getTime()) && d >= new Date('2026-07-01T00:00:00-03:00');
  }).sort((a,b)=>new Date(a.startsAt||0)-new Date(b.startsAt||0));
  return rows.map((row, index) => {
    let pf = 0, pa = 0, games = 0, wins = 0;
    const rowSlug = slugify(row.name);
    const expected = Number(row.j || 0) || 99;
    const ownGames = lateSeriesGames.filter(g => slugify(g?.teamA?.name) === rowSlug || slugify(g?.teamB?.name) === rowSlug).slice(0, expected);
    for (const g of ownGames) {
      const isA = slugify(g?.teamA?.name) === rowSlug;
      const own = Number(isA ? g.scoreA : g.scoreB), opp = Number(isA ? g.scoreB : g.scoreA);
      pf += own; pa += opp; games += 1; if (own > opp) wins += 1;
    }
    return {
      ...row,
      position: index + 1,
      j: Number(row.j ?? games),
      v: Number(row.v ?? wins),
      d: Number(row.j ?? games) - Number(row.v ?? wins),
      pointsFor: games ? pf : null,
      pointsAgainst: games ? pa : null,
    };
  });
}

function archiveStandings(campaign = []) {
  return campaign.map((row, index) => ({
    name: row.team?.name || '',
    position: row.position || index + 1,
    pts: row.classificationPoints ?? null,
    j: Number(row.games || 0), v: Number(row.wins || 0), d: Number(row.losses || 0),
    pointsFor: Number(row.pointsFor || 0), pointsAgainst: Number(row.pointsAgainst || 0), saldo: Number(row.diff || 0),
  }));
}

export default async function TeamPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const reqNum = Number(sp?.temporada);
  const requestedYear = Number.isInteger(reqNum) && reqNum >= 2025 && reqNum <= 2100 ? reqNum : null;

  const masterRequested=sp?.categoria==='master'||sp?.context?.startsWith('master-');
  let historical2025 = masterRequested?null:getArchive2025Team(slug);
  let current2026 = masterRequested?null:await getTeamBySlug(slug);
  const seasonParam = String(sp?.s || '');
  const current2027 = masterRequested?null:await getTeam2027BySlug(slug, requestedYear > 2026 ? requestedYear : undefined, seasonParam || undefined);
  // Historical identities come from permanent-franchise participations, never from name guesses.
  const participation2026=current2027?.participations?.find(x=>Number(x.year)===2026&&x.competitionId===current2027.identity?.competition?.id);
  if(!current2026&&participation2026?.team?.name)current2026=await getTeamBySlug(slugify(participation2026.team.name));
  const participation2025=current2027?.participations?.find(x=>Number(x.year)===2025&&x.competitionId===current2027.identity?.competition?.id);
  if(!historical2025&&participation2025?.team?.name)historical2025=getArchive2025Team(slugify(participation2025.team.name));
  let data = masterRequested?await getMasterTeam(slug):seasonParam ? current2027 : requestedYear === 2025 ? historical2025 : requestedYear === 2026 ? current2026 : requestedYear > 2026 ? current2027 : (process.env.L3C_HOME_MODE==='pre2027'||process.env.L3C_HOME_MODE==='season2027'?current2027||current2026:current2026||current2027)||historical2025;
  if(!data&&!requestedYear&&!seasonParam&&!masterRequested)data=await getAnyTeamBySlug(slug);

  if (!data) notFound();

  const team = data.team;
  const year = Number(data.seasonYear || requestedYear || 2026);
  const master = data.competition === 'Master';
  const seriesRaw = year<=2026?(data.series || seriesForTeam(team.name) || ''):'';
  const series = String(seriesRaw).replace('Série ', '');
  const seriesKey = series.toLowerCase();
  const all2026 = !master && year === 2026 ? await getAllGames() : null;
  const currentStandings = !master && year === 2026 && seriesKey ? standingsFallback()[seriesKey] || [] : [];
  const standings = year === 2025
    ? archiveStandings(getArchive2025Campaign())
    : enrichSeriesStandings(currentStandings, all2026?.legacyGames || all2026?.recentResults || [], series);

  const highlights = data.highlights || {};
  const allTeamGames = (data.games || []).slice().sort((a, b) => new Date(b.startsAt || 0) - new Date(a.startsAt || 0));
  const finishedGames = allTeamGames.filter(isFinishedPublicGame);
  const upcomingGames = allTeamGames.filter(isUpcomingPublicGame).sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0));
  const roster = sortRoster(data.roster || []);
  const commission = publicCommission(data);
  const gameHref = (g) => master ? `/master/event/${masterGameSlug(g)}/` : `/event/${year === 2025 ? archive2025GameSlug(g) : eventSlugForGame(g)}/`;
  const playerHref = (player) => {
    const base = `/player/${slugify(player?.name || '')}/`;
    if (master) return `${base}?categoria=master&temporada=${year}`;
    if (data.scopeKey && data.scopeKey !== 'adulto' && data.scopeKey !== 'master') return `${base}?context=${data.scopeKey}-${year}`;
    return `${base}?categoria=adulto&temporada=${year}`;
  };
  const accent = await resolveTeamAccent(team, accentForTeam(team.name));
  const participations=(data.participations||current2027?.participations||[]).filter(x=>x.competitionId===(data.identity?.competition?.id||current2027?.identity?.competition?.id));
  const seasonTab = (y) => {
    const entry=participations.find(x=>Number(x.year)===Number(y));
    if(entry)return participationHref(entry,slugify);
    const historic=Number(y)===2026?current2026:Number(y)===2025?historical2025:null;
    return `/team/${slugify(historic?.team?.name||team.name)}/?temporada=${y}${master?'&categoria=master':''}`;
  };
  const totalGames = Number(highlights.games ?? (Number(highlights.wins || 0) + Number(highlights.losses || 0)));
  const saldo = Number(highlights.pointsFor || 0) - Number(highlights.pointsAgainst || 0);
  const titleNames=[team.name,...participations.map(x=>x.team?.name)].filter(Boolean);
  const titles=[...new Map(titleNames.flatMap(name=>franchiseTitles(name)).map(title=>[`${title.year}-${title.series}`,title])).values()];
  const availableSeasons = [...new Set([...participations.map(x=>Number(x.year)), current2027 ? Number(current2027.seasonYear || 2027) : null, current2026 ? 2026 : null, historical2025 ? 2025 : null].filter(Boolean))];
  const currentDivision = master ? 'Liga Master' : (divisionLabel({...data,series:seriesRaw},year) || (year>2026?'Divisão ainda não informada':data.competition || 'Adulto Livre'));
  const currentRow = standings.find(row => slugify(row.name) === slug) || null;
  const bestTitle = titles[0] || null;
  const titleSeries = [...new Set(titles.map((title) => title.series))];
  const titleYears = [...new Set(titles.map((title) => title.year))].sort((a, b) => a - b);
  const sameTitleSeries = titles.length > 0 && titleSeries.length === 1;
  const championLabel = (count) => {
    if (count === 1) return 'Campeão';
    if (count === 2) return 'Bicampeão';
    if (count === 3) return 'Tricampeão';
    if (count === 4) return 'Tetracampeão';
    if (count === 5) return 'Pentacampeão';
    return `${count}× campeão`;
  };
  const heroHonors = titles.length
    ? {
        label: titles.length === 1 ? 'Título oficial' : `${titles.length} títulos oficiais`,
        headline: sameTitleSeries ? `${championLabel(titles.length)} da ${titleSeries[0]}` : `${titles.length} títulos oficiais`,
        detail: sameTitleSeries
          ? titleYears.join(' • ')
          : [...titles].sort((a,b)=>a.year-b.year).map((title) => `${title.series} ${title.year}`).join(' • '),
      }
    : null;
  const bestResult = bestTitle
    ? sameTitleSeries
      ? { value: championLabel(titles.length), detail: `${titleSeries[0]} · ${titleYears.join('–')}` }
      : { value: `${titles.length} títulos`, detail: heroHonors.detail }
    : currentRow?.position
      ? { value: `${currentRow.position}º lugar`, detail: `${currentDivision} ${year}` }
      : { value: '—', detail: 'Sem posição final registrada' };
  const seasonsLabel = availableSeasons.length ? availableSeasons.sort((a,b)=>a-b).join(' · ') : String(year);
  const campaignLabel = `${Number(highlights.wins || 0)}–${Number(highlights.losses || 0)}`;

  const classificationPanel = standings.length > 0 ? (
    <section id="classificacao" className="team-v057-panel team-v057-standings">
      <div className="team-v057-head">
        <div><span>🏆</span><h2>{year === 2026 && series ? `Classificação da Série ${series}` : `Campanha geral ${year}`}</h2></div>
        <small>{year === 2026 && series ? `${standings.length} equipes` : `${standings.length} equipes`}</small>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Pos</th><th>Equipe</th>{year === 2026 && <th>PTS</th>}<th>J</th><th>V</th><th>D</th><th>Pró</th><th>Contra</th><th>Saldo</th></tr></thead>
          <tbody>{standings.map((row, index) => {
            const current = slugify(row.name) === slug;
            return <tr key={`${row.name}-${index}`} className={current ? 'current' : ''}>
              <td>{row.position || index + 1}</td>
              <td className="team-cell">{teamLogo(row.name) && <img src={teamLogo(row.name)} alt="" />}<b>{row.name}</b></td>
              {year === 2026 && <td><b>{row.pts ?? '—'}</b></td>}
              <td>{row.j ?? '—'}</td><td>{row.v ?? '—'}</td><td>{row.d ?? '—'}</td>
              <td>{row.pointsFor ?? '—'}</td><td>{row.pointsAgainst ?? '—'}</td>
              <td className={Number(row.saldo) >= 0 ? 'positive' : 'negative'}>{Number(row.saldo) > 0 ? '+' : ''}{row.saldo ?? '—'}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </section>
  ) : null;

  return (
    <main className={`team-page team-profile-v057 ${master ? 'master-page' : ''}`} style={{'--team-accent': accent, '--team-soft': rgba(accent, .16), '--team-faint': rgba(accent, .06), '--team-glow': rgba(accent, .55)}}>
      <section className="team-v057-hero" id="visao-geral">
        <div className={`wide-shell team-v057-hero-grid ${year === 2026 && classificationPanel ? 'with-classification' : ''}`}>
          <div className="team-v057-identity">
            <div className="team-v057-logo"><TeamLogo team={team} size={190} /></div>
            <div className="team-v057-copy">
              <small>{data.leagueName || (master ? 'Liga Master' : year === 2025 ? 'Liga 3 Colinas' : 'Liga Forjax de Basquete')} · {year}</small>
              <h1>{team.name}</h1>
              <div className="hero-chip-row">
                <span>📍 {team.city || 'Franca'}, {team.state || 'SP'}</span>
                {currentDivision && <span>🏆 {currentDivision}</span>}
                {master && <span>Master</span>}
              </div>
              {heroHonors && (
                <div className="team-v059-hero-honors" aria-label="Conquistas da franquia">
                  <span className="team-v059-honors-icon">★</span>
                  <div>
                    <small>{heroHonors.label}</small>
                    <strong>{heroHonors.headline}</strong>
                    <span>{heroHonors.detail}</span>
                  </div>
                </div>
              )}
              <nav className="team-v057-nav" aria-label="Navegação da equipe">
                <a className="active" href="#visao-geral">Visão geral</a>
                <a href="#elenco">Elenco</a>
                <a href="#comissao-tecnica">Comissão técnica</a>
                <a href="#jogos">Jogos</a>
                <a href="#titulos">Títulos</a>
                <a href="#historico">Histórico</a>
              </nav>
            </div>
          </div>

          <aside className="team-v057-summary team-v058-franchise-summary">
            <div className="team-v058-summary-title"><small>Resumo da franquia</small><span>{team.name}</span></div>
            <div className="team-v057-summary-grid team-v058-summary-grid">
              <div><small>Temporadas vinculadas</small><strong>{availableSeasons.length || 1}</strong><span>{seasonsLabel}</span></div>
              <div><small>Títulos</small><strong>{titles.length}</strong><span>{titles.length ? `${titles.length} ${titles.length === 1 ? 'conquista oficial' : 'conquistas oficiais'}` : 'Nenhum título oficial'}</span></div>
              {data.franchise&&<div><small>Franquia</small><strong className="team-v058-text-value">{data.franchise.name||data.franchise.code}</strong><span>{data.franchise.code}</span></div>}<div><small>Divisão atual</small><strong className="team-v058-text-value">{currentDivision}</strong><span>Temporada {year}</span></div>
              <div><small>Melhor resultado</small><strong className="team-v058-text-value">{bestResult.value}</strong><span>{bestResult.detail}</span></div>
            </div>
            <div className="team-v057-rate team-v058-season-strip">
              <div><small>Campanha {year}</small><strong>{campaignLabel}</strong></div>
              <div className="team-v057-progress"><i style={{width: percent(highlights.wins, highlights.losses)}} /></div>
              <p>{jogosLabel(totalGames)} · {percent(highlights.wins, highlights.losses)} de aproveitamento · saldo {saldo > 0 ? '+' : ''}{saldo}</p>
            </div>
          </aside>

          {year === 2026 && classificationPanel && <div className="team-v057-classification-slot">{classificationPanel}</div>}
        </div>
      </section>

      {!master && (
        <section className="wide-shell team-v057-season-tabs" aria-label="Temporadas">
          {(availableSeasons.length ? availableSeasons : [year]).map((y) => <Link key={y} className={year === y ? 'active' : ''} href={seasonTab(y)}>{y}</Link>)}
        </section>
      )}

      <section className="wide-shell team-v057-body">
        {year !== 2026 && classificationPanel}

        <section id="elenco" className="team-v057-panel team-v057-roster-panel">
          <div className="team-v057-head">
            <div><span>👥</span><h2>Elenco completo</h2></div>
            <small>{roster.length} atletas · temporada {year}</small>
          </div>
          <div className="team-v057-roster-grid">
            {roster.map((entry, index) => (
              <Link className="team-v057-player" href={playerHref(entry.player)} key={entry.player?.id || `${entry.player?.name}-${index}`}>
                <div className="team-v057-player-photo">
                  {entry.player?.photoUrl ? <img src={entry.player.photoUrl} alt={entry.player.name} /> : <div className="team-v057-placeholder"><b>{String(entry.player?.name || '?')[0]}</b></div>}
                  {entry.number !== null && entry.number !== undefined && entry.number !== '' && <strong>{entry.number}</strong>}
                </div>
                <span>{entry.player?.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="comissao-tecnica" className="team-v057-panel team-v057-commission-panel" aria-labelledby="public-commission-title">
          <div className="team-v057-head">
            <div><span aria-hidden="true">♙</span><h2 id="public-commission-title">Comissão técnica</h2></div>
            <small>Temporada {year}</small>
          </div>
          {commission.length ? <div className="team-v057-commission-grid">
            {commission.map((person, index) => <article className="team-v057-commission-member" key={person.id || `${person.name}-${index}`}>
              <div className="team-v057-commission-photo">{person.photoUrl ? <img src={person.photoUrl} alt="" loading="lazy" /> : <span aria-hidden="true">♙</span>}</div>
              <div><strong>{person.name}</strong><small>{person.role}</small></div>
            </article>)}
          </div> : <div className="team-v057-empty">Nenhum integrante da comissão técnica disponível na consulta pública desta temporada.</div>}
        </section>

        <section id="titulos" className="team-v057-panel team-v058-titles-panel">
          <div className="team-v057-head">
            <div><span>★</span><h2>Títulos da franquia</h2></div>
            <small>{titles.length ? `${titles.length} ${titles.length === 1 ? 'conquista oficial' : 'conquistas oficiais'}` : 'Histórico oficial'}</small>
          </div>
          {titles.length ? (
            <div className="team-v058-titles-grid">
              {titles.map((title, index) => (
                <article className={`team-v058-title-card ${slugify(title.series)}`} key={`${title.year}-${title.series}-${index}`}>
                  <span className="team-v058-trophy">★</span>
                  <div><small>{title.series}</small><strong>Campeão {title.year}</strong><p>{team.name}</p></div>
                  <TeamLogo team={team} size={62} />
                </article>
              ))}
            </div>
          ) : (
            <div className="team-v058-no-titles"><b>★</b><div><strong>Ainda sem títulos oficiais registrados</strong><span>As conquistas futuras aparecerão automaticamente no histórico da franquia.</span></div></div>
          )}
        </section>

        <section id="jogos" className="team-v057-bottom-grid">
          <div className="team-v057-panel">
            <div className="team-v057-head"><div><span>▣</span><h2>Jogos de {year}</h2></div><small>{finishedGames.length} realizados</small></div>
            <div className="team-v057-game-list">
              {finishedGames.map((game, index) => {
                const dt = gameDate(game); const result = resultForTeam(game, slug);
                const opponent = slugify(game.teamA?.name) === slug ? game.teamB : game.teamA;
                return <Link href={gameHref(game)} className="team-v057-game-row" key={game.id || index}>
                  <time>{dt?.date?.slice(0,5) || '—'}</time>
                  <span className="team-v057-opponent"><TeamLogo team={opponent} size={30} /><b>{opponent?.name || 'Adversário'}</b></span>
                  <em>{gameStage(game)}</em>
                  <strong title="Placar com a equipe primeiro">{slugify(game.teamA?.name) === slug ? `${game.scoreA} × ${game.scoreB}` : `${game.scoreB} × ${game.scoreA}`}</strong>
                  {result && <i className={result === 'V' ? 'win' : 'loss'}>{result}</i>}
                </Link>;
              })}
              {!finishedGames.length && <div className="team-v057-empty">Nenhum resultado registrado nesta temporada.</div>}
            </div>
          </div>

          <div className="team-v057-panel team-v057-next">
            <div className="team-v057-head"><div><span>▣</span><h2>Próximos jogos</h2></div></div>
            {upcomingGames.length ? <div className="team-v057-game-list">{upcomingGames.map((game, index) => {
              const dt = gameDate(game); const opponent = slugify(game.teamA?.name) === slug ? game.teamB : game.teamA;
              return <Link href={gameHref(game)} className="team-v057-game-row team-v057-game-row-next" key={game.id || index}><time>{dt ? `${dt.date} · ${dt.time}` : 'A definir'}</time><span className="team-v057-opponent"><TeamLogo team={opponent} size={30}/><b>{opponent?.name}</b></span><em>{gameStage(game)}</em><strong>×</strong></Link>;
            })}</div> : <div className="team-v057-season-ended"><b>▣</b><h3>Temporada encerrada</h3><p>Nenhum jogo futuro programado para {team.name} em {year}.</p></div>}
          </div>

          <div id="historico" className="team-v057-panel team-v057-history">
            <div className="team-v057-head"><div><span>◷</span><h2>Histórico da franquia</h2></div></div>
            <div className="team-v057-history-grid">
              {current2026 && <Link className={`team-v057-history-card ${year === 2026 ? 'active' : ''}`} href={seasonTab(2026)}><strong>2026</strong><div><b>{seriesForTeam(current2026.team?.name) || 'Adulto Livre'}</b><span>{Number(current2026.highlights?.games ?? (Number(current2026.highlights?.wins || 0) + Number(current2026.highlights?.losses || 0)))} jogos</span></div><TeamLogo team={current2026.team} size={42}/></Link>}
              {historical2025 && <Link className={`team-v057-history-card archive ${year === 2025 ? 'active' : ''}`} href={seasonTab(2025)}><strong>2025</strong><div><b>Adulto Livre</b><span>{historical2025.games?.length || 0} jogos</span></div><TeamLogo team={historical2025.team} size={42}/></Link>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
