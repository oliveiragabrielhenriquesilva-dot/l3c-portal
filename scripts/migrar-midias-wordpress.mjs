#!/usr/bin/env node
// Copia as imagens do WordPress para dentro do site e reescreve os JSON de dados.
// Uso (na pasta do site, ENQUANTO o WordPress ainda esta no ar):
//   node scripts/migrar-midias-wordpress.mjs --dry-run     # so lista
//   node scripts/migrar-midias-wordpress.mjs               # baixa e reescreve
// Opcoes: --origin=https://liga3colinas.com.br  (de onde baixar)
//         --from=C:\\caminho\\wp-content\\uploads  (copia de uma pasta local/backup, sem internet)
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const dry=args.includes('--dry-run');
const fromArg=(args.find(a=>a.startsWith('--from='))||'').slice(7);
const originArg=(args.find(a=>a.startsWith('--origin='))||'').split('=')[1];
const RE=/https?:\/\/(?:www\.)?liga3colinas\.com\.br\/wp-content\/uploads\/[^"'\s\\)<>]+/gi;
const dataDir=path.join(root,'data');
const outDir=path.join(root,'public','assets','legacy','uploads');
const extra=['/wp-content/uploads/2026/08/logo-oficial-forjax.webp']; // logo do cabecalho

const files=(await fs.readdir(dataDir)).filter(f=>f.endsWith('.json')).map(f=>path.join(dataDir,f));
const texts=new Map();const urls=new Set();
for(const f of files){const t=await fs.readFile(f,'utf8');texts.set(f,t);for(const m of t.matchAll(RE))urls.add(m[0]);}
const origin=(originArg||'https://liga3colinas.com.br').replace(/\/$/,'');
const rel=u=>decodeURIComponent(new URL(u).pathname.replace(/^\/wp-content\/uploads\//,''));
const jobs=[...urls].map(u=>({url:u,rel:rel(u)}));
for(const e of extra){const r=e.replace('/wp-content/uploads/','');if(!jobs.some(j=>j.rel===r))jobs.push({url:origin+e,rel:r});}
console.log(`${jobs.length} imagens encontradas em ${files.length} arquivos de dados.`);
if(dry){jobs.forEach(j=>console.log(' ',j.rel));process.exit(0)}

async function get(j){
  const dest=path.join(outDir,j.rel);
  try{await fs.access(dest);return {...j,ok:true,skipped:true}}catch{}
  if(fromArg){
    try{const buf=await fs.readFile(path.join(fromArg,j.rel));await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,buf);return {...j,ok:true,bytes:buf.length}}
    catch(e){return {...j,ok:false,error:'nao encontrado na pasta: '+j.rel}}
  }
  for(let i=0;i<3;i++){
    try{
      const src=originArg?origin+new URL(j.url).pathname:j.url;
      const r=await fetch(src,{redirect:'follow'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const buf=Buffer.from(await r.arrayBuffer());
      if(buf.length<200)throw new Error('arquivo muito pequeno');
      await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,buf);
      return {...j,ok:true,bytes:buf.length};
    }catch(e){if(i===2)return {...j,ok:false,error:String(e.message||e)}}
  }
}
const results=[];let idx=0;
await Promise.all(Array.from({length:6},async()=>{while(idx<jobs.length){const j=jobs[idx++];const r=await get(j);results.push(r);process.stdout.write(r.ok?'.':'x')}}));
console.log();
const okSet=new Set(results.filter(r=>r.ok).map(r=>r.url));
// So reescreve URLs que foram baixadas com sucesso (as que falharam continuam apontando para o WordPress).
for(const [f,t] of texts){
  const n=t.replace(RE,m=>okSet.has(m)?'/assets/legacy/uploads/'+rel(m).split('/').map(encodeURI).join('/'):m);
  if(n!==t)await fs.writeFile(f,n);
}
const failed=results.filter(r=>!r.ok);
await fs.writeFile(path.join(root,'migracao-midias-relatorio.json'),JSON.stringify({total:jobs.length,ok:results.length-failed.length,falhas:failed},null,2));
console.log(`OK: ${results.length-failed.length}  Falhas: ${failed.length}`);
failed.forEach(f=>console.log('  FALHOU',f.rel,f.error));
console.log('Relatorio: migracao-midias-relatorio.json');
