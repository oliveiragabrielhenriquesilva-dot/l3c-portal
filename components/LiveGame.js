'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const periodLabel = (p) => { const n = Number(p) || 1; return n > 4 ? `PRORROG. ${n - 4}` : `${n}º QUARTO`; };
const sigOf = (s) => s ? [s.sequence, s.game?.status, s.game?.scoreA, s.game?.scoreB, s.game?.currentPeriod].join('|') : '';

// Mantém a página do jogo viva: placar/relógio instantâneos + atualização completa (box score, parciais) a cada mudança.
export default function LiveGame({ gameId, initialStatus = '', initialScoreA = 0, initialScoreB = 0 }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [, startTransition] = useTransition();
  const [snap, setSnap] = useState(null);
  const [mode, setMode] = useState('connecting'); // connecting | sse | poll
  const recvAt = useRef(0);
  const lastSig = useRef('');
  const lastRefresh = useRef(0);
  const timer = useRef(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let es = null, poll = null, dead = false, silent = null;

    const refresh = () => {
      const wait = Math.max(0, 800 - (Date.now() - lastRefresh.current));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { lastRefresh.current = Date.now(); startTransition(() => routerRef.current.refresh()); }, wait);
    };
    const onSnap = (s) => {
      if (!s?.game) return;
      recvAt.current = Date.now();
      setSnap(s);
      const sig = sigOf(s);
      if (sig !== lastSig.current) { const first = lastSig.current === ''; lastSig.current = sig; if (!first) refresh(); }
      if (String(s.game.status).toUpperCase() === 'FINISHED') stop();
    };
    const stopPoll = () => { clearInterval(poll); poll = null; };
    const startPoll = () => {
      if (poll || dead) return;
      setMode('poll');
      const tick = () => fetch(`/api/live/${encodeURIComponent(gameId)}`, { cache: 'no-store' }).then((r) => r.json()).then(onSnap).catch(() => {});
      tick(); poll = setInterval(tick, 2000);
    };
    const armSilence = () => { clearTimeout(silent); silent = setTimeout(startPoll, 20000); };
    const openSse = () => {
      if (dead || typeof EventSource === 'undefined') return startPoll();
      es = new EventSource(`/api/live/${encodeURIComponent(gameId)}/stream`);
      armSilence();
      const got = (ev) => { armSilence(); stopPoll(); setMode('sse'); try { onSnap(JSON.parse(ev.data)); } catch {} };
      es.addEventListener('snapshot', got);
      es.addEventListener('heartbeat', () => { armSilence(); });
      es.addEventListener('upstream-down', () => { startPoll(); });
      es.onerror = () => { startPoll(); };
    };
    const stop = () => { dead = true; es?.close(); stopPoll(); clearTimeout(silent); };
    const onVis = () => {
      if (document.hidden) { es?.close(); es = null; stopPoll(); clearTimeout(silent); }
      else if (!dead && !es) { openSse(); refresh(); }
    };
    openSse();
    document.addEventListener('visibilitychange', onVis);
    const safety = setInterval(() => { if (!document.hidden && !dead) refresh(); }, 30000);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); clearInterval(safety); clearTimeout(timer.current); };
  }, [gameId]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);

  const g = snap?.game;
  const status = String(g?.status || initialStatus).toUpperCase();
  const live = status === 'LIVE';
  const showScore = live || ['FINISHED', 'FINAL', 'COMPLETED', 'ENDED', 'AWAITING_REVIEW'].includes(status);
  const sA = g ? (g.displayScoreA ?? g.scoreA) : initialScoreA;
  const sB = g ? (g.displayScoreB ?? g.scoreB) : initialScoreB;
  const base = Number(g?.gameClockMs) || 0;
  const left = g?.clockRunning ? base - Math.max(0, now - recvAt.current) : base;
  return (
    <>
      <h1>{showScore ? `${sA ?? 0} × ${sB ?? 0}` : '×'}</h1>
      {live ? (
        <div className="lv-sub" role="status" aria-live="polite" data-mode={mode}>
          {g ? <span className="lv-clock"><em>{periodLabel(g.currentPeriod)}</em>{mmss(left)}</span> : <span className="lv-dot" aria-hidden="true" />}
          <span className="lv-mode">{mode === 'sse' ? 'tempo real' : mode === 'poll' ? 'atualizando a cada 2 s' : ''}</span>
        </div>
      ) : null}
    </>
  );
}
