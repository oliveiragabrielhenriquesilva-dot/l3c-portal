import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../../../lib/site';
export async function GET(req){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Sessão expirada.'},{status:401});
 const p=new URL(req.url).searchParams, id=p.get('id')||'',accessId=p.get('accessId')||'',seasonId=p.get('seasonId')||'';
 if(!id||id.length>128||!accessId||!seasonId)return NextResponse.json({message:'Equipe e profissional são obrigatórios.'},{status:400});
 try{const url=`${API}/team-portal/staff/${encodeURIComponent(id)}/credential?${new URLSearchParams({accessId,seasonId})}`;
 const r=await fetch(url,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});
 return NextResponse.json(await r.json().catch(()=>({message:'Resposta inválida da API.'})),{status:r.status,headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({message:'Não foi possível conectar ao L3C Stats.'},{status:502})}
}
