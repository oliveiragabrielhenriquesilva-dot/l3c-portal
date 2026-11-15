'use client';
import {jogosLabel} from '../lib/format';

import {useMemo,useState} from 'react';
import Link from 'next/link';

const LABELS={ouro:'Série Ouro',prata:'Série Prata',bronze:'Série Bronze'};
const METRICS=[
  ['points','PTS','Pontos'],
  ['rebounds','REB','Rebotes'],
  ['assists','AST','Assistências'],
  ['steals','STL','Roubos'],
  ['blocks','BLK','Tocos'],
];

function slugify(value=''){
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function finished(g){return String(g?.status||'').toUpperCase()==='FINISHED'}
function teamResult(g,name){
  const target=slugify(name),a=slugify(g?.teamA?.name),b=slugify(g?.teamB?.name);
  if(target!==a&&target!==b)return null;
  const own=target===a?Number(g.scoreA):Number(g.scoreB),opp=target===a?Number(g.scoreB):Number(g.scoreA);
  if(own>opp)return 'W'; if(own<opp)return 'L'; return 'D';
}

export default function HomeCompetitionHub({standings,leaders,teamLogos,games=[]}){
  const [serie,setSerie]=useState('ouro');
  const rows=(standings?.[serie]||[]).slice(0,5);
  const forms=useMemo(()=>{
    const out={};
    for(const group of Object.values(standings||{}))for(const row of group||[]){
      out[row.name]=[...games].filter(finished).sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).map(g=>teamResult(g,row.name)).filter(Boolean).slice(0,5);
    }
    return out;
  },[games,standings]);
  return <section className="home-competition-hub home-v0513-hub">
    <div className="home-standings-block">
      <div className="home-v0513-head"><h2>Classificação</h2><Link href="/classificacao/">Ver classificação completa →</Link></div>
      <div className="classification-tabs" role="tablist" aria-label="Séries">
        {Object.keys(LABELS).map(key=><button key={key} type="button" className={serie===key?'active':''} onClick={()=>setSerie(key)}>{LABELS[key]}</button>)}
      </div>
      <div className="table-scroll home-standings-table-wrap">
        <table className="home-standings-table home-v0513-table">
          <thead><tr><th>#</th><th>Equipe</th><th>PTS</th><th>J</th><th>V</th><th>D</th><th>Saldo</th><th>Últimos 5</th></tr></thead>
          <tbody>{rows.map((row,index)=>{const losses=Math.max(0,Number(row.j||0)-Number(row.v||0));return <tr key={row.name}>
            <td>{index+1}</td>
            <td><Link className="home-table-team" href={`/team/${slugify(row.name)}/`}>{teamLogos?.[row.name]&&<img src={teamLogos[row.name]} alt=""/>}<span>{row.name}</span></Link></td>
            <td>{row.pts}</td><td>{row.j}</td><td>{row.v}</td><td>{losses}</td><td className={Number(row.saldo)>=0?'positive':'negative'}>{Number(row.saldo)>0?'+':''}{row.saldo}</td>
            <td><div className="home-v0513-form">{(forms[row.name]||[]).map((r,i)=><i key={`${r}-${i}`} className={r==='W'?'win':r==='L'?'loss':'draw'} title={r==='W'?'Vitória':r==='L'?'Derrota':'Empate'}>{r==='W'?'V':r==='L'?'D':'E'}</i>)}</div></td>
          </tr>})}</tbody>
        </table>
      </div>
    </div>

    <div className="home-leaders-block">
      <div className="home-v0513-head"><h2>Líderes da temporada</h2><Link href="/lideres/">Ver todos os líderes →</Link></div>
      <div className="home-leaders-five home-v0513-leaders">
        {METRICS.map(([key,abbr,label])=>{
          const item=leaders?.[key];
          if(!item)return <div className="home-leader-card empty-card" key={key}><small>{abbr}</small><strong>{label}</strong><span>Sem dados</span></div>;
          return <Link className="home-leader-card" href={`/player/${slugify(item.player?.name)}/`} key={key}>
            <div className="home-leader-card-top"><span>{abbr}</span><b>{label}</b><em>Ver ranking →</em></div>
            <div className="home-leader-person">
              {item.player?.photoUrl?<img src={item.player.photoUrl} alt=""/>:<div className="home-leader-placeholder">{item.player?.name?.[0]||'?'}</div>}
              <div><strong>{item.player?.name}</strong><small>{item.teams?.[0]?.name||item.teamName||''} · {jogosLabel(item.games)}</small><div><b>{Number(item.value||0).toFixed(1).replace('.',',')}</b><span>{abbr}/JOGO</span></div></div>
            </div>
          </Link>
        })}
      </div>
    </div>
  </section>
}
