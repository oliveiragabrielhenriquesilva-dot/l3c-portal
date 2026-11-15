import Link from 'next/link';
import { TeamLogo } from './Cards';
import { Countdown, ShareButton } from './PreGameClient';
import { apiFetch, gamePublicStatus, normalizeGame, slugify, MASTER_SEASON_ID, SEASON_ID } from '../lib/site';

const num = (v) => Number(v) || 0;
const sameTeam = (a, b) => Boolean(a && b) && ((a.id && a.id === b.id) || slugify(a.name || '') === slugify(b.name || ''));
const shortDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
};
const fullDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
};

function summarize(team, finished) {
  const mine = finished.filter((g) => sameTeam(g.teamA, team) || sameTeam(g.teamB, team))
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  let wins = 0, losses = 0, diff = 0;
  const rows = mine.map((g) => {
    const home = sameTeam(g.teamA, team);
    const pf = num(home ? g.scoreA : g.scoreB), pa = num(home ? g.scoreB : g.scoreA);
    if (pf > pa) wins += 1; else if (pf < pa) losses += 1;
    diff += pf - pa;
    return { g, pf, pa, opp: home ? g.teamB : g.teamA, res: pf > pa ? 'V' : pf < pa ? 'D' : 'E' };
  });
  return { games: mine.length, wins, losses, diff, last: rows[0] || null, form: rows.slice(0, 5).map((r) => r.res) };
}

function PreTeamCard({ team, info, players, isMaster, seasonYear }) {
  const playerHref = (name) => `/player/${slugify(name)}/${isMaster ? `?context=master-${seasonYear}` : ''}`;
  return (
    <div className="pg-card">
      <div className="pg-card-head"><TeamLogo team={team} size={34} /><strong>{team?.name || 'Equipe'}</strong></div>
      {info.games ? (
        <>
          <div className="pg-kpis">
            <div><b>{info.games}</b><small>Jogos</small></div>
            <div><b>{info.wins}</b><small>Vitórias</small></div>
            <div><b>{info.losses}</b><small>Derrotas</small></div>
            <div><b>{info.diff > 0 ? `+${info.diff}` : info.diff}</b><small>Saldo</small></div>
          </div>
          <div className="pg-form" aria-label="Últimos resultados">{info.form.map((r, i) => <i key={i} className={`r-${r}`}>{r}</i>)}</div>
          {info.last && (
            <div className="pg-last"><small>Último jogo</small>
              <div><span>{shortDate(info.last.g.startsAt)} · vs {info.last.opp?.name || 'Equipe'}</span><strong>{info.last.pf} × {info.last.pa}</strong><em className={`r-${info.last.res}`}>{info.last.res === 'V' ? 'Vitória' : info.last.res === 'D' ? 'Derrota' : 'Empate'}</em></div>
            </div>
          )}
        </>
      ) : <p className="pg-empty">Ainda sem jogos disputados nesta temporada.</p>}
      {players.length > 0 && (
        <div className="pg-players"><small>Atletas para ficar de olho · médias na temporada</small>
          {players.map((x) => (
            <Link href={playerHref(x.player?.name)} key={x.player?.id || x.player?.name}>
              <span className="pg-pname">{x.player?.name}</span>
              <span className="pg-pstats"><b>{num(x.averages?.points).toFixed(1)}</b> PTS <b>{num(x.averages?.rebounds).toFixed(1)}</b> REB <b>{num(x.averages?.assists).toFixed(1)}</b> AST</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function icsLink(game, title, venue) {
  const start = new Date(game.startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s) => String(s || '').replace(/[\;,]/g, (m) => `\\${m}`).replace(/\r?\n/g, ' ');
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Liga 3 Colinas//Site//PT', 'BEGIN:VEVENT',
    `UID:${game.id}@liga3colinas.com.br`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${esc(title)}`, ...(venue ? [`LOCATION:${esc(venue)}`] : []), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

export async function PreGameActions({ game, title, venue }) {
  const href = icsLink(game, title, venue);
  return (
    <div className="pg-actions">
      {href ? <a className="pg-btn" href={href} download="jogo-liga3colinas.ics">Adicionar ao calendário</a> : null}
      <ShareButton title={title} />
    </div>
  );
}

export default async function PreGame({ game, isMaster, seasonYear, venue }) {
  const seasonId = isMaster ? MASTER_SEASON_ID : SEASON_ID;
  const [gamesPayload, playersPayload] = await Promise.all([
    apiFetch(`/v1/public/seasons/${encodeURIComponent(seasonId)}/games`),
    apiFetch(`/v1/public/seasons/${encodeURIComponent(seasonId)}/players`),
  ]);
  const finished = (Array.isArray(gamesPayload?.games) ? gamesPayload.games : [])
    .map(normalizeGame)
    .filter((g) => g && g.id !== game.id && gamePublicStatus(g) === 'FINISHED');
  const players = Array.isArray(playersPayload?.players) ? playersPayload.players : [];
  const topPlayers = (team) => players
    .filter((x) => x?.player?.name && (x.teams || []).some((t) => sameTeam(t, team)))
    .sort((a, b) => num(b.averages?.points) - num(a.averages?.points))
    .slice(0, 3);
  const infoA = summarize(game.teamA, finished), infoB = summarize(game.teamB, finished);
  const h2h = finished
    .filter((g) => (sameTeam(g.teamA, game.teamA) && sameTeam(g.teamB, game.teamB)) || (sameTeam(g.teamA, game.teamB) && sameTeam(g.teamB, game.teamA)))
    .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));

  return (
    <section className="section shell pg-section">
      <h2 className="pg-title">Como chegam</h2>
      <div className="pg-two">
        <PreTeamCard team={game.teamA} info={infoA} players={topPlayers(game.teamA)} isMaster={isMaster} seasonYear={seasonYear} />
        <PreTeamCard team={game.teamB} info={infoB} players={topPlayers(game.teamB)} isMaster={isMaster} seasonYear={seasonYear} />
      </div>

      <div className="pg-two pg-two-wide">
        <div className="pg-wrap">
          <h2 className="pg-title">Confronto direto</h2>
          <div className="pg-card pg-h2h">
            {h2h.length ? h2h.map((g) => (
              <div key={g.id}>
                <span><small>{g.stage?.name || g.round || 'Jogo'}</small>{fullDate(g.startsAt)}</span>
                <b>{g.teamA?.name}</b><strong>{num(g.scoreA)} × {num(g.scoreB)}</strong><b>{g.teamB?.name}</b>
              </div>
            )) : <p className="pg-empty">Primeiro confronto entre as equipes nesta temporada.</p>}
          </div>
        </div>
        <div className="pg-wrap">
          <h2 className="pg-title">Local</h2>
          <div className="pg-card pg-venue">
            <strong>{venue || 'Local a confirmar'}</strong>
            <span>{fullDate(game.startsAt)}</span>
            {venue ? <a className="pg-btn ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} Franca SP`)}`} target="_blank" rel="noopener noreferrer">Como chegar →</a> : null}
          </div>
        </div>
      </div>

      <div className="pg-note">Boxscore, destaques da partida e comparativo das equipes aparecem aqui assim que o jogo for finalizado.</div>
    </section>
  );
}
