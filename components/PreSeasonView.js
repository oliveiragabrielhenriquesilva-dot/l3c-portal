// Pré-temporada de uma competição/temporada do catálogo (portal /c/<competição>, /master etc.).
import {Sponsors} from './SiteChrome';
import {PortalShell} from './PortalParts';
import PreSeasonTemplate from './PreSeasonTemplate';
import {teamHref,sectionPath} from '../lib/scopes';
import {genericDefaults,mergePreSeason} from '../lib/preseason';

export default function PreSeasonView({scope,season,brand,data}){
  const teams=(data?.teams||[]).map(x=>x?.team||x).filter(t=>t?.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  const start=season.startDate?String(season.startDate).slice(0,10):'';
  const cfg=mergePreSeason(season.preSeason,genericDefaults({compName:scope.competition?.name||scope.name,year:season.year,startDate:start,name:season.officialName||scope.name,count:teams.length}));
  return <PortalShell scope={scope} className="home-generic">
    <PreSeasonTemplate cfg={cfg} logo={brand.logo} seal={brand.seal} sealAlt={brand.sealAlt} year={season.year} teams={teams}
      teamHref={t=>teamHref(scope,season,t.name)} teamsAllHref={`${sectionPath(scope,'equipes')}?temporada=${season.key}`}
      bottom={<Sponsors/>}/>
  </PortalShell>;
}
