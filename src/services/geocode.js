// Cache so we don't re-fetch same coordinates
const cache = {};
// clear cache line — remove after testing
Object.keys(cache).forEach(k => delete cache[k]);
export async function getPlaceName(lat, lng) {
  const key = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`;
  
  if (cache[key]) return cache[key];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();

    // Extract most useful part — neighbourhood/suburb/city
    const a = data.address || {};
   const name =
    a.city_district ||
    a.suburb        ||
    a.town          ||
    a.city          ||
    a.county        ||
    a.district      ||
    a.neighbourhood ||
    a.village       ||
    "Unknown area";

    cache[key] = name;
    return name;
  } catch {
    return "Unknown area";
  }
}