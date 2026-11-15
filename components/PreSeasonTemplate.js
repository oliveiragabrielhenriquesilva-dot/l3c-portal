// Template ÚNICO de pré-temporada (o mesmo visual do Adulto 2027). Todo o conteúdo vem da configuração do painel,
// com padrão para o que estiver vazio (lib/preseason.js). Adulto, Master, Base e competições novas usam este arquivo.
import Link from 'next/link';
import {TeamLogo} from './Cards';
import {dateStatus,nextMilestone,fillVars} from '../lib/preseason';

const initials=(name='')=>{const w=String(name).trim().split(/\s+/);return ((w[0]?.[0]||'')+(w[1]?.[0]||w[0]?.[1]||'')).toUpperCase()};
function Flow({steps,tone}){return <ol className={`p27-flow p27-flow-${tone}`}>{steps.map((x,i)=><li key={x+i}><span>{x}</span>{i<steps.length-1&&<i aria-hidden="true">→</i>}</li>)}</ol>}

export default function PreSeasonTemplate({cfg,logo,seal,sealAlt,year,teams=[],teamGroups=[],teamHref,teamsAllHref,top=null,bottom=null,now=Date.now()}){
  const count=teams.length;
  const vars={equipes:count||'',ano:year||''};
  const T=s=>fillVars(s,vars).trim();
  const lines=T(cfg.headline).split('\n').map(x=>x.trim()).filter(Boolean);
  const accent=T(cfg.headlineAccent);
  const milestone=nextMilestone(cfg.milestones,now);
  const tone=t=>t?`p27-tone-${t}`:'p27-tone-white';
  const dock=(cfg.dock||[]).map(d=>{
    const auto=d.date?dateStatus(d.date,now):null;
    const value=T(d.value)||auto?.text||'—';
    return {label:d.label,value,tone:d.tone||auto?.tone||'white'};
  });
  return <div className="p27">
    {top}
    <section className="p27-hero">
      <div className="p27-hero-bg" aria-hidden="true"><i className="p27-arc a1"/><i className="p27-arc a2"/><i className="p27-glow"/></div>
      <div className="p27-wrap p27-hero-grid">
        <div className="p27-hero-copy">
          {cfg.badge&&<span className="p27-pill"><i/>{T(cfg.badge)}</span>}
          <div className="p27-titlerow">
            {seal&&<img className="p27-selo" src={seal} alt={sealAlt||''} width={356} height={760}/>}
            <h1>{lines.map((l,i)=><span key={i}>{l}{(i<lines.length-1||accent)&&<br/>}</span>)}{accent&&<span>{accent}</span>}</h1>
          </div>
          {cfg.intro&&<p>{T(cfg.intro)}</p>}
          <div className="p27-actions">
            {cfg.primaryButton&&cfg.teams?.show!==false&&count>0&&<a className="p27-btn primary" href="#equipes">{cfg.primaryButton}</a>}
            {cfg.secondaryButton&&cfg.format?.show&&<a className="p27-btn" href="#formato">{cfg.secondaryButton}</a>}
          </div>
        </div>
        <div className="p27-art" aria-label={T(cfg.badge)}>
          {year&&<span className="p27-big" aria-hidden="true">{year}</span>}
          <img className="p27-art-forjax" src={logo} alt=""/>
        </div>
      </div>
      {(milestone||dock.length>0)&&<div className="p27-wrap"><div className="p27-dock">
        {milestone&&<div className="p27-count"><div><small>Próximo marco</small><b>{milestone.title}</b><span>{milestone.when}</span></div><div className="p27-count-n"><strong>{milestone.days}</strong><em>{milestone.days===1?'dia':'dias'}</em></div></div>}
        {dock.length>0&&<div className="p27-dock-items">{dock.map((d,i)=><div key={i}><small>{d.label}</small><b className={tone(d.tone)}>{d.value}</b></div>)}</div>}
      </div></div>}
      {(cfg.stats||[]).length>0&&<div className="p27-wrap"><div className="p27-stats">{cfg.stats.map((s,i)=><div key={i}><strong>{T(s.value)}</strong><span>{s.label}</span></div>)}</div></div>}
    </section>

    {cfg.teams?.show!==false&&<section className="p27-section" id="equipes"><div className="p27-wrap">
      <div className="p27-head"><div><small>{T(cfg.teams.eyebrow)}</small><h2>{count?T(cfg.teams.title)||'Equipes':'Equipes'}</h2></div>{count>0&&teamsAllHref&&<Link href={teamsAllHref}>Ver todas as equipes →</Link>}</div>
      {teamGroups.length>0?<div className="p27-division-groups">{teamGroups.map(group=><article className={`p27-division-group p27-division-${String(group.id).toLowerCase()}`} key={group.id}><header><div><small>DIVISÃO</small><h3>{group.title}</h3>{group.description&&<p>{group.description}</p>}</div><strong>{group.teams.length} equipes</strong></header><nav aria-label={`Consultar ${group.title}`}>{(group.links||[]).map(link=><Link key={link.href} href={link.href}>{link.label} →</Link>)}</nav>{group.teams.length?<div className="p27-teams">{group.teams.map(t=><Link href={teamHref(t)} className="p27-team" key={t.id||t.name}><span className="p27-team-logo">{t.logoUrl?<TeamLogo team={t} size={76}/>:<span className="p27-team-ini">{initials(t.name)}</span>}</span><b>{t.name}</b></Link>)}</div>:<p>As equipes desta divisão serão exibidas após a publicação dos vínculos oficiais.</p>}</article>)}</div>:count?<div className="p27-teams">{teams.map(t=><Link href={teamHref(t)} className="p27-team" key={t.id||t.name}><span className="p27-team-logo">{t.logoUrl?<TeamLogo team={t} size={76}/>:<span className="p27-team-ini">{initials(t.name)}</span>}</span><b>{t.name}</b></Link>)}</div>:<div className="p27-empty">As equipes serão exibidas aqui assim que forem cadastradas e publicadas pelo L3C Stats.</div>}
    </div></section>}

    {cfg.format?.show&&((cfg.format.cards||[]).length>0||(cfg.format.tiles||[]).length>0)&&<section className="p27-section p27-band" id="formato"><div className="p27-wrap">
      <div className="p27-head"><div><small>{cfg.format.eyebrow}</small><h2>{cfg.format.title}</h2></div></div>
      {(cfg.format.cards||[]).length>0&&<div className="p27-divs">{cfg.format.cards.map((c,i)=><article key={i} className={`p27-div p27-div-${c.color==='gold'?'gold':'red'}`}>
        <div className="p27-div-top">{c.badge&&<span className="p27-num">{c.badge}</span>}<div>{c.subtitle&&<small>{c.subtitle}</small>}<h3>{c.title}</h3></div></div>
        {(c.flow||[]).length>0&&<Flow tone={c.color==='gold'?'gold':'red'} steps={c.flow}/>}
        {(c.bullets||[]).length>0&&<ul>{c.bullets.map((b,j)=><li key={j}>{b}</li>)}</ul>}
      </article>)}</div>}
      {(cfg.format.tiles||[]).length>0&&<div className="p27-tiles">{cfg.format.tiles.map((t,i)=><div key={i}><strong>{t.value}</strong><span>{t.label}</span></div>)}</div>}
    </div></section>}

    {cfg.steps?.show&&(cfg.steps.items||[]).length>0&&<section className="p27-section"><div className="p27-wrap">
      <div className="p27-head"><div><small>{cfg.steps.eyebrow}</small><h2>{cfg.steps.title}</h2></div></div>
      <ol className="p27-steps">{cfg.steps.items.map((s,i)=><li key={i} className={s.done?'done':''}><span className="p27-dot">{s.done?'✓':i+1}</span>{s.when&&<em className="p27-when">{s.when}</em>}<b>{s.title}</b>{s.desc&&<small>{s.desc}</small>}</li>)}</ol>
    </div></section>}

    {cfg.links?.show!==false&&(cfg.links.items||[]).length>0&&<section className="p27-section"><div className="p27-wrap">
      <div className="p27-head"><div><small>{cfg.links.eyebrow}</small><h2>{cfg.links.title}</h2></div></div>
      <div className="p27-grid4">{cfg.links.items.map((l,i)=>{
        const inner=<><b>{l.title}</b>{l.text&&<span>{l.text}</span>}{l.cta&&<em>{l.cta}</em>}</>;
        return l.href?.startsWith('/')?<Link key={i} className="p27-link" href={l.href}>{inner}</Link>:<a key={i} className="p27-link" href={l.href||'#'}>{inner}</a>;
      })}</div>
    </div></section>}
    {bottom}
  </div>;
}
