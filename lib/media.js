// Midias antigas do WordPress passam a apontar para a copia local em /assets/legacy/uploads/.
const WP_MEDIA=/https?:\/\/(?:www\.)?liga3colinas\.com\.br\/wp-content\/uploads\//gi;
export function localMedia(v){return typeof v==='string'?v.replace(WP_MEDIA,'/assets/legacy/uploads/'):v}
export function localizeData(obj){return JSON.parse(localMedia(JSON.stringify(obj)))}
