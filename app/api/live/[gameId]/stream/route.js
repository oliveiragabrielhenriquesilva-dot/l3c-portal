import { subscribe, isValidGameId } from '../../../../../lib/liveHub';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tempo real (SSE): repassa os eventos do jogo para o navegador sem CORS e sem armazenar em buffer.
export async function GET(req, { params }) {
  const { gameId } = await params;
  if (!isValidGameId(gameId)) return new Response('invalid', { status: 400 });
  const enc = new TextEncoder();
  let unsub = null;
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode('retry: 3000\n\n'));
      unsub = subscribe(gameId, (block) => { try { c.enqueue(enc.encode(block)); } catch { unsub?.(); } });
      if (!unsub) { c.close(); return; }
      req.signal.addEventListener('abort', () => { unsub?.(); try { c.close(); } catch {} });
    },
    cancel() { unsub?.(); },
  });
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
