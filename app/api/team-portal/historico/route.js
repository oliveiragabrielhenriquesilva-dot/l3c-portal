import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../../lib/site';
export async function GET(request){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Entre novamente para continuar.'},{status:401});
 const url=new URL(request.url);
 const accessId=url.searchParams.get('accessId')||'';
 const seasonId=url.searchParams.get('seasonId')||'';
 const teamId=url.searchParams.get('teamId')||'';
 if(!accessId||!seasonId)return NextResponse.json({message:'Selecione a franquia e a temporada.'},{status:400});
 const endpoint=teamId?'historical-roster':'historical-teams';
 const query=new URLSearchParams({accessId,seasonId,...(teamId?{teamId}:{})});
 try{const res=await fetch(`${API}/team-portal/${endpoint}?${query}`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});const data=await res.json().catch(()=>({message:'Resposta inválida do L3C Stats.'}));return NextResponse.json(data,{status:res.status});}
 catch{return NextResponse.json({message:'Não foi possível conectar ao L3C Stats.'},{status:502});}
}
