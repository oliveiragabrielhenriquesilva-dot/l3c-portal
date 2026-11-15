'use client';
import {useState} from 'react';

const categoryOf=(item)=>{
  const values=[item?.season?.competition?.name,item?.division?.name,item?.season?.name,item?.season?.category?.name].filter(Boolean).join(' ').toLowerCase();
  if(/master|avab|veteran/.test(values))return 'Master';
  if(/base|sub[ -]?\d|infantil|juvenil|cadete|mirim/.test(values))return 'Base';
  if(/adult|livre|forjax|3 colinas/.test(values))return 'Adulto Livre';
  return 'Outra categoria';
};
const statusLabel=(v)=>({ACTIVE:'Ativo',PENDING:'Pendente',INACTIVE:'Inativo',SUSPENDED:'Suspenso',ELIGIBLE:'Elegível',INELIGIBLE:'Não elegível',REGULAR:'Regular'}[v]||'A verificar');
const readableId=(id)=>id?.startsWith('legacy_player_wp_')?`L3C · Atleta ${id.slice('legacy_player_wp_'.length)}`:(id||'Não informado');
const yearOf=(p)=>Number(p?.season?.year)||0;
const isRecorded=(p)=>p.status==='ACTIVE'&&!p.endedAt;
const currentYear=()=>new Date().getFullYear();
const statusInfo=p=>{const y=yearOf(p);if(y<currentYear())return {label:'Temporada encerrada',type:'historic'};if(y>currentYear())return {label:'Temporada futura',type:'future'};if(p.eligibilityStatus==='INELIGIBLE')return {label:'Não elegível',type:'bad'};if(p.eligibilityStatus==='ELIGIBLE'&&isRecorded(p))return {label:'Elegível',type:'good'};return {label:'Situação a verificar',type:'neutral'};};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

