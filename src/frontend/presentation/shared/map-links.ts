export function getMapLocation(
  address: string,
  pin?: { mapUrl?: string; mapEmbedUrl?: string },
) {
  const query = address.trim();
  if (!query) return null;

  const embed = new URL("https://maps.google.com/maps");
  embed.search = new URLSearchParams({
    q: query,
    hl: "vi",
    z: "18",
    iwloc: "A",
    output: "embed",
  }).toString();
  const search = new URL("https://www.google.com/maps/search/");
  search.search = new URLSearchParams({ api: "1", query }).toString();
  return {
    address: query,
    embedUrl: pin?.mapEmbedUrl || embed.href,
    searchUrl: pin?.mapUrl || search.href,
  };
}
