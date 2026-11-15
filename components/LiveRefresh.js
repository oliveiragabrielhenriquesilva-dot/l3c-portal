'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Home e listas: enquanto houver jogo ao vivo, confere o placar a cada 5 s e recarrega a página só quando algo muda.
// Sem jogo ao vivo mas com jogo prestes a começar, confere a cada 30 s para o card virar "ao vivo" sozinho.
export default function LiveRefresh({ games = [], soon = false }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const key = games.map((g) => `${g.id}:${g.status}:${g.scoreA}:${g.scoreB}`).join('|');

  useEffect(() => {
    if (!games.length && !soon) return undefined;
    const known = new Map(games.map((g) => [g.id, `${String(g.status).toUpperCase()}|${g.scoreA}|${g.scoreB}`]));
    let busy = false;
    const tick = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        if (!games.length) { routerRef.current.refresh(); return; }
        let changed = false;
        await Promise.all(games.map(async (g) => {
          const r = await fetch(`/api/live/${encodeURIComponent(g.id)}`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
          const s = r?.game; if (!s) return;
          const sig = `${String(s.status).toUpperCase()}|${s.displayScoreA ?? s.scoreA}|${s.displayScoreB ?? s.scoreB}`;
          if (sig !== known.get(g.id)) { known.set(g.id, sig); changed = true; }
        }));
        if (changed) routerRef.current.refresh();
      } finally { busy = false; }
    };
    const t = setInterval(tick, games.length ? 5000 : 30000);
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [key, soon]);
  return null;
}
