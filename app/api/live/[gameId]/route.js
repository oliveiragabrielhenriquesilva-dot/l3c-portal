import { liveSnapshot, isValidGameId } from '../../../../lib/liveHub';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Reserva por polling: devolve o estado atual do jogo (cache de 1 s para proteger a API).
export async function GET(_req, { params }) {
  const { gameId } = await params;
  if (!isValidGameId(gameId)) return new Response('{}', { status: 400 });
  const data = await liveSnapshot(gameId);
  return new Response(JSON.stringify(data || {}), {
    status: data ? 200 : 502,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
