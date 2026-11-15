import {notFound} from 'next/navigation';
import Link from 'next/link';
import {Sponsors} from '../../../components/SiteChrome';
import {getPublicOfficialBySlug,slugify} from '../../../lib/site';

export const dynamic='force-dynamic';
export async function generateMetadata({params}){const {slug}=await params;const d=await getPublicOfficialBySlug(slug);return {title:d?`${d.official.name} | Arbitragem e mesa`:'Arbitragem e mesa'}}

function initials(name=''){const w=String(name).trim().split(/\s+/);return ((w[0]?.[0]||'')+(w[1]?.[0]||'')).toUpperCase()}
function when(v){if(!v)return 'A definir';const d=new Date(v);if(Number.isNaN(d.getTime()))return 'A definir';return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}

export default async function Page({params}){
  const {slug}=await params;
  const d=await getPublicOfficialBySlug(slug);
  if(!d)notFound();
  const {official:o,games}=d;
  const finished=games.filter(g=>['FINISHED','FINALIZED','COMPLETED'].includes(String(g.status).toUpperCase())).length;
  return <main className="shell of-page">
    <header className="of-head of-profile">
      <span className="of-avatar of-avatar-lg">{o.photoUrl?<img src={o.photoUrl} alt=""/>:initials(o.name)}</span>
      <div><small>{[o.referee&&'Árbitro',o.tableOfficial&&'Mesário'].filter(Boolean).join(' · ')}{o.city?` · ${o.city}`:''}</small><h1>{o.name}</h1>
        <p>{games.length} {games.length===1?'jogo':'jogos'} com atuação confirmada{games.length?` · ${finished} finalizados`:''}</p></div>
    </header>
    <section>
      <h2>Jogos</h2>
      {!games.length?<div className="of-empty">Ainda não há jogos públicos com atuação confirmada.</div>:
      <div className="of-table">{games.map(g=><Link key={g.gameId+g.role} className="of-row" href={`/event/${slugify(`${g.teamA||'jogo'}-vs-${g.teamB||''}`)}/`}>
        <time>{when(g.startsAt)}</time>
        <span className="of-match"><b>{g.teamA||'A definir'}</b><i>{String(g.status).toUpperCase()==='SCHEDULED'?'×':`${g.scoreA} × ${g.scoreB}`}</i><b>{g.teamB||'A definir'}</b></span>
        <span className="of-role">{g.role}{g.competition?` · ${g.competition}`:''}{g.seasonYear?` ${g.seasonYear}`:''}</span>
      </Link>)}</div>}
    </section>
    <p><Link className="of-back" href="/arbitros/">← Toda a arbitragem</Link></p>
    <Sponsors/>
  </main>;
}
