import Link from 'next/link';
import {sectionPath} from '../lib/scopes';

// Cabeçalho único de todas as páginas de portal: logo da temporada (cadastro), nome oficial e selo da competição.
export function PortalHeader({brand,title,subtitle}){
  return <header className="ld-head">
    {brand?.logo&&<img className="ld-logo" src={brand.logo} alt={brand.league||''}/>}
    <div className="ld-headtext">
      <span className="ld-eyebrow">{String(brand?.league||'').toUpperCase()} · ESTATÍSTICAS</span>
      <h1>{title}</h1>
      {subtitle&&<p>{subtitle}</p>}
    </div>
    {brand?.seal&&<img className="ld-seal" src={brand.seal} alt={brand.sealAlt||''}/>}
  </header>;
}

// Menu horizontal de temporadas (nomes públicos vindos do cadastro). O mesmo em todas as páginas.
export function SeasonMenu({scope,season,section,extraQuery='',children}){
  return <div className="ld-toolbar">
    <div className="ld-seasons" role="tablist" aria-label="Temporada">
      <span className="ld-label">TEMPORADA</span>
      {scope.seasons.map(s=><Link key={s.key} className={s.key===season.key?'active':''} href={`${sectionPath(scope,section)}?temporada=${encodeURIComponent(s.key)}${extraQuery}`}>{s.label}</Link>)}
    </div>
    {children}
  </div>;
}

export function PortalShell({scope,children,className=''}){
  return <main className={`portal-directory-page ld-page ${scope?.key==='master'?'master-page ld-master':''} ${className}`}>{children}</main>;
}
