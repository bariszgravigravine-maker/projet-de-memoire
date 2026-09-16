import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Repères connus du Cameroun (coordonnées directes, sans appel réseau).
 * Clé = texte normalisé (minuscules, sans accents, sans articles).
 */
const KNOWN_LANDMARKS = {
  'beac': { latitude: 3.8670, longitude: 11.5174, displayName: 'BEAC, Centre-ville, Yaoundé' },
  'entree beac': { latitude: 3.8670, longitude: 11.5174, displayName: 'Entrée BEAC, Centre-ville, Yaoundé' },
  'beac yaounde': { latitude: 3.8670, longitude: 11.5174, displayName: 'BEAC, Centre-ville, Yaoundé' },
  'banque des etats de l afrique centrale': { latitude: 3.8670, longitude: 11.5174, displayName: 'BEAC, Centre-ville, Yaoundé' },
  'poste centrale': { latitude: 3.8667, longitude: 11.5167, displayName: 'Poste Centrale, Yaoundé' },
  'hotel de ville yaounde': { latitude: 3.8720, longitude: 11.5210, displayName: 'Hôtel de Ville, Yaoundé' },
  'palais des congres': { latitude: 3.8900, longitude: 11.5160, displayName: 'Palais des Congrès, Yaoundé' },
  'stade ahmadou ahidjo': { latitude: 3.8890, longitude: 11.5400, displayName: 'Stade Ahmadou Ahidjo, Yaoundé' },
  'omnisport': { latitude: 3.8861, longitude: 11.4900, displayName: 'Stade Omnisports, Yaoundé' },
  'stade omnisports': { latitude: 3.8861, longitude: 11.4900, displayName: 'Stade Omnisports, Yaoundé' },
  'universite de yaounde 1': { latitude: 3.8634, longitude: 11.5031, displayName: 'Université de Yaoundé I, Ngoa-Ekellé' },
  'universite de yaounde i': { latitude: 3.8634, longitude: 11.5031, displayName: 'Université de Yaoundé I, Ngoa-Ekellé' },
  'universite de yaounde 2': { latitude: 3.8050, longitude: 11.4800, displayName: 'Université de Yaoundé II, Soa' },
  'hopital central': { latitude: 3.8640, longitude: 11.5170, displayName: 'Hôpital Central, Yaoundé' },
  'hopital central de yaounde': { latitude: 3.8640, longitude: 11.5170, displayName: 'Hôpital Central, Yaoundé' },
  'hopital gyneco': { latitude: 3.8960, longitude: 11.5370, displayName: 'Hôpital Gynéco-Obstétrique, Ngousso, Yaoundé' },
  'chateau deau': { latitude: 3.8896, longitude: 11.5286, displayName: "Château d'eau, Bastos, Yaoundé" },
  'carrefour bastos': { latitude: 3.8896, longitude: 11.5286, displayName: 'Carrefour Bastos, Yaoundé' },
  'rond point nlongkak': { latitude: 3.8778, longitude: 11.5153, displayName: 'Rond-point Nlongkak, Yaoundé' },
  'carrefour warda': { latitude: 3.8850, longitude: 11.5250, displayName: 'Carrefour Warda, Yaoundé' },
  'marche mokolo': { latitude: 3.8833, longitude: 11.5000, displayName: 'Marché Mokolo, Yaoundé' },
  'marche central': { latitude: 4.0511, longitude: 9.7679, displayName: 'Marché Central, Douala' },
  'cathedrale notre dame': { latitude: 3.8700, longitude: 11.5180, displayName: 'Cathédrale Notre Dame, Yaoundé' },
  'mont febe': { latitude: 3.8900, longitude: 11.4900, displayName: 'Mont Fébé, Yaoundé' },
};

function normalizeName(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(l['’]|le |la |les |de |d['’]|du |des |a cote de |pres de |proche de |pas loin de |entree de |entree )+/g, '')
    .trim();
}

/**
 * Service de géocodage — convertit une adresse textuelle en coordonnées
 * latitude/longitude via Nominatim (OpenStreetMap), avec table de repères
 * connus en priorité (pas d'appel réseau).
 */
export const GeocodingService = {
  async geocode(address) {
    if (!address || address.trim() === '') return null;
    try {
      const res = await axios.get(config.nominatim.url, {
        params: {
          q: `${address}, Cameroun`,
          format: 'json',
          limit: 1,
          countrycodes: 'cm',
        },
        headers: {
          'User-Agent': 'ImmoGeoApp/1.0 (fredy)',
        },
        timeout: 10000,
      });
      if (res.data && res.data.length > 0) {
        return {
          latitude: parseFloat(res.data[0].lat),
          longitude: parseFloat(res.data[0].lon),
          displayName: res.data[0].display_name,
        };
      }
      return null;
    } catch (err) {
      console.error('[Geocoding] Erreur:', err.message);
      return null;
    }
  },

  /**
   * Géocode un lieu repère. Ordre de recherche :
   * 1. Table des repères connus (BEAC, stades, hôpitaux…) — instantané
   * 2. Correspondance partielle dans la table (le texte contient un repère)
   * 3. Nominatim (OpenStreetMap) en secours
   */
  async geocodeLandmark(name) {
    if (!name) return null;
    const norm = normalizeName(name);
    // 1. Correspondance exacte
    if (KNOWN_LANDMARKS[norm]) return KNOWN_LANDMARKS[norm];
    // 2. Correspondance partielle : "l'entree de la beac a yaounde" → "beac"
    for (const [key, coords] of Object.entries(KNOWN_LANDMARKS)) {
      if (norm.includes(key) || key.includes(norm)) return coords;
    }
    // 3. Nominatim
    return this.geocode(name);
  },
};

export default GeocodingService;
