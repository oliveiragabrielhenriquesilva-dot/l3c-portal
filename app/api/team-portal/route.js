import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../lib/site';
const paths={search:'/team-portal/players',bulk:'/team-portal/roster/requests',existing:'/team-portal/roster/requests',new:'/team-portal/players/requests'};
export async function GET(request){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Sessão expirada. Faça login novamente.'},{status:401});
 const url=new URL(request.url);const accessId=url.searchParams.get('accessId');const seasonId=url.searchParams.get('seasonId');
 if(!accessId||!seasonId)return NextResponse.json({message:'Selecione um vínculo e uma temporada válidos.'},{status:400});
 const query=new URLSearchParams({accessId,seasonId,q:(url.searchParams.get('q')||'').slice(0,120)});
 const path=url.searchParams.get('policy')==='1'?'/team-portal/players/registration-policy':url.searchParams.get('requests')==='1'?'/team-portal/roster/requests':paths.search;
 try{const r=await fetch(`${API}${path}?${query}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});return NextResponse.json(await r.json().catch(()=>({message:'Resposta inválida da API.'})),{status:r.status})}catch{return NextResponse.json({message:'Não foi possível consultar a API.'},{status:502})}
}
export async function POST(request){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Sessão expirada. Faça login novamente.'},{status:401});
 const body=await request.json().catch(()=>({}));const action=body.action;
 if(!['existing','bulk','new'].includes(action))return NextResponse.json({message:'Operação inválida.'},{status:400});
 if(typeof body.accessId!=='string'||typeof body.seasonId!=='string'||!body.accessId||!body.seasonId)return NextResponse.json({message:'Vínculo e temporada são obrigatórios.'},{status:400});
 const number=body.number===''||body.number===null||body.number===undefined?undefined:Number(body.number);
 if(number!==undefined&&(!Number.isInteger(number)||number<0||number>99))return NextResponse.json({message:'Número de camisa inválido.'},{status:400});
 const payload=action==='new'?{
  accessId:body.accessId,seasonId:body.seasonId,fullName:body.fullName,
  displayName:body.displayName,birthDate:body.birthDate,document:body.document,
  email:body.email,phone:body.phone,position:body.position,number,
 }:{accessId:body.accessId,seasonId:body.seasonId,
  players:action==='bulk'?(Array.isArray(body.players)?body.players.slice(0,40):[]):[{playerId:body.playerId,number}]};
 if(action==='bulk'&&(!payload.players.length||payload.players.some(x=>typeof x.playerId!=='string')))return NextResponse.json({message:'Selecione atletas válidos.'},{status:400});
 if(action==='existing'&&!body.playerId)return NextResponse.json({message:'Selecione um atleta existente.'},{status:400});
 if(action==='new'&&(!String(body.fullName||'').trim()||!String(body.birthDate||'').trim()))return NextResponse.json({message:'Nome completo e data de nascimento são obrigatórios.'},{status:400});
 try{const r=await fetch(`${API}${paths[action]}`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});return NextResponse.json(await r.json().catch(()=>({message:'Resposta inválida da API.'})),{status:r.status})}catch{return NextResponse.json({message:'Não foi possível consultar a API.'},{status:502})}
}
