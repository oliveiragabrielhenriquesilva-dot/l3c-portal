import {API} from '../../lib/site';
export const dynamic='force-dynamic';
export const metadata={title:'Verificação de credencial · Liga 3 Colinas',robots:{index:false,follow:false}};
export default async function CredencialComissao({searchParams}){
 const p=await searchParams;const code=String(p?.codigo||'').slice(0,2048);
 let result=null,err='';
 if(!code)err='Informe o código de verificação da credencial.';
 else try{const r=await fetch(`${API}/public/staff-credentials/verify?${new URLSearchParams({code})}`,{cache:'no-store'});result=await r.json();if(!r.ok)err=result?.message||'Não foi possível verificar a credencial.';}
 catch{err='Não foi possível consultar o L3C Stats neste momento.'}
 const valid=result?.valid===true;
 const person=result?.professional;
 return <main style={{minHeight:'100vh',background:'#061827',color:'#fff',fontFamily:'Arial,sans-serif',padding:'28px 14px'}}><div style={{maxWidth:560,margin:'auto'}}>
 <header style={{borderBottom:'3px solid #f26d28',paddingBottom:20}}><a href="/" style={{color:'#ffb481',fontSize:14}}>← Site oficial</a><h1 style={{fontSize:25}}>LIGA 3 COLINAS</h1><p style={{opacity:.8}}>Verificação de credencial · Comissão Técnica</p></header>
 <section style={{background:'#102940',borderRadius:14,padding:24,marginTop:20,borderTop:`8px solid ${valid?'#40a880':'#f26d28'}`}}>
 {valid?<><h2 style={{color:'#b4eedb'}}>✓ Credencial válida nesta consulta</h2>{person?.photoUrl&&<img src={person.photoUrl} alt="" style={{width:100,height:115,objectFit:'cover',borderRadius:9}}/>}<h3 style={{overflowWrap:'anywhere'}}>{person?.displayName||person?.fullName}</h3><p style={{color:'#ffb481',fontWeight:700}}>{result.role}</p><p>{result.team?.name} · {result.season?.competition?.name} · {result.season?.year}</p><p style={{fontSize:13,opacity:.8}}>Verificado em {new Date(result.checkedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · Código expira em {new Date(result.expiresAt).toLocaleDateString('pt-BR')}</p></>:<><h2 style={{color:'#ffd4bc'}}>Credencial não validada</h2><p>{err||({'EXPIRADA':'O código expirou. Solicite nova emissão.','VINCULO_INATIVO':'O vínculo deixou de estar ativo ou homologado.','ASSINATURA_INVALIDA':'A assinatura deste código é inválida.'}[result?.reason]||'Credencial inexistente ou inválida.')}</p></>}
 <p style={{fontSize:13,opacity:.8,marginTop:24}}>A conferência online identifica a situação no momento da consulta. A autorização de acesso às instalações depende da organização do evento.</p>
 </section></div></main>;
}
