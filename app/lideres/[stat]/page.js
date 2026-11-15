import {notFound,redirect} from 'next/navigation';
// O ranking completo agora é a própria página de Líderes (?todos=1), no mesmo modelo de todas as competições.
const STATS={pontos:'points',rebotes:'rebounds',assistencias:'assists',roubos:'steals',tocos:'blocks',eficiencia:'efficiency'};
export function generateStaticParams(){return Object.keys(STATS).map(stat=>({stat}))}
export default async function LiderStat({params,searchParams}){
  const {stat}=await params;
  const key=STATS[stat];
  if(!key)notFound();
  const sp=(await searchParams)||{};
  const temporada=String(sp.temporada||'');
  redirect(`/lideres/?${temporada?`temporada=${encodeURIComponent(temporada)}&`:''}estatistica=${key}&todos=1`);
}
