import {cookies} from 'next/headers';
import CadastroClient from './CadastroClient';

export const metadata={title:'Cadastro de Acesso | Liga 3 Colinas'};

export default async function CadastroPage({searchParams}){
  const [sp,jar]=await Promise.all([searchParams,cookies()]);
  const requested=String(sp?.perfil||'').toLowerCase();
  const initialProfile=['arbitragem','arbitro','mesario'].includes(requested)?'ARBITRAGEM':(['comissao','comissao-tecnica','comissao_tecnica','tecnico','staff'].includes(requested)?'COMISSAO_TECNICA':'ATHLETE');
  return <CadastroClient initialProfile={initialProfile} loggedIn={Boolean(jar.get('l3c_session')?.value)}/>;
}
