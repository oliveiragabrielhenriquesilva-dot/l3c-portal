'use client';
import {useEffect,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
export default function NavigationFeedback(){
 const path=usePathname(),search=useSearchParams();
 const [pending,setPending]=useState(''),[slow,setSlow]=useState(false);
 useEffect(()=>{setPending('');setSlow(false)},[path,search]);
 useEffect(()=>{
  function click(event){
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
   const link=event.target.closest?.('a[href]');
   if(!link||link.hasAttribute('download')||link.hasAttribute('data-navigation-retry')||(link.target&&link.target!=='_self'))return;
   const url=new URL(link.href,window.location.href);
   if(url.origin!==window.location.origin||(url.pathname===window.location.pathname&&url.search===window.location.search))return;
   setPending(url.pathname+url.search+url.hash);setSlow(false);
  }
  document.addEventListener('click',click,true);return()=>document.removeEventListener('click',click,true);
 },[]);
 useEffect(()=>{if(!pending)return;const timer=setTimeout(()=>setSlow(true),12000);return()=>clearTimeout(timer)},[pending]);
 if(!pending)return null;
 return <div className="navigation-feedback" role="status" aria-live="polite"><span className="navigation-spinner" aria-hidden="true"/><span>{slow?'A página está demorando para responder.':'Carregando página…'}</span>{slow&&<a data-navigation-retry href={pending}>Abrir novamente</a>}</div>;
}
