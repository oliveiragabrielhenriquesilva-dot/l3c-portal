'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
export default function LoginForm(){
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);
  const [visible,setVisible]=useState(false);
  const router=useRouter();
  useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.get('registered')==='1')setMessage('Cadastro recebido. Aguarde a liberação do seu vínculo pelo administrador.');else if(params.get('aguardando')==='1')setMessage('Seu cadastro está aguardando o vínculo pelo administrador.');},[]);
  async function submit(e){
    e.preventDefault();setLoading(true);setError('');
    try{
      const f=new FormData(e.currentTarget);
      const r=await fetch('/api/session/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok){setError(Array.isArray(j.message)?j.message.join(' · '):(j.message||'Não foi possível entrar.'));return;}
      const hasAccess=['teams','organizations','competitions','officials'].some(key=>Array.isArray(j[key])&&j[key].length>0);
      router.push(hasAccess?'/minha-conta/':'/minha-conta/?aguardando=1');router.refresh();
    }catch{setError('Não foi possível conectar à plataforma. Tente novamente.');}
    finally{setLoading(false)}
  }
  return <div className="l3c-access-layout">
    <section className="l3c-access-art" aria-label="Liga 3 Colinas de Basquete e suas competições oficiais">
      <img src="/portal-login-3-colinas.webp" alt="Liga 3 Colinas, paisagem das três colinas e selos Adulto Livre, Liga Master e Categoria de Base"/>
    </section>
    <section className="l3c-access-side">
      <div className="l3c-access-content">
        <div className="l3c-access-eyebrow">ACESSO À PLATAFORMA OFICIAL</div>
        <h1>Bem-vindo de volta<span>.</span></h1>
        <p className="l3c-access-lead">Entre com suas credenciais para acessar a plataforma oficial da Liga 3 Colinas.</p>
        <form className="l3c-access-form" onSubmit={submit}>
          <label htmlFor="l3c-email">E-mail de acesso</label>
          <div className="l3c-access-field"><span aria-hidden="true">✉</span><input id="l3c-email" type="email" name="email" placeholder="seuemail@exemplo.com" autoComplete="email" required/></div>
          <label htmlFor="l3c-password">Senha</label>
          <div className="l3c-access-field"><span aria-hidden="true">♙</span><input id="l3c-password" type={visible?'text':'password'} name="password" placeholder="Digite sua senha" autoComplete="current-password" required/><button type="button" className="l3c-password-toggle" onClick={()=>setVisible(v=>!v)}>{visible?'Ocultar':'Mostrar'}</button></div>
          {error&&<p role="alert" className="l3c-access-error">{error}</p>}
          {message&&<p role="status" className="l3c-access-success">{message}</p>}
          <button type="submit" className="l3c-access-submit" disabled={loading}>{loading?'ENTRANDO...':'ENTRAR NO PORTAL'} <span aria-hidden="true">→</span></button>
        </form>
        <div className="l3c-access-or"><span/>OU<span/></div>
        <Link className="l3c-access-create" href="/cadastro/"><span aria-hidden="true">♧</span> CRIAR CADASTRO <span aria-hidden="true">→</span></Link>
        <div className="l3c-access-info"><b>Ainda não tem acesso?</b><p>Faça seu cadastro para atuar como <strong>atleta, profissional de arbitragem e mesa ou integrante da comissão técnica</strong>. O acesso depende da análise e autorização da Liga 3 Colinas, conforme as regras de cada função.</p></div>
        <div className="l3c-access-footer">♙ &nbsp; Ambiente institucional · Acesso mediante autorização da Liga 3 Colinas.<div><Link href="/">← Voltar ao site oficial</Link></div></div>
      </div>
    </section>
  </div>;
}
