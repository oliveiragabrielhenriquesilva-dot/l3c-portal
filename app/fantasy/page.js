import './fantasy.css';
import FantasyClient from './FantasyClient';

export const metadata={
  title:'L3C Fantasy',
  description:'Monte seu time com atletas da Liga 3 Colinas e dispute o ranking oficial do L3C Fantasy.',
  openGraph:{title:'L3C Fantasy',description:'Monte seu time. Domine a rodada.',images:['/assets/brand/l3c-fantasy.png']},
};
export const dynamic='force-dynamic';
export default function FantasyPage(){return <FantasyClient/>}
