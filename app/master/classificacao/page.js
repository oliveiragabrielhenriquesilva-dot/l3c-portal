import {notFound} from 'next/navigation';
import {ClassificacaoView} from '../../../components/PortalViews';
import {getScope} from '../../../lib/scopes';
export const metadata={title:'Classificação | Liga Master'};
export default async function Page({searchParams}){const scope=await getScope('master');if(!scope)notFound();const sp=(await searchParams)||{};return <ClassificacaoView scope={scope} sp={sp}/>}
