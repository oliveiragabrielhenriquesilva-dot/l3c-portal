import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../../lib/site';

async function requestApi(path,method='GET',payload){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Sessão expirada. Entre novamente.'},{status:401});
 try{
  const r=await fetch(`${API}${path}`,{method,headers:{authorization:`Bearer ${token}`,...(payload?{'content-type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}),cache:'no-store'});
  const body=await r.json().catch(()=>({message:'Resposta inesperada da API.'}));
  return NextResponse.json(body,{status:r.status});
 }catch{return NextResponse.json({message:'Não foi possível conectar à API do L3C Stats.'},{status:502})}
}
export async function GET(req){
 const q=new URL(req.url).searchParams;
 const accessId=q.get('accessId'),seasonId=q.get('seasonId');
 if(!accessId||!seasonId)return NextResponse.json({message:'Selecione equipe e temporada.'},{status:400});
 return requestApi(`/team-portal/roster/release-policy?${new URLSearchParams({accessId,seasonId})}`);
}
export async function DELETE(req){
 const b=await req.json().catch(()=>null);
 if(!b||!b.accessId||!b.seasonId||typeof b.rosterId!=='string'||!b.rosterId)return NextResponse.json({message:'Informe vínculo, equipe e temporada.'},{status:400});
 const qs=new URLSearchParams({accessId:String(b.accessId),seasonId:String(b.seasonId)});
 return requestApi(`/team-portal/roster/${encodeURIComponent(b.rosterId)}?${qs}`,'DELETE');
}

export async function PATCH(req){
 const body=await req.json().catch(()=>null);
 if(!body||!body.accessId||!body.seasonId||typeof body.rosterId!=='string'||!body.rosterId)return NextResponse.json({message:'Informe equipe, temporada e jogador.'},{status:400});
 const number=body.number===''||body.number==null?null:Number(body.number);
 if(number!==null&&(!Number.isInteger(number)||number<0||number>99))return NextResponse.json({message:'A camisa deve ser um número entre 0 e 99.'},{status:400});
 return requestApi(`/team-portal/roster/${encodeURIComponent(body.rosterId)}`,'PATCH',{accessId:String(body.accessId),seasonId:String(body.seasonId),number,...(typeof body.position==='string'?{position:body.position.trim().slice(0,50)}:{})});
}
