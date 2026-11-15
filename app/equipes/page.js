import {notFound} from 'next/navigation';
import {EquipesView} from '../../components/PortalViews';
import {getScope} from '../../lib/scopes';
export const metadata={title:'Equipes',description:'Todas as equipes da Liga Forjax de Basquete, com elenco, jogos e histórico.'};
export default async function Page({searchParams}){const scope=await getScope('adulto');if(!scope)notFound();const sp=(await searchParams)||{};return <EquipesView scope={scope} sp={sp}/>}
