import {promises as fs} from 'fs';
import path from 'path';

// Fotos fora do deploy: se a variável L3C_MEDIA_DIR apontar para uma pasta persistente do servidor
// (fora da pasta do aplicativo), as imagens são servidas de lá. Arquivos que existirem em
// public/assets/legacy/uploads continuam tendo prioridade (comportamento anterior preservado).
export const dynamic='force-dynamic';
export const runtime='nodejs';

const TYPES={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.svg':'image/svg+xml','.pdf':'application/pdf'};
const notFound=()=>new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});

export async function GET(request,{params}){
  const base=process.env.L3C_MEDIA_DIR;
  if(!base)return notFound();
  const parts=(await params).path||[];
  if(!parts.length)return notFound();
  let segments;
  try{segments=parts.map(p=>decodeURIComponent(p))}catch{return notFound()}
  if(segments.some(s=>!s||s==='.'||s==='..'||s.includes('\0')||s.includes('/')||s.includes('\\')))return notFound();
  const type=TYPES[path.extname(segments[segments.length-1]).toLowerCase()];
  if(!type)return notFound();
  const root=path.resolve(base);
  const file=path.resolve(root,...segments);
  if(!file.startsWith(root+path.sep))return notFound();
  try{
    const stat=await fs.stat(file);
    if(!stat.isFile())return notFound();
    const etag=`"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const headers={'Content-Type':type,'Cache-Control':'public, max-age=86400, stale-while-revalidate=604800','ETag':etag,'Last-Modified':stat.mtime.toUTCString()};
    if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});
    const data=await fs.readFile(file);
    return new Response(data,{status:200,headers:{...headers,'Content-Length':String(data.length)}});
  }catch{return notFound()}
}
