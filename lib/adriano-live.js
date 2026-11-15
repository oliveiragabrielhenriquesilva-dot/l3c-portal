// Resenhas factuais: apenas resultados encerrados; sem inventar estatísticas ausentes.
export function resultReview(game,{category='master',year=2026,slug}={}){
 if(String(game?.publicStatus||game?.status).toUpperCase()!=='FINISHED')return null;
 const a=game.teamA?.name,b=game.teamB?.name;
 const sa=game.displayScoreA??game.scoreA,sb=game.displayScoreB??game.scoreB;
 if(!a||!b||sa==null||sb==null||!Number.isFinite(Number(sa))||!Number.isFinite(Number(sb))||Number(sa)<0||Number(sb)<0||Number(sa)===Number(sb))return null;
 const win=Number(sa)>Number(sb),winner=win?a:b,loser=win?b:a;
 const title=`${winner} vence ${loser} por ${win?sa:sb} a ${win?sb:sa}`;
 const stage=game.stage?.name||game.round||'Liga Master';
 const text=`${title}, com ${Math.abs(Number(sa)-Number(sb))} pontos de diferença. A partida integra ${stage} da temporada ${year}.`;
 const timestamp=String(game.startsAt||'');
 const dt=new Date(timestamp);
 return {gameId:game.id,category,year,slug,title,text,fullText:[text],teamA:a,teamB:b,score:`${sa} × ${sb}`,series:stage,stage,timestamp,date:Number.isNaN(dt.getTime())?'Data não informada':dt.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),generated:true};
}
export function reviewHref(review){return `${review.category==='master'?'/master':''}/event/${encodeURIComponent(review.slug)}/`;}
export function mergeReviews(history,current){
 const currentKeys=new Set(current.map(r=>`${r.category}:${r.year}:${r.slug}`));
 return [...history.filter(r=>!currentKeys.has(`${r.category}:${r.year}:${r.slug}`)),...current].sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')));
}
