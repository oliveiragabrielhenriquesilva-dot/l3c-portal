import Link from 'next/link';
import {PageHero,Sponsors} from '../../components/SiteChrome';
import {ContextNav,KpiStrip,PageIntro,EmptyPortal} from '../../components/PortalDirectory';
import {newsFallback} from '../../lib/site';

export const metadata={title:'Notícias',description:'Notícias e novidades da Liga Forjax de Basquete.'};
export default function Noticias(){
  const news=newsFallback();
  const featured=news[0]||null;
  const secondary=news.slice(1);
  return <main className="portal-directory-page news-v0515">
    <Sponsors/>
    <PageHero title="Notícias" subtitle="Redação oficial, bastidores e histórias da Liga." eyebrow="Redação oficial"/>
    <section className="section shell">
      <ContextNav items={[[`/noticias/`,'Notícias',true],['/adriano/','AdrIAno',false],['/master/','Liga Master',false],['/temporada-2027/','Temporada 2027',false]]}/>
      <KpiStrip items={[[news.length,'Matérias no acervo'],['2026','Temporada principal'],['AdrIAno','Análises de jogos'],['Oficial','Canal editorial']]}/>
      <PageIntro title="Central de conteúdo" description="Notícias institucionais e esportivas ficam separadas das análises automáticas do AdrIAno, mas conectadas pelo mesmo portal." aside={<Link className="btn" href="/adriano/">Abrir AdrIAno</Link>}/>
      {featured?<article className="portal-news-feature"><div><small>{featured.date}</small><h2>{featured.title}</h2><p>Matéria em destaque do acervo oficial da Liga Forjax.</p><Link className="btn primary" href={`/noticias/${featured.slug}/`}>Ler matéria</Link></div><div className="portal-news-feature-brand"><img src="/assets/brand/adriano-ia.png" alt=""/><span>Portal oficial</span><strong>Liga Forjax</strong></div></article>:<EmptyPortal title="Nenhuma matéria publicada" text="As notícias aparecerão aqui assim que forem publicadas no acervo oficial."/>}
      <div className="portal-news-layout"><div className="portal-news-grid">{secondary.map(item=><Link className="portal-news-card" href={`/noticias/${item.slug}/`} key={item.slug}><small>{item.date}</small><h3>{item.title}</h3><p>Conteúdo preservado no arquivo editorial do portal.</p><span>Ler notícia →</span></Link>)}</div><aside className="portal-news-aside"><div className="panel-box"><div className="panel-box-head"><h3>Outras centrais</h3></div><Link href="/adriano/"><b>AdrIAno</b><span>Análises de todas as partidas com dados oficiais.</span></Link><Link href="/temporadas/"><b>Temporadas</b><span>Arquivo 2025, 2026 e preparação para 2027.</span></Link><Link href="/recordes/"><b>Recordes</b><span>Melhores marcas individuais do acervo.</span></Link></div></aside></div>
    </section>
  </main>;
}
