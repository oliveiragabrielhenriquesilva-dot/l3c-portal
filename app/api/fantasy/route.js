import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {API} from '../../../lib/site';

function json(data,status=200){return NextResponse.json(data,{status,headers:{'cache-control':'no-store'}})}
async function token(){return (await cookies()).get('l3c_session')?.value||''}
async function relay(path,{method='GET',body,auth=false}={}){
  const t=auth?await token():'';
  if(auth&&!t)return json({message:'Entre na sua conta para continuar.'},401);
  try{
    const response=await fetch(`${API}${path}`,{
      method,
      headers:{...(body?{'content-type':'application/json'}:{}),...(t?{authorization:`Bearer ${t}`}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),
      cache:'no-store',
    });
    const data=await response.json().catch(()=>({message:'Resposta inválida da API.'}));
    return json(data,response.status);
  }catch{return json({message:'Não foi possível comunicar com o L3C Fantasy.'},502)}
}

function selected(url){return url.searchParams.get('fantasySeasonId')||''}
function withSelected(path,id){return id?`${path}${path.includes('?')?'&':'?'}fantasySeasonId=${encodeURIComponent(id)}`:path}

export async function GET(req){
  const url=new URL(req.url);const action=url.searchParams.get('action')||'bootstrap';const fantasySeasonId=selected(url);
  if(action==='seasons')return relay('/fantasy/public/seasons');
  if(action==='bootstrap')return relay(withSelected('/fantasy/public/bootstrap',fantasySeasonId));
  if(action==='market'){
    const q=new URLSearchParams();if(fantasySeasonId)q.set('fantasySeasonId',fantasySeasonId);for(const key of ['search','position','teamId']){const v=url.searchParams.get(key);if(v)q.set(key,v)}
    return relay(`/fantasy/public/market${q.size?`?${q}`:''}`);
  }
  if(action==='ranking'){
    const q=new URLSearchParams({limit:url.searchParams.get('limit')||'100'});if(fantasySeasonId)q.set('fantasySeasonId',fantasySeasonId);
    return relay(`/fantasy/public/ranking?${q}`);
  }
  if(action==='me')return relay(withSelected('/fantasy/me',fantasySeasonId),{auth:true});
  return json({message:'Ação inválida.'},400);
}

export async function POST(req){
  const url=new URL(req.url);const action=url.searchParams.get('action')||'';const body=await req.json().catch(()=>({}));
  if(action==='register')return relay('/fantasy/register',{method:'POST',body});
  return json({message:'Ação inválida.'},400);
}

export async function PUT(req){
  const url=new URL(req.url);const action=url.searchParams.get('action')||'';const body=await req.json().catch(()=>({}));
  if(action==='team')return relay('/fantasy/me/team',{method:'PUT',body,auth:true});
  return json({message:'Ação inválida.'},400);
}
