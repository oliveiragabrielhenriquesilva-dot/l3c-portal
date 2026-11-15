import {notFound} from 'next/navigation';
import {ClassificacaoView} from '../../components/PortalViews';
import {getScope} from '../../lib/scopes';
export const metadata={title:'Classificação',description:'Tabela de classificação da Liga Forjax de Basquete.'};
export default async function Page({searchParams}){const scope=await getScope('adulto');if(!scope)notFound();const sp=(await searchParams)||{};return <ClassificacaoView scope={scope} sp={sp}/>}
