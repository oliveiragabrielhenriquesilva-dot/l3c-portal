import Link from 'next/link';
import {Sponsors} from '../../components/SiteChrome';
import {getPublicOfficials,slugify} from '../../lib/site';

export const metadata={title:'Arbitragem e mesa | Liga Forjax de Basquete'};
export const dynamic='force-dynamic';

function initials(name=''){const w=String(name).trim().split(/\s+/);return ((w[0]?.[0]||'')+(w[1]?.[0]||'')).toUpperCase()}
function Card({o}){return <Link className="of-card" href={`/arbitro/${slugify(o.name)}/`}>
  <span className="of-avatar">{o.photoUrl?<img src={o.photoUrl} alt=""/>:initials(o.name)}</span>
  <span className="of-name">{o.name}</span>
  <span className="of-sub">{[o.referee&&'Árbitro',o.tableOfficial&&'Mesário'].filter(Boolean).join(' · ')}{o.city?` · ${o.city}`:''}</span>
</Link>}

export default async function Page(){
  const list=await getPublicOfficials();
  const referees=list.filter(o=>o.referee);const table=list.filter(o=>!o.referee&&o.tableOfficial);
  return <main className="shell of-page">
    <header className="of-head"><small>Liga Forjax de Basquete</small><h1>Arbitragem e mesa</h1><p>Profissionais com cadastro homologado pela Liga.</p></header>
    {!list.length&&<div className="of-empty">A lista será exibida aqui assim que houver profissionais homologados.</div>}
    {referees.length>0&&<section><h2>Árbitros <em>{referees.length}</em></h2><div className="of-grid">{referees.map(o=><Card key={o.id} o={o}/>)}</div></section>}
    {table.length>0&&<section><h2>Mesários <em>{table.length}</em></h2><div className="of-grid">{table.map(o=><Card key={o.id} o={o}/>)}</div></section>}
    <Sponsors/>
  </main>;
}
