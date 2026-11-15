import {divisionLabel} from '../lib/season-team';
// Páginas-modelo de qualquer competição/temporada do L3C Stats: Jogos, Classificação, Equipes e Atletas.
// Líderes e Recordes ficam em LideresView.js. Todas leem o catálogo (lib/scopes.js): nada é cadastrado aqui.
import Link from 'next/link';
import LiveRefresh from './LiveRefresh';
import {Sponsors} from './SiteChrome';
import {GameCard,ResultRow} from './Cards';
import {KpiStrip,EmptyPortal,TeamDirectoryCard,AthleteDirectoryCard} from './PortalDirectory';
import {PortalHeader,SeasonMenu,PortalShell} from './PortalParts';
import PreSeasonView from './PreSeasonView';
import {preSeasonActive} from '../lib/preseason';
import {pickSeason,loadSeason,brandOf,sectionPath,teamHref,playerHref,gameHref,playerContext,scopeHasRanking} from '../lib/scopes';
import {liveWatch,gamePublicStatus,seriesForTeam} from '../lib/site';
import {jogosLabel,prettyName} from '../lib/format';

const unique=list=>[...new Set(list.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
const lower=v=>String(v||'').toLocaleLowerCase('pt-BR');

async function prepare(scope,sp){
  const season=pickSeason(scope,sp?.temporada);
  const loaded=await loadSeason(season);
  return {season,brand:brandOf(scope,season),...loaded};
}
function Offline({offline}){
  return offline?<div className="source-warning">Os dados desta temporada estão temporariamente indisponíveis. Tente novamente em instantes.</div>:null;
}

// ---------------------------------------------------------------- JOGOS
export async function JogosView({scope,sp={}}){
  const {season,brand,data,offline}=await prepare(scope,sp);
  const status=String(sp.status||'todos');
  const team=String(sp.equipe||'');
  const phase=String(sp.fase||'');
  const division=String(sp.serie||'').toLowerCase();
  const divisions=data.divisions||[];
  const selectedDivision=divisions.find(item=>String(item.code||item.id).toLowerCase()===division);
  const teamDivisions=new Map((data.teams||[]).map(item=>[item.team?.id,item.division?.id]));
  const games=[...(data.legacyGames||[])].filter(game=>!selectedDivision||(teamDivisions.get(game.teamA?.id)===selectedDivision.id&&teamDivisions.get(game.teamB?.id)===selectedDivision.id));
  const teams=unique(games.flatMap(g=>[g.teamA?.name,g.teamB?.name]));
  const phases=unique(games.map(g=>g.stage?.name||g.round||'Temporada'));
  const filtered=games.filter(g=>{
    const s=gamePublicStatus(g);
    if(status==='finalizados'&&s!=='FINISHED')return false;
    if(status==='proximos'&&s!=='UPCOMING')return false;
    if(status==='aovivo'&&s!=='LIVE')return false;
    if(status==='pendentes'&&s!=='PENDING_RESULT')return false;
    if(team&&g.teamA?.name!==team&&g.teamB?.name!==team)return false;
    const f=g.stage?.name||g.round||'Temporada';if(phase&&f!==phase)return false;
    return true;
  });
  const by=name=>filtered.filter(g=>gamePublicStatus(g)===name);
  const live=by('LIVE');
  const upcoming=by('UPCOMING').sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
  const pending=by('PENDING_RESULT').sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt));
  const results=by('FINISHED').sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt));
  const href=g=>gameHref(scope,season,g);
  const base=sectionPath(scope,'jogos');
  const finishedCount=games.filter(g=>gamePublicStatus(g)==='FINISHED').length;
  return <PortalShell scope={scope} className="games-v0515"><LiveRefresh {...liveWatch(games)}/>
    <Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={`Jogos · ${season.label}`} subtitle={`${jogosLabel(games.length)} no calendário · ${jogosLabel(finishedCount)} finalizados`}/>
      <SeasonMenu scope={scope} season={season} section="jogos"/>
      <Offline offline={offline}/>
      <KpiStrip items={[[games.length,'Jogos no calendário'],[finishedCount,'Finalizados'],[games.filter(g=>gamePublicStatus(g)==='UPCOMING').length,'Próximos'],[filtered.length,'No filtro atual']]}/>
      <form className="portal-filter-form" action={base}>
        <input type="hidden" name="temporada" value={season.key}/>
        {divisions.length>0&&<label><span>Divisão</span><select name="serie" defaultValue={division}><option value="">Todas</option>{divisions.map(d=><option key={d.id} value={String(d.code||d.id).toLowerCase()}>{d.displayName||d.name}</option>)}</select></label>}
        <label><span>Status</span><select name="status" defaultValue={status}><option value="todos">Todos</option><option value="aovivo">Ao vivo</option><option value="proximos">Próximos</option><option value="finalizados">Finalizados</option><option value="pendentes">Pendentes</option></select></label>
        <label><span>Equipe</span><select name="equipe" defaultValue={team}><option value="">Todas</option>{teams.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label><span>Fase</span><select name="fase" defaultValue={phase}><option value="">Todas</option>{phases.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <button type="submit">Aplicar filtros</button><Link href={`${base}?temporada=${season.key}`}>Limpar</Link>
      </form>
      {live.length>0&&<section className="portal-games-section"><div className="section-heading compact"><div><h2>Ao vivo agora</h2></div></div><div className="games-grid redesign-games-grid">{live.map(g=><GameCard key={g.id} game={g} href={href(g)}/>)}</div></section>}
      {upcoming.length>0&&<section className="portal-games-section"><div className="section-heading compact"><div><h2>Próximos jogos</h2><p className="section-subtitle">Partidas oficialmente agendadas.</p></div></div><div className="games-grid redesign-games-grid">{upcoming.map(g=><GameCard key={g.id} game={g} href={href(g)}/>)}</div></section>}
      {pending.length>0&&<section className="portal-games-section"><div className="section-heading compact"><div><h2>Aguardando resultado</h2><p className="section-subtitle">Jogos já realizados ou com horário passado, ainda sem resultado oficial publicado.</p></div></div><div className="games-grid redesign-games-grid">{pending.map(g=><GameCard key={g.id} game={g} href={href(g)}/>)}</div></section>}
      {results.length>0&&<section className="portal-games-section" id="resultados"><div className="section-heading compact"><div><h2>Resultados</h2><p className="section-subtitle">Do mais recente para o mais antigo.</p></div></div><div className="result-list wide-result-list">{results.map(g=><ResultRow key={g.id} game={g} href={href(g)}/>)}</div></section>}
      {!filtered.length&&<EmptyPortal title="Nenhum jogo encontrado" text={games.length?'Altere os filtros para consultar outra equipe, fase ou situação.':'A tabela de jogos desta temporada ainda não foi publicada.'}/>}
    </div>
  </PortalShell>;
}

// ---------------------------------------------------------------- CLASSIFICAÇÃO
function StandingsTable({scope,season,title,rows}){
  return <section className="panel-box portal-standing-card">
    <div className="panel-box-head"><h3>{title}</h3><span>{rows.length} equipes</span></div>
    <div className="table-scroll"><table><thead><tr><th>#</th><th>Equipe</th><th>PTS</th><th>J</th><th>V</th><th>D</th><th>PF</th><th>PA</th><th>Saldo</th></tr></thead><tbody>
      {rows.map((row,i)=><tr key={`${title}-${row.team?.name}-${i}`}>
        <td>{i+1}</td>
        <td className="team-cell">{row.team?.logoUrl&&<img src={row.team.logoUrl} alt=""/>}<Link href={teamHref(scope,season,row.team?.name)}><b>{row.team?.name}</b></Link></td>
        <td><b>{row.points}</b></td><td>{row.games}</td><td>{row.wins}</td><td>{row.losses}</td><td>{row.pointsFor}</td><td>{row.pointsAgainst}</td>
        <td className={row.diff>=0?'positive':'negative'}>{row.diff>0?'+':''}{row.diff}</td>
      </tr>)}
    </tbody></table></div>
  </section>;
}
export async function ClassificacaoView({scope,sp={}}){
  const {season,brand,groups,offline}=await prepare(scope,sp);
  const active=groups.find(g=>g.key===String(sp.serie||'').toLowerCase())||groups[0];
  const all=groups.flatMap(g=>g.rows);
  const totalGames=Math.round(all.reduce((s,x)=>s+Number(x.games||0),0)/2);
  const base=sectionPath(scope,'classificacao');
  const hasRules=scope.key==='adulto'||scope.key==='master';
  return <PortalShell scope={scope} className="classification-v0515">
    <Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={`Classificação · ${season.label}`} subtitle={groups.length>1?`${groups.length} divisões · ${all.length} equipes · ${jogosLabel(totalGames)} contabilizados`:`${all.length} equipes · ${jogosLabel(totalGames)} contabilizados`}/>
      <SeasonMenu scope={scope} season={season} section="classificacao">
        {season.source==='adulto2026'&&<div className="ld-tabs"><Link href="/temporada/2026/fase-de-classificacao/">Grupos A e B</Link></div>}
      </SeasonMenu>
      <Offline offline={offline}/>
      {groups.length>1&&<div className="portal-series-tabs">{groups.map(g=><Link className={active?.key===g.key?'active':''} href={`${base}?temporada=${season.key}&serie=${g.key}`} key={g.key}>{g.label}</Link>)}</div>}
      {active&&active.rows.length?<>
        <StandingsTable scope={scope} season={season} title={`${active.label} · ${season.year||''}`} rows={active.rows}/>
        {groups.length>1&&<div className="portal-classification-summary-grid">{groups.map(g=><StandingsTable key={g.key} scope={scope} season={season} title={g.label} rows={g.rows}/>)}</div>}
      </>:<EmptyPortal title="Classificação ainda não disponível" text="A tabela aparece automaticamente assim que os primeiros jogos desta temporada forem finalizados."/>}
      {hasRules&&<div className="callout-rule-box portal-rule-box"><b>Critérios oficiais</b><p>Vitória vale 2 pontos; derrota vale 1 ponto; no WO 20×0 a equipe derrotada recebe 0. Os desempates seguem os critérios publicados no regulamento oficial da competição.</p></div>}
    </div>
  </PortalShell>;
}

// ---------------------------------------------------------------- EQUIPES
export async function EquipesView({scope,sp={}}){
  const {season,brand,data,offline}=await prepare(scope,sp);
  const serie=String(sp.serie||'todas').toLowerCase();
  const q=lower(sp.q).trim();
  const hasSeries=season.source==='adulto2026';
  const divisions=data.divisions||[];
  const rows=[...(data.teams||[])].filter(x=>{
    const team=x.team||x;
    if(divisions.length&&serie!=='todas'&&String(x.division?.code||x.division?.id).toLowerCase()!==serie)return false;
    if(hasSeries&&serie!=='todas'&&!lower(seriesForTeam(team.name)).includes(serie))return false;
    if(q&&!lower(team.name).includes(q)&&!lower(team.city).includes(q))return false;
    return true;
  });
  const base=sectionPath(scope,'equipes');
  return <PortalShell scope={scope} className="teams-v0515">
    <Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={`Equipes · ${season.label}`} subtitle={`${(data.teams||[]).length} equipes · elenco, campanha e jogos de cada franquia`}/>
      <SeasonMenu scope={scope} season={season} section="equipes"/>
      <Offline offline={offline}/>
      <KpiStrip items={[[data.teams?.length||0,'Equipes'],[rows.length,'No filtro atual'],[data.players?.length||0,'Atletas'],[season.year||'—','Temporada']]}/>
      <form className="portal-filter-form portal-filter-form-compact" action={base}>
        <input type="hidden" name="temporada" value={season.key}/>
        {hasSeries&&<label><span>Divisão</span><select name="serie" defaultValue={serie}><option value="todas">Todas</option><option value="ouro">Série Ouro</option><option value="prata">Série Prata</option><option value="bronze">Série Bronze</option></select></label>}
        {!hasSeries&&divisions.length>0&&<label><span>Divisão</span><select name="serie" defaultValue={serie}><option value="todas">Todas</option>{divisions.map(d=><option key={d.id} value={String(d.code||d.id).toLowerCase()}>{d.displayName||d.name}</option>)}</select></label>}
        <label className="grow"><span>Buscar equipe</span><input name="q" defaultValue={sp.q||''} placeholder="Nome ou cidade"/></label>
        <button type="submit">Filtrar</button><Link href={`${base}?temporada=${season.key}`}>Limpar</Link>
      </form>
      {rows.length?<div className="portal-team-directory-grid">{rows.map(item=>{
        const team=item.team||item;
        const division=hasSeries?(seriesForTeam(team.name)||season.label):(divisionLabel(item,season.year)||season.label);
        return <TeamDirectoryCard key={team.id||team.name} item={item} subtitle={[division,team.city].filter(Boolean).join(' · ')} href={teamHref(scope,season,team.name)}/>;
      })}</div>:<EmptyPortal title="Nenhuma equipe encontrada" text={(data.teams||[]).length?'Altere os filtros ou limpe a busca para voltar a todas as equipes.':'As equipes desta temporada ainda não foram publicadas.'}/>}
    </div>
  </PortalShell>;
}

// ---------------------------------------------------------------- ATLETAS
export async function AtletasView({scope,sp={}}){
  const {season,brand,data,offline}=await prepare(scope,sp);
  const q=lower(sp.q).trim();
  const team=String(sp.equipe||'');
  const players=(data.players||[]).map(x=>x?.player?{...x,player:{...x.player,name:prettyName(x.player.name)}}:x);
  const teams=unique(players.flatMap(x=>(x.teams||[]).map(t=>t.name)));
  const rows=players.filter(x=>{
    if(q&&!lower(x.player?.name).includes(q))return false;
    if(team&&!(x.teams||[]).some(t=>t.name===team))return false;
    return true;
  }).sort((a,b)=>String(a.player?.name||'').localeCompare(String(b.player?.name||''),'pt-BR'));
  const base=sectionPath(scope,'atletas');
  const ctx=playerContext(scope,season);
  return <PortalShell scope={scope} className="athletes-v0515">
    <Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={`Atletas · ${season.label}`} subtitle={`${players.length} atletas · perfil único com a trajetória em todas as temporadas`}/>
      <SeasonMenu scope={scope} season={season} section="atletas"/>
      <Offline offline={offline}/>
      <KpiStrip items={[[players.length,'Atletas'],[rows.length,'No filtro atual'],[teams.length,'Equipes representadas'],[season.year||'—','Temporada']]}/>
      <form className="portal-filter-form portal-filter-form-compact" action={base}>
        <input type="hidden" name="temporada" value={season.key}/>
        <label className="grow"><span>Buscar atleta</span><input name="q" defaultValue={sp.q||''} placeholder="Nome do atleta"/></label>
        <label><span>Equipe</span><select name="equipe" defaultValue={team}><option value="">Todas</option>{teams.map(x=><option value={x} key={x}>{x}</option>)}</select></label>
        <button type="submit">Filtrar</button><Link href={`${base}?temporada=${season.key}`}>Limpar</Link>
      </form>
      {rows.length?<div className="portal-athlete-directory-grid">{rows.map(item=><AthleteDirectoryCard key={item.player.id||item.player.name} item={item} href={playerHref(scope,season,item.player.name)} context={ctx}/>)}</div>:<EmptyPortal title="Nenhum atleta encontrado" text={players.length?'Altere o nome ou a equipe selecionada.':'Os atletas desta temporada ainda não foram publicados.'}/>}
    </div>
  </PortalShell>;
}

// ---------------------------------------------------------------- INÍCIO (competições sem página inicial própria)
export async function HomeView({scope,sp={},forceSeason=false}){
  const {season,brand,data,groups,offline}=await prepare(scope,sp);
  const games=[...(data.legacyGames||[])];
  if(!forceSeason&&preSeasonActive(season,games.length))return <PreSeasonView scope={scope} season={season} brand={brand} data={data} offline={offline}/>;
  const upcoming=games.filter(g=>['LIVE','UPCOMING'].includes(gamePublicStatus(g))).sort((a,b)=>(gamePublicStatus(b)==='LIVE')-(gamePublicStatus(a)==='LIVE')||new Date(a.startsAt)-new Date(b.startsAt)).slice(0,3);
  const results=games.filter(g=>gamePublicStatus(g)==='FINISHED').sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).slice(0,5);
  const top=(groups[0]?.rows||[]).slice(0,6);
  const players=[...(data.players||[])].filter(x=>Number(x.games||0)>0);
  const leaders=[['points','Pontos'],['rebounds','Rebotes'],['assists','Assistências'],['steals','Roubos'],['blocks','Tocos']].map(([k,l])=>({k,l,item:[...players].sort((a,b)=>Number(b.averages?.[k]||0)-Number(a.averages?.[k]||0))[0]}));
  const href=g=>gameHref(scope,season,g);
  const q=`?temporada=${season.key}`;
  return <PortalShell scope={scope} className="home-generic">
    <LiveRefresh {...liveWatch(games)}/>
    <Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={season.label} subtitle={`${scope.competition?.name||scope.name} · ${jogosLabel(games.length)} no calendário · ${(data.teams||[]).length} equipes`}/>
      <SeasonMenu scope={scope} season={season} section="jogos"/>
      <Offline offline={offline}/>
      <nav className="portal-context-nav" aria-label="Seções">{[['jogos','Jogos'],['classificacao','Classificação'],['lideres','Líderes e recordes'],...(scopeHasRanking(scope)?[['ranking','Ranking oficial']]:[]),['equipes','Equipes'],['atletas','Atletas']].map(([s,l])=><Link key={s} href={`${sectionPath(scope,s)}${q}`}>{l}</Link>)}</nav>
      {(data.divisions||[]).length>0&&<section className="active-division-grid" aria-label="Divisões da temporada">{data.divisions.map(division=>{
        const entries=(data.teams||[]).filter(item=>item.division?.id===division.id);
        const teamIds=new Set(entries.map(item=>item.team?.id));
        const matches=games.filter(game=>teamIds.has(game.teamA?.id)&&teamIds.has(game.teamB?.id));
        const group=groups.find(group=>group.key===String(division.code||division.id).toLowerCase());
        const divisionQuery=`${q}&serie=${String(division.code||division.id).toLowerCase()}`;
        return <article className="active-division-card" key={division.id}><header><small>DIVISÃO</small><h2>{division.displayName||division.name}</h2></header><div className="active-division-metrics"><span><b>{entries.length}</b> equipes</span><span><b>{matches.length}</b> jogos</span><span><b>{matches.filter(game=>gamePublicStatus(game)==='FINISHED').length}</b> finalizados</span></div><nav><Link href={`${sectionPath(scope,'jogos')}${divisionQuery}`}>Jogos</Link><Link href={`${sectionPath(scope,'classificacao')}${divisionQuery}`}>Classificação</Link><Link href={`${sectionPath(scope,'equipes')}${divisionQuery}`}>Equipes</Link></nav><div className="active-division-teams">{entries.map(item=><Link key={item.team.id} href={teamHref(scope,season,item.team.name)}>{item.team.shortName||item.team.name}</Link>)}</div>{group?.rows?.length>0&&<StandingsTable scope={scope} season={season} title={division.displayName||division.name} rows={group.rows}/>}</article>;
      })}</section>}
      {!(data.divisions||[]).length&&top.length>0&&<StandingsTable scope={scope} season={season} title="Classificação" rows={top}/>}
      {leaders.some(x=>x.item)&&<section className="ld-section"><span className="ld-label">LÍDERES DA TEMPORADA</span><div className="ld-cards">{leaders.filter(x=>x.item).map(({k,l,item})=><Link key={k} className="ld-card" href={`${sectionPath(scope,'lideres')}${q}&estatistica=${k}`}>
        {item.player?.photoUrl?<img className="ld-avatar md" src={item.player.photoUrl} alt=""/>:<span className="ld-avatar md ph" aria-hidden="true">{String(item.player?.name||'?')[0]}</span>}
        <span className="ld-card-text"><em>{l.toUpperCase()}</em><b>{prettyName(item.player?.name)}</b><small>{item.teams?.[0]?.name||''}</small></span><strong>{Number(item.averages?.[k]||0).toFixed(1).replace('.',',')}</strong></Link>)}</div></section>}
      {upcoming.length>0&&<section className="portal-games-section"><div className="section-heading compact"><div><h2>Próximos jogos</h2></div><Link href={`${sectionPath(scope,'jogos')}${q}`}>Todos os jogos →</Link></div><div className="games-grid redesign-games-grid">{upcoming.map(g=><GameCard key={g.id} game={g} href={href(g)}/>)}</div></section>}
      {results.length>0&&<section className="portal-games-section"><div className="section-heading compact"><div><h2>Últimos resultados</h2></div></div><div className="result-list wide-result-list">{results.map(g=><ResultRow key={g.id} game={g} href={href(g)}/>)}</div></section>}
      {!games.length&&!top.length&&<EmptyPortal title="Temporada em preparação" text="Assim que a tabela de jogos e as equipes forem publicadas no L3C Stats, esta página é preenchida automaticamente."/>}
    </div>
  </PortalShell>;
}
