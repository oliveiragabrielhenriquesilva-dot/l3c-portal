import Link from 'next/link';
import {navigationHref} from '../lib/navigation-context';
import {BRAND} from '../lib/brand';
import {SOCIAL,CONTACT,CURRENT_SEASON_LABEL} from '../lib/site-config';

const forjaxNav=[
  ['/','Início'],['/jogos/','Jogos'],['/classificacao/','Classificação'],
  ['/lideres/','Líderes'],['/equipes/','Equipes'],['/atletas/','Atletas'],['/fantasy/','Fantasy'],['/temporadas/','Temporadas'],
  ['/noticias/','Notícias'],['/sobre/','Sobre']
];
const masterNav=[['/master/','Início'],['/master/jogos/','Jogos'],['/master/classificacao/','Classificação'],['/master/lideres/','Líderes'],['/master/equipes/','Equipes'],['/master/jogadores/','Atletas']];

function SocialIcon({type}){
  if(type==='instagram')return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.4" cy="6.7" r="1.2" fill="currentColor"/></svg>;
  if(type==='youtube')return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7.2a3 3 0 0 0-2.1-2.1C17 4.6 12 4.6 12 4.6s-5 0-6.9.5A3 3 0 0 0 3 7.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 16.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.8 31 31 0 0 0-.4-4.8Z" fill="currentColor"/><path d="m10 15.3 5.2-3.3L10 8.7v6.6Z" fill="#090b0e"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.3 8.3H2.2V21h3.1V8.3ZM3.8 3A1.8 1.8 0 1 0 3.8 6.6 1.8 1.8 0 0 0 3.8 3ZM21 13.7c0-3.8-2-5.6-4.7-5.6-2.2 0-3.1 1.2-3.7 2V8.3H9.5V21h3.1v-6.3c0-1.7.3-3.3 2.4-3.3 2 0 2 1.9 2 3.4V21H21v-7.3Z" fill="currentColor"/></svg>;
}

function AccountIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}

const sectionNav=base=>[[base,'Início'],[`${base}jogos/`,'Jogos'],[`${base}classificacao/`,'Classificação'],[`${base}lideres/`,'Líderes'],[`${base}equipes/`,'Equipes'],[`${base}atletas/`,'Atletas']];
// Competições do cadastro do L3C Stats (passadas pelo layout). Sem catálogo, mantém as duas históricas.
const FALLBACK_SCOPES=[
  {key:'adulto',name:'Adulto Livre',short:'Liga Forjax',base:'/',logo:BRAND.logo},
  {key:'master',name:'Liga Master',short:'Liga Master',base:'/master/',logo:'/assets/brand/master-logo-v0518.png'},
];
function scopeList(scopes){return scopes&&scopes.length?scopes:FALLBACK_SCOPES}
// Adulto e Master mantêm as marcas oficiais já homologadas no cabeçalho; as demais competições usam a logo do cadastro.
function scopeLogo(sc){return sc.key==='adulto'?BRAND.logo:sc.key==='master'?'/assets/brand/master-logo-v0518.png':(sc.logo||'/assets/brand/l3c-logo.png')}

