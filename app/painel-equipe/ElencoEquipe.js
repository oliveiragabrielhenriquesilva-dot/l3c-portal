'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
const message=data=>Array.isArray(data?.message)?data.message.join(' · '):data?.message||'Não foi possível concluir a alteração.';
export default function ElencoEquipe({roster=[],accessId,seasonId}){
 const router=useRouter();
 const[policy,setPolicy]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busyId,setBusyId]=useState(null);
 const[editing,setEditing]=useState(''),[form,setForm]=useState({number:'',position:''}),[updates,setUpdates]=useState({}),[removed,setRemoved]=useState([]);
 useEffect(()=>{
  let active=true;setPolicy(null);setEditing('');setUpdates({});setRemoved([]);setError('');setNotice('');
  fetch(`/api/team-portal/roster?${new URLSearchParams({accessId,seasonId})}`,{cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(message(data));return data}).then(data=>{if(active)setPolicy(data)}).catch(e=>{if(active)setPolicy({open:false,reason:e.message})});
  return()=>{active=false};
 },[accessId,seasonId]);
 const nameOf=row=>row.player?.person?.displayName||row.player?.person?.fullName||'Atleta';
 function edit(row){const value=updates[row.id]||{};setEditing(row.id);setForm({number:value.number!==undefined?value.number??'':row.number??'',position:value.position!==undefined?value.position:row.player?.position||''});setError('');setNotice('')}
 async function save(row){
  const number=form.number===''?null:Number(form.number);
  if(number!==null&&(!Number.isInteger(number)||number<0||number>99)){setError('Informe uma camisa de 0 a 99 ou deixe em branco.');return}
  setBusyId(row.id);setError('');setNotice('');
  try{const response=await fetch('/api/team-portal/roster',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({accessId,seasonId,rosterId:row.id,number,position:form.position})});const data=await response.json();if(!response.ok)throw Error(message(data));setUpdates(value=>({...value,[row.id]:{...value[row.id],number,position:form.position.trim()}}));setEditing('');setNotice(`Camisa e posição de ${nameOf(row)} atualizadas.`);router.refresh()}catch(e){setError(e.message)}finally{setBusyId(null)}
 }
 async function photo(row,file){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Escolha uma foto JPG, PNG ou WEBP.');return}
  if(file.size>5*1024*1024){setError('A foto deve ter até 5 MB.');return}
  setBusyId(row.id);setError('');setNotice('');
  try{const form=new FormData();form.append('accessId',accessId);form.append('seasonId',seasonId);form.append('rosterId',row.id);form.append('file',file);const response=await fetch('/api/team-portal/roster/photo',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw Error(message(data));setUpdates(value=>({...value,[row.id]:{...value[row.id],photoUrl:data.photoUrl}}));setNotice(`Foto de ${nameOf(row)} atualizada.`);router.refresh()}catch(e){setError(e.message)}finally{setBusyId(null)}
 }
 async function release(row){
  if(!policy?.open)return;
  if(!window.confirm(`Desvincular ${nameOf(row)} desta temporada? O cadastro, as estatísticas e a vaga histórica utilizada serão preservados.`))return;
  setBusyId(row.id);setError('');setNotice('');
  try{const response=await fetch('/api/team-portal/roster',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({accessId,seasonId,rosterId:row.id})});const data=await response.json();if(!response.ok)throw Error(message(data));setRemoved(value=>[...value,row.id]);setNotice(`${nameOf(row)} foi desvinculado do elenco. O histórico foi preservado.`);router.refresh()}catch(e){setError(e.message)}finally{setBusyId(null)}
 }
 const rows=roster.filter(row=>row.status==='ACTIVE'&&!row.endedAt&&!removed.includes(row.id));
 return <section className="l3e-panel"><h2>Elenco da temporada</h2><p className="l3e-muted">Atualize a foto, a camisa e a posição de cada atleta. Desvincular encerra apenas a participação nesta equipe e temporada, preservando o cadastro e o histórico.</p>
 {policy===null?<p className="l3e-muted">Consultando período de inscrições…</p>:<p className="l3e-muted">{policy.open?'Inscrições abertas: desvinculação disponível.':`Desvinculação indisponível: ${policy.reason||'período encerrado'}`}</p>}
 {error&&<p role="alert" className="l3e-staff-error">{error}</p>}{notice&&<p role="status" className="l3e-staff-success">{notice}</p>}
 <div className="l3e-people">{rows.map(row=>{const value=updates[row.id]||{};const photoUrl=value.photoUrl??row.player?.person?.photoUrl;const number=value.number!==undefined?value.number:row.number;const position=value.position!==undefined?value.position:row.player?.position;return <article key={row.id} className="l3e-roster-person">
  {photoUrl?<img src={photoUrl} alt={`Foto de ${nameOf(row)}`}/>:<span className="l3e-portrait">♟</span>}
  <div className="l3e-roster-person-main"><b>#{number??'—'} · {nameOf(row)}</b><small>{position||'Posição não informada'}</small>
   <div className="l3e-roster-actions"><label className="l3e-roster-photo">{busyId===row.id?'Aguarde…':'Alterar foto'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={busyId!==null} aria-label={`Alterar foto de ${nameOf(row)}`} onChange={e=>{const file=e.target.files?.[0];e.target.value='';void photo(row,file)}}/></label>
    <button type="button" className="l3e-staff-link" disabled={busyId!==null} onClick={()=>edit(row)} aria-label={`Editar camisa de ${nameOf(row)}`}>Editar camisa</button>
    <button type="button" className="l3e-staff-link l3e-roster-remove" disabled={busyId!==null||!policy?.open} title={!policy?.open?policy?.reason||'Consultando período de inscrições':undefined} onClick={()=>void release(row)} aria-label={`Desvincular ${nameOf(row)}`}>Desvincular</button>
   </div>
   {editing===row.id&&<form className="l3e-roster-edit" onSubmit={e=>{e.preventDefault();void save(row)}}><label>Camisa<input type="number" min="0" max="99" value={form.number} onChange={e=>setForm(value=>({...value,number:e.target.value}))}/></label><label>Posição<input maxLength="50" value={form.position} onChange={e=>setForm(value=>({...value,position:e.target.value}))}/></label><button type="submit" disabled={busyId!==null}>{busyId===row.id?'Salvando…':'Salvar'}</button><button type="button" disabled={busyId!==null} onClick={()=>setEditing('')}>Cancelar</button></form>}
  </div></article>})}{!rows.length&&<p className="l3e-muted">Nenhum atleta ativo registrado nesta temporada.</p>}</div>
 </section>;
}
