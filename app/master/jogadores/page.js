import {notFound} from 'next/navigation';
import {AtletasView} from '../../../components/PortalViews';
import {getScope} from '../../../lib/scopes';
export const metadata={title:'Atletas | Liga Master'};
export default async function Page({searchParams}){const scope=await getScope('master');if(!scope)notFound();const sp=(await searchParams)||{};return <AtletasView scope={scope} sp={sp}/>}
