// Líderes e Recordes de qualquer competição/temporada do L3C Stats (modelo único).
import Link from 'next/link';
import {Sponsors} from './SiteChrome';
import {PortalHeader,SeasonMenu,PortalShell} from './PortalParts';
import {qualifiedPlayers,slugify,teamLogo} from '../lib/site';
import {jogosLabel,prettyName} from '../lib/format';
import {pickSeason,loadSeason,brandOf,seasonBests,scopeRecords,sectionPath,playerHref,gameHref,rankingAvailable} from '../lib/scopes';

const METRICS=[['points','PTS','Pontos','pontos'],['rebounds','REB','Rebotes','rebotes'],['assists','AST','Assistências','assistencias'],['steals','STL','Roubos','roubos'],['blocks','BLK','Tocos','tocos'],['efficiency','EFF','Eficiência','eficiencia']];
const UNIT={points:'pontos',rebounds:'rebotes',assists:'assistências',steals:'roubos',blocks:'tocos',efficiency:'de eficiência'};

const fmt=v=>Number(v||0).toFixed(1).replace('.',',');
const initials=name=>String(name||'?').split(' ').filter(Boolean).filter(w=>w.length>2||w===w.toUpperCase()).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
const dateBR=iso=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'America/Sao_Paulo'})};

function Avatar({player,size='md'}){
  return player?.photoUrl?<img className={`ld-avatar ${size}`} src={player.photoUrl} alt={player.name||''} loading="lazy"/>:<span className={`ld-avatar ${size} ph`} aria-hidden="true">{initials(player?.name)}</span>;
}
function GameScore({game}){
  if(!game)return null;
  const a=game.teamA,b=game.teamB;
  const logoA=a?.logoUrl||teamLogo(a?.name),logoB=b?.logoUrl||teamLogo(b?.name);
  return <div className="ld-score" aria-label={`${a?.name} ${game.scoreA} a ${game.scoreB} ${b?.name}`}>
    <span className="ld-score-team">{logoA&&<img src={logoA} alt=""/>}<b>{a?.name}</b></span>
    <strong>{game.scoreA} × {game.scoreB}</strong>
    <span className="ld-score-team right"><b>{b?.name}</b>{logoB&&<img src={logoB} alt=""/>}</span>
  </div>;
}

function Tabs({scope,season,aba}){
  return <div className="ld-tabs" role="tablist" aria-label="Seção">
    <Link className={aba==='lideres'?'active':''} href={`${sectionPath(scope,'lideres')}?temporada=${season.key}`}>Líderes</Link>
    <Link className={aba==='recordes'?'active':''} href={`${sectionPath(scope,'lideres')}?aba=recordes`}>Recordes</Link>
    {rankingAvailable(season)&&<Link href={`${sectionPath(scope,'ranking')}?temporada=${season.key}`}>Ranking oficial</Link>}
  </div>;
}

