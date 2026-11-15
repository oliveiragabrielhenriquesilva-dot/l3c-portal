import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../../lib/site';
const fail=(message,status=400)=>NextResponse.json({message},{status});
async function proxy(path,method,body){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return fail('Sessão expirada. Faça login novamente.',401);
 try{const res=await fetch(`${API}${path}`,{method,headers:{authorization:`Bearer ${token}`,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
 return NextResponse.json(await res.json().catch(()=>({message:'Resposta inválida da API.'})),{status:res.status});}
 catch{return fail('Não foi possível conectar ao L3C Stats.',502)}
}
export async function GET(req){
 const p=new URL(req.url).searchParams,accessId=p.get('accessId'),seasonId=p.get('seasonId');
 if(!accessId||!seasonId)return fail('Selecione uma equipe e temporada.');
 return proxy(`/team-portal/staff-candidates?${new URLSearchParams({accessId,seasonId,q:(p.get('q')||'').slice(0,120)})}`,'GET');
}
export async function POST(req){
 const b=await req.json().catch(()=>null);
 if(!b||typeof b.accessId!=='string'||typeof b.seasonId!=='string'||!b.accessId||!b.seasonId)return fail('Equipe e temporada são obrigatórias.');
 const role=String(b.role||'').trim().slice(0,80);if(!role)return fail('Informe a função do profissional.');
 if(b.action==='existing')return typeof b.personId==='string'&&b.personId?proxy('/team-portal/staff','POST',{accessId:b.accessId,seasonId:b.seasonId,personId:b.personId,role}):fail('Selecione um profissional.');
 if(b.action==='new'){
  const fullName=String(b.fullName||'').trim().slice(0,160);if(fullName.length<3)return fail('Informe o nome completo.');
  const payload={accessId:b.accessId,seasonId:b.seasonId,fullName,role};
  for(const k of ['displayName','birthDate','document','email','phone'])if(typeof b[k]==='string'&&b[k].trim())payload[k]=b[k].trim();
  return proxy('/team-portal/staff/new','POST',payload);
 }
 if(b.action==='role')return typeof b.assignmentId==='string'&&b.assignmentId?proxy(`/team-portal/staff/${encodeURIComponent(b.assignmentId)}`,'PATCH',{accessId:b.accessId,seasonId:b.seasonId,role}):fail('Vínculo inválido.');
 return fail('Operação inválida.');
}
