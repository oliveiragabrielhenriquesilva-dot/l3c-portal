import PreSeasonHome from '../../components/PreSeasonHome';
import ApprovedSeasonHome from '../../components/ApprovedSeasonHome';
import {getScope} from '../../lib/scopes';
import {homeMode} from '../../lib/home-mode';
export const metadata={title:'Temporada 2027 · Adulto Livre',description:'Equipes, jogos e classificação das divisões Elite e Acesso da Liga 3 Colinas 2027.'};
export default async function Temporada2027(){
 const scope=await getScope('adulto');
 const target=(scope?.allSeasons||scope?.seasons||[]).find(s=>Number(s.year)===2027);
 if(scope&&target&&homeMode(target,process.env.L3C_HOME_MODE)==='season2027')return <ApprovedSeasonHome scope={scope} season={target}/>;
 return <PreSeasonHome page/>;
}