export default async function LideresView({scope,sp={}}){
  const base=sectionPath(scope,'lideres');
  const aba=String(sp.aba||'lideres')==='recordes'?'recordes':'lideres';

  // ------------------------------------------------ RECORDES (toda a história da competição)
  if(aba==='recordes'){
    const season=pickSeason(scope,scope.defaultSeasonKey);
    const records=(await scopeRecords(scope)).map(r=>({...r,player:{...r.player,name:prettyName(r.player?.name)}}));
    const years=scope.seasons.map(s=>s.year).filter(Boolean).sort((a,b)=>a-b);
    const period=years.length>1?`Todas as temporadas · ${scope.name} ${years[0]}–${years[years.length-1]}`:`${scope.name} ${years[0]||''}`;
    return <PortalShell scope={scope}><Sponsors/>
      <div className="ld-shell">
        <PortalHeader brand={brandOf(scope,season)} title={`Recordes · ${scope.name}`} subtitle={`As maiores marcas em um único jogo, somando ${years.length>1?'todas as temporadas registradas':'a temporada registrada'}.`}/>
        <div className="ld-toolbar">
          <div className="ld-seasons"><span className="ld-label">PERÍODO</span><span className="ld-period">{period}</span></div>
          <Tabs scope={scope} season={season} aba="recordes"/>
        </div>
        <section id="recordes" className="ld-section">
          <div className="ld-sechead"><h2>Recordes de todos os tempos</h2><span>melhor marca em um único jogo</span></div>
          {records.length?<div className="ld-records">
            {records.map(r=>{
              const g=r.game;
              const rs=scope.seasons.find(s=>s.id===r.seasonId)||season;
              const logoA=g&&(g.teamA?.logoUrl||teamLogo(g.teamA?.name)),logoB=g&&(g.teamB?.logoUrl||teamLogo(g.teamB?.name));
              return <article className="ld-record" key={r.key}>
                <span className="ld-kicker">{String(r.label).toUpperCase()}</span>
                <strong className="ld-bignum">{r.value}</strong>
                <Link className="ld-record-player" href={playerHref(scope,rs,r.player?.name)}>
                  <Avatar player={{...r.player}} size="xl"/>
                  <span><b>{r.player?.name}</b><small>{[r.teamName,r.season].filter(Boolean).join(' · ')}</small></span>
                </Link>
                {g&&<Link className="ld-record-game" href={gameHref(scope,rs,g)} aria-label={`${g.teamA?.name} ${g.scoreA} a ${g.scoreB} ${g.teamB?.name}`}>
                  <span className="ld-mini"><span className="ld-mini-team">{logoA?<img src={logoA} alt=""/>:<i/>}<b>{g.teamA?.name}</b></span><strong>{g.scoreA}</strong></span>
                  <span className="ld-mini"><span className="ld-mini-team">{logoB?<img src={logoB} alt=""/>:<i/>}<b>{g.teamB?.name}</b></span><strong>{g.scoreB}</strong></span>
                  <small>{dateBR(g.startsAt)}</small>
                  <em>Ver súmula →</em>
                </Link>}
              </article>;
            })}
          </div>:<p className="ld-note">Os recordes aparecem aqui assim que as primeiras súmulas forem finalizadas.</p>}
          <p className="ld-note">Recordes consideram as súmulas disponíveis de todas as temporadas de {scope.name}. Cada competição tem os seus recordes no próprio portal.</p>
        </section>
      </div>
    </PortalShell>;
  }

  // ------------------------------------------------ LÍDERES (por temporada)
  const season=pickSeason(scope,sp.temporada);
  const {data,offline}=await loadSeason(season);
  const brand=brandOf(scope,season);
  const wanted=String(sp.estatistica||sp.metric||'');
  const full=String(sp.todos||'')==='1';
  const archive=season.source==='archive2025';
  const raw=[...(data.players||[])].map(x=>x?.player?{...x,player:{...x.player,name:prettyName(x.player.name)}}:x);
  const finished=data.summary?.finished||data.summary?.games||0;
  const teamsCount=data.teams?.length||0;
  const minGames=archive?1:Math.max(1,Math.ceil((finished||98)*.70/(teamsCount||16)));
  const players=qualifiedPlayers(raw,minGames);
  const effective=players.length?players:raw;
  const metrics=METRICS.filter(([key])=>key!=='efficiency'||raw.some(x=>Number(x.averages?.efficiency||0)));
  const focus=metrics.some(([k])=>k===wanted)?wanted:'points';
  const sortBy=key=>[...effective].sort((a,b)=>Number(b.averages?.[key]||0)-Number(a.averages?.[key]||0)||Number(b.games||0)-Number(a.games||0));
  const best=await seasonBests(season);
  const [fkey,fabbr,flabel]=metrics.find(([k])=>k===focus)||metrics[0];
  const ranking=sortBy(fkey);
  const leader=ranking[0];
  const second=ranking[1],third=ranking[2];
  const rest=ranking.slice(3,full?undefined:10);
  const maxValue=Number(leader?.averages?.[fkey]||0)||1;
  const posOf=x=>ranking.findIndex(y=>Number(y.averages?.[fkey]||0)===Number(x.averages?.[fkey]||0))+1;
  const bestOf=x=>best.get(slugify(x?.player?.name))?.[fkey]||null;
  const leaderBest=bestOf(leader);
  const href=name=>playerHref(scope,season,name);
  const subtitle=`${jogosLabel(finished)} finalizados · ${raw.length} atletas · mínimo de ${jogosLabel(minGames)} para entrar no ranking`;

  return <PortalShell scope={scope}><Sponsors/>
    <div className="ld-shell">
      <PortalHeader brand={brand} title={`Líderes · ${season.label}`} subtitle={subtitle}/>
      <SeasonMenu scope={scope} season={season} section="lideres"><Tabs scope={scope} season={season} aba="lideres"/></SeasonMenu>
      {offline&&<div className="source-warning">Os dados desta temporada estão temporariamente indisponíveis. Tente novamente em instantes.</div>}

      <section id="lideres" className="ld-section">
        <span className="ld-label">ESCOLHA UM FUNDAMENTO</span>
        <div className="ld-cards">
          {metrics.map(([key,abbr,label])=>{
            const l=sortBy(key)[0];
            return <Link key={key} className={`ld-card ${key===fkey?'active':''}`} href={`${base}?temporada=${season.key}&estatistica=${key}`} aria-current={key===fkey?'true':undefined}>
              <Avatar player={l?.player} size="md"/>
              <span className="ld-card-text"><em>{abbr} · {label.toUpperCase()}</em><b>{l?.player?.name||'Sem dados'}</b><small>{l?.teams?.[0]?.name||''}</small></span>
              <strong>{l?fmt(l.averages?.[key]):'—'}</strong>
            </Link>;
          })}
        </div>
      </section>

      <section className="ld-section">
        <div className="ld-sechead"><h2>{flabel} por jogo</h2><span>média da temporada</span></div>
        {leader?<>
          <div className="ld-leader">
            <div className="ld-leader-main">
              <div className="ld-rankline"><span className="ld-gold">1º LUGAR</span><small>{jogosLabel(leader.games)}</small></div>
              <Link className="ld-leader-id" href={href(leader.player?.name)}><Avatar player={leader.player} size="lg"/><span><b>{leader.player?.name}</b><small>{leader.teams?.[0]?.name||''}</small></span></Link>
              <div className="ld-value"><strong>{fmt(leader.averages?.[fkey])}</strong><span>{fabbr} por jogo</span></div>
            </div>
            {leaderBest&&<div className="ld-bestgame">
              <span className="ld-gold">MELHOR JOGO DA TEMPORADA</span>
              <div className="ld-bestnum">{leaderBest.value} <small>{UNIT[fkey]}</small></div>
              <GameScore game={leaderBest.game}/>
              <small>{dateBR(leaderBest.game?.startsAt)}</small>
              <Link href={gameHref(scope,season,leaderBest.game)}>Ver súmula do jogo →</Link>
            </div>}
          </div>
          {(second||third)&&<div className="ld-podium">{[second,third].map((x,i)=>x&&<Link key={x.player.id||i} className="ld-pod" href={href(x.player?.name)}>
            <div className="ld-rankline"><span>{i+2}º LUGAR</span><small>{jogosLabel(x.games)}</small></div>
            <div className="ld-pod-id"><Avatar player={x.player} size="md"/><span><b>{x.player?.name}</b><small>{x.teams?.[0]?.name||''}</small></span></div>
            <div className="ld-value sm"><strong>{fmt(x.averages?.[fkey])}</strong><span>{fabbr} por jogo</span></div>
          </Link>)}</div>}

          {rest.length>0&&<div className="ld-table" role="table" aria-label={`Ranking de ${flabel}`}>
            <div className="ld-row head" role="row"><span>#</span><span>ATLETA</span><span>EQUIPE</span><span className="r">J</span><span>MÉDIA</span></div>
            {rest.map(x=><Link role="row" key={x.player.id||x.player.name} className="ld-row" href={href(x.player?.name)}>
              <span className="pos">{posOf(x)}</span>
              <span className="who"><Avatar player={x.player} size="xs"/><b>{x.player?.name}</b></span>
              <span>{x.teams?.[0]?.name||'—'}</span>
              <span className="r">{x.games}</span>
              <span className="bar"><i style={{width:`${Math.max(4,Math.round(Number(x.averages?.[fkey]||0)/maxValue*100))}%`}}/><b>{fmt(x.averages?.[fkey])}</b></span>
            </Link>)}
          </div>}
          {ranking.length>10&&<Link className="ld-more" href={full?`${base}?temporada=${season.key}&estatistica=${fkey}`:`${base}?temporada=${season.key}&estatistica=${fkey}&todos=1`}>{full?'Mostrar só os 10 primeiros ↑':'Ver ranking completo →'}</Link>}
        </>:<p className="ld-note">Os líderes aparecem aqui assim que as primeiras súmulas desta temporada forem finalizadas.</p>}
      </section>

      <p className="ld-note"><b>J</b> = jogos disputados · <b>Média</b> = valor por jogo · <b>EFF</b> = índice de eficiência · atletas com a mesma média dividem a posição · mínimo de {jogosLabel(minGames)} · atualizado após cada jogo finalizado.</p>
    </div>
  </PortalShell>;
}
