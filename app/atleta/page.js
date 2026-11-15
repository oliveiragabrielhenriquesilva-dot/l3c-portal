import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {API} from '../../lib/site';
import AthletePanel from './AthletePanel';
import './wallet.css';
import './athlete-panel.css';
async function af(path,t){const r=await fetch(`${API}${path}`,{headers:{authorization:`Bearer ${t}`},cache:'no-store'});if(r.status===401||r.status===403)return null;const body=await r.json().catch(()=>null);if(!r.ok)return {error:true,message:body?.message||'Não foi possível carregar o Portal do Atleta.'};return body}
export const metadata={title:'Portal do Atleta | Liga 3 Colinas'};
export default async function Atleta(){const jar=await cookies();const token=jar.get('l3c_session')?.value;if(!token)redirect('/entrar/?next=/atleta/');const d=await af('/athlete-portal/me',token);if(!d)redirect('/entrar/?next=/atleta/');if(d.error)return <main className="portal-body"><section className="section shell"><div className="portal-card athlete-empty"><h1>Portal do Atleta</h1><p>{d.message}</p></div></section></main>;return <AthletePanel data={d}/>}