export default function Carteirinhas({person,participations,playerId}){
  const all=(participations||[]).map(p=>({...p,category:categoryOf(p)}));
  const mostRecent={};
  all.filter(isRecorded).forEach(p=>{mostRecent[p.category]=Math.max(mostRecent[p.category]||0,yearOf(p))});
  const options=all.filter(p=>isRecorded(p)&&yearOf(p)===mostRecent[p.category]&&yearOf(p)>=currentYear());
  const history=all.filter(p=>!options.includes(p));
  const [active,setActive]=useState(0);
  const [walletHelp,setWalletHelp]=useState(false);
  const [saveError,setSaveError]=useState('');
  const selected=options[Math.min(active,Math.max(0,options.length-1))];
  const name=person?.fullName||person?.displayName||'Atleta';
  const yearNow=new Date().getFullYear();
  const selectedYear=yearOf(selected);
  const timeLabel=`Temporada ${selectedYear||'não informada'}`;
  const info=selected?statusInfo(selected):null;
  const saveImage=()=>{if(!selected)return;try{setSaveError('');const w=960,h=600;const team=selected.team?.name||'Equipe não informada';const cat=selected.category;const id=readableId(playerId);const xml=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="960" height="600" rx="24" fill="#082036"/><rect width="960" height="75" rx="24" fill="#f26d28"/><rect y="56" width="960" height="19" fill="#f26d28"/><g font-family="Arial,sans-serif" fill="white"><text x="40" y="47" font-size="27" font-weight="bold">LIGA 3 COLINAS</text><text x="920" y="47" text-anchor="end" font-size="26" font-weight="bold">${esc(cat)}</text><text x="40" y="140" font-size="22">IDENTIFICAÇÃO ESPORTIVA</text><text x="915" y="146" text-anchor="end" font-size="40" font-weight="bold">${esc(selectedYear)}</text><text x="40" y="225" font-size="34" font-weight="bold">${esc(name.slice(0,43))}</text><text x="40" y="294" font-size="27">${esc(team.slice(0,50))} · Camisa ${esc(selected.number??'—')}</text><text x="40" y="375" font-size="23">${esc(id)}</text><text x="40" y="433" font-size="25">${esc(timeLabel)} · ${esc(info.label)}</text><text x="40" y="553" font-size="18" fill="#bdd0df">Cópia pessoal · Não substitui a verificação oficial da Liga</text></g></svg>`;const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`L3C-carteirinha-${cat.replace(/[^a-z0-9]/gi,'-')}-${selectedYear}.svg`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setSaveError('Não foi possível salvar a imagem neste dispositivo. Utilize a opção PDF.')}};
  return <section id="carteirinha" className="athlete-wallet-area" aria-labelledby="wallet-title">
    <div className="athlete-wallet-heading"><div><span className="athlete-wallet-kicker">Identificação esportiva</span><h2 id="wallet-title">Minhas carteirinhas</h2><p>Uma identificação por categoria e temporada. Vínculos antigos ficam no histórico.</p></div><span className="athlete-wallet-count">{options.length} {options.length===1?'carteirinha da temporada':'carteirinhas da temporada'}</span></div>
    {!options.length?<div className="athlete-wallet-empty">Não há carteirinhas para a temporada atual ou futura. Seus vínculos anteriores continuam no histórico abaixo.</div>:<>
      <div className="athlete-wallet-tabs" role="tablist" aria-label="Selecionar identificação por categoria">
        {options.map((o,i)=><button key={o.rosterId||`${o.category}-${yearOf(o)}-${i}`} id={`wallet-tab-${i}`} type="button" role="tab" aria-selected={i===Math.min(active,options.length-1)} aria-controls="wallet-panel" onClick={()=>setActive(i)} className={i===active?'selected':''}><span>{o.category}</span><small>{o.team?.name||'Equipe não identificada'} · {o.season?.year||'Temporada'}</small></button>)}
      </div>
      <div className="athlete-wallet-mobile-actions"><button type="button" onClick={()=>window.print()}>Imprimir ou salvar PDF</button><button type="button" onClick={saveImage}>Salvar no celular</button><button type="button" className="secondary" onClick={()=>setWalletHelp(v=>!v)} aria-expanded={walletHelp}>Adicionar à Carteira</button></div>{saveError&&<p role="alert" className="athlete-wallet-disclaimer">{saveError}</p>}{walletHelp&&<div className="athlete-wallet-help" role="status"><strong>Apple Wallet e Google Wallet</strong><p>A integração oficial ainda não está disponível. Essas carteiras exigem emissão e assinatura de um passe pela Liga. Enquanto isso, use “Salvar no celular” ou “Salvar PDF” para guardar uma cópia pessoal, sem validade de credencial digital autenticada.</p><button type="button" onClick={()=>setWalletHelp(false)}>Entendi</button></div>}
      <div className="athlete-wallet-card" role="tabpanel" id="wallet-panel" aria-labelledby={`wallet-tab-${Math.min(active,options.length-1)}`}>
        <div className="athlete-wallet-banner"><span>{selected.season?.competition?.name||"LIGA 3 COLINAS"}</span><strong>{selected.category.toUpperCase()}</strong></div>
        <div className="athlete-wallet-brand"><span>IDENTIFICAÇÃO DO ATLETA</span><b>{selected.season?.year||'—'}</b></div>
        <div className="athlete-wallet-person"><div className="athlete-wallet-photo">{person?.photoUrl?<img src={person.photoUrl} alt={`Foto de ${name}`}/>:<span>SEM FOTO</span>}</div><div className="athlete-wallet-person-data"><small>ATLETA</small><h3>{name}</h3><div className="athlete-wallet-team">{selected.team?.logoUrl?<img src={selected.team.logoUrl} alt={`Escudo da equipe ${selected.team?.name||''}`}/>:null}<p>{selected.team?.name||'Equipe não identificada'}</p></div><div className="athlete-wallet-pills"><span>Camisa {selected.number??'—'}</span><span>{selected.category}</span></div></div></div>
        <div className="athlete-wallet-details"><div><small>Identificação do atleta</small><strong>{readableId(playerId)}</strong></div><div><small>Competição</small><strong>{selected.season?.competition?.name||selected.category}</strong></div><div><small>Vínculo registrado</small><strong>{statusLabel(selected.status)}</strong></div><div><small>Elegibilidade registrada</small><strong>{statusLabel(selected.eligibilityStatus)}</strong></div></div>
        <div className="athlete-wallet-footer"><span>{timeLabel}</span><span className={`athlete-wallet-status ${info.type}`}>{info.label}</span></div>
      </div>
      <p className="athlete-wallet-disclaimer">A situação exibida corresponde ao registro desta temporada no L3C Stats. A elegibilidade esportiva não substitui a autenticação da carteirinha, que ainda não conta com QR Code ou passe oficial para Apple Wallet e Google Wallet.</p>
    </>}
    {history.length>0&&<div className="athlete-wallet-history"><h3>Temporadas anteriores e outros vínculos</h3><p>Registros históricos não são carteirinhas vigentes.</p><div className="athlete-wallet-history-list">{history.sort((a,b)=>yearOf(b)-yearOf(a)).map((p,i)=><div key={p.rosterId||i}><span><b>{p.category}</b><small>{p.team?.name||'Equipe não informada'} · {p.season?.year||'Ano não informado'}</small></span><em>Histórico</em></div>)}</div></div>}
  </section>;
}
