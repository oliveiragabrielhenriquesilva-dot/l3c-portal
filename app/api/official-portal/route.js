import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../lib/site';

const GET_PATHS={me:'me',games:'me/games',finance:'me/finance',unavailability:'me/unavailability'};
const fail=(message,status=400)=>NextResponse.json({message},{status});
async function proxy(path,method='GET',data){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return fail('Sua sessão expirou. Entre novamente.',401);
 try{
  const response=await fetch(`${API}/official-portal/${path}`,{method,headers:{authorization:`Bearer ${token}`,...(data?{'content-type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{}),cache:'no-store'});
  const body=await response.json().catch(()=>({message:'Resposta inválida do L3C Stats.'}));
  return NextResponse.json(body,{status:response.status,headers:{'cache-control':'no-store'}});
 }catch{return fail('Não foi possível comunicar com o L3C Stats.',502)}
}
function checkOrigin(request){const origin=request.headers.get('origin');if(!origin)return true;const host=request.headers.get('x-forwarded-host')||request.headers.get('host');try{return !!host&&new URL(origin).host===host}catch{return false}}
export async function GET(request){const mode=new URL(request.url).searchParams.get('mode')||'me';return GET_PATHS[mode]?proxy(GET_PATHS[mode]):fail('Consulta não permitida.');}
export async function POST(request){
 if(!checkOrigin(request))return fail('Origem da solicitação inválida.',403);
 const body=await request.json().catch(()=>null);if(!body||typeof body!=='object')return fail('Solicitação inválida.');
 if(body.action==='respond'){
  const id=String(body.id||'');if(!/^[\w-]{5,128}$/.test(id))return fail('Escala inválida.');
  if(!['CONFIRMED','DECLINED'].includes(body.status))return fail('Resposta inválida.');
  return proxy(`me/assignments/${encodeURIComponent(id)}/response`,'PATCH',{status:body.status,note:String(body.note||'').slice(0,500)});
 }
 if(body.action==='unavailability'){
  const startsAt=String(body.startsAt||''),endsAt=String(body.endsAt||'');
  if(!Number.isFinite(Date.parse(startsAt))||!Number.isFinite(Date.parse(endsAt)))return fail('Informe datas válidas.');
  return proxy('me/unavailability','POST',{startsAt,endsAt,reason:String(body.reason||'').slice(0,300)});
 }
 if(body.action==='remove-unavailability'){
  const id=String(body.id||'');if(!/^[\w-]{5,128}$/.test(id))return fail('Indisponibilidade inválida.');
  return proxy(`me/unavailability/${encodeURIComponent(id)}`,'DELETE');
 }
 return fail('Operação não permitida.');
}
