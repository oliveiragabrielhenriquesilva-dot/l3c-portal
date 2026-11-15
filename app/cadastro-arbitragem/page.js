import {redirect} from 'next/navigation';
export const metadata={title:'Cadastro de Arbitragem e Mesa',description:'Cadastro de árbitros e oficiais de mesa da Liga Forjax de Basquete.'};
export default function CadastroArbitragemPage(){redirect('/cadastro/?perfil=arbitragem')}
