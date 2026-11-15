export function homeMode(season,envMode=''){
 if(season?.preSeason?.enabled===false)return 'season2027';
 if(season?.preSeason?.enabled===true)return 'pre2027';
 if(envMode==='season2027'||envMode==='pre2027')return envMode;
 if(season&&['ACTIVE','REGISTRATION_OPEN'].includes(season.status))return 'season2027';
 return 'legacy2026';
}
