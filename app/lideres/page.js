import {notFound} from 'next/navigation';
import LideresView from '../../components/LideresView';
import {getScope} from '../../lib/scopes';
export const metadata={title:'Líderes e recordes',description:'Líderes individuais e recordes de todos os tempos do Adulto Livre.'};
export default async function Page({searchParams}){const scope=await getScope('adulto');if(!scope)notFound();const sp=(await searchParams)||{};return <LideresView scope={scope} sp={sp}/>}
