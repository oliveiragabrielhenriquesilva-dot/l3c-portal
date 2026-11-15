import {notFound} from 'next/navigation';
import {JogosView,ClassificacaoView,EquipesView,AtletasView} from '../../../../components/PortalViews';
import LideresView from '../../../../components/LideresView';
import RankingView from '../../../../components/RankingView';
import {getScope} from '../../../../lib/scopes';
const VIEWS={jogos:JogosView,classificacao:ClassificacaoView,equipes:EquipesView,atletas:AtletasView,jogadores:AtletasView,lideres:LideresView,recordes:LideresView,ranking:RankingView};
const TITLES={jogos:'Jogos',classificacao:'Classificação',equipes:'Equipes',atletas:'Atletas',jogadores:'Atletas',lideres:'Líderes e recordes',recordes:'Recordes',ranking:'Ranking oficial'};
export async function generateMetadata({params}){const {comp,section}=await params;const scope=await getScope(comp);return {title:`${TITLES[section]||'Portal'} | ${scope?.name||'Competição'}`}}
export default async function CompetitionSection({params,searchParams}){
  const {comp,section}=await params;
  const View=VIEWS[section];
  if(!View)notFound();
  const scope=await getScope(comp);
  if(!scope)notFound();
  const sp={...((await searchParams)||{})};
  if(section==='recordes')sp.aba='recordes';
  return <View scope={scope} sp={sp}/>;
}
