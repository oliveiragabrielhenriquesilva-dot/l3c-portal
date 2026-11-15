import legacyRaw from '../data/legacy-2026.json';
import {localizeData} from './media';
const legacy=localizeData(legacyRaw);
import {archiveSlug} from './legacy';

export const GROUPS={
  a:['the bronx','wolves','hnk','athletics','sj basquete','guara','ballers','apol'],
  b:['patriots','xd','jussara','brewers','manoel','ducks','sharks rc','segantini'],
};
export const GROUP_LABELS={a:'Grupo A',b:'Grupo B'};

function norm(v=''){
  let x=String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
  const aliases={'xd basketball':'xd','guara basquetebol':'guara','manoel basketball':'manoel','sharks ribeirao corrente':'sharks rc','sharks ribeirao':'sharks rc'};
  return aliases[x]||x;
}
function teamByName(name){return legacy.teams.find(t=>norm(t.name)===norm(name));}
function viewTeam(t){return {id:`legacy_team_wp_${t.wordpressId}`,name:t.name,shortName:t.name,logoUrl:t.logoUrl,slug:t.slug||archiveSlug(t.name)};}
function viewGame(raw){const a=teamByName(raw.teams?.[0]?.name),b=teamByName(raw.teams?.[1]?.name);let slug=null;const id=`legacy_game_adulto_livre_2026_${raw.source.wordpressPostId}`;for(const [s,v] of Object.entries(legacy.eventAliases||{}))if(v===id){slug=s;break;}return {id,wpId:raw.source.wordpressPostId,slug:slug||archiveSlug(raw.title),startsAt:String(raw.scheduledAtLegacy||'').replace(' ','T')+'-03:00',status:raw.status,scoreA:Number(raw.teams?.[0]?.score||0),scoreB:Number(raw.teams?.[1]?.score||0),round:raw.legacy?.phaseLabel||'',stage:{name:raw.legacy?.phaseLabel||''},venue:raw.legacy?.venue?{name:raw.legacy.venue}:null,teamA:a?viewTeam(a):{name:raw.teams?.[0]?.name},teamB:b?viewTeam(b):{name:raw.teams?.[1]?.name}};}
function inDate(raw){const ymd=String(raw.scheduledAtLegacy||'').slice(0,10);return ymd>='2026-01-01'&&ymd<='2026-05-30';}
export function groupGames(group){const cfg=GROUPS[group]||[];return (legacy.games||[]).filter(raw=>{if(!inDate(raw)||raw.teams?.length<2)return false;return cfg.includes(norm(raw.teams[0].name))&&cfg.includes(norm(raw.teams[1].name));}).map(viewGame).sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));}

export function groupStandings(group){
  const cfg=GROUPS[group]||[];
  const teams=(legacy.teams||[]).filter(t=>cfg.includes(norm(t.name)));
  const tab=new Map(teams.map(t=>[norm(t.name),{id:t.wordpressId,name:t.name,team:viewTeam(t),pts:0,j:0,v:0,d:0,pro:0,contra:0,saldo:0}]));
  const h2h=new Map();
  const key=(a,b)=>`${a}__${b}`;
  for(const g of groupGames(group)){
    if(g.status!=='FINISHED')continue;
    const a=norm(g.teamA.name),b=norm(g.teamB.name),ra=tab.get(a),rb=tab.get(b);if(!ra||!rb)continue;
    const sa=Number(g.scoreA||0),sb=Number(g.scoreB||0);ra.j++;rb.j++;ra.pro+=sa;ra.contra+=sb;rb.pro+=sb;rb.contra+=sa;
    const isWo=(sa===20&&sb===0)||(sb===20&&sa===0);
    if(sa>sb){ra.v++;rb.d++;ra.pts+=2;rb.pts+=isWo?0:1;}else if(sb>sa){rb.v++;ra.d++;rb.pts+=2;ra.pts+=isWo?0:1;}
    for(const [tid,opp,pf,pa] of [[a,b,sa,sb],[b,a,sb,sa]]){
      const k=key(tid,opp);const x=h2h.get(k)||{pts:0,j:0,v:0,d:0,pro:0,contra:0,saldo:0};x.j++;x.pro+=pf;x.contra+=pa;if(pf>pa){x.v++;x.pts+=2;}else if(pa>pf){x.d++;x.pts+=isWo?0:1;}x.saldo=x.pro-x.contra;h2h.set(k,x);
    }
  }
  const rows=[...tab.values()];rows.forEach(r=>r.saldo=r.pro-r.contra);
  const buckets=new Map();for(const r of rows){if(!buckets.has(r.pts))buckets.set(r.pts,[]);buckets.get(r.pts).push(r)}
  const ordered=[];for(const pts of [...buckets.keys()].sort((a,b)=>b-a)){
    const tied=buckets.get(pts);
    if(tied.length===1){ordered.push(tied[0]);continue;}
    if(tied.length===2){tied.sort((x,y)=>{const hx=h2h.get(key(norm(x.name),norm(y.name)))||{pts:0,saldo:0,pro:0};const hy=h2h.get(key(norm(y.name),norm(x.name)))||{pts:0,saldo:0,pro:0};return hy.pts-hx.pts||hy.saldo-hx.saldo||y.saldo-x.saldo||y.pro-x.pro||x.name.localeCompare(y.name,'pt-BR')});ordered.push(...tied);continue;}
    const ids=tied.map(r=>norm(r.name));const mini={};for(const tid of ids){mini[tid]={pts:0,saldo:0,pro:0};for(const opp of ids){if(tid===opp)continue;const x=h2h.get(key(tid,opp));if(x){mini[tid].pts+=x.pts;mini[tid].saldo+=x.saldo;mini[tid].pro+=x.pro;}}}
    tied.sort((x,y)=>{const mx=mini[norm(x.name)],my=mini[norm(y.name)];return my.pts-mx.pts||my.saldo-mx.saldo||y.saldo-x.saldo||y.pro-x.pro||x.name.localeCompare(y.name,'pt-BR')});ordered.push(...tied);
  }
  return ordered;
}

export function generalFirstPhase(){
  const series={1:[],2:[],3:[]};
  for(const group of ['a','b'])groupStandings(group).forEach((r,i)=>{const pos=i+1,order=pos<=3?1:pos<=6?2:3;series[order].push({...r,group,groupLabel:GROUP_LABELS[group],groupPos:pos,seriesOrder:order,series:order===1?'ouro':order===2?'prata':'bronze'});});
  const out=[];
  for(const order of [1,2,3]){
    const byPts=new Map();for(const r of series[order]){if(!byPts.has(r.pts))byPts.set(r.pts,[]);byPts.get(r.pts).push(r)}
    for(const pts of [...byPts.keys()].sort((a,b)=>b-a)){
      const tied=byPts.get(pts);if(tied.length===1){out.push(tied[0]);continue;}
      const groups=[...new Set(tied.map(r=>r.group))];
      if(groups.length===1)tied.sort((x,y)=>x.groupPos-y.groupPos||x.name.localeCompare(y.name,'pt-BR'));
      else tied.sort((x,y)=>y.saldo-x.saldo||y.pro-x.pro||y.v-x.v||x.name.localeCompare(y.name,'pt-BR'));
      out.push(...tied);
    }
  }
  return out;
}
