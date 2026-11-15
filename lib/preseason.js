// Pré-temporada padrão (qualquer competição). A configuração vem do painel (Temporada > Pré-temporada) e fica em season.preSeason.
// O que o painel deixar vazio usa o padrão abaixo. Datas são "AAAA-MM-DD" no horário de Brasília.
const DAY=86400000;
export const brDay=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?Date.UTC(+m[1],+m[2]-1,+m[3])+3*3600*1000:null};
export const fmtDay=iso=>{const t=brDay(iso);if(t==null)return '';return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'long',year:'numeric'}).format(new Date(t))};
export const shortDay=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?`${m[3]}/${m[2]}`:''};
export function dateStatus(iso,now=Date.now()){
  const t=brDay(iso);if(t==null)return null;
  const d=Math.ceil((t-now)/DAY);
  if(now>=t+DAY)return {text:'REALIZADO',tone:'ok'};
  if(now>=t)return {text:'HOJE',tone:'warn'};
  return {text:shortDay(iso),tone:'mute',days:d};
}
export function nextMilestone(list,now=Date.now()){
  const m=(list||[]).map(x=>({...x,t:brDay(x.date)})).filter(x=>x.t!=null&&x.t>now).sort((a,b)=>a.t-b.t)[0];
  if(!m)return null;
  return {title:m.label,when:shortDay(m.date),days:Math.max(0,Math.ceil((m.t-now)/DAY))};
}
const pick=(a,b)=>(a!==undefined&&a!==null&&a!==''&&!(Array.isArray(a)&&!a.length))?a:b;
const sec=(c,d)=>({...d,...Object.fromEntries(Object.entries(c||{}).filter(([k,v])=>v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&!v.length)))});

// Padrão para quando o painel ainda não configurou nada.
export function genericDefaults({compName,year,startDate,name,count=0}){
  return {
    badge:`Pré-temporada · ${compName||''} ${year||''}`.trim(),
    headline:count?'{equipes} equipes.\nUma nova':(name||compName||''),headlineAccent:count?'temporada.':String(year||''),
    intro:'A temporada está em preparação: tabela, jogos e classificação aparecem aqui automaticamente assim que forem publicados no L3C Stats.',
    primaryButton:'Conheça as equipes',secondaryButton:'',
    dock:[{label:'Situação',value:'EM PREPARAÇÃO',tone:'warn'},{label:'Equipes cadastradas',value:count?`${count} ${count===1?'EQUIPE':'EQUIPES'}`:'EM BREVE',tone:count?'ok':'white'},{label:'Início da temporada',value:startDate?fmtDay(startDate).toUpperCase():'A DEFINIR',tone:'white'}],
    milestones:startDate?[{label:'Início da temporada',date:startDate}]:[],
    stats:[],
    teams:{show:true,eyebrow:`Equipes ${year||''}`.trim(),title:'As {equipes} equipes cadastradas'},
    format:{show:false,eyebrow:'Regulamento',title:'Como será a temporada',cards:[],tiles:[]},
    steps:{show:false,eyebrow:'Caminho até a quadra',title:'Linha do tempo da pré-temporada',items:[]},
    links:{show:true,eyebrow:'Participe',title:'Cadastros e informações',items:[
      {title:'Atletas',text:'Confirme seu cadastro, mantenha seus dados e emita a carteirinha.',cta:'Cadastro do atleta →',href:'/cadastro/'},
      {title:'Comissão técnica',text:'Técnicos e auxiliares vinculados à equipe e à temporada.',cta:'Cadastro da comissão →',href:'/cadastro/'},
      {title:'Arbitragem e mesa',text:'Árbitros, apontadores e cronometristas: cadastro e escala dos jogos.',cta:'Cadastro da arbitragem →',href:'/cadastro/?perfil=arbitragem'},
    ]},
  };
}
export function mergePreSeason(cfg,defaults){
  const c=cfg||{};
  return {
    ...defaults,
    ...Object.fromEntries(['badge','headline','headlineAccent','intro','primaryButton','secondaryButton'].map(k=>[k,pick(c[k],defaults[k])])),
    dock:pick(c.dock,defaults.dock),milestones:pick(c.milestones,defaults.milestones),stats:pick(c.stats,defaults.stats),
    teams:sec(c.teams,defaults.teams),format:sec(c.format,defaults.format),steps:sec(c.steps,defaults.steps),links:sec(c.links,defaults.links),
  };
}
// Mostra a pré-temporada? enabled=true força; false desliga; vazio = automático (Planejamento e sem jogos publicados).
export function preSeasonActive(season,gamesCount){
  const e=season?.preSeason?.enabled;
  if(e===true)return true;
  if(e===false)return false;
  return season?.status==='PLANNING'&&!gamesCount;
}
export const fillVars=(text,vars)=>String(text||'').replace(/\{(\w+)\}/g,(_,k)=>vars[k]!=null?String(vars[k]):'');
