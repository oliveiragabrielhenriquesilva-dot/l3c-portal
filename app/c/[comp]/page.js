import {notFound} from 'next/navigation';
import {HomeView} from '../../../components/PortalViews';
import {getScope} from '../../../lib/scopes';
export async function generateMetadata({params}){const {comp}=await params;const scope=await getScope(comp);return {title:scope?.name||'Competição'}}
export default async function CompetitionHome({params,searchParams}){
  const {comp}=await params;
  const scope=await getScope(comp);
  if(!scope)notFound();
  const sp=(await searchParams)||{};
  return <HomeView scope={scope} sp={sp}/>;
}
