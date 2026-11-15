import {notFound} from 'next/navigation';
import {AtletasView} from '../../components/PortalViews';
import {getScope} from '../../lib/scopes';
export const metadata={title:'Atletas',description:'Perfis e estatísticas dos atletas da Liga Forjax de Basquete.'};
export default async function Page({searchParams}){const scope=await getScope('adulto');if(!scope)notFound();const sp=(await searchParams)||{};return <AtletasView scope={scope} sp={sp}/>}
