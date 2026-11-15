'use client';
import Link from 'next/link';
import {useState} from 'react';

const initial={name:'',email:'',password:'',confirmPassword:'',cpf:'',rg:'',birthDate:'',phone:'',city:'',
 canReferee:false,canScorekeeper:false,refereeExperience:'',scorekeeperExperience:'',hasCourse:false,
 paymentPixKey:'',noFrancaFranchiseLinkDeclared:false};

export default function CadastroArbitragemForm({loggedIn=false,embedded=false}){
 const [form,setForm]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('');
 const change=(k,v)=>setForm(p=>({...p,[k]:v}));
 const Root=embedded?'div':'main';
 async function save(event){
  event.preventDefault();setError('');
  if(!form.canReferee&&!form.canScorekeeper)return setError('Escolha a função de árbitro, mesário ou ambas.');
  if(!form.noFrancaFranchiseLinkDeclared)return setError('Leia e aceite a declaração de incompatibilidade.');
  if(!loggedIn&&form.password!==form.confirmPassword)return setError('As senhas não coincidem.');
  setBusy(true);
  try{
   const r=await fetch('/api/arbitragem-inscricao',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(Array.isArray(j.message)?j.message.join(' · '):j.message||'Inscrição não realizada.');
   setDone('Solicitação de arbitragem enviada. Ela ficará pendente até a Liga conferir os dados e homologar o profissional.');
  }catch(e){setError(e.message||'Falha ao enviar inscrição.')}finally{setBusy(false)}
 }
 return <Root className={embedded?"l3ca l3ca-embedded":"l3ca"}><div className="l3ca-shell">
  {embedded?<header className="l3ca-embedded-head"><span className="l3ca-kicker">ARBITRAGEM E MESA · CADASTRO OFICIAL</span><h2>Inscrição de árbitros e mesários</h2><p>Escolha uma ou ambas as funções. O ingresso depende de homologação da Liga.</p></header>:<header className="l3ca-head"><img src="/l3c-logo-oficial.png" alt="Logo Liga 3 Colinas"/><div><small>LIGA 3 COLINAS · CADASTRO OFICIAL</small><h1>Inscrição de árbitros e mesários</h1><p>Solicitação de ingresso para análise da Liga. Inscrever-se não significa estar autorizado a atuar.</p></div></header>}
  <div className="l3ca-alert l3ca-warning"><b>Regra de independência</b><p>Atletas, integrantes da comissão técnica e representantes de qualquer equipe não podem integrar a arbitragem ou a mesa, independentemente da categoria, equipe ou temporada. A Liga conferirá os vínculos registrados no sistema.</p></div>
  {done?<section className="l3ca-success" role="status"><h2>Solicitação recebida</h2><p>{done}</p><Link href={loggedIn?'/minha-conta/':'/entrar/'}>{loggedIn?'Acompanhar em Meus Acessos':'Entrar com minha conta'} →</Link></section>
  :<form onSubmit={save} className="l3ca-form">
    <section><span className="l3ca-kicker">ETAPA 1</span><h2>Identificação e contato</h2>
    {loggedIn?<p className="l3ca-hint">Sua conta será reutilizada. Não será criada outra pessoa nem outro login.</p>:<p className="l3ca-hint">Já possui conta da Liga? <Link href="/entrar/?next=/cadastro/%3Fperfil%3Darbitragem">Entre primeiro</Link> para não duplicar seu cadastro.</p>}
    <div className="l3ca-grid">
      {!loggedIn&&<><label>Nome completo *<input required minLength={3} maxLength={160} autoComplete="name" value={form.name} onChange={e=>change('name',e.target.value)}/></label><label>E-mail *<input required type="email" autoComplete="email" value={form.email} onChange={e=>change('email',e.target.value)}/></label></>}
      <label>CPF *<input required inputMode="numeric" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={e=>change('cpf',e.target.value)}/></label>
      <label>RG / documento de identidade *<input required maxLength={32} value={form.rg} onChange={e=>change('rg',e.target.value)}/></label>
      <label>Data de nascimento *<input required type="date" value={form.birthDate} onChange={e=>change('birthDate',e.target.value)}/></label>
      <label>Telefone / WhatsApp *<input required type="tel" minLength={8} maxLength={40} value={form.phone} onChange={e=>change('phone',e.target.value)}/></label>
      <label>Cidade de residência *<input required minLength={2} maxLength={120} value={form.city} onChange={e=>change('city',e.target.value)}/></label>
      {!loggedIn&&<><label>Senha *<input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={e=>change('password',e.target.value)}/></label><label>Confirmar senha *<input required minLength={8} type="password" autoComplete="new-password" value={form.confirmPassword} onChange={e=>change('confirmPassword',e.target.value)}/></label></>}
    </div></section>
    <section><span className="l3ca-kicker">ETAPA 2</span><h2>Função e experiência</h2>
      <div className="l3ca-options"><label><input type="checkbox" checked={form.canReferee} onChange={e=>change('canReferee',e.target.checked)}/> Árbitro</label><label><input type="checkbox" checked={form.canScorekeeper} onChange={e=>change('canScorekeeper',e.target.checked)}/> Mesário</label></div>
      {form.canReferee&&<label>Experiência como árbitro<textarea rows={3} maxLength={3000} value={form.refereeExperience} onChange={e=>change('refereeExperience',e.target.value)}/></label>}
      {form.canScorekeeper&&<label>Experiência na mesa<textarea rows={3} maxLength={3000} value={form.scorekeeperExperience} onChange={e=>change('scorekeeperExperience',e.target.value)}/></label>}
      <label className="l3ca-check"><input type="checkbox" checked={form.hasCourse} onChange={e=>change('hasCourse',e.target.checked)}/> Possuo curso ou comprovação de experiência</label>
      <p className="l3ca-hint">O comprovante de curso ou experiência poderá ser enviado de forma privada após criar a conta. A Liga poderá solicitá-lo na homologação.</p>
    </section>
    <section><span className="l3ca-kicker">ETAPA 3</span><h2>Informações para pagamento</h2><label>Chave Pix (opcional)<input maxLength={180} autoComplete="off" placeholder="Preencha somente se desejar" value={form.paymentPixKey} onChange={e=>change('paymentPixKey',e.target.value)}/></label><p className="l3ca-hint">Informação privada, usada somente para pagamento por pessoal autorizado. Não aparece no perfil público.</p></section>
    <section><span className="l3ca-kicker">ETAPA 4</span><h2>Declaração obrigatória</h2><label className="l3ca-check l3ca-declare"><input required type="checkbox" checked={form.noFrancaFranchiseLinkDeclared} onChange={e=>change('noFrancaFranchiseLinkDeclared',e.target.checked)}/><span>Declaro não ser atleta, membro de comissão técnica ou representante de <strong>nenhuma equipe</strong>. Sei que a Liga verificará esses vínculos antes da aprovação e de qualquer escala.</span></label></section>
    {error&&<div role="alert" className="l3ca-alert l3ca-error">{error}</div>}
    <button className="l3ca-submit" disabled={busy}>{busy?'Enviando inscrição...':'Enviar para homologação'}</button>
  </form>}
  <footer className="l3ca-footer"><Link href="/minha-conta/">Meus acessos</Link> · <Link href="/entrar/">Entrar</Link> · Liga 3 Colinas</footer>
 </div></Root>;
}
