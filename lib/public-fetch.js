export async function fetchPublicText(url,options={},fetcher=fetch){
 const {timeoutMs=8000,signal,...rest}=options;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),Math.max(1,Number(timeoutMs)||8000));
 try{
  const response=await fetcher(url,{...rest,signal:signal?AbortSignal.any([signal,controller.signal]):controller.signal});
  if(!response.ok)return null;
  return await response.text();
 }catch{return null}finally{clearTimeout(timer)}
}
