// Cor de destaque da equipe, automática:
// 1) cor cadastrada no L3C Stats (Equipe > cor principal), se foi escolhida;
// 2) cor dominante do escudo (calculada no servidor e guardada em memória);
// 3) vermelho padrão da Liga.
const DEFAULT_ACCENT='#ed1b2f';
const PANEL_DEFAULT='#ff7a00'; // valor pré-preenchido do painel: não conta como cor escolhida
const cache=new Map();

function validHex(v){const s=String(v||'').trim();return /^#?[0-9a-f]{6}$/i.test(s)?('#'+s.replace('#','')).toLowerCase():null}

function rgbToHsv(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;
  if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}
  return {h,s:mx?d/mx:0,v:mx/255}}
function hsvToHex(h,s,v){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else [r,g,b]=[c,0,x];
  const to=n=>Math.round((n+m)*255).toString(16).padStart(2,'0');return '#'+to(r)+to(g)+to(b)}

/** Cor dominante (saturada) de uma imagem em pixels RGBA; null se só houver cinza/preto/branco. */
export function dominantFromRgba(data,channels=4){
  const bins=Array.from({length:24},()=>({w:0,h:0,s:0,v:0}));
  for(let i=0;i<data.length;i+=channels){
    if(channels===4&&data[i+3]<128)continue;
    const {h,s,v}=rgbToHsv(data[i],data[i+1],data[i+2]);
    if(s<0.4||v<0.3)continue;
    const w=s*v,b=bins[Math.min(23,Math.floor(h/15))];
    b.w+=w;b.h+=h*w;b.s+=s*w;b.v+=v*w;
  }
  const best=bins.reduce((a,b)=>b.w>a.w?b:a,bins[0]);
  if(!best||best.w<=0)return null;
  return hsvToHex(best.h/best.w,Math.min(1,best.s/best.w),Math.max(0.62,best.v/best.w));
}

async function accentFromLogo(url){
  if(!url||!/^https?:\/\//i.test(url))return null;
  if(cache.has(url))return cache.get(url);
  let color=null;
  try{
    const sharpMod=await import(/* webpackIgnore: true */ 'sharp');
    const sharp=sharpMod.default||sharpMod;
    const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),4000);
    const res=await fetch(url,{signal:ctl.signal,cache:'force-cache'});clearTimeout(t);
    if(res.ok){
      const buf=Buffer.from(await res.arrayBuffer());
      const {data,info}=await sharp(buf).resize(40,40,{fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      color=dominantFromRgba(data,info.channels);
    }
  }catch{color=null}
  cache.set(url,color);
  return color;
}

function hexToRgb(h){const n=parseInt(h.replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255]}
/** Garante legibilidade no tema escuro: cores muito escuras (ex.: verde #0a2a14) são clareadas, mantendo o tom. */
export function readableAccent(hex){
  const v0=validHex(hex);if(!v0)return DEFAULT_ACCENT;
  const [r,g,b]=hexToRgb(v0);const {h,s,v}=rgbToHsv(r,g,b);
  if(s<0.15)return v>=0.7?v0:hsvToHex(0,0,0.7);
  return v>=0.62?v0:hsvToHex(h,s,0.62);
}

export async function resolveTeamAccent(team,mapped){
  const chosen=validHex(team?.primaryColor);
  if(chosen&&chosen!==PANEL_DEFAULT)return readableAccent(chosen);
  if(mapped)return readableAccent(mapped);
  return readableAccent((await accentFromLogo(team?.logoUrl))||DEFAULT_ACCENT);
}
