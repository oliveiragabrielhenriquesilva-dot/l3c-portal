'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { formatLiveClock, livePeriodLabel, useLiveGame } from './live-game';
const mainModes = [
    { mode: 'SCOREBOX', label: 'Placar ao vivo', description: 'Retorna imediatamente ao Scorebox', icon: '▣' },
    { mode: 'PREGAME', label: 'Pré-jogo', description: 'Confronto, competição, data, horário e local', icon: 'VS' },
    { mode: 'INTERVAL', label: 'Intervalo', description: 'Placar alinhado e comparativo das equipes', icon: 'Ⅱ' },
    { mode: 'STATS', label: 'Números da partida', description: 'Comparativo coletivo em tela cheia', icon: '▥' },
    { mode: 'HIGHLIGHTS', label: 'Destaques', description: 'Um destaque de cada equipe', icon: '★' },
    { mode: 'LAST_ACTION', label: 'Última ação', description: 'Mantém a ação mais recente em destaque', icon: '✦' },
    { mode: 'FINAL', label: 'Tela especial', description: 'Finais e jogos decisivos', icon: '◆' },
    { mode: 'HIDDEN', label: 'Tela limpa', description: 'Saída totalmente transparente', icon: '×' },
];
function teamName(team) { return team?.shortName || team?.name || 'Equipe'; }
function teamLogo(team) { return team?.logoUrl || null; }
function gameLabel(game) {
    const a = teamName(game?.teamA), b = teamName(game?.teamB);
    const when = game?.startsAt ? new Date(game.startsAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sem data';
    const status = game?.status === 'LIVE' ? 'AO VIVO' : game?.status === 'INTERVAL' ? 'INTERVALO' : game?.status === 'FINISHED' ? 'FINAL' : 'AGENDADO';
    return `${status} · ${a} x ${b} · ${when}`;
}
function modeLabel(state) {
    if (state?.mode === 'LINEUPS') {
        const source = state.lineupSource === 'ON_COURT' ? '5 em quadra' : 'Quinteto inicial';
        const display = state.lineupDisplay === 'A' ? 'Equipe A' : state.lineupDisplay === 'B' ? 'Equipe B' : state.lineupDisplay === 'BOTH' ? 'Ambos' : 'Sequência automática';
        return `${source} · ${display}`;
    }
    if (state?.mode === 'TIMEOUT')
        return 'Tempo técnico';
    return mainModes.find(item => item.mode === state?.mode)?.label || 'Saída limpa';
}
function DurationField({ label, value, min, max, onCommit }) {
    const [txt, setTxt] = useState(String(value));
    useEffect(() => { setTxt(String(value)); }, [value]);
    function commit() {
        const raw = Number(txt);
        const n = txt.trim() === '' || !Number.isFinite(raw) ? value : Math.min(max, Math.max(min, Math.round(raw)));
        setTxt(String(n));
        if (n !== value)
            onCommit(n);
    }
    return <label><span>{label}</span><div><input type="number" min={min} max={max} value={txt} onChange={(e) => setTxt(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter')
        e.currentTarget.blur(); }}/><em>s</em></div></label>;
}
export default function TransmissionPage({ organizationId: authorizedOrganizationId }) {
    const [games, setGames] = useState([]);
    const [externalGames, setExternalGames] = useState([]);
    const [externalError, setExternalError] = useState('');
    const [competitions, setCompetitions] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorFile, setSponsorFile] = useState(null);
    const [sponsorPreview, setSponsorPreview] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingChannelLogo, setUploadingChannelLogo] = useState(false);
    const [competitionColorDraft, setCompetitionColorDraft] = useState('#FF7A00');
    const [savingCompetitionColor, setSavingCompetitionColor] = useState(false);
    const [savingLayout, setSavingLayout] = useState(false);
    const [layoutSaved, setLayoutSaved] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const confirmTimerRef = useRef(undefined);
    const [layoutDraft, setLayoutDraft] = useState({ width: 550, height: 76, scoreTextScale: 100, overlayOffsetX: 0, overlayOffsetY: 0 });
    const layoutInitializedRef = useRef(false);
    const saveQueueRef = useRef(Promise.resolve());
    const state = data?.state || {};
    const organizationId = data?.organization?.id || authorizedOrganizationId || '';
    const overlayPath = organizationId ? `https://stats.liga3colinas.com.br/overlay/${organizationId}` : '';
    const overlayUrl = typeof window !== 'undefined' && overlayPath ? overlayPath : overlayPath;
    const isExternal = state.source === 'GOCHAMPS';
    const selectedGame = isExternal ? (data?.external?.game || externalGames.find((game) => game.id === state.externalGameId) || null) : games.find((game) => game.id === state.gameId) || null;
    const selectedCompetitionId = String(selectedGame?.season?.competition?.id || '');
    const selectedCompetition = competitions.find((item) => String(item?.id || '') === selectedCompetitionId) || selectedGame?.season?.competition || null;
    const selectedCompetitionName = String(selectedCompetition?.name || 'Competição');
    const selectedCompetitionLogo = String(selectedCompetition?.logoUrl || '');
    const selectedCompetitionColor = String(selectedCompetition?.primaryColor || '#FF7A00');
    const channelLogo = String(state.channelLogoUrl || data?.organization?.logoUrl || '');
    const channelName = String(data?.organization?.shortName || data?.organization?.name || 'Canal');
    const allSponsors = Array.isArray(state.sponsors) ? state.sponsors : [];
    const competitionSponsors = allSponsors.filter((item) => String(item?.competitionId || '') === selectedCompetitionId);
    const { data: nativeLive, gameClockMs: nativeClock } = useLiveGame(isExternal ? '' : String(state.gameId || ''), 2000);
    const live = isExternal ? data?.external?.live : nativeLive;
    const gameClockMs = isExternal ? Number(live?.game?.gameClockMs || 0) : nativeClock;
    useEffect(() => {
        let active = true;
        if (isExternal)
            api('/transmission/gochamps/games').then(result => { if (active) {
                setExternalGames(result.games || []);
                setExternalError('');
            } }).catch(error => { if (active)
                setExternalError(error.message); });
        const refresh = async () => { try {
            const next = await api('/transmission');
            if (active && !saving)
                setData(next);
        }
        catch (error) {
            if (active)
                setExternalError(error.message);
        } };
        const timer = window.setInterval(refresh, 2500);
        return () => { active = false; window.clearInterval(timer); };
    }, [isExternal, saving]);
    const orderedGames = useMemo(() => [...games].sort((a, b) => {
        const rank = (g) => g.status === 'LIVE' ? 0 : g.status === 'INTERVAL' ? 1 : g.status === 'SCHEDULED' ? 2 : g.status === 'FINISHED' ? 4 : 3;
        const diff = rank(a) - rank(b);
        if (diff)
            return diff;
        return new Date(b.startsAt || 0).getTime() - new Date(a.startsAt || 0).getTime();
    }), [games]);
    async function load() {
        setLoading(true);
        setError('');
        try {
            const [tx, gameList, competitionList] = await Promise.all([api('/transmission'), api('/games'), api('/competitions')]);
            setData(tx);
            setGames(Array.isArray(gameList) ? gameList : []);
            setCompetitions(Array.isArray(competitionList) ? competitionList : []);
        }
        catch (e) {
            setError(e?.message || 'Não foi possível carregar a Central de Transmissão.');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { void load(); let active = true; const timer = window.setInterval(() => { api('/games').then(rows => { if (active)
        setGames(Array.isArray(rows) ? rows : []); }).catch(() => { }); }, 30000); return () => { active = false; window.clearInterval(timer); }; }, []);
    useEffect(() => {
        if (!data?.state || layoutInitializedRef.current)
            return;
        const st = data.state;
        setLayoutDraft({
            width: Number(st.width ?? 550),
            height: Number(st.height ?? 76),
            scoreTextScale: Number(st.scoreTextScale ?? 100),
            overlayOffsetX: Number(st.overlayOffsetX ?? 0),
            overlayOffsetY: Number(st.overlayOffsetY ?? 0),
        });
        layoutInitializedRef.current = true;
    }, [data]);
    useEffect(() => { setCompetitionColorDraft(selectedCompetitionColor); }, [selectedCompetitionId, selectedCompetitionColor]);
    function save(patch) {
        const task = async () => {
            setSaving(true);
            setError('');
            try {
                const next = await api('/transmission', { method: 'PUT', body: JSON.stringify(patch) });
                setData(next);
                return next;
            }
            catch (e) {
                setError(e?.message || 'Não foi possível atualizar a saída do OBS.');
                throw e;
            }
            finally {
                setSaving(false);
            }
        };
        const queued = saveQueueRef.current.then(task, task);
        saveQueueRef.current = queued.catch(() => null);
        return queued;
    }
    async function copyLink() {
        if (!overlayUrl)
            return;
        try {
            await navigator.clipboard.writeText(overlayUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
        }
        catch { }
    }
    function localNumber(key, value) { setData((d) => ({ ...d, state: { ...d.state, [key]: value } })); }
    function clampNumber(value, min, max, fallback) {
        if (!Number.isFinite(value))
            return fallback;
        return Math.min(max, Math.max(min, Math.round(value)));
    }
    function updateLayoutDraft(key, value) {
        setLayoutSaved(false);
        setLayoutDraft(current => ({ ...current, [key]: value }));
    }
    async function saveLayout(nextDraft = layoutDraft) {
        const patch = {
            width: clampNumber(Number(nextDraft.width), 420, 1200, 550),
            height: clampNumber(Number(nextDraft.height), 60, 180, 76),
            scoreTextScale: clampNumber(Number(nextDraft.scoreTextScale), 90, 135, 100),
            overlayOffsetX: clampNumber(Number(nextDraft.overlayOffsetX), -700, 700, 0),
            overlayOffsetY: clampNumber(Number(nextDraft.overlayOffsetY), -700, 120, 0),
        };
        setLayoutDraft(patch);
        setSavingLayout(true);
        setLayoutSaved(false);
        try {
            const next = await save(patch);
            const st = next?.state || patch;
            setLayoutDraft({
                width: Number(st.width ?? patch.width),
                height: Number(st.height ?? patch.height),
                scoreTextScale: Number(st.scoreTextScale ?? patch.scoreTextScale),
                overlayOffsetX: Number(st.overlayOffsetX ?? patch.overlayOffsetX),
                overlayOffsetY: Number(st.overlayOffsetY ?? patch.overlayOffsetY),
            });
            setLayoutSaved(true);
            window.setTimeout(() => setLayoutSaved(false), 1800);
        }
        catch (e) {
            setError(e?.message || 'Não foi possível salvar o layout do overlay. Tente novamente.');
        }
        finally {
            setSavingLayout(false);
        }
    }
    function lineup(source, display) { void save({ mode: 'LINEUPS', lineupSource: source, lineupDisplay: display }); }
    async function uploadCompetitionLogo(file) {
        if (!file || !selectedCompetitionId)
            return;
        setUploadingLogo(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const updated = await api(`/competitions/${selectedCompetitionId}/logo`, { method: 'POST', body: fd });
            const logoUrl = String(updated?.logoUrl || '');
            setCompetitions(current => current.map((item) => String(item?.id || '') === selectedCompetitionId ? { ...item, logoUrl } : item));
        }
        catch (e) {
            setError(e?.message || 'Não foi possível enviar a logo da competição.');
        }
        finally {
            setUploadingLogo(false);
        }
    }
    async function uploadChannelLogo(file) {
        if (!file)
            return;
        setUploadingChannelLogo(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const response = await api('/transmission/channel-logo', { method: 'POST', body: fd });
            const logoUrl = String(response?.logoUrl || '');
            if (logoUrl)
                await save({ channelLogoUrl: logoUrl });
        }
        catch (e) {
            setError(e?.message || 'Não foi possível enviar a logo do canal.');
        }
        finally {
            setUploadingChannelLogo(false);
        }
    }
    async function saveCompetitionColor() {
        if (!selectedCompetitionId)
            return;
        const color = /^#[0-9A-Fa-f]{6}$/.test(competitionColorDraft) ? competitionColorDraft.toUpperCase() : '';
        if (!color) {
            setError('Informe uma cor válida no formato #RRGGBB.');
            return;
        }
        setSavingCompetitionColor(true);
        setError('');
        try {
            const updated = await api(`/competitions/${selectedCompetitionId}`, { method: 'PATCH', body: JSON.stringify({ primaryColor: color }) });
            setCompetitions(current => current.map((item) => String(item?.id || '') === selectedCompetitionId ? { ...item, primaryColor: String(updated?.primaryColor || color) } : item));
        }
        catch (e) {
            setError(e?.message || 'Não foi possível salvar a cor da competição.');
        }
        finally {
            setSavingCompetitionColor(false);
        }
    }
    async function uploadSponsorFile(file) {
        const fd = new FormData();
        fd.append('file', file);
        const response = await api('/transmission/sponsor-logo', { method: 'POST', body: fd });
        return String(response?.logoUrl || '');
    }
    async function addSponsor() {
        const name = sponsorName.trim();
        if (!selectedCompetitionId) {
            setError('Selecione uma partida para identificar a competição.');
            return;
        }
        if (!name && !sponsorFile) {
            setError('Informe o nome ou selecione a logo do patrocinador.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const logoUrl = sponsorFile ? await uploadSponsorFile(sponsorFile) : '';
            const next = [...allSponsors, { id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, competitionId: selectedCompetitionId, name, logoUrl, active: true }];
            const result = await api('/transmission', { method: 'PUT', body: JSON.stringify({ sponsors: next }) });
            setData(result);
            setSponsorName('');
            setSponsorFile(null);
            if (sponsorPreview)
                URL.revokeObjectURL(sponsorPreview);
            setSponsorPreview('');
        }
        catch (e) {
            setError(e?.message || 'Não foi possível cadastrar o patrocinador.');
        }
        finally {
            setSaving(false);
        }
    }
    async function toggleSponsor(id, active) {
        await save({ sponsors: allSponsors.map((item) => String(item?.id) === id ? { ...item, active } : item) });
    }
    async function removeSponsor(id) {
        await save({ sponsors: allSponsors.filter((item) => String(item?.id) !== id) });
    }
    const teamA = live?.teamA || selectedGame?.teamA;
    const teamB = live?.teamB || selectedGame?.teamB;
    const scoreA = Number(live?.game?.scoreA ?? selectedGame?.scoreA ?? 0);
    const scoreB = Number(live?.game?.scoreB ?? selectedGame?.scoreB ?? 0);
    const currentPeriod = Number(live?.game?.currentPeriod || selectedGame?.currentPeriod || 1);
    const liveStatus = String(live?.game?.status || selectedGame?.status || 'SCHEDULED');
    function tapClear() {
        if (confirmClear) {
            window.clearTimeout(confirmTimerRef.current);
            setConfirmClear(false);
            void save({ mode: 'HIDDEN' });
            return;
        }
        setConfirmClear(true);
        window.clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = window.setTimeout(() => setConfirmClear(false), 4000);
    }
    const hasGame = isExternal ? !!state.externalGameId : !!state.gameId;
    const isScore = state.mode === 'SCOREBOX' || !state.mode;
    const isHidden = state.mode === 'HIDDEN';
    const airTone = !hasGame ? 'idle' : isHidden ? 'bad' : isScore ? 'ok' : 'warn';
    const airLabel = !hasGame ? 'Selecione um jogo' : isHidden ? 'Tela limpa' : isScore ? 'Placar ao vivo' : modeLabel(state);
    const airHint = !hasGame ? 'Escolha a partida para liberar os controles.' : isHidden ? 'A saída está transparente: nada aparece na transmissão.' : isScore ? 'Placar normal no ar. Ações e faltas aparecem sozinhas.' : 'Tela especial no ar. Use “Voltar ao placar” para encerrar.';
    const screenModes = mainModes.filter(item => item.mode !== 'HIDDEN' && (!isExternal || item.mode !== 'LAST_ACTION'));
    const lineupBlocks = [
        { title: '5 em quadra agora', sub: 'Lê os cinco marcados na Mesa', source: 'ON_COURT' },
        { title: 'Quinteto inicial', sub: 'Os cinco definidos no pré-jogo', source: 'STARTERS' },
    ];
    const lineupButtons = [
        { label: teamName(teamA), display: 'A' }, { label: teamName(teamB), display: 'B' }, { label: 'Ambos', display: 'BOTH' }, { label: 'A → B', display: 'SEQUENCE' },
    ];
    function switchRow(key, title, desc, checked) {
        return <label className="tx10-switch" key={key}><span><b>{title}</b><small>{desc}</small></span><input type="checkbox" checked={checked} onChange={(e) => save({ [key]: e.target.checked })}/><i aria-hidden="true"/></label>;
    }
    return <div className="transmission-operator-app">
    <div className="tx3-page">
      <header className="tx3-titlebar">
        <div><span>OPERAÇÃO AO VIVO</span><h1>Central de Transmissão</h1><p>Escolha o jogo uma única vez. O mesmo link do OBS recebe placar, ações, quintetos, pré-jogo, intervalo e telas especiais.</p></div>
        <div className="tx3-live-pill">{state.mode && state.mode !== 'HIDDEN' ? '● SAÍDA ATIVA' : 'SAÍDA LIMPA'}</div>
      </header>

      {error && <div className="error">{error}</div>}
      {loading ? <section className="section">Carregando Central de Transmissão...</section> : <>
        <section className="tx10-top">
          <label className="tx10-game"><span>ORIGEM DOS DADOS</span><select value={isExternal ? 'GOCHAMPS' : 'L3C'} disabled={saving} onChange={e => void save({ source: e.target.value, gameId: null, externalGameId: null, mode: 'HIDDEN' })}><option value="L3C">L3C Stats · Mesa oficial</option><option value="GOCHAMPS">GoChamps · Master 2026</option></select></label>
          {isExternal && <label className="tx10-game"><span>JOGO DO MASTER NO GOCHAMPS</span><select value={state.externalGameId || ''} disabled={saving} onChange={e => void save({ source: 'GOCHAMPS', gameId: null, externalGameId: e.target.value || null })}><option value="">Selecione o jogo...</option>{externalGames.map(game => <option key={game.id} value={game.id}>{gameLabel(game)}</option>)}</select></label>}
          {(externalError || data?.externalError) && isExternal && <p role="alert">{externalError || data.externalError}</p>}
          {isExternal && <p>Placar e estatísticas lidos do GoChamps. Relógio, período e quintetos dependem dos dados publicados pela origem. O resultado oficial no Stats permanece separado.</p>}
          {!isExternal && <label className="tx10-game"><span>PARTIDA DA TRANSMISSÃO</span><select value={state.gameId || ''} onChange={(e) => save({ source: 'L3C', externalGameId: null, gameId: e.target.value || null })} disabled={saving}><option value="">Selecione um jogo...</option>{orderedGames.map((game) => <option key={game.id} value={game.id}>{gameLabel(game)}</option>)}</select></label>}
          <div className={`tx10-score ${liveStatus === 'LIVE' ? 'live' : ''}`}>{selectedGame ? <><b>{teamName(teamA)} {scoreA} × {scoreB} {teamName(teamB)}</b><span>{liveStatus === 'LIVE' ? `● AO VIVO${!isExternal || live?.game?.periodAvailable ? ' · ' + livePeriodLabel(currentPeriod) : ''}${!isExternal || live?.game?.clockAvailable ? ' · ' + formatLiveClock(gameClockMs) : ''}` : liveStatus === 'INTERVAL' ? 'INTERVALO' : liveStatus === 'FINISHED' ? 'FINAL' : 'AGENDADO'}</span></> : <span>Selecione uma partida para habilitar a transmissão.</span>}</div>
        </section>

        <section className={`tx10-air tone-${airTone}`} aria-live="polite">
          <div className="tx10-air-state"><i aria-hidden="true"/><div><span>NO AR AGORA</span><strong>{airLabel}</strong></div></div>
          <p>{airHint}</p>
          <button type="button" className="tx10-back" disabled={saving || !hasGame || isScore} onClick={() => save({ mode: 'SCOREBOX' })}>↩ VOLTAR AO PLACAR</button>
          <button type="button" className={`tx10-clear ${confirmClear ? 'confirm' : ''}`} disabled={saving || isHidden} onClick={tapClear}>{isHidden ? 'TELA LIMPA ATIVA' : confirmClear ? 'TOQUE DE NOVO PARA CONFIRMAR' : 'TELA LIMPA'}</button>
        </section>

        <section className="tx10-grid">
          <div className="tx10-main">
            <div className="tx10-block"><h2>TELAS</h2><div className="tx10-screens">{screenModes.map(item => { const on = hasGame && state.mode === item.mode; return <button type="button" key={item.mode} disabled={saving || !hasGame || (isExternal && ['STATS', 'HIGHLIGHTS'].includes(item.mode) && !(data?.external?.detail?.teamA?.available && data?.external?.detail?.teamB?.available))} className={on ? 'on' : ''} onClick={() => save({ mode: item.mode })}>{on ? <em>NO AR</em> : null}<b>{item.label}</b><span>{item.description}</span></button>; })}</div></div>

            <div className="tx10-block"><h2>PEDIDO DE TEMPO</h2><div className="tx10-two">{[teamA, teamB].map((team, index) => { const on = hasGame && state.mode === 'TIMEOUT' && String(state.timeoutTeamId || '') === String(team?.id || ''); return <button type="button" key={index} disabled={saving || !hasGame} className={on ? 'on' : ''} onClick={() => save({ mode: 'TIMEOUT', timeoutTeamId: team?.id || null })}><span className="tx10-abbr">{teamLogo(team) ? <img src={teamLogo(team)} alt=""/> : teamName(team).slice(0, 3).toUpperCase()}</span><span><b>Tempo · {teamName(team)}</b><small>Mostra “pedido de tempo” no lugar do placar</small></span></button>; })}</div></div>

            <div className="tx10-block"><h2>QUINTETOS</h2><div className="tx10-two">{lineupBlocks.filter(block => !isExternal || block.source !== 'ON_COURT').map(block => <div className="tx10-lineup" key={block.source}><header><b>{block.title}</b><span>{block.sub}</span></header><div>{lineupButtons.map(item => { const on = hasGame && state.mode === 'LINEUPS' && state.lineupSource === block.source && state.lineupDisplay === item.display; return <button type="button" key={item.display} disabled={saving || !hasGame} className={on ? 'on' : ''} onClick={() => lineup(block.source, item.display)}>{item.label}</button>; })}</div></div>)}</div></div>

            <p className="tx10-note">Sem preview nesta tela: o que está no ar aparece na faixa de cima, e você confere o resultado no retorno da transmissão ou no link do placar.</p>
          </div>

          <aside className="tx10-side">
            <section className="tx10-card"><h2>LINK FIXO DO OBS</h2><code>{overlayUrl || 'Organização não selecionada'}</code><div className="tx10-linkbtns"><button type="button" onClick={copyLink} disabled={!overlayUrl}>{copied ? 'COPIADO!' : 'COPIAR LINK'}</button>{overlayPath && <a href={overlayPath} target="_blank" rel="noreferrer">ABRIR ↗</a>}</div><small>Não muda entre jogos.</small></section>
            <section className="tx10-card"><h2>AJUSTES RÁPIDOS</h2>
              {switchRow('showTeamFouls', 'Exibir faltas', 'Faltas coletivas no placar', state.showTeamFouls !== false)}
              {switchRow('showActionBand', 'Ações automáticas', 'Ações da Mesa acima do placar', state.showActionBand !== false)}
              {switchRow('showPossession', 'Exibir posse', 'Desligado por padrão', state.showPossession === true)}
              {switchRow('showShotClock', 'Relógio de 24s', 'Desligado por padrão', state.showShotClock === true)}
              {switchRow('showL3CStatsLogo', 'Logo L3C Stats', 'Alterna com a logo do canal', (state.showL3CStatsLogo ?? state.showFePlayLogo) !== false)}
            </section>
            <section className="tx10-card"><h2>AUTOMAÇÕES</h2>
              {switchRow('autoTimeoutFromMesa', 'Pedido de tempo da Mesa', 'Quando a Mesa registra, o overlay assume a tela', state.autoTimeoutFromMesa !== false)}
              {switchRow('autoReturnAfterTimeout', 'Voltar ao placar após o tempo', 'Ao terminar o tempo configurado', state.autoReturnAfterTimeout !== false)}
              {switchRow('autoReturnAfterLineup', 'Voltar ao placar após o quinteto', 'Ao fim da exibição do quinteto', state.autoReturnAfterLineup !== false)}
            </section>
          </aside>
        </section>

        <details className="tx3-card tx3-settings tx10-advanced" open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}><summary><span>⚙ Configurações avançadas</span><small>layout · logos · patrocinadores</small></summary>
          <div className="tx3-section-head"><div><span>CONFIGURAÇÕES DA TRANSMISSÃO</span><h2>Scorebox, ações e automações</h2></div><small>Ajustes persistentes da organização.</small></div>
          <div className="tx3-settings-grid">
            <label><span>LARGURA DO PLACAR</span><div><input type="number" min="420" max="1200" value={layoutDraft.width} onChange={(e) => updateLayoutDraft('width', Number(e.target.value))}/><em>px</em></div></label>
            <label><span>ALTURA DO PLACAR</span><div><input type="number" min="60" max="180" value={layoutDraft.height} onChange={(e) => updateLayoutDraft('height', Number(e.target.value))}/><em>px</em></div></label>
            <label className="tx8-position-setting"><span>TAMANHO DO TEXTO DO PLACAR</span><div className="tx8-position-control"><input type="range" min="90" max="135" step="5" value={layoutDraft.scoreTextScale} onChange={(e) => updateLayoutDraft('scoreTextScale', Number(e.target.value))}/><input type="number" min="90" max="135" step="5" value={layoutDraft.scoreTextScale} onChange={(e) => updateLayoutDraft('scoreTextScale', Number(e.target.value))}/><em>%</em></div><small>100% = tamanho atual · até 135% para ampliar nomes, placar, período e relógio</small></label>
            <label className="tx8-position-setting"><span>POSIÇÃO HORIZONTAL</span><div className="tx8-position-control"><input type="range" min="-700" max="700" step="5" value={layoutDraft.overlayOffsetX} onChange={(e) => updateLayoutDraft('overlayOffsetX', Number(e.target.value))}/><input type="number" min="-700" max="700" value={layoutDraft.overlayOffsetX} onChange={(e) => updateLayoutDraft('overlayOffsetX', Number(e.target.value))}/></div><small>− esquerda · + direita</small></label>
            <label className="tx8-position-setting"><span>POSIÇÃO VERTICAL</span><div className="tx8-position-control"><input type="range" min="-700" max="120" step="5" value={layoutDraft.overlayOffsetY} onChange={(e) => updateLayoutDraft('overlayOffsetY', Number(e.target.value))}/><input type="number" min="-700" max="120" value={layoutDraft.overlayOffsetY} onChange={(e) => updateLayoutDraft('overlayOffsetY', Number(e.target.value))}/></div><small>− sobe · + desce</small></label>
            <DurationField label="DURAÇÃO DAS AÇÕES" value={Number(state.actionDurationSec || 7)} min={2} max={15} onCommit={(n) => void save({ actionDurationSec: n })}/>
            <DurationField label="DURAÇÃO DO PEDIDO NA TELA" value={Number(state.timeoutDurationSec || 60)} min={10} max={120} onCommit={(n) => void save({ timeoutDurationSec: n })}/>
            <DurationField label="QUINTETO / 5 EM QUADRA" value={Number(state.lineupDurationSec || 6)} min={3} max={30} onCommit={(n) => void save({ lineupDurationSec: n })}/>
            <DurationField label="ROTAÇÃO DE PATROCINADOR" value={Number(state.sponsorRotationSec || 60)} min={30} max={300} onCommit={(n) => void save({ sponsorRotationSec: n })}/>
            <label><span>COR PRINCIPAL</span><select value={state.theme === 'FE_PLAY' ? 'L3C_STATS' : (state.theme || 'L3C_STATS')} onChange={(e) => save({ theme: e.target.value })}><option value="L3C_STATS">Laranja L3C Stats</option><option value="COMPETITION">Cor da competição</option></select></label>
            <label className="tx7-competition-color"><span>COR DA COMPETIÇÃO</span><div className="tx7-color-control"><input type="color" value={competitionColorDraft} disabled={!selectedCompetitionId} onChange={e => setCompetitionColorDraft(e.target.value.toUpperCase())}/><input value={competitionColorDraft} disabled={!selectedCompetitionId} maxLength={7} onChange={e => setCompetitionColorDraft(e.target.value.toUpperCase())}/><button type="button" disabled={!selectedCompetitionId || savingCompetitionColor} onClick={() => void saveCompetitionColor()}>{savingCompetitionColor ? 'SALVANDO...' : 'SALVAR'}</button></div></label>
          </div>
          <div className="tx8-position-actions tx9-layout-actions"><button type="button" className="tx9-save-layout" disabled={savingLayout} onClick={() => void saveLayout()}>{savingLayout ? 'SALVANDO...' : layoutSaved ? '✓ AJUSTES SALVOS' : 'SALVAR LAYOUT'}</button><button type="button" disabled={savingLayout || ((Number(layoutDraft.overlayOffsetX) === 0) && (Number(layoutDraft.overlayOffsetY) === 0))} onClick={() => { const reset = { ...layoutDraft, overlayOffsetX: 0, overlayOffsetY: 0 }; setLayoutDraft(reset); void saveLayout(reset); }}>RESTAURAR POSIÇÃO PADRÃO</button><small>Tamanho, texto e posição são gravados juntos para não voltar aos valores anteriores.</small></div>
          <div className="tx4-sponsor-admin tx6-brand-admin">
            <div className="tx3-section-head"><div><span>LOGOS DO OVERLAY</span><h2>Canal, competição e patrocinadores</h2></div><small>{selectedCompetitionId ? `${selectedCompetitionName} · ${competitionSponsors.length} patrocinador(es)` : 'Selecione uma partida'}</small></div>
            <p>A marca principal usa a logo da organização/canal. Com “Exibir logo L3C Stats” ligado, o overlay alterna canal e L3C Stats; desligado, exibe somente o canal. A logo da competição permanece na identificação do campeonato.</p>

            <div className="tx6-competition-upload tx11-channel-preview">
              <div className="tx6-logo-preview">{channelLogo ? <img src={channelLogo} alt={`Logo ${channelName}`}/> : <span>SEM LOGO</span>}</div>
              <div><strong>LOGO DO CANAL</strong><small>{state.channelLogoUrl ? 'Logo exclusiva da transmissão.' : channelLogo ? 'Usando a logo da organização como padrão.' : 'Envie a logo do canal para substituir a marca padrão.'} JPG, PNG ou WEBP · até 5 MB.</small><label className="tx6-upload-button">{uploadingChannelLogo ? 'ENVIANDO...' : 'SELECIONAR LOGO'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingChannelLogo} onChange={e => { const file = e.target.files?.[0] || null; void uploadChannelLogo(file); e.currentTarget.value = ''; }}/></label></div>
            </div>

            <div className="tx6-competition-upload">
              <div className="tx6-logo-preview">{selectedCompetitionLogo ? <img src={selectedCompetitionLogo} alt="Logo da competição"/> : <span>SEM LOGO</span>}</div>
              <div><strong>LOGO DA COMPETIÇÃO</strong><small>Identifica o campeonato nos overlays. JPG, PNG ou WEBP · até 5 MB.</small><label className="tx6-upload-button">{uploadingLogo ? 'ENVIANDO...' : 'SELECIONAR LOGO'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingLogo || !selectedCompetitionId} onChange={e => { const file = e.target.files?.[0] || null; void uploadCompetitionLogo(file); e.currentTarget.value = ''; }}/></label></div>
            </div>

            <div className="tx6-sponsor-heading"><strong>PATROCINADOR DO PLACAR</strong><small>Envie a arte diretamente. Ela preencherá todo o quadro do placar.</small></div>
            <div className="tx4-sponsor-form tx6-sponsor-form">
              <input value={sponsorName} onChange={e => setSponsorName(e.target.value)} placeholder="Nome do patrocinador"/>
              <label className="tx6-sponsor-file"><span>{sponsorPreview ? <img src={sponsorPreview} alt="Prévia do patrocinador"/> : 'SELECIONAR LOGO'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0] || null; if (sponsorPreview)
            URL.revokeObjectURL(sponsorPreview); setSponsorFile(file); setSponsorPreview(file ? URL.createObjectURL(file) : ''); }}/></label>
              <button type="button" disabled={saving || !selectedCompetitionId} onClick={() => void addSponsor()}>{saving ? 'ENVIANDO...' : '+ ADICIONAR'}</button>
            </div>
            <div className="tx4-sponsor-list">
              {competitionSponsors.length ? competitionSponsors.map((item) => <div key={item.id} className={item.active === false ? 'disabled' : ''}>
                <span>{item.logoUrl ? <img src={item.logoUrl} alt=""/> : <b>LOGO</b>}</span>
                <strong>{item.name || 'Patrocinador'}</strong>
                <button type="button" onClick={() => void toggleSponsor(String(item.id), item.active === false)}>{item.active === false ? 'ATIVAR' : 'PAUSAR'}</button>
                <button type="button" className="danger" onClick={() => void removeSponsor(String(item.id))}>REMOVER</button>
              </div>) : <small className="tx4-sponsor-empty">Nenhum patrocinador cadastrado para esta competição.</small>}
            </div>
          </div>
        </details>
      </>}
    </div>
  </div>;
}
