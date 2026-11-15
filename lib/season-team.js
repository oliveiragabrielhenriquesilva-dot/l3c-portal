// Season entry metadata is authoritative; legacy series only belong to historical seasons.
export function divisionLabel(data,year) {
  const division=data?.division;
  if(division)return division.displayName||division.name||'';
  if(Number(year)<=2026)return data?.series||'';
  return '';
}
export function matchesIdentity(item,slug,slugify){
  return [item?.team,...(item?.identities||[])].filter(Boolean).some(team=>
    slugify(team.name)===slug||Boolean(team.shortName&&slugify(team.shortName)===slug));
}
export function participationHref(item,slugify){
  return `/team/${slugify(item.team?.name||'')}/?temporada=${item.year}${String(item.seasonId).startsWith('legacy_')?'':`&s=${encodeURIComponent(item.seasonId)}`}`;
}
