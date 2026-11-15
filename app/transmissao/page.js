import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {API} from '../../lib/site';
import {transmissionOrganizations} from '../../lib/operational-access';
import TransmissionPanel from './TransmissionPanel';
import './transmission.css';
export const metadata={title:'Área da Transmissão | Liga 3 Colinas'};
export default async function Page({searchParams}){
 const sp=await searchParams;
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)redirect('/entrar/?next=/transmissao/');
 let accesses=null;
 try{const response=await fetch(`${API}/auth/me/accesses`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});if(response.ok)accesses=await response.json()}catch{}
 const organizations=transmissionOrganizations(accesses||{});
 const selected=sp.organizationId?organizations.find(item=>item.id===sp.organizationId):organizations[0];
 if(selected&&!sp.organizationId)redirect(`/transmissao/?organizationId=${encodeURIComponent(selected.id)}`);
 if(!selected)return <main className="section"><h1>Área da Transmissão</h1><p>Não foi possível confirmar acesso à transmissão nesta organização.</p><Link href="/minha-conta/">Voltar aos meus acessos</Link></main>;
 return <main className="portal-transmission"><header className="portal-transmission-header"><div><small>ÁREA DA TRANSMISSÃO</small><h1>{selected.name}</h1></div><Link href="/minha-conta/">Meus acessos</Link></header>{organizations.length>1&&<nav aria-label="Organizações da transmissão">{organizations.map(item=><Link key={item.id} href={`/transmissao/?organizationId=${encodeURIComponent(item.id)}`}>{item.name}</Link>)}</nav>}<TransmissionPanel key={selected.id} organizationId={selected.id}/></main>;
}
