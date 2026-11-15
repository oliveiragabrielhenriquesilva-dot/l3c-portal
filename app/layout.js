import {siteOrigin} from '../lib/site-origin';
import './globals.css';
import {Suspense} from 'react';
import Chrome from '../components/Chrome';
import {getScopes} from '../lib/scopes';

const SITE_URL=siteOrigin();
const SITE_TITLE='Liga Forjax de Basquete · Liga 3 Colinas';
const SITE_DESC='Site oficial da Liga Forjax de Basquete: jogos, classificação, líderes, equipes e atletas da Liga 3 Colinas.';
// metadataBase + Open Graph: o link compartilhado no WhatsApp/Instagram aparece com título, descrição e imagem.
export const metadata={
  metadataBase:new URL(SITE_URL),
  robots:process.env.L3C_PUBLIC_INDEXING==='false'?{index:false,follow:false}:undefined,
  title:{default:SITE_TITLE,template:'%s | Liga Forjax'},
  description:SITE_DESC,
  openGraph:{type:'website',locale:'pt_BR',siteName:'Liga 3 Colinas',title:SITE_TITLE,description:SITE_DESC,images:[{url:'/l3c-logo-oficial.png',alt:'Liga 3 Colinas'}]},
  twitter:{card:'summary',title:SITE_TITLE,description:SITE_DESC,images:['/l3c-logo-oficial.png']},
};
export const dynamic='force-dynamic';

// O menu de competições vem do cadastro do L3C Stats: competição nova publicada = aparece aqui sozinha.
export default async function RootLayout({children}){
  let scopes=[];
  try{
    scopes=(await getScopes()).map(s=>({key:s.key,name:s.name,short:s.key==='adulto'?'Liga Forjax':s.key==='master'?'Liga Master':s.name,base:s.base,logo:s.logo,defaultSeasonKey:s.defaultSeasonKey,seasonIds:s.seasons.map(x=>x.id)}));
  }catch{}
  return <html lang="pt-BR"><body><Suspense fallback={null}><Chrome scopes={scopes}>{children}</Chrome></Suspense></body></html>;
}
