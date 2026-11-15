import {notFound} from 'next/navigation';
import {JogosView} from '../../components/PortalViews';
import {getScope} from '../../lib/scopes';
export const metadata={title:'Jogos e resultados',description:'Agenda, resultados e súmulas de todos os jogos da Liga Forjax de Basquete.'};
export default async function Page({searchParams}){const scope=await getScope('adulto');if(!scope)notFound();const sp=(await searchParams)||{};return <JogosView scope={scope} sp={sp}/>}
