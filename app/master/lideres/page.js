import {notFound} from 'next/navigation';
import LideresView from '../../../components/LideresView';
import {getScope} from '../../../lib/scopes';
export const metadata={title:'Líderes e recordes | Liga Master'};
export default async function Page({searchParams}){const scope=await getScope('master');if(!scope)notFound();const sp=(await searchParams)||{};return <LideresView scope={scope} sp={sp}/>}
