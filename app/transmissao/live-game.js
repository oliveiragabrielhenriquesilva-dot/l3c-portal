'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api as publicApi } from './api';
export function useLiveGame(gameId, intervalMs = 2000) {
    const [data, setData] = useState(null);
    const [receivedAt, setReceivedAt] = useState(0);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);
    const selectedId = useRef(gameId);
    selectedId.current = gameId;
    const load = useCallback(async () => {
        if (!gameId)
            return;
        try {
            const next = await publicApi(`/public/games/${encodeURIComponent(gameId)}/live`);
            if (selectedId.current !== gameId)
                return;
            setData(next);
            setReceivedAt(Date.now());
            setError('');
        }
        catch (e) {
            setError(String(e?.message || 'Falha na sincronização ao vivo.'));
        }
    }, [gameId]);
    useEffect(() => {
        setData(null);
        setReceivedAt(0);
        setError('');
        if (!gameId)
            return;
        load();
        const id = window.setInterval(load, intervalMs);
        return () => window.clearInterval(id);
    }, [load, intervalMs]);
    useEffect(() => {
        const id = window.setInterval(() => setTick((value) => value + 1), 250);
        return () => window.clearInterval(id);
    }, []);
    const elapsed = receivedAt ? Math.max(0, Date.now() - receivedAt) : 0;
    const gameClockMs = data
        ? Math.max(0, Number(data.game.gameClockMs || 0) - (data.game.clockRunning ? elapsed : 0))
        : 0;
    const shotClockMs = data
        ? Math.max(0, Number(data.game.shotClockMs || 0) - (data.game.shotClockRunning ? elapsed : 0))
        : 0;
    const stale = Boolean(data && receivedAt && Date.now() - receivedAt > Math.max(7000, intervalMs * 3));
    void tick;
    return { data, error, receivedAt, gameClockMs, shotClockMs, stale, reload: load };
}
export function formatLiveClock(ms) {
    const safe = Math.max(0, Math.round(ms));
    const totalSeconds = Math.ceil(safe / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
export function formatShotClock(ms) {
    const safe = Math.max(0, ms);
    if (safe < 5000 && safe > 0)
        return (safe / 1000).toFixed(1);
    return String(Math.ceil(safe / 1000));
}
export function livePeriodLabel(period) {
    const n = Math.max(1, Number(period || 1));
    return n <= 4 ? `${n}º QUARTO` : `${n - 4}ª PRORROGAÇÃO`;
}
