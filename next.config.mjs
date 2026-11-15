import {domainSettings,canonicalRedirects} from './lib/domain-config.mjs';
const domains=domainSettings();
const securityHeaders = [
  // CSP conservadora: bloqueia embed em outros sites e plugins, sem restringir scripts do Next.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig={
  output:'standalone',
  poweredByHeader:false,
  images:{unoptimized:true},
  async headers(){return [{source:'/:path*',headers:securityHeaders}]},
  async redirects(){return [
    ...canonicalRedirects(),
    {source:'/liga-master',destination:'/master/',permanent:true},
    {source:'/liga-master/:path*',destination:'/master/:path*',permanent:true},
    {source:'/classificacoes',destination:'/classificacao/',permanent:true},
    {source:'/jogadores',destination:'/atletas/',permanent:true},
    {source:'/eventos',destination:'/jogos/',permanent:true},
    {source:'/times',destination:'/equipes/',permanent:true},
    {source:'/temporada',destination:'/temporada/2026/',permanent:true},
    {source:'/temporada/2026/jogos',destination:'/jogos/',permanent:true},
    {source:'/temporada/2026/eventos',destination:'/jogos/',permanent:true},
    {source:'/temporada/2026/classificacoes',destination:'/classificacao/',permanent:true},
    {source:'/temporada/2026/equipes',destination:'/equipes/',permanent:true},
    {source:'/temporada/2026/times',destination:'/equipes/',permanent:true},
    {source:'/temporada/2026/jogadores',destination:'/atletas/',permanent:true},
    {source:'/temporada/2026/atletas',destination:'/atletas/',permanent:true},
    {source:'/temporada/2026/noticias',destination:'/noticias/',permanent:true},
    {source:'/temporada/2026/adriano',destination:'/adriano/',permanent:true},
    {source:'/temporada/2026/sobre',destination:'/sobre/',permanent:true},
    {source:'/fase-de-classificacao',destination:'/temporada/2026/fase-de-classificacao/',permanent:true},
    {source:'/fase-classificacao',destination:'/temporada/2026/fase-de-classificacao/',permanent:true},
    {source:'/primeira-fase',destination:'/temporada/2026/fase-de-classificacao/',permanent:true},
    {source:'/interesse-2027',destination:'/temporada-2027/',permanent:true},
    // Saida do WordPress: enderecos tipicos que ainda circulam (Google, WhatsApp, favoritos)
    {source:'/wp-login.php',destination:domains.wordpress?`${domains.wordpress}/wp-login.php`:'/entrar/',permanent:true},
    {source:'/wp-admin',destination:domains.wordpress?`${domains.wordpress}/wp-admin/`:'/entrar/',permanent:true},
    {source:'/wp-admin/:path*',destination:domains.wordpress?`${domains.wordpress}/wp-admin/:path*`:'/entrar/',permanent:true},
    {source:'/feed',destination:'/noticias/',permanent:true},
    {source:'/feed/:path*',destination:'/noticias/',permanent:true},
    {source:'/category/:path*',destination:'/noticias/',permanent:true},
    {source:'/tag/:path*',destination:'/noticias/',permanent:true},
    {source:'/author/:path*',destination:'/',permanent:true},
  ]},
  async rewrites(){return [
    ...(domains.wordpress?[{source:'/wp-json/:path*',destination:`${domains.wordpress}/wp-json/:path*`}]:[]),
    // Links antigos de imagem continuam funcionando apos a troca de dominio
    {source:'/wp-content/uploads/:path*',destination:'/assets/legacy/uploads/:path*'}
  ]}
};
export default nextConfig;
