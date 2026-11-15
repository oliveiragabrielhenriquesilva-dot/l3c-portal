import {NextResponse} from 'next/server';
import {API} from '../../../../lib/site';

export async function POST(req){
  const body=await req.json();
  if(['ARBITRO','MESARIO'].includes(String(body?.requestedProfile||'').toUpperCase()))return NextResponse.json({message:'Utilize o formulário oficial /cadastro/?perfil=arbitragem para inscrição de árbitros e mesários.'},{status:409});
  const r=await fetch(`${API}/auth/register-request`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(body),
    cache:'no-store',
  });
  const data=await r.json().catch(()=>({}));
  return NextResponse.json(data,{status:r.status});
}
