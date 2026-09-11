import axios from 'axios';
import { config } from '../config/index.js';

/**
 * Service de géocodage — convertit une adresse textuelle en coordonnées
 * latitude/longitude via Nominatim (OpenStreetMap).
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
   * Géocode un lieu repère (ex: "ngoa ekele") pour la recherche "près de".
   */
  async geocodeLandmark(name) {
    if (!name) return null;
    return this.geocode(name);
  },
};

export default GeocodingService;
