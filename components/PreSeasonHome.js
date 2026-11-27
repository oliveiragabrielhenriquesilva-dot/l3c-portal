import Link from 'next/link';
import {Sponsors} from './SiteChrome';
import PreSeasonTemplate from './PreSeasonTemplate';
import {mergePreSeason} from '../lib/preseason';
import {
  apiFetch,getOverview,getMasterOverview,isLiveOrUpcomingGame,isLivePublicGame,liveFirst,
  eventSlugForGame,masterGameSlug,championsFallback,slugify,teamLogo,
} from '../lib/site';

// Home de pré-temporada. Só é usada quando L3C_HOME_MODE=pre2027 (ver app/page.js).
// Sem a variável, o site continua exibindo a home da temporada 2026 normalmente.

const SEASON_2027_ID=process.env.L3C_ADULTO_2027_SEASON_ID||'l3c_season_adulto_livre_2027';
const SP=-3*3600*1000; // America/Sao_Paulo (sem horário de verão)
const at=(y,m,d)=>Date.UTC(y,m-1,d)-SP; // início do dia em Brasília

function nowBR(){return Date.now()}

function athleteStatus(now){
  if(now<at(2026,11,1))return {text:'ABRE EM 1º/NOV',tone:'warn'};
  if(now<at(2026,12,1))return {text:'ABERTO ATÉ 30/NOV',tone:'ok'};
  if(now<at(2027,3,1))return {text:'2ª JANELA: 1 A 5/MAR',tone:'warn'};
  if(now<at(2027,3,6))return {text:'ABERTO ATÉ 5/MAR',tone:'ok'};
  return {text:'ENCERRADO',tone:'mute'};
}
function congressStatus(now){return now<at(2026,10,29)?{text:'28/10',tone:'mute'}:{text:'REALIZADO',tone:'ok'}}


function initials(name=''){const w=String(name).trim().split(/\s+/);return ((w[0]?.[0]||'')+(w[1]?.[0]||w[0]?.[1]||'')).toUpperCase()}

async function loadTeams(){
  const api=await apiFetch(`/v1/public/seasons/${encodeURIComponent(SEASON_2027_ID)}`);
  const list=(Array.isArray(api?.teams)?api.teams:[]).map(x=>({...x.team,division:x.division||null})).filter(t=>t?.name);
  return list.sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR')).map(t=>({...t,logoUrl:t.logoUrl||teamLogo(t.name)||null}));
}

// Logo do hero vem do diretório público (logo da competição cadastrada no L3C Stats); se faltar, usa o arquivo local.
const HERO_LOGO_FALLBACK='/assets/brand/forjax-l3c-2027.webp';
async function loadHeroLogo(){
  try{
    const dir=await apiFetch('/v1/public/directory');
    const list=Array.isArray(dir?.seasons)?dir.seasons:[];
    const s=list.find(x=>x?.id===SEASON_2027_ID)||list.find(x=>x?.featured&&/adulto/i.test(String(x?.competition?.category||x?.competition?.name||'')));
    return {logo:s?.logoUrl||s?.competition?.logoUrl||HERO_LOGO_FALLBACK,seal:s?.sealUrl||s?.competition?.sealUrl||(s?.logoUrl&&s?.competition?.logoUrl&&s.logoUrl!==s.competition.logoUrl?s.competition.logoUrl:null),preSeason:s?.preSeason||null,startDate:s?.startDate||null};
  }catch{return {logo:HERO_LOGO_FALLBACK,seal:null,preSeason:null,startDate:null}}
}

async function loadNextGame(){
  try{
    const [adulto,master]=await Promise.all([getOverview().catch(()=>null),getMasterOverview().catch(()=>null)]);
    const pool=[
      ...(adulto?.legacyGames||[]).filter(isLiveOrUpcomingGame).map(g=>({g,href:`/event/${eventSlugForGame(g)}/`,label:'Liga Forjax · Adulto Livre 2026',logo:'/assets/brand/forjax-logo.png'})),
      ...(master?.legacyGames||[]).filter(isLiveOrUpcomingGame).map(g=>({g,href:`/master/event/${masterGameSlug(g)}/`,label:'Liga Master 2026',logo:'/assets/brand/master-logo-v0518.png'})),
    ];
    const first=liveFirst(pool.map(p=>p.g))[0];
    return pool.find(p=>p.g===first)||null;
  }catch(e){return null}
}

function fmtDate(iso){
  if(!iso)return '';
  const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';
  const p=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).formatToParts(d).reduce((a,x)=>({...a,[x.type]:x.value}),{});
  return `${p.day}/${p.month}/${p.year} · ${p.hour}:${p.minute}`;
}

