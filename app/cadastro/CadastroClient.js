'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import CadastroArbitragemForm from '../cadastro-arbitragem/CadastroArbitragemForm';
import '../cadastro-arbitragem/cadastro-arbitragem.css';

const profiles=[
  {value:'ATHLETE',name:'Atleta',icon:'♙',description:'Portal do atleta e histórico esportivo.'},
  {value:'ARBITRAGEM',name:'Arbitragem e Mesa',icon:'▤',description:'Árbitro, mesário ou ambas as funções.'},
  {value:'COMISSAO_TECNICA',name:'Comissão Técnica',icon:'♧',description:'Técnicos e profissionais das equipes.'},
];

export default function CadastroClient({initialProfile='ATHLETE',loggedIn=false}){
  const [form,setForm]=useState({name:'',email:'',phone:'',password:'',requestedProfile:initialProfile,notes:''});
  const [staffRole,setStaffRole]=useState('Técnico');
  const [staffTeamId,setStaffTeamId]=useState('');
  const [staffSeasonId,setStaffSeasonId]=useState('');
  const [staffOptions,setStaffOptions]=useState([]);
  const [staffOptionsLoading,setStaffOptionsLoading]=useState(false);
  const [staffOptionsError,setStaffOptionsError]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const [loading,setLoading]=useState(false);
  const patch=(key,value)=>setForm(previous=>({...previous,[key]:value}));
  const selectProfile=(value)=>{setError('');setSuccess('');patch('requestedProfile',value)};
  const isArbitragem=form.requestedProfile==='ARBITRAGEM';
  const isComissao=form.requestedProfile==='COMISSAO_TECNICA';
  useEffect(()=>{
    if(!isComissao)return;
    let mounted=true;
    const controller=new AbortController();
    setStaffOptionsLoading(true);
    setStaffOptionsError('');
    fetch('/api/session/staff-registration-options',{cache:'no-store',signal:controller.signal})
      .then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.message||'Falha ao consultar os cadastros oficiais.');return data})
      .then(data=>{if(mounted)setStaffOptions(Array.isArray(data.seasons)?data.seasons:[])})
      .catch(err=>{if(mounted&&err.name!=='AbortError')setStaffOptionsError(err.message||'Não foi possível consultar as temporadas.')})
      .finally(()=>{if(mounted)setStaffOptionsLoading(false)});
    return()=>{mounted=false;controller.abort()};
  },[isComissao]);
  const chosenStaffSeason=staffOptions.find(item=>item.id===staffSeasonId);


  async function submit(e){
    e.preventDefault();
    if(loading)return;
    setError('');setSuccess('');
    if(isArbitragem){setError('Preencha o formulário de arbitragem apresentado nesta página.');return;}
    if(isComissao&&staffSeasonId&&!staffTeamId){setError('Escolha uma equipe oficial dessa temporada ou deixe ambos os campos a definir.');return;}
    if(form.password!==confirmPassword){setError('As senhas informadas não coincidem.');return;}
    setLoading(true);
    try{
      const r=await fetch('/api/session/register-request',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({...form,name:form.name.trim(),email:form.email.trim(),phone:form.phone.trim(),notes:form.notes.trim().slice(0,1000),...(isComissao?{staffRole,staffSeasonId:staffSeasonId||null,staffTeamId:staffTeamId||null}:{})}),
      });
      const j=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(Array.isArray(j.message)?j.message.join(' · '):(j.message||'Não foi possível criar o cadastro.'));
      setSuccess(j.message||'Cadastro criado. O vínculo será liberado pelo administrador.');
    }catch(err){setError(err.message||'Não foi possível conectar à plataforma.');}
    finally{setLoading(false);}
  }

  return <main className="l3c-register-page">
    <div className="l3c-register-layout">
      <section className="l3c-register-intro" aria-label="Liga 3 Colinas · escolha de perfil de cadastro">
        <div className="l3c-register-visual">
          <img src="/portal-login-3-colinas.webp" alt="Liga 3 Colinas, três colinas e identidade visual oficial do Portal de Acesso" />
        </div>
        <div className="l3c-register-intro-inner">
          <div className="l3c-register-profiles" aria-labelledby="register-profiles-title">
            <span className="l3c-register-kicker">CADASTRO DE ACESSO</span>
            <h1 id="register-profiles-title">SELECIONE O SEU PERFIL</h1>
            <p>Escolha a área de atuação. O formulário correspondente será exibido ao lado.</p>
            <div className="l3c-register-profile-grid">
              {profiles.map(profile=><button key={profile.value} type="button" aria-pressed={form.requestedProfile===profile.value} className={`l3c-register-profile ${form.requestedProfile===profile.value?'selected':''}`} onClick={()=>selectProfile(profile.value)}><span className="l3c-register-profile-icon" aria-hidden="true">{profile.icon}</span><span><b>{profile.name}</b><small>{profile.description}</small></span></button>)}
            </div>
          </div>
          <div className="l3c-register-brand-footer">LIGA 3 COLINAS DE BASQUETE <i/> TRADIÇÃO · ESPORTE · COMUNIDADE</div>
        </div>
      </section>
      <section className={`l3c-register-side ${isArbitragem?'l3c-register-side-arbitragem':''}`} aria-label="Solicitar cadastro" aria-live="off">
        {isArbitragem
          ?<CadastroArbitragemForm embedded loggedIn={loggedIn}/>
          :<form className="l3c-register-form" onSubmit={submit}>
            <div className="l3c-register-kicker">NOVO CADASTRO</div>
            <h2>{isComissao?'COMISSÃO TÉCNICA':'SOLICITAR ACESSO'}</h2>
            <p className="l3c-register-subtitle">{isComissao?'Solicite seu cadastro de profissional. A Liga e a equipe deverão autorizar o vínculo; a inscrição não concede acesso automático.':'Preencha suas informações. O administrador fará o vínculo e a liberação dos acessos.'}</p>
            <label htmlFor="register-name">NOME COMPLETO</label><input id="register-name" required minLength={2} maxLength={150} autoComplete="name" placeholder="Digite seu nome completo" value={form.name} onChange={e=>patch('name',e.target.value)}/>
            <label htmlFor="register-email">E-MAIL</label><input id="register-email" required type="email" autoComplete="email" placeholder="Digite seu e-mail" value={form.email} onChange={e=>patch('email',e.target.value)}/>
            <label htmlFor="register-phone">TELEFONE / WHATSAPP</label><input id="register-phone" type="tel" maxLength={30} autoComplete="tel" placeholder="(XX) XXXXX-XXXX" value={form.phone} onChange={e=>patch('phone',e.target.value)}/>
            <label htmlFor="register-password">SENHA</label><div className="l3c-register-password"><input id="register-password" required type={showPassword?'text':'password'} minLength={8} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={form.password} onChange={e=>patch('password',e.target.value)}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Ocultar':'Mostrar'}</button></div>
            <label htmlFor="register-confirm">CONFIRMAR SENHA</label><input id="register-confirm" required type={showPassword?'text':'password'} minLength={8} autoComplete="new-password" placeholder="Digite novamente sua senha" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/>
            <label htmlFor="register-profile">PERFIL DESEJADO</label><select id="register-profile" value={form.requestedProfile} onChange={e=>selectProfile(e.target.value)}>{profiles.map(profile=><option key={profile.value} value={profile.value}>{profile.name}</option>)}</select>
            {isComissao&&<div className="l3c-register-staff-fields" aria-label="Dados da Comissão Técnica">
              <p className="l3c-register-staff-note">O cadastro não cria vínculo com a equipe. A solicitação será analisada pela Liga e dependerá de aprovação oficial.</p>
              <label htmlFor="register-staff-role">FUNÇÃO PRETENDIDA</label><select id="register-staff-role" required value={staffRole} onChange={e=>setStaffRole(e.target.value)}>
                {['Técnico','Auxiliar técnico','Preparador físico','Fisioterapeuta','Massagista','Outra função'].map(role=><option key={role} value={role}>{role}</option>)}
              </select>
              <label htmlFor="register-staff-season">COMPETIÇÃO / TEMPORADA (SE JÁ DEFINIDA)</label>
              <select id="register-staff-season" value={staffSeasonId} disabled={staffOptionsLoading||Boolean(staffOptionsError)} onChange={e=>{setStaffSeasonId(e.target.value);setStaffTeamId('')}}>
                <option value="">A definir / Ainda não tenho equipe</option>
                {staffOptions.map(season=><option key={season.id} value={season.id}>{season.label}</option>)}
              </select>
              {staffOptionsLoading&&<p className="l3c-register-staff-note" role="status">Consultando competições oficiais...</p>}
              {staffOptionsError&&<p className="l3c-register-staff-note" role="alert">{staffOptionsError} Você pode se inscrever com a equipe a definir.</p>}
              <label htmlFor="register-staff-team">EQUIPE (SE JÁ DEFINIDA)</label>
              <select id="register-staff-team" value={staffTeamId} disabled={!chosenStaffSeason} required={Boolean(staffSeasonId)} onChange={e=>setStaffTeamId(e.target.value)}>
                <option value="">{chosenStaffSeason?'Selecione a equipe oficial':'Primeiro selecione a temporada'}</option>
                {(chosenStaffSeason?.teams||[]).map(team=><option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <p className="l3c-register-staff-note">Equipe e temporada são selecionadas a partir dos registros oficiais do L3C Stats. Caso não tenha equipe definida, deixe a temporada como “A definir”.</p>
            </div>}
            <label htmlFor="register-notes">OBSERVAÇÕES (OPCIONAL)</label><textarea id="register-notes" rows={3} maxLength={1000} placeholder={isComissao?"Experiência, certificações ou informações adicionais":"Observações sobre seu cadastro..."} value={form.notes} onChange={e=>patch('notes',e.target.value)}/>
            {error&&<p className="l3c-register-alert error" role="alert">{error}</p>}
            {success&&<div className="l3c-register-alert success" role="status">{success}<Link href="/entrar/?registered=1">Ir para o login →</Link></div>}
            <button className="l3c-register-submit" type="submit" disabled={loading||Boolean(success)}>{loading?'ENVIANDO...':success?'SOLICITAÇÃO ENVIADA':'ENVIAR SOLICITAÇÃO'} <span aria-hidden="true">→</span></button>
            <p className="l3c-register-staff-note">Todos os campos são obrigatórios, exceto telefone e observações. Seus dados são usados apenas para identificar e vincular você à Liga, conforme a LGPD, e não são compartilhados com terceiros.</p>
            <div className="l3c-register-back"><span>Já possui conta?</span><Link href="/entrar/">ENTRAR</Link></div>
          </form>}
      </section>
    </div>
  </main>;
}
