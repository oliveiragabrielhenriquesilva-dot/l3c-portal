import {NextResponse} from 'next/server';
import {API} from '../../../../lib/site';

export async function POST(req){
  const body=await req.json();
  const r=await fetch(`${API}/auth/login`,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify(body),
    cache:'no-store',
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)return NextResponse.json(data,{status:r.status});
  const token=data.accessToken||data.token||data.access_token;
  if(!token)return NextResponse.json({message:'Token não retornado pela API.'},{status:502});
  const res=NextResponse.json({
    ok:true,
    user:data.user||null,
    organizations:data.organizations||[],
    competitions:data.competitions||[],
    teams:data.teams||[],
    officials:data.officials||[],
  });
  res.cookies.set('l3c_session',token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:60*60*12});
  return res;
}
