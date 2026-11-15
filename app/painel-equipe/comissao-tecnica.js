'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
const roles=['Técnico','Auxiliar técnico','Preparador físico','Fisioterapeuta','Massagista','Outro'];
const personName=p=>p?.displayName||p?.fullName||'Profissional';
export default function ComissaoTecnica({staff=[],accessId,seasonId,teamName,year}){
 const router=useRouter();
 const [tab,setTab]=useState('existing'),[query,setQuery]=useState(''),[results,setResults]=useState([]),[searched,setSearched]=useState(false);
 const [person,setPerson]=useState(null),[role,setRole]=useState('Técnico'),[otherRole,setOtherRole]=useState('');
 const [form,setForm]=useState({fullName:'',birthDate:'',document:'',email:'',phone:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [editing,setEditing]=useState(null),[editRole,setEditRole]=useState('');
 const [credential,setCredential]=useState(null);
 const active=staff.filter(x=>x.status==='ACTIVE'&&!x.endedAt),pending=staff.filter(x=>x.status==='PENDING'&&!x.endedAt),history=staff.filter(x=>!['ACTIVE','PENDING'].includes(x.status)||x.endedAt);
 const finalRole=(role==='Outro'?otherRole:role).trim();
 async function request(payload){
  setBusy(true);setError('');setNotice('');
  try{const res=await fetch('/api/team-portal/staff',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accessId,seasonId,...payload})});
   const data=await res.json();if(!res.ok)throw new Error(data.message||'Não foi possível salvar.');
   setNotice('Solicitação enviada à Liga. O vínculo só aparecerá na página pública após a homologação.');setPerson(null);setSearched(false);setResults([]);setForm({fullName:'',birthDate:'',document:'',email:'',phone:''});setEditing(null);router.refresh();
  }catch(e){setError(e.message||'Falha inesperada.')}finally{setBusy(false)}
 }
 async function uploadPhoto(assignmentId,file){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
   setError('Escolha uma imagem JPG, PNG ou WEBP com até 5 MB.');return;
  }
  setBusy(true);setError('');setNotice('');
  try{
   const formData=new FormData();
   formData.append('accessId',accessId);formData.append('seasonId',seasonId);
   formData.append('assignmentId',assignmentId);formData.append('file',file);
   const r=await fetch('/api/team-portal/staff/photo',{method:'POST',body:formData});
   const data=await r.json();if(!r.ok)throw new Error(data.message||'Falha ao atualizar a foto.');
   setNotice('Foto atualizada com sucesso. A credencial usará a nova imagem quando for emitida novamente.');
   setCredential(null);router.refresh();
  }catch(e){setError(e.message||'Não foi possível atualizar a foto.')}finally{setBusy(false)}
 }
 async function issueCredential(id){setBusy(true);setError('');setCredential(null);
  try{const p=new URLSearchParams({id,accessId,seasonId});const r=await fetch(`/api/team-portal/staff/credential?${p}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.message||'Não foi possível emitir a credencial.');setCredential(d)}
  catch(e){setError(e.message||'Falha de emissão.')}finally{setBusy(false)}
 }
 function printCredential(){if(!credential)return;
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const w=window.open('','_blank','width=720,height=600');if(!w){setError('Autorize janelas pop-up para imprimir.');return;}
  w.document.write(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Credencial L3C</title><style>body{font-family:Arial,sans-serif;padding:25px}.card{max-width:590px;padding:25px;border-radius:16px;background:#082036;color:white;border-top:14px solid #f26d28}a{color:#ffb481;overflow-wrap:anywhere}small{color:#bdd0df}</style><div class="card"><h2>LIGA 3 COLINAS · COMISSÃO TÉCNICA</h2><h2>${esc(credential.professional?.fullName)}</h2><h3>${esc(credential.role)}</h3><p>${esc(credential.team?.name)} · ${esc(credential.season?.competition?.name)} ${esc(credential.season?.year)}</p><p>Validar online: <a href="${esc(credential.verifyUrl)}">${esc(credential.verifyUrl)}</a></p><small>Somente vínculo homologado e vigente. Acesso à quadra depende das regras da Liga.</small></div><script>window.onload=()=>window.print()<\/script></html>`);w.document.close();
 }
 async function search(e){e.preventDefault();setBusy(true);setError('');setSearched(false);setPerson(null);
  try{const res=await fetch(`/api/team-portal/staff?${new URLSearchParams({accessId,seasonId,q:query.trim()})}`,{cache:'no-store'});const data=await res.json();if(!res.ok)throw new Error(data.message||'Falha ao pesquisar.');setResults(Array.isArray(data)?data:[]);setSearched(true)}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <div className="l3e-staff">
  <section className="l3e-panel">
   {error&&<p role="alert" className="l3e-staff-error">{error}</p>}
   {notice&&<p role="status" className="l3e-staff-success">{notice}</p>}
   <div className="l3e-staff-heading"><div><h2>Comissão técnica</h2><p className="l3e-muted">{teamName} · Temporada {year}. Os vínculos são exclusivos desta equipe e temporada.</p></div><span className="l3e-staff-count">{active.length} integrante(s) ativo(s)</span></div>
   <div className="l3e-staff-grid">{active.map(a=><article key={a.id} className="l3e-staff-person">{a.staff?.person?.photoUrl?<img src={a.staff.person.photoUrl} alt=""/>:<span className="l3e-staff-avatar">♙</span>}<div className="l3e-staff-person-body"><strong>{personName(a.staff?.person)}</strong><small>{a.role||'Função não informada'}</small><small>Homologado · {year}</small>{editing===a.id?<div className="l3e-staff-edit"><input value={editRole} maxLength={80} onChange={e=>setEditRole(e.target.value)} aria-label="Nova função"/><button disabled={busy||!editRole.trim()} onClick={()=>request({action:'role',assignmentId:a.id,role:editRole})}>Salvar</button><button onClick={()=>setEditing(null)}>Cancelar</button></div>:<><button className="l3e-staff-link" disabled={busy} onClick={()=>issueCredential(a.id)}>Carteirinha profissional</button><label className="l3e-staff-link" style={{display:'inline-block',cursor:busy?'not-allowed':'pointer'}}>
    Alterar foto
    <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Alterar foto de ${personName(a.staff?.person)}`} disabled={busy} style={{position:'absolute',width:1,height:1,opacity:0}} onChange={e=>{const file=e.target.files?.[0];if(file)uploadPhoto(a.id,file);e.target.value='';}}/>
   </label><button className="l3e-staff-link" onClick={()=>{setEditing(a.id);setEditRole(a.role||'')}}>Alterar função</button></>}</div></article>)}
   {!active.length&&<p className="l3e-muted">Ainda não há profissionais homologados nesta temporada.</p>}</div>
   {pending.length>0&&<div className="l3e-staff-history" style={{marginTop:16}}><h3>Aguardando homologação da Liga ({pending.length})</h3>{pending.map(a=><div key={a.id}><strong>{personName(a.staff?.person)}</strong><small>{a.role||'Função não informada'} · Solicitação pendente; ainda não é exibida ao público</small>
    <label className="l3e-staff-link" style={{display:'inline-block',cursor:busy?'not-allowed':'pointer'}}>Alterar foto
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-label={`Alterar foto de ${personName(a.staff?.person)}`} style={{position:'absolute',width:1,height:1,opacity:0}} onChange={e=>{const file=e.target.files?.[0];if(file)uploadPhoto(a.id,file);e.target.value='';}}/>
    </label></div>)}</div>}
  </section>
  {credential&&<section className="l3e-panel" aria-label="Carteirinha digital da Comissão Técnica"><h2>Carteirinha profissional</h2>
   <div style={{background:'#082036',color:'white',borderTop:'8px solid #f26d28',borderRadius:14,padding:22,maxWidth:550,display:'flex',gap:16,flexWrap:'wrap'}}>
    {credential.professional?.photoUrl&&<img src={credential.professional.photoUrl} alt="" style={{width:85,height:100,objectFit:'cover',borderRadius:8}}/>}
    <div style={{flex:1,minWidth:0}}><strong>LIGA 3 COLINAS · COMISSÃO TÉCNICA</strong><h3 style={{color:'white',margin:'12px 0 4px',overflowWrap:'anywhere'}}>{personName(credential.professional)}</h3><p style={{color:'#ffb481'}}>{credential.role}</p><p>{credential.team?.name} · {credential.season?.competition?.name} {credential.season?.year}</p><small>Credencial assinada · Consulte a situação online</small></div>
   </div>
   <p className="l3e-muted">Código válido até {new Date(credential.expiresAt).toLocaleDateString('pt-BR')}, condicionado à homologação ativa. Não autoriza entrada automática na quadra.</p>
   <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}><a className="l3e-staff-link" href={credential.verifyUrl} rel="noopener noreferrer" target="_blank">Verificar online</a><button className="l3e-staff-link" onClick={printCredential}>Imprimir ou salvar PDF</button><button className="l3e-staff-link" onClick={()=>setCredential(null)}>Fechar</button></div>
   <p style={{fontSize:12,overflowWrap:'anywhere'}}>{credential.verifyUrl}</p>
  </section>}
  <section className="l3e-panel"><h2>Adicionar profissional</h2><p className="l3e-muted">Primeiro consulte se a pessoa já existe na organização. Evite criar cadastros duplicados.</p>
   <div className="l3e-staff-tabs"><button className={tab==='existing'?'active':''} onClick={()=>setTab('existing')}>Vincular cadastro existente</button><button className={tab==='new'?'active':''} onClick={()=>setTab('new')}>Cadastrar novo profissional</button></div>
   {tab==='existing'?<><form className="l3e-staff-search" onSubmit={search}><label>Pesquisar por nome ou e-mail<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome do profissional" maxLength={120}/></label><button disabled={busy} type="submit">Pesquisar</button></form>
     {searched&&<div className="l3e-staff-results">{results.length?results.map(p=><button type="button" key={p.personId} disabled={p.alreadyLinked} className={person?.personId===p.personId?'selected':''} onClick={()=>setPerson(p)}>{p.photoUrl?<img src={p.photoUrl} alt=""/>:<span className="l3e-staff-avatar">♙</span>}<span><strong>{personName(p)}</strong><small>{p.alreadyLinked?'Já vinculado à equipe':p.defaultRole||'Cadastro existente'}{p.isPlayer?' · Também é atleta':''}</small></span></button>):<p className="l3e-muted">Nenhum cadastro encontrado. Confira o nome ou use a opção de novo profissional.</p>}</div>}
   </>:<div className="l3e-staff-fields"><label>Nome completo *<input maxLength={160} value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></label><label>Data de nascimento<input type="date" value={form.birthDate} onChange={e=>setForm({...form,birthDate:e.target.value})}/></label><label>Documento<input maxLength={32} value={form.document} onChange={e=>setForm({...form,document:e.target.value})}/></label><label>E-mail<input type="email" maxLength={160} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Telefone<input maxLength={40} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></div>}
   <div className="l3e-staff-fields"><label>Função na equipe *<select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(x=><option key={x}>{x}</option>)}</select></label>{role==='Outro'&&<label>Descreva a função<input maxLength={80} value={otherRole} onChange={e=>setOtherRole(e.target.value)}/></label>}</div>
   {error&&<p role="alert" className="l3e-staff-error">{error}</p>}{notice&&<p role="status" className="l3e-staff-success">{notice}</p>}
   <button className="l3e-staff-submit" disabled={busy||!finalRole||(tab==='existing'?!person:form.fullName.trim().length<3)} onClick={()=>request(tab==='existing'?{action:'existing',personId:person.personId,role:finalRole}:{action:'new',...form,role:finalRole})}>{busy?'Aguarde…':tab==='existing'?'Vincular à comissão':'Cadastrar e vincular'}</button>
   <p className="l3e-muted">O vínculo utiliza as operações oficiais já disponíveis no L3C Stats. O pedido ficará aguardando homologação pela Liga. Somente os profissionais aprovados aparecerão na página pública e na consulta de pré-jogo.</p>
  </section>
  {history.length>0&&<section className="l3e-panel"><h2>Histórico de vínculos</h2><div className="l3e-staff-history">{history.map(x=><div key={x.id}><strong>{personName(x.staff?.person)}</strong><small>{x.role||'Função não informada'} · {x.status==='REJECTED'?'Solicitação rejeitada':'Encerrado ou inativo'}</small></div>)}</div></section>}
 </div>;
}
