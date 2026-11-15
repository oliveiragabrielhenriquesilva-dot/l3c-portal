// Ranking oficial de qualquer competição/temporada do L3C Stats (modelo único).
// Os dados vêm da API pública (/v1/public/seasons/:id/ranking): fórmula, presença mínima e divisões são definidas lá.
import Link from 'next/link';
import {Sponsors} from './SiteChrome';
import {PortalHeader,SeasonMenu,PortalShell} from './PortalParts';
import {apiFetch} from '../lib/site';
import {prettyName} from '../lib/format';
import {pickSeason,brandOf,sectionPath,rankingAvailable} from '../lib/scopes';
import {RANKING_MIN_YEAR} from '../lib/site-config';

const fmt=v=>Number(v||0).toFixed(1).replace('.',',');
const initials=name=>String(name||'?').split(' ').filter(Boolean).filter(w=>w.length>2||w===w.toUpperCase()).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';

function Tabs({scope,season}){
  return <div className="ld-tabs" role="tablist" aria-label="Seção">
    <Link href={`${sectionPath(scope,'lideres')}?temporada=${season.key}`}>Líderes</Link>
    <Link href={`${sectionPath(scope,'lideres')}?aba=recordes`}>Recordes</Link>
    {rankingAvailable(season)&&<Link className="active" href={`${sectionPath(scope,'ranking')}?temporada=${season.key}`}>Ranking oficial</Link>}
  </div>;
}

export default async function RankingView({scope,sp={}}){
  const base=sectionPath(scope,'ranking');
  const season=pickSeason(scope,sp.temporada);
  const brand=brandOf(scope,season);
  const archive=!rankingAvailable(season);
  const payload=archive?null:await apiFetch(`/v1/public/seasons/${encodeURIComponent(season.id)}/ranking`,{ttl:20000});
  const groups=(payload?.divisions||[]).filter(d=>d.official);
  const wanted=String(sp.divisao||'');
  const current=groups.find(g=>g.key===wanted)||groups.find(g=>g.athletes?.length)||groups[0]||null;
  const threshold=Number(payload?.awardPresenceThreshold||70);
  const rows=(current?.athletes||[]);
  return <PortalShell scope={scope}><Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={`Ranking oficial · ${season.label}`} subtitle={`Pontuação = ${payload?.formula?.expression||'(PTS × 1,2) + (AST × 1,2) + (REB × 1,2) + (STL × 1,5) + (BLK × 1,5) − (TO × 2,0)'} · presença mínima de ${threshold}% para premiação`}/>
      <SeasonMenu scope={scope} season={season} section="ranking"><Tabs scope={scope} season={season}/></SeasonMenu>
      {!archive&&!payload&&<div className="source-warning">O ranking desta temporada está temporariamente indisponível. Tente novamente em instantes.</div>}
      {archive&&<p className="ld-note">O ranking oficial vale a partir da temporada {RANKING_MIN_YEAR}. Para {season.label}, veja os <Link href={`${sectionPath(scope,'lideres')}?temporada=${season.key}`}>Líderes e Recordes</Link>.</p>}
      {groups.length>1&&<div className="ld-seasons" role="tablist" aria-label="Divisão">
        <span className="ld-label">DIVISÃO</span>
        {groups.map(g=><Link key={g.key} className={current?.key===g.key?'active':''} href={`${base}?temporada=${season.key}&divisao=${encodeURIComponent(g.key)}`}>{g.label}</Link>)}
      </div>}
      {current&&<section className="ld-section">
        <div className="ld-sechead"><h2>{groups.length>1?current.label:'Classificação geral de atletas'}</h2><span>{current.validGames} jogo(s) válido(s)</span></div>
        {rows.length?<div className="rk-wrap"><table className="rk-table">
          <thead><tr><th>#</th><th>Atleta</th><th>Equipe</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>TO</th><th>Presença</th><th>Pontuação</th></tr></thead>
          <tbody>{rows.map(r=>{const ok=r.awardEligible===true;return <tr key={r.player?.id||r.position} className={ok?'':'rk-off'}>
            <td><b>{r.position}º</b></td>
            <td><span className="rk-player">{r.player?.photoUrl?<img className="ld-avatar sm" src={r.player.photoUrl} alt="" loading="lazy"/>:<span className="ld-avatar sm ph" aria-hidden="true">{initials(r.player?.name)}</span>}<b>{prettyName(r.player?.name)}</b></span></td>
            <td>{(r.teams||[]).map(t=>t?.name||t?.displayName||'').filter(Boolean).join(' / ')||'—'}</td>
            <td>{r.totals?.points??0}</td><td>{r.totals?.rebounds??0}</td><td>{r.totals?.assists??0}</td><td>{r.totals?.steals??0}</td><td>{r.totals?.blocks??0}</td><td>{r.totals?.turnovers??0}</td>
            <td><span className={`rk-badge ${ok?'ok':r.awardEligible===null?'wait':'no'}`}>{r.presence70?`${r.presence70.present}/${r.presence70.denominator} · ${String(Number(r.presence70.percent||0).toFixed(0))}%`:'—'}</span></td>
            <td><strong>{fmt(r.score)}</strong></td>
          </tr>})}</tbody>
        </table></div>:<p className="ld-note">O ranking aparece aqui assim que as primeiras súmulas forem finalizadas.</p>}
        {(payload?.warnings||[]).filter(w=>!/Regulamento 2027/.test(w)).map(w=><p className="ld-note" key={w}>{w}</p>)}
        <p className="ld-note">Atletas com presença abaixo de {threshold}% aparecem esmaecidos e não concorrem à premiação. Categorias e critérios de desempate seguem o comunicado oficial da competição.</p>
      </section>}
      {!archive&&payload&&!current&&<p className="ld-note">Esta temporada ainda não tem ranking oficial.</p>}
    </div>
  </PortalShell>;
}
