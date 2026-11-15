import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {API} from '../../../../lib/site';

export async function GET(){
  const jar=await cookies();
  const token=jar.get('l3c_session')?.value;
  if(!token)return NextResponse.json({message:'Sessão não encontrada.'},{status:401});
  const r=await fetch(`${API}/auth/me/accesses`,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  return NextResponse.json(data,{status:r.status});
}
