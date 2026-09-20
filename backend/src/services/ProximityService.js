import axios from 'axios';

/**
 * Détection automatique des équipements de proximité autour d'un bien.
 *
 * Interroge l'API Overpass (OpenStreetMap) pour trouver les écoles, lycées,
 * marchés, hôpitaux… dans un rayon donné, puis les traduit en codes du
 * catalogue `preferences` avec la distance réelle (mètres) et le nom du lieu.
 * Ainsi l'utilisateur n'a plus à déclarer les proximités à la main : le
 * système les déduit des coordonnées choisies sur la mini-map.
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_M = 1000;

// Centre-ville de Yaoundé (Poste Centrale) — tag "centre_ville" si le bien
// est à moins de 3 km du centre.
const CITY_CENTER = { latitude: 3.8667, longitude: 11.5167, maxM: 3000, name: 'Centre-ville, Yaoundé' };

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Traduit les tags OSM d'un élément en codes de préférence du catalogue.
 * Retourne [] si l'élément ne correspond à aucune catégorie connue.
 */
function classify(tags) {
  if (!tags) return [];
  const name = (tags.name || '').toLowerCase();
  const codes = [];

  switch (tags.amenity) {
    case 'school':
      // OSM ne distingue pas primaire/secondaire : "school" couvre école.
      // Si le nom indique explicitement un lycée/collège, on ajoute le code.
      codes.push('ecole');
      if (/lyc|coll|high school|secondary/.test(name)) codes.push('lycee');
      break;
    case 'college':
    case 'university':
      codes.push('universite');
      break;
    case 'kindergarten':
    case 'childcare':
      codes.push('creche');
      break;
    case 'hospital':
    case 'clinic':
    case 'doctors':
      codes.push('hopital');
      break;
    case 'pharmacy':
      codes.push('pharmacie');
      break;
    case 'marketplace':
      codes.push('marche');
      break;
    case 'bank':
    case 'atm':
    case 'bureau_de_change':
      codes.push('banque');
      break;
    case 'police':
      codes.push('commissariat');
      break;
    case 'bus_station':
      codes.push('transport');
      break;
    case 'gym':
      codes.push('salle_sport');
      break;
    case 'place_of_worship':
      if (tags.religion === 'muslim' || /mosqu|masjid/.test(name)) codes.push('mosquee');
      else codes.push('eglise');
      break;
  }

  switch (tags.shop) {
    case 'supermarket':
    case 'convenience':
      codes.push('supermarche');
      break;
    case 'marketplace':
      codes.push('marche');
      break;
  }

  switch (tags.leisure) {
    case 'park':
    case 'garden':
    case 'recreation_ground':
    case 'nature_reserve':
      codes.push('espace_vert');
      break;
    case 'fitness_centre':
    case 'sports_centre':
      codes.push('salle_sport');
      break;
  }

  if (tags.public_transport || tags.highway === 'bus_stop') codes.push('transport');

  return codes;
}

const OVERPASS_QUERY = (lat, lon) => `
[out:json][timeout:15];
(
  nwr["amenity"~"^(school|college|university|kindergarten|childcare|hospital|clinic|doctors|pharmacy|marketplace|bank|atm|bureau_de_change|police|bus_station|place_of_worship|gym)$"](around:${SEARCH_RADIUS_M},${lat},${lon});
  nwr["shop"~"^(supermarket|convenience|marketplace)$"](around:${SEARCH_RADIUS_M},${lat},${lon});
  nwr["leisure"~"^(park|garden|recreation_ground|nature_reserve|fitness_centre|sports_centre)$"](around:${SEARCH_RADIUS_M},${lat},${lon});
  nwr["public_transport"~"^(station|platform|stop_position)$"](around:${SEARCH_RADIUS_M},${lat},${lon});
  node["highway"="bus_stop"](around:${SEARCH_RADIUS_M},${lat},${lon});
);
out center tags 80;
`;

export const ProximityService = {
  /**
   * Détecte les préférences de proximité autour de (lat, lon).
   * @returns {Promise<Array<{code:string, note:string|null, distance_m:number}>>}
   *   Au plus une entrée par code — le lieu le plus proche de la catégorie.
   */
  async detectNearby(lat, lon) {
    if (lat == null || lon == null) return [];

    const res = await axios.post(
      OVERPASS_URL,
      `data=${encodeURIComponent(OVERPASS_QUERY(lat, lon))}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ImmoGeoApp/1.0 (fredy)',
        },
        timeout: 20000,
      }
    );

    // Garde uniquement le lieu le plus proche de chaque catégorie.
    const nearest = new Map();
    for (const el of res.data?.elements || []) {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (elLat == null || elLon == null) continue;

      const distance = Math.round(haversineM(lat, lon, elLat, elLon));
      const name = el.tags?.name || null;

      for (const code of classify(el.tags)) {
        const current = nearest.get(code);
        if (!current || distance < current.distance_m) {
          nearest.set(code, { code, note: name, distance_m: distance });
        }
      }
    }

    // Centre-ville : distance à vol d'oiseau du centre de Yaoundé
    const dCenter = Math.round(haversineM(lat, lon, CITY_CENTER.latitude, CITY_CENTER.longitude));
    if (dCenter <= CITY_CENTER.maxM) {
      nearest.set('centre_ville', { code: 'centre_ville', note: CITY_CENTER.name, distance_m: dCenter });
    }

    return [...nearest.values()].sort((a, b) => a.distance_m - b.distance_m);
  },
};

export default ProximityService;
