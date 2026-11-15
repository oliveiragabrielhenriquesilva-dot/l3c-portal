export function jogosLabel(n){const v=Number(n||0);return `${v} ${v===1?'jogo':'jogos'}`}

const PARTICLES=new Set(['da','de','do','das','dos','e','di','du','del','della']);
// Padroniza só a apresentação do nome (CAIXA ALTA, minúsculas, "Dos"/"Da"); não altera o cadastro e não devolve acentos perdidos.
export function prettyName(name){
  const raw=String(name||'').trim().replace(/\s+/g,' ');
  if(!raw)return raw;
  return raw.split(' ').map((w,i)=>{
    const lower=w.toLocaleLowerCase('pt-BR');
    if(i>0&&PARTICLES.has(lower))return lower;
    const mixed=/[a-zà-ÿ]/.test(w.slice(1))&&/[A-ZÀ-Þ]/.test(w.slice(1));
    if(mixed)return w;
    return lower.replace(/(^|[-'’])([a-zà-ÿ])/g,(m,p,c)=>p+c.toLocaleUpperCase('pt-BR'));
  }).join(' ');
}
