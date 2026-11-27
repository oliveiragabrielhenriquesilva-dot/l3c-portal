'use client';
import {usePathname,useSearchParams} from 'next/navigation';
import {navigationContext} from '../lib/navigation-context';
import {Header,Footer} from './SiteChrome';

// Descobre em qual competição o visitante está, para o menu e o cabeçalho acompanharem.
function activeScopeKey(path,search,scopes){
  if(search?.get('categoria')==='master'||search?.get('context')?.startsWith('master-'))return 'master';
  if(path.startsWith('/master')||path.startsWith('/player/master'))return 'master';
  const m=path.match(/^\/c\/([^/]+)/);
  if(m)return m[1];
  const sid=search?.get('s');
  if(sid){const sc=(scopes||[]).find(x=>(x.seasonIds||[]).includes(sid));if(sc)return sc.key}
  const ctx=String(search?.get('context')||'');
  if(ctx){const sc=(scopes||[]).find(x=>x.key!=='adulto'&&x.key!=='master'&&ctx.startsWith(`${x.key}-`));if(sc)return sc.key;if(ctx.startsWith('master-'))return 'master'}
  return 'adulto';
}
export default function Chrome({children,scopes=[]}){
  const p=usePathname()||'/';
  const search=useSearchParams();
  const standalone=p.startsWith('/painel-equipe')||p.startsWith('/atleta')||p.startsWith('/entrar')||p.startsWith('/cadastro')||p.startsWith('/minha-conta');
  if(standalone)return <>{children}</>;
  const key=activeScopeKey(p,search,scopes);
  const navigation=navigationContext(p,search,scopes.find(scope=>scope.key===key));
  return <><Header path={p} scopes={scopes} activeKey={key} navigation={navigation}/> {children}<Footer navigation={navigation} scopes={scopes} activeKey={key}/></>;
}
