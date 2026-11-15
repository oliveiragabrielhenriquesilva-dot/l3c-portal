import {notFound} from 'next/navigation';
import {JogosView} from '../../../components/PortalViews';
import {getScope} from '../../../lib/scopes';
export const metadata={title:'Jogos | Liga Master'};
export default async function Page({searchParams}){const scope=await getScope('master');if(!scope)notFound();const sp=(await searchParams)||{};return <JogosView scope={scope} sp={sp}/>}
