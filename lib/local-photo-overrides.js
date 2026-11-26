// Explicit recovery map for Supabase Storage photos that were uploaded locally.
// Keys are the exact storage object paths (bucket included), not athlete names.
// Only add mappings after the corresponding public local URL is verified.
// Never delete the original Supabase URL in the API/database.
export default {
};
