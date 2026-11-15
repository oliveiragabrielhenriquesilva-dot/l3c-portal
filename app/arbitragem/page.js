import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {API} from '../../lib/site';
import ArbitragemPanel from './ArbitragemPanel';
import './arbitragem.css';

async function get(path,token){
 try{const res=await fetch(`${API}/official-portal/${path}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});
  if(res.status===401)return {authExpired:true};if(!res.ok)return {error:true,message:(await res.json().catch(()=>({}))).message||'Consulta indisponível'};
  return await res.json();
 }catch{return {error:true,message:'Não foi possível consultar o L3C Stats.'}}
}
export const metadata={title:'Área da Arbitragem | Liga 3 Colinas'};
export default async function ArbitragemPage(){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)redirect('/entrar/?next=/arbitragem/');
 const me=await get('me',token);
 if(me?.authExpired)redirect('/entrar/?next=/arbitragem/');
 if(me?.error)return <main className="l3r l3r-empty"><h1>Área da Arbitragem</h1><p>{me.message}</p><p>O portal é exclusivo para árbitros e mesários com vínculo nesta conta.</p><Link href="/minha-conta/">Voltar aos meus acessos</Link></main>;
 const [games,finance,unavailability]=await Promise.all([get('me/games',token),get('me/finance',token),get('me/unavailability',token)]);
 return <ArbitragemPanel initial={{me,games,finance,unavailability}}/>;
}
