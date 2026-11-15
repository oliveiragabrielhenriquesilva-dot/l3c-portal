'use client';
import {useState} from 'react';
import Link from 'next/link';
export default function EquipeMobileNav({base,view}){
 const [open,setOpen]=useState(false);
 const primary=[['overview','Início','⌂'],['roster','Elenco','♟'],['registrations','Inscrições','▤']];
 const extras=[['eligibility','Presença e Elegibilidade'],['transfers','Transferências'],['staff','Comissão Técnica'],['documents','Documentos'],['finance','Financeiro']];
 return <><nav className="l3e-mobile-bottom" aria-label="Navegação mobile da equipe">{primary.map(([id,label,icon])=><Link key={id} href={`${base}&view=${id}`} aria-current={view===id?'page':undefined} className={view===id?'on':''} onClick={()=>setOpen(false)}><span aria-hidden="true">{icon}</span><small>{label}</small></Link>)}<button type="button" aria-expanded={open} aria-controls="l3e-mobile-more" className={open||extras.some(x=>x[0]===view)?'on':''} onClick={()=>setOpen(v=>!v)}><span aria-hidden="true">☰</span><small>Mais</small></button></nav>{open&&<div id="l3e-mobile-more" className="l3e-mobile-more" role="navigation" aria-label="Outras áreas da equipe">{extras.map(([id,label])=><Link key={id} href={`${base}&view=${id}`} onClick={()=>setOpen(false)}>{label}</Link>)}<Link href="/minha-conta/">Meus acessos</Link><button type="button" onClick={()=>setOpen(false)}>Fechar menu</button></div>}</>;
}
