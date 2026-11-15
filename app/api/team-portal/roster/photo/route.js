import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {API} from '../../../../../lib/site';

export async function POST(req){
 const token=(await cookies()).get('l3c_session')?.value;
 if(!token)return NextResponse.json({message:'Sessão expirada. Entre novamente.'},{status:401});
 try{
  const form=await req.formData();
  const accessId=String(form.get('accessId')||'');
  const seasonId=String(form.get('seasonId')||'');
  const rosterId=String(form.get('rosterId')||'');
  const file=form.get('file');
  if(!accessId||!seasonId||!rosterId||!file||typeof file==='string')return NextResponse.json({message:'Informe equipe, temporada, atleta e foto.'},{status:400});
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return NextResponse.json({message:'A foto deve ser JPG, PNG ou WEBP.'},{status:400});
  if(file.size>5*1024*1024)return NextResponse.json({message:'A foto deve ter até 5 MB.'},{status:400});
  const data=new FormData();data.append('file',file,file.name||'foto');
  const q=new URLSearchParams({accessId,seasonId});
  const r=await fetch(`${API}/team-portal/roster/${encodeURIComponent(rosterId)}/photo?${q}`,{
   method:'POST',headers:{authorization:`Bearer ${token}`},body:data,cache:'no-store'
  });
  return NextResponse.json(await r.json().catch(()=>({message:'Resposta inválida da API.'})),{status:r.status});
 }catch{return NextResponse.json({message:'Falha ao enviar a foto para o L3C Stats.'},{status:502})}
}
