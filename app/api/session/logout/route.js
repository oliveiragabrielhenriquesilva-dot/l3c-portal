import {NextResponse} from 'next/server';
import {siteOrigin} from '../../../../lib/site-origin';
// Sem dominio fixo: usa NEXT_PUBLIC_SITE_URL ou o host que chegou pelo proxy.
function origin(req){return process.env.NEXT_PUBLIC_SITE_URL?siteOrigin():new URL(req.url).origin}
export async function POST(req){
  const res=NextResponse.redirect(`${origin(req)}/entrar/`,303);
  res.cookies.set('l3c_session','',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});
  return res;
}
