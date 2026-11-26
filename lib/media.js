// Midias antigas do WordPress passam a apontar para a copia local em /assets/legacy/uploads/.
import localPhotoOverrides from './local-photo-overrides';

const WP_MEDIA=/https?:\/\/(?:www\.)?liga3colinas\.com\.br\/wp-content\/uploads\//gi;
const SUPABASE_MEDIA=/https?:\/\/[^/"\\\s]+\.supabase\.co\/storage\/v1\/object\/public\/[^"\\\s]+/gi;
const ROOT='/l3c-media/';

// Return local photos only when an explicit mapping has been configured and
// its public path is safe. No speculative rewrite to missing files.
export function resolveMediaUrl(url,overrides=localPhotoOverrides){
  if(typeof url!=='string')return url;
  const wp=url.replace(WP_MEDIA,'/assets/legacy/uploads/');
  if(wp!==url)return wp;
  try{
    const u=new URL(url);
    if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co'))return url;
    const prefix='/storage/v1/object/public/';
    if(!u.pathname.startsWith(prefix))return url;
    const storagePath=decodeURIComponent(u.pathname.slice(prefix.length));
    const local=overrides[storagePath];
    if(typeof local!=='string'||!local.startsWith(ROOT)||local.includes('..')||local.includes('\\'))return url;
    return local;
  }catch{return url}
}

// API JSON arrives as text: preserve all fields; replace only recognized
// photo links, including links with ?v=... query strings.
export function localMedia(value){
  if(typeof value!=='string')return value;
  const wpRewritten=value.replace(WP_MEDIA,'/assets/legacy/uploads/');
  return wpRewritten.replace(SUPABASE_MEDIA,(url)=>resolveMediaUrl(url));
}
export function localizeData(obj){return JSON.parse(localMedia(JSON.stringify(obj)))}
