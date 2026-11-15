import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../lib/site';
import {transmissionOrganizations} from '../../../lib/operational-access';
export async function forward(req){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Sessão expirada.'},{status:401});
 if(req.method!=='GET'){
  const origin=req.headers.get('origin');
  if(origin&&origin!==new URL(req.url).origin)return NextResponse.json({message:'Origem não autorizada.'},{status:403});
  if(Number(req.headers.get('content-length')||0)>6*1024*1024)return NextResponse.json({message:'Arquivo acima do limite permitido.'},{status:413});
 }
 const params=new URL(req.url).searchParams;
 const path=params.get('path')||'',organizationId=params.get('organizationId')||'';
 const allowed=(path==='/transmission'&&['GET','PUT'].includes(req.method))||(/^\/transmission\/(channel-logo|sponsor-logo)$/.test(path)&&req.method==='POST')||(['/games','/competitions','/transmission/gochamps/games'].includes(path)&&req.method==='GET')||(/^\/competitions\/[\w-]+\/logo$/.test(path)&&req.method==='POST')||(/^\/competitions\/[\w-]+$/.test(path)&&req.method==='PATCH')||(/^\/public\/games\/[\w-]+\/live$/.test(path)&&req.method==='GET');
 if(!allowed||!organizationId)return NextResponse.json({message:'Operação inválida.'},{status:400});
 try{
  const identity=await fetch(`${API}/auth/me/accesses`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});
  if(!identity.ok)return NextResponse.json({message:'Sessão ou acesso indisponível.'},{status:identity.status});
  if(!transmissionOrganizations(await identity.json()).some(item=>item.id===organizationId))return NextResponse.json({message:'Sem acesso à transmissão desta organização.'},{status:403});
  const headers={authorization:`Bearer ${token}`,'x-organization-id':organizationId};
  const options={method:req.method,headers,cache:'no-store'};
  if(req.method!=='GET'){
   if((req.headers.get('content-type')||'').includes('multipart/form-data'))options.body=await req.formData();
   else{headers['content-type']='application/json';options.body=JSON.stringify(await req.json())}
  }
  const response=await fetch(`${API}${path}`,options);
  return NextResponse.json(await response.json().catch(()=>({message:'Resposta inesperada da API.'})),{status:response.status});
 }catch{return NextResponse.json({message:'Não foi possível conectar à transmissão.'},{status:502})}
}
export const GET=forward,PUT=forward,POST=forward,PATCH=forward;