function GlobalSwitcher({scopes,activeKey='adulto'}){
  return <div className="fe-global-switcher"><div className="fe-global-switcher-inner">
    <nav className="fe-competitions" aria-label="Competições">
      {scopeList(scopes).map(sc=><Link key={sc.key} className={sc.key===activeKey?'active':''} href={sc.base}><span className="fe-comp-mark"><img src={scopeLogo(sc)} alt=""/></span><span>{sc.short||sc.name}</span></Link>)}
    </nav>
    <nav className="fe-social-links" aria-label="Redes sociais e temporada 2027">
      <Link className="fe-season2027-top-link" href="/temporada-2027/">Temporada 2027</Link>
      <Link className="fe-adriano-top-link" href={activeKey==='master'?'/adriano/?categoria=master&temporada=2026':'/adriano/'}><img src="/assets/brand/adriano-ia.png" alt=""/><span>Adr<span className="ia">IA</span>no</span></Link>
      {SOCIAL.instagram&&<a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Liga"><span className="fe-social-icon"><SocialIcon type="instagram"/></span></a>}
      {SOCIAL.youtube&&<a href={SOCIAL.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube da Liga"><span className="fe-social-icon"><SocialIcon type="youtube"/></span></a>}
      {SOCIAL.linkedin&&<a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn da Liga"><span className="fe-social-icon"><SocialIcon type="linkedin"/></span></a>}
      <Link className="fe-account-link" href="/entrar/"><span className="fe-account-icon"><AccountIcon/></span><span className="fe-account-text">Acessar minha conta</span></Link>
    </nav>
  </div></div>
}

function PortalHeader({scopes,activeKey='adulto',path='/',navigation}){
  const list=scopeList(scopes);
  const sc=list.find(x=>x.key===activeKey)||list[0];
  const master=sc.key==='master';
  const adulto=sc.key==='adulto';
  const nav=adulto?forjaxNav:master?masterNav:sectionNav(sc.base);
  const logo=scopeLogo(sc);
  const home=sc.base;
  const title=adulto?'Liga Forjax':master?'Liga Master':(sc.short||sc.name);
  const small=adulto?'de Basquete':master?'AVAB · L3C':'Liga 3 Colinas';
  const clean=value=>String(value).replace(/\/+$/,'')||'/';
  const active=(href)=>clean(href)===clean(home)?clean(path)===clean(home):clean(path).startsWith(clean(href));
  return <><GlobalSwitcher scopes={scopes} activeKey={sc.key}/><header className={`fe-site-header ${master?'is-master':''} ${path==='/'?'is-home':''}`}><div className="fe-site-header-inner">
    <Link className="fe-site-brand" href={home}><span className="fe-site-brand-mark"><img src={logo} alt={title}/></span><span>{title}<small>{small}</small></span></Link>
    <nav className="fe-site-nav">{nav.map(([h,l])=><Link className={active(h)?'active':''} key={h} href={navigationHref(h,navigation)}>{l}</Link>)}</nav>
  </div></header></>;
}

export function Header({path='/',scopes,activeKey='adulto',navigation}){return <PortalHeader scopes={scopes} activeKey={activeKey} path={path} navigation={navigation}/>}
export function MasterHeader({path='/master/',scopes}){return <PortalHeader scopes={scopes} activeKey="master" path={path}/>}

export function CommercialPartners(){const master=['Patrocinador Master','Forjax CT','/assets/sponsors/forjax.png'];const firstRow=[
  ['Bola Oficial','Molten','/assets/sponsors/molten-current.png'],
  ['Patrocinador','Gatorade','/assets/sponsors/gatorade-current.png'],
  ['Patrocinador','UniCesumar','/assets/sponsors/unicesumar-current.png'],
];const secondRow=[
  ['Uniforme Oficial','Dsportivo','/assets/sponsors/dsportivo-current.png'],
  ['Arena Oficial','Chui Esportes','/assets/sponsors/chui-current.png'],
  ['Canal Oficial','Franca Esportes','/assets/sponsors/franca-esportes.png'],
  ['Fotos Oficiais','Trinta Dezoito','/assets/sponsors/trinta-dezoito.png'],
];const partner=([label,name,src])=><div className="commercial-partner-item" key={name}><div className="commercial-label"><span></span><b>{label}</b><span></span></div><img src={src} alt={name}/></div>;return <section className="commercial-partners" aria-label="Parceiros oficiais da Liga"><div className="wide-shell"><div className="commercial-partner-master"><div className="commercial-partner-item master"><div className="commercial-label"><span></span><b>{master[0]}</b><span></span></div><img src={master[2]} alt={master[1]}/></div></div><div className="commercial-partner-row three">{firstRow.map(partner)}</div><div className="commercial-partner-row four">{secondRow.map(partner)}</div></div></section>}

export function Footer({navigation}={}){return <><CommercialPartners/><footer className="premium-footer"><div className="wide-shell footer-main"><div className="footer-brand"><img src={BRAND.logo} alt="Liga Forjax"/><div><b>Liga Forjax de Basquete</b><strong>{BRAND.tagline}</strong></div></div><div className="footer-col"><h4>Campeonato</h4><Link href={navigationHref('/jogos/',navigation)}>Jogos</Link><Link href={navigationHref('/classificacao/',navigation)}>Classificação</Link><Link href={navigationHref('/lideres/',navigation)}>Líderes</Link><Link href={navigationHref('/equipes/',navigation)}>Equipes</Link><Link href={navigationHref('/atletas/',navigation)}>Atletas</Link></div><div className="footer-col"><h4>A Liga</h4><Link href="/noticias/">Notícias</Link><Link href="/adriano/">Conheça o AdrIAno</Link><Link href="/sobre/">Sobre a Liga</Link>{CONTACT.email&&<a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>}{CONTACT.whatsapp&&<a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp da Liga</a>}<Link href="/">Página inicial</Link></div></div><div className="footer-copy"><span>© {new Date().getFullYear()} <b>Liga Forjax de Basquete</b>. Todos os direitos reservados.</span><span>Site oficial <i>•</i> {CURRENT_SEASON_LABEL}</span></div></footer></>}

export function Sponsors(){const sponsors=[
  ['Molten','/assets/sponsors/molten-current.png'],['Dsportivo','/assets/sponsors/dsportivo-current.png'],['Chui Esportes','/assets/sponsors/chui-current.png'],['Gatorade','/assets/sponsors/gatorade-current.png'],['UniCesumar','/assets/sponsors/unicesumar-current.png'],['Trinta Dezoito','/assets/sponsors/trinta-dezoito.png'],['Cozinha Santomaz','/assets/sponsors/cozinha-santomaz.png']
];return <section className="fe-sponsors fe-sponsors-top" aria-label="Patrocinadores oficiais"><div className="fe-sponsors-inner"><div className="fe-sponsors-heading"><span>Patrocinadores oficiais</span></div><div className="fe-sponsors-grid" style={{'--fe-sponsor-cols':sponsors.length}}>{sponsors.map(([n,u])=><div className="fe-sponsor-card" key={n} title={n}><img src={u} alt={n}/></div>)}</div></div></section>}

export function PageHero({title,subtitle,eyebrow='Site oficial'}){return <section className="page-hero"><div className="shell"><small>{eyebrow}</small><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></section>}
