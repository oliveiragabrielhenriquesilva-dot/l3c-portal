'use client';
import { useEffect, useState } from 'react';

// Contagem regressiva até o início da partida. Só calcula no navegador (evita divergência com o HTML do servidor).
export function Countdown({ startsAt }) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const target = new Date(startsAt).getTime();
  if (!Number.isFinite(target)) return null;
  const ms = now === null ? null : Math.max(0, target - now);
  const pad = (n) => String(n).padStart(2, '0');
  const parts = ms === null
    ? [['--', 'Dias'], ['--', 'Horas'], ['--', 'Min'], ['--', 'Seg']]
    : [[pad(Math.floor(ms / 864e5)), 'Dias'], [pad(Math.floor((ms % 864e5) / 36e5)), 'Horas'], [pad(Math.floor((ms % 36e5) / 6e4)), 'Min'], [pad(Math.floor((ms % 6e4) / 1e3)), 'Seg']];
  return (
    <div className="pg-countdown" aria-label="Tempo até o início da partida">
      <small>A bola sobe em</small>
      <div>{parts.map(([value, label]) => <span key={label}><b>{value}</b><em>{label}</em></span>)}</div>
    </div>
  );
}

// Compartilhar: usa o compartilhamento nativo do celular; no computador abre o WhatsApp.
export function ShareButton({ title }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
    } catch (e) { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank', 'noopener,noreferrer');
  };
  return <button type="button" className="pg-btn ghost" onClick={share}>Compartilhar</button>;
}
