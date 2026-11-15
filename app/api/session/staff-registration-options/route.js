import {NextResponse} from 'next/server';
import {API} from '../../../../lib/site';

export async function GET(){
  try{
    const response=await fetch(`${API}/auth/staff-registration-options`,{cache:'no-store'});
    const data=await response.json().catch(()=>({message:'A API não retornou dados válidos.'}));
    return NextResponse.json(data,{status:response.status,headers:{'Cache-Control':'no-store'}});
  }catch{
    return NextResponse.json({message:'Não foi possível consultar a lista oficial de equipes.'},{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
