import {siteOrigin} from '../lib/site-origin';
export default function robots(){
  const base=siteOrigin();
  if(process.env.L3C_PUBLIC_INDEXING==='false')return {rules:[{userAgent:'*',disallow:'/'}]};
  return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/minha-conta','/painel-equipe','/entrar','/transmissao','/arbitragem','/atleta/']}],sitemap:`${base}/sitemap.xml`};
}
