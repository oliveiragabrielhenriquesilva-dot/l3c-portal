export function siteOrigin(){
 const configured=process.env.NEXT_PUBLIC_SITE_URL||'https://liga3colinas.com.br';
 const url=new URL(configured);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('NEXT_PUBLIC_SITE_URL inválida.');
 return url.origin;
}
