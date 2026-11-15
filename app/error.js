'use client';
export default function ErrorPage({reset}){return <main className="portal-route-loading" role="alert"><h1>Não foi possível abrir esta página</h1><p>Tente carregar novamente.</p><button className="btn primary" onClick={()=>reset()}>Tentar novamente</button><a className="btn" href="/">Página inicial</a></main>}
