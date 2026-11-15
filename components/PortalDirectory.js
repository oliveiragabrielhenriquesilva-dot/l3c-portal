import {jogosLabel} from '../lib/format';
import Link from 'next/link';
import {TeamLogo} from './Cards';
import {slugify} from '../lib/site';

export function ContextNav({items=[]}){
  return <div className="portal-context-nav">{items.map(item=>{
    const [href,label,active=false]=item;
    return <Link className={active?'active':''} href={href} key={`${href}-${label}`}>{label}</Link>;
  })}</div>
}

export function KpiStrip({items=[]}){
  return <div className="portal-kpi-strip">{items.map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
}

export function FilterBar({children}){
  return <div className="portal-filter-bar">{children}</div>
}

export function TeamDirectoryCard({item,subtitle='',href}){
  const team=item?.team||item||{};
  const url=href||`/team/${slugify(team.name)}/`;
  return <Link className="portal-team-card" href={url}>
    <div className="portal-team-logo"><TeamLogo team={team} size={74}/></div>
    <div className="portal-team-copy"><strong>{team.name}</strong><span>{subtitle||team.city||'Liga Forjax'}</span></div>
    <span className="portal-card-arrow">→</span>
  </Link>
}

export function AthleteDirectoryCard({item,href,context=''}){
  const p=item?.player||item||{};
  const target=href||`/player/${slugify(p.name)}/${context?`?context=${context}`:''}`;
  return <Link className="portal-athlete-card" href={target}>
    {p.photoUrl?<img src={p.photoUrl} alt=""/>:<div className="portal-athlete-placeholder">{p.name?.[0]||'?'}</div>}
    <div><strong>{p.name}</strong><span>{item?.teams?.[0]?.name||''}</span><small>{jogosLabel(item?.games)} · {Number(item?.averages?.points||0).toFixed(1).replace('.',',')} PTS/J</small></div>
    <span className="portal-card-arrow">→</span>
  </Link>
}

export function PageIntro({eyebrow='Portal esportivo',title,description,aside=null}){
  return <section className="portal-page-intro"><div><small>{eyebrow}</small><h2>{title}</h2>{description&&<p>{description}</p>}</div>{aside&&<div className="portal-page-intro-aside">{aside}</div>}</section>
}

export function EmptyPortal({title='Nenhum dado disponível',text=''}){
  return <div className="portal-empty-state"><strong>{title}</strong>{text&&<span>{text}</span>}</div>
}
