import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../lib/site';

const fail=(message,status=400)=>NextResponse.json({message},{status,headers:{'cache-control':'no-store'}});
const originOk=request=>{const origin=request.headers.get('origin');if(!origin)return true;const host=request.headers.get('x-forwarded-host')||request.headers.get('host');try{return !!host&&new URL(origin).host===host}catch{return false}};
async function auth(){return (await cookies()).get('l3c_session')?.value}
export async function GET(request){
 const token=await auth();if(!token)return fail('Sessão expirada.',401);
 const id=new URL(request.url).searchParams.get('id');
 if(id&&!/^[a-zA-Z0-9_-]{8,128}$/.test(id))return fail('Documento inválido.');
 const path=id?`me/documents/${encodeURIComponent(id)}/link`:'me/documents';
 try{const r=await fetch(`${API}/official-portal/${path}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});return NextResponse.json(await r.json().catch(()=>({message:'Resposta indisponível.'})),{status:r.status,headers:{'cache-control':'no-store'}})}catch{return fail('Erro ao consultar documentos.',502)}
}
export async function POST(request){
 if(!originOk(request))return fail('Origem não autorizada.',403);
 const token=await auth();if(!token)return fail('Sessão expirada.',401);
 const kind=new URL(request.url).searchParams.get('kind');
 if(!['IDENTIDADE','CURSO_EXPERIENCIA'].includes(kind))return fail('Tipo de documento inválido.');
 const body=await request.formData().catch(()=>null);const file=body?.get('file');
 if(!file||typeof file.arrayBuffer!=='function'||file.size<1||file.size>10*1024*1024)return fail('Arquivo inválido ou maior que 10 MB.');
 const type=String(file.type||'');if(!['application/pdf','image/jpeg','image/png'].includes(type))return fail('Envie PDF, JPG ou PNG.');
 const form=new FormData();form.append('file',file,file.name);
 try{const r=await fetch(`${API}/official-portal/me/documents?kind=${kind}`,{method:'POST',headers:{authorization:`Bearer ${token}`},body:form,cache:'no-store'});return NextResponse.json(await r.json().catch(()=>({message:'Resposta indisponível.'})),{status:r.status,headers:{'cache-control':'no-store'}})}catch{return fail('Erro ao enviar documento.',502)}
}
