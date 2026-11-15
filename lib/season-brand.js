// RESERVA: usada só quando o cadastro (API) não traz logo para a temporada. A identidade real vem do cadastro do L3C Stats (lib/scopes.js, brandOf).
// Para trocar uma imagem de reserva, substitua o arquivo em public/assets/brand/.
// seal: null = a temporada não tem selo próprio (o espaço some, sem imagem quebrada).
export const SEASON_BRAND={
  '2026':{league:'Liga Forjax de Basquete',logo:'/assets/brand/forjax-logo.png',seal:'/assets/brand/selo-l3c-adulto-livre.png',sealAlt:'Selo L3C · Adulto Livre'},
  'master':{league:'Liga Master',logo:'/assets/brand/master-logo-v0518.png',seal:null,sealAlt:''},
  '2025':{league:'Liga 3 Colinas',logo:'/assets/brand/l3c-logo.png',seal:null,sealAlt:''},
};
export function brandForSeason(season){return SEASON_BRAND[String(season)]||{league:'',logo:'/assets/brand/l3c-logo.png',seal:null,sealAlt:''}}
