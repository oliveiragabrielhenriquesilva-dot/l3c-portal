'use client';
export async function api(path,options={}){
 const organizationId=new URLSearchParams(window.location.search).get('organizationId');
 const params=new URLSearchParams({path,organizationId:organizationId||''});
 const response=await fetch(`/api/transmission?${params}`,{...options,headers:{...(!(options.body instanceof FormData)&&options.body?{'content-type':'application/json'}:{}),...(options.headers||{})},cache:'no-store'});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(Array.isArray(result.message)?result.message.join(' · '):result.message||'Não foi possível executar esta ação.');
 return result;
}
