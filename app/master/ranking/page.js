import {notFound} from 'next/navigation';
import RankingView from '../../../components/RankingView';
import {getScope} from '../../../lib/scopes';
export const metadata={title:'Ranking oficial | Liga Master'};
export default async function Page({searchParams}){const scope=await getScope('master');if(!scope)notFound();const sp=(await searchParams)||{};return <RankingView scope={scope} sp={sp}/>}
