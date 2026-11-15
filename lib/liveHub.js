// Hub de tempo real do SITE: UMA conexão SSE com a API por jogo, repartida entre todos os visitantes.
// Assim 500 pessoas assistindo = 1 conexão (e 1 consulta por evento) na API, não 500.
import { API } from './site';

const GAME_ID = /^[A-Za-z0-9_-]{3,80}$/;
export const isValidGameId = (id) => GAME_ID.test(String(id || ''));
const MAX_SUBSCRIBERS = 1500;
const hubs = globalThis.__l3cLiveHubs || (globalThis.__l3cLiveHubs = new Map());
let total = 0;

function startUpstream(hub) {
  hub.ctrl = new AbortController();
  (async () => {
    while (hub.subs.size > 0) {
      try {
        const r = await fetch(`${API}/v1/public/games/${encodeURIComponent(hub.id)}/stream`, {
          cache: 'no-store', signal: hub.ctrl.signal, headers: { accept: 'text/event-stream' },
        });
        if (!r.ok || !r.body) throw new Error(String(r.status));
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const block = buf.slice(0, i + 2).replace(/\r/g, '');
            buf = buf.slice(i + 2);
            if (/^event: snapshot/m.test(block)) hub.last = block;
            for (const send of hub.subs) send(block);
          }
        }
      } catch (e) {
        if (hub.ctrl.signal.aborted) return;
        if (process.env.L3C_LIVE_DEBUG) console.log('[liveHub] upstream error', hub.id, String(e?.message || e));
      }
      if (hub.subs.size === 0 || hub.ctrl.signal.aborted) return;
      // Avisa os navegadores: caem para o modo rápido (polling) até a API voltar.
      for (const send of hub.subs) send('event: upstream-down\ndata: {}\n\n');
      await new Promise((ok) => setTimeout(ok, 2000));
    }
  })();
}

export function subscribe(gameId, send) {
  if (!isValidGameId(gameId) || total >= MAX_SUBSCRIBERS) return null;
  let hub = hubs.get(gameId);
  if (!hub) { hub = { id: gameId, subs: new Set(), last: null, ctrl: null }; hubs.set(gameId, hub); }
  hub.subs.add(send); total++;
  if (process.env.L3C_LIVE_DEBUG) console.log('[liveHub] sub', gameId, hub.subs.size);
  if (hub.last) send(hub.last);
  if (hub.subs.size === 1) startUpstream(hub);
  let done = false;
  return () => {
    if (done) return; done = true; total--;
    hub.subs.delete(send);
    if (process.env.L3C_LIVE_DEBUG) console.log('[liveHub] unsub', gameId, hub.subs.size);
    if (hub.subs.size === 0) { hub.ctrl?.abort(); hubs.delete(gameId); }
  };
}

const liveCache = globalThis.__l3cLiveCache || (globalThis.__l3cLiveCache = new Map());
export async function liveSnapshot(gameId) {
  if (!isValidGameId(gameId)) return null;
  const hit = liveCache.get(gameId);
  if (hit && Date.now() - hit.at < 1000) return hit.data;
  if (hit?.pending) return hit.pending;
  const pending = fetch(`${API}/v1/public/games/${encodeURIComponent(gameId)}/live`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((data) => { liveCache.set(gameId, { at: Date.now(), data }); if (liveCache.size > 200) liveCache.clear(); return data; });
  liveCache.set(gameId, { at: 0, pending });
  return pending;
}
