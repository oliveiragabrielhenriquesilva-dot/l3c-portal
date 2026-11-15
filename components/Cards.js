import {jogosLabel} from '../lib/format';
import Link from 'next/link';
import { slugify, eventSlugForGame, gamePublicStatus } from '../lib/site';

export function TeamLogo({ team, size = 58, className = '' }) {
  return <img className={`team-logo ${className}`} style={{ width: size, height: size }} src={team?.logoUrl || '/assets/legacy/uploads/2026/08/logo-oficial-forjax.webp'} alt={team?.name || 'Equipe'} />;
}

export function gameDate(game) {
  if (!game?.startsAt) return null;
  const d = new Date(game.startsAt);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return {
      date: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d),
      time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
    };
  } catch {
    return null;
  }
}

export function GameCard({ game, href, compact = false }) {
  const state = gamePublicStatus(game);
  const done = state === 'FINISHED';
  const pending = state === 'PENDING_RESULT';
  const live = state === 'LIVE';
  const dt = gameDate(game);
  const statusLabel = done ? 'Final' : pending ? 'Aguardando resultado' : live ? '● Ao vivo' : 'Partida agendada';
  return (
    <Link href={href || `/event/${eventSlugForGame(game)}/`} className={`game-card ${compact ? 'compact' : ''} state-${state.toLowerCase()}`}>
      <div className="game-meta"><span>{dt ? `${dt.date} · ${dt.time}` : 'A definir'}</span><b>{game.stage?.name || game.round || ''}</b></div>
      <div className="game-row">
        <div className="game-team"><TeamLogo team={game.teamA} /><strong>{game.teamA?.name || 'Equipe A'}</strong></div>
        <div className="score">{done || live ? <><b>{game.scoreA}</b><span>×</span><b>{game.scoreB}</b></> : <span className="versus">×</span>}</div>
        <div className="game-team right"><TeamLogo team={game.teamB} /><strong>{game.teamB?.name || 'Equipe B'}</strong></div>
      </div>
      <div className="game-status">{statusLabel}</div>
    </Link>
  );
}

export function ResultRow({ game, href }) {
  const dt = gameDate(game);
  const state = gamePublicStatus(game);
  const done = state === 'FINISHED';
  const pending = state === 'PENDING_RESULT';
  return (
    <Link className={`result-row state-${state.toLowerCase()}`} href={href || `/event/${eventSlugForGame(game)}/`}>
      <div className="result-date">{dt ? `${dt.date} · ${dt.time}` : 'A definir'}{pending && <small>Aguardando resultado</small>}</div>
      <div className="result-match">
        <div className="result-team"><TeamLogo team={game.teamA} size={52} /><small>{game.teamA?.name || 'Equipe A'}</small></div>
        <strong>{done ? `${game.scoreA} × ${game.scoreB}` : '×'}</strong>
        <div className="result-team"><TeamLogo team={game.teamB} size={52} /><small>{game.teamB?.name || 'Equipe B'}</small></div>
      </div>
      <div className="result-stage">{game.stage?.name || game.round || ''}</div>
    </Link>
  );
}

export function TeamCard({ team, division }) {
  return <Link className="team-card" href={`/team/${slugify(team.name)}/`}><TeamLogo team={team} size={62} /><b>{team.name}</b>{division && <span>{division}</span>}</Link>;
}

export function StatLeader({ label, metric, item }) {
  if (!item) return null;
  return <Link className="leader-card" href={`/player/${slugify(item.player?.name)}/`}><div className="leader-top"><span>{metric}</span><em>{label}</em><i>Ver ranking →</i></div><div className="leader-person">{item.player?.photoUrl ? <img src={item.player.photoUrl} alt="" /> : <div className="avatar">{(item.player?.name || '?')[0]}</div>}<div><strong>{item.player?.name}</strong><small>{item.teams?.[0]?.name || item.teamName || ''} · {jogosLabel(item.games)}</small><div className="leader-value"><b>{Number(item.value ?? 0).toFixed(1).replace('.', ',')}</b><span>{metric}/JOGO</span></div></div></div></Link>;
}
