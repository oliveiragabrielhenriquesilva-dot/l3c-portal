import {notFound} from 'next/navigation';
import {EquipesView} from '../../../components/PortalViews';
import {getScope} from '../../../lib/scopes';
export const metadata={title:'Equipes | Liga Master'};
export default async function Page({searchParams}){const scope=await getScope('master');if(!scope)notFound();const sp=(await searchParams)||{};return <EquipesView scope={scope} sp={sp}/>}
