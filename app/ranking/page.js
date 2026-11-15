import {notFound} from 'next/navigation';
import RankingView from '../../components/RankingView';
import {getScope} from '../../lib/scopes';
export const metadata={title:'Ranking oficial',description:'Ranking oficial de atletas do Adulto Livre: pontuação, presença mínima e premiação.'};
export default async function Page({searchParams}){const scope=await getScope('adulto');if(!scope)notFound();const sp=(await searchParams)||{};return <RankingView scope={scope} sp={sp}/>}
