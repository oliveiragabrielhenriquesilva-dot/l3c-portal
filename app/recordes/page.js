import {redirect} from 'next/navigation';
export const metadata={title:'Recordes'};
// Os recordes ficam dentro de Líderes, no mesmo modelo de toda competição.
export default async function Recordes({searchParams}){
  const sp=(await searchParams)||{};
  const category=String(sp.categoria||'adulto');
  redirect(category==='master'?'/master/lideres/?aba=recordes':'/lideres/?aba=recordes');
}