function Trophy(){return <svg viewBox="0 0 64 64" width="40" height="40" aria-hidden="true"><path d="M18 8h28v8c0 12-5.7 20.7-14 23-8.3-2.3-14-11-14-23V8Z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M18 14H9v5c0 9 4.5 14 12 14M46 14h9v5c0 9-4.5 14-12 14M32 39v10M22 56h20M26 49h12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>}



// Padrão do Adulto Livre 2027 (o conteúdo que antes era fixo no código). O painel (Temporada > Pré-temporada) sobrescreve qualquer campo.
function adultoDefaults(count,now){
  const athletes=athleteStatus(now);
  const congress=congressStatus(now);
  const n=count||20;
  return {
    badge:'Pré-temporada · Adulto Livre 2027',
    headline:'{equipes} equipes.\nUma nova',headlineAccent:'temporada.',
    intro:'As equipes da Temporada 2027 já estão definidas. Conheça os times, veja o formato da competição e acompanhe a preparação até a primeira rodada.',
    primaryButton:'Conheça as equipes',secondaryButton:'Como será a temporada',
    dock:[
      {label:'Inscrição de equipes',value:`ENCERRADA · ${n} EQUIPES`,tone:'ok'},
      {label:'Cadastro de atletas',value:athletes.text,tone:athletes.tone},
      {label:'Congresso Técnico',value:congress.text,tone:congress.tone},
      {label:'Início da temporada',value:'JANEIRO / 2027',tone:'white'},
    ],
    milestones:[
      {label:'Congresso Técnico',date:'2026-10-28'},{label:'Abertura do cadastro de atletas',date:'2026-11-01'},
      {label:'Fim da 1ª janela de cadastro',date:'2026-12-01'},{label:'2ª janela de cadastro',date:'2027-03-01'},
    ],
    stats:[{value:String(n),label:'equipes confirmadas'},{value:'8',label:'na Divisão Elite'},{value:'12',label:'na Divisão de Acesso'},{value:'2×',label:'janelas de cadastro de atletas'}],
    teams:{show:true,eyebrow:'Equipes 2027',title:'As {equipes} equipes confirmadas'},
    format:{show:true,eyebrow:'Regulamento 2027',title:'Como será a temporada',cards:[
      {color:'red',badge:'8',subtitle:'Divisão Elite',title:'14 jogos na fase classificatória',flow:['Todos contra todos (ida e volta)','Quartas','Semifinais','Final · melhor de 3'],bullets:['Os 8 avançam ao mata-mata','Quartas e semifinais em jogo único','O vencedor da final é o Campeão Geral da Liga 3 Colinas 2027']},
      {color:'gold',badge:'12',subtitle:'Divisão de Acesso',title:'11 jogos na fase classificatória',flow:['Todos contra todos (turno único)','Play-in 5º ao 12º','Quartas','Semifinais','Final · melhor de 3'],bullets:['Os 4 primeiros vão direto às quartas','Quartas e semifinais em jogo único','O campeão sobe à Elite de 2028']},
    ],tiles:[
      {value:'4×10',label:'minutos por quarto · prorrogação de 5 min'},{value:'24/14',label:'segundos de posse · regras FIBA'},
      {value:'2·1·0',label:'vitória · derrota · derrota por W.O.'},{value:'18+',label:'anos · até 20 atletas inscritos por equipe'},
      {value:'8–12/MAR',label:'janela de transferências'},{value:'3 dias',label:'úteis para publicar súmula e boxscore'},
    ]},
    steps:{show:true,eyebrow:'Caminho até a quadra',title:'Linha do tempo da pré-temporada',items:[
      {done:true,title:'Inscrição de equipes',when:'Encerrada',desc:`${n} equipes confirmadas`},
      {title:'Cadastro e homologação',when:'1 a 30/NOV',desc:'2ª janela: 1 a 5 de março de 2027'},
      {title:'Tabela e sorteio',when:'EM BREVE',desc:'Divulgação oficial dos jogos'},
      {title:'Início da temporada',when:'JAN/2027',desc:'Primeira rodada da Elite e do Acesso'},
    ]},
    links:{show:true,eyebrow:'Participe',title:'Cadastros e informações',items:[
      {title:'Atletas',text:'Confirme seu cadastro, mantenha seus dados e emita a carteirinha.',cta:'Cadastro do atleta →',href:'/cadastro/'},
      {title:'Comissão técnica',text:'Técnicos e auxiliares vinculados à equipe e à temporada.',cta:'Cadastro da comissão →',href:'/cadastro/'},
      {title:'Arbitragem e mesa',text:'Árbitros, apontadores e cronometristas: cadastro e escala dos jogos.',cta:'Cadastro da arbitragem →',href:'/cadastro/?perfil=arbitragem'},
      {title:'Regulamento',text:'Formato, critérios de classificação e regras da competição.',cta:'Ver resumo →',href:'#formato'},
    ]},
  };
}

export default async function PreSeasonHome({page=false}={}){
  const [teams,next,hero]=await Promise.all([loadTeams(),page?Promise.resolve(null):loadNextGame(),loadHeroLogo()]);
  const teamGroups=['ELITE','ACCESS'].map(code=>{
    const selected=teams.filter(team=>team.division?.code===code);
    const division=selected[0]?.division;
    const query=`temporada=${encodeURIComponent(SEASON_2027_ID)}&serie=${code.toLowerCase()}`;
    return {id:code,title:division?.displayName||division?.name||(code==='ELITE'?'Divisão Elite':'Divisão de Acesso'),teams:selected,links:[{label:'Equipes',href:`/equipes/?${query}`},{label:'Jogos',href:`/jogos/?${query}`},{label:'Classificação',href:`/classificacao/?${query}`}],description:code==='ELITE'?'Classificatória: turno e returno. Depois, quartas, semifinais e final.':'Classificatória: turno único. Depois, play-in, quartas, semifinais e final.'};
  });
  const unassigned=teams.filter(team=>!['ELITE','ACCESS'].includes(team.division?.code));
  if(unassigned.length)teamGroups.push({id:'unassigned',title:'Divisão ainda não informada',teams:unassigned,links:[]});
  const champions=championsFallback();
  const now=nowBR();
  const live=next&&isLivePublicGame(next.g);
  const cfg=mergePreSeason(hero.preSeason,adultoDefaults(teams.length,now));
  const series=[{k:'ouro',label:'Série Ouro',tone:'gold'},{k:'prata',label:'Série Prata',tone:'silver'},{k:'bronze',label:'Série Bronze',tone:'bronze'}];
  const strip=next&&(()=>{const A={name:next.g.teamA?.name,logoUrl:next.g.teamA?.logoUrl||teamLogo(next.g.teamA?.name)};const B={name:next.g.teamB?.name,logoUrl:next.g.teamB?.logoUrl||teamLogo(next.g.teamB?.name)};
    return <div className={`p27-strip${live?' live':''}`}><div className="p27-wrap p27-strip-in">
    <div className="p27-strip-comp"><img src={next.logo} alt=""/><div><small><i/>{live?'Ao vivo agora':'Próximo jogo'}</small><b>{next.label}</b></div></div>
    <div className="p27-strip-match">
      <div className="p27-strip-team"><span>{A.logoUrl?<img src={A.logoUrl} alt={A.name||''}/>:<em>{initials(A.name)}</em>}</span><b>{A.name}</b></div>
      <div className="p27-strip-vs">{live?<strong>{next.g.scoreA??0} <i>×</i> {next.g.scoreB??0}</strong>:<strong>VS</strong>}</div>
      <div className="p27-strip-team right"><b>{B.name}</b><span>{B.logoUrl?<img src={B.logoUrl} alt={B.name||''}/>:<em>{initials(B.name)}</em>}</span></div>
    </div>
    <div className="p27-strip-info"><small>Data e local</small><b>{fmtDate(next.g.startsAt)}</b>{next.g.venue?.name&&<span>{next.g.venue.name}</span>}</div>
    <Link href={next.href} className="p27-strip-btn">{live?'Acompanhar':'Ver jogo'} →</Link>
  </div></div>})();
  const bottom=<>
    {!page&&<section className="p27-section"><div className="p27-wrap">
      <div className="p27-head"><div><small className="gold">Temporada 2026</small><h2>Os campeões de 2026</h2></div><div className="p27-head-links"><Link href="/temporada/2026/">Arquivo 2026 →</Link><Link href="/lideres/?temporada=2026">Líderes e recordes →</Link></div></div>
      <div className="p27-grid3">{series.map(s=>{const name=champions?.[s.k];if(!name)return null;const team={name,logoUrl:teamLogo(name)};return <Link key={s.k} href={`/team/${slugify(name)}/?temporada=2026`} className={`p27-champ p27-champ-${s.tone}`}><span className="p27-champ-cup"><Trophy/></span><small>Campeão da {s.label} 2026</small><strong>{name}</strong><span className="p27-champ-more">Ver campanha →</span>{team.logoUrl&&<img className="p27-champ-logo" src={team.logoUrl} alt="" aria-hidden="true"/>}</Link>})}</div>
    </div></section>}
    <Sponsors/>
  </>;
  return <main className="p27-main"><PreSeasonTemplate cfg={cfg} logo={hero.logo} seal={hero.seal||"/assets/brand/selo-l3c-adulto-livre.png"} sealAlt="Selo oficial L3C · Adulto Livre" year={2027}
    teams={teams} teamGroups={teamGroups} teamHref={t=>`/team/${slugify(t.name)}/?temporada=2027&s=${encodeURIComponent(SEASON_2027_ID)}`} teamsAllHref={`/equipes/?temporada=${encodeURIComponent(SEASON_2027_ID)}`} top={strip} bottom={bottom}/></main>
}
