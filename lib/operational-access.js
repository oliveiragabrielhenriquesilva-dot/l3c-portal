export function transmissionOrganizations(accesses={}){
 const result=new Map();
 for(const entry of accesses.organizations||[]){
  if((entry.modules||[]).some(code=>['TRANSMISSION','MANAGEMENT'].includes(String(code).toUpperCase())))result.set(entry.id,{id:entry.id,name:entry.shortName||entry.name});
 }
 for(const entry of accesses.competitions||[]){
  if(entry.organizationId&&(entry.modules||[]).some(code=>['TRANSMISSION','MANAGEMENT'].includes(String(code).toUpperCase())))result.set(entry.organizationId,{id:entry.organizationId,name:entry.organizationName||entry.name});
 }
 return [...result.values()];
}
