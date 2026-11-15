import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../lib/site';

const fail=(message,status=400)=>NextResponse.json({message},{status,headers:{'cache-control':'no-store'}});
export async function POST(request){
  const origin=request.headers.get('origin');
  const host=request.headers.get('x-forwarded-host')||request.headers.get('host');
  try{if(origin&&(!host||new URL(origin).host!==host))return fail('Origem não autorizada.',403)}catch{return fail('Origem inválida.',403)}
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=='object'||Array.isArray(body))return fail('Formulário inválido.');
  if(!body.noFrancaFranchiseLinkDeclared)return fail('A declaração de ausência de vínculos com equipes é obrigatória.');
  const token=(await cookies()).get('l3c_session')?.value;
  const path=token?'me/enroll':'register';
  const clean={
    ...(token?{}:{name:String(body.name||'').trim().slice(0,160),email:String(body.email||'').trim().slice(0,180),password:String(body.password||'').slice(0,120)}),
    phone:String(body.phone||'').trim().slice(0,40),rg:String(body.rg||'').trim().slice(0,32),
    cpf:String(body.cpf||'').replace(/\D/g,''),birthDate:String(body.birthDate||''),city:String(body.city||'').trim().slice(0,120),
    canReferee:body.canReferee===true,canScorekeeper:body.canScorekeeper===true,
    refereeExperience:String(body.refereeExperience||'').trim().slice(0,3000),
    scorekeeperExperience:String(body.scorekeeperExperience||'').trim().slice(0,3000),
    hasCourse:body.hasCourse===true,noFrancaFranchiseLinkDeclared:true,
    paymentPixKey:String(body.paymentPixKey||'').trim().slice(0,180),
  };
  try{
    const response=await fetch(`${API}/official-portal/${path}`,{
      method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},
      body:JSON.stringify(clean),cache:'no-store',
    });
    const data=await response.json().catch(()=>({message:'Não foi possível interpretar a resposta da API.'}));
    return NextResponse.json(data,{status:response.status,headers:{'cache-control':'no-store'}});
  }catch{return fail('Não foi possível conectar ao L3C Stats.',502)}
}
