import MistralService from './MistralService.js';
import AdService from './AdService.js';
import GeocodingService from './GeocodingService.js';
import InteractionModel from '../models/InteractionModel.js';

/**
 * Service de l'agent virtuel IA.
 *
 * Flux :
 * 1. L'utilisateur envoie un prompt en langage naturel ("cherche moi une maison
 *    située à ngoa ekele avec 3 chambres 2 salons").
 * 2. Le backend transmet le prompt à Mistral AI.
 * 3. Mistral renvoie un JSON structuré (critères de recherche).
 * 4. Le backend effectue la recherche en base selon ces critères.
 * 5. Mistral formate une réponse conversationnelle avec les résultats.
 */
export const AgentAIService = {
  async searchByNaturalLanguage(userMessage, userId = null) {
    // 1. Conversion du prompt en critères JSON via Mistral
    const criteria = await MistralService.parseSearchQuery(userMessage);

    // 2. Géocodage du lieu repère ("près de ngoa ekele")
    let searchCriteria = { ...criteria };
    if (criteria.near && criteria.radiusKm) {
      const geo = await GeocodingService.geocodeLandmark(criteria.near);
      if (geo) {
        searchCriteria.centerLat = geo.latitude;
        searchCriteria.centerLon = geo.longitude;
        searchCriteria.radius = criteria.radiusKm;
      }
    }

    // 3. Recherche en base de données
    const results = await AdService.search(searchCriteria);

    // 4. Enregistre l'interaction si l'utilisateur est connecté
    if (userId && results.length > 0) {
      for (const r of results.slice(0, 5)) {
        await InteractionModel.recordView({ userId, adId: r.ad_id });
      }
    }

    // 5. Réponse conversationnelle formatée par Mistral
    const response = await MistralService.buildSearchResponse(userMessage, results, criteria);

    return {
      criteria,
      results,
      response,
      count: results.length,
    };
  },

  async generateAdDescription(data) {
    return MistralService.generateAdDescription(data);
  },

  /**
   * Recherche par image : extrait les caractéristiques du bien depuis l'image,
   * cherche en base des biens similaires, et renvoie une réponse conversationnelle.
   */
  async searchByImage(images, userId = null) {
    // 1. Extraction des caractéristiques via vision IA
    const features = await MistralService.extractPropertyFeatures(images);

    // 2. Construction des critères de recherche depuis les features extraites
    const searchCriteria = {};
    if (features.property_type && features.property_type !== 'null') {
      searchCriteria.type = features.property_type;
    }
    if (features.estimated_bedrooms != null && features.estimated_bedrooms > 0) {
      // Cherche des biens avec au moins ce nombre de chambres - 1 (pour élargir)
      searchCriteria.bedroomsMin = Math.max(1, features.estimated_bedrooms - 1);
    }
    if (features.estimated_bathrooms != null && features.estimated_bathrooms > 0) {
      searchCriteria.bathroomsMin = Math.max(1, features.estimated_bathrooms - 1);
    }

    // 3. Recherche en base de données
    const results = await AdService.search(searchCriteria);

    // 4. Enregistre l'interaction si l'utilisateur est connecté
    if (userId && results.length > 0) {
      for (const r of results.slice(0, 5)) {
        await InteractionModel.recordView({ userId, adId: r.ad_id });
      }
    }

    // 5. Réponse conversationnelle formatée par Mistral
    const userContext = `L'utilisateur a envoyé une image d'un bien immobilier. Analyse IA : ${features.description || 'Bien immobilier'}. Type détecté : ${features.property_type || 'non déterminé'}, chambres estimées : ${features.estimated_bedrooms || '?'}, douches : ${features.estimated_bathrooms || '?'}, style : ${features.style || 'non déterminé'}.`;
    const response = await MistralService.buildSearchResponse(userContext, results, {
      type: features.property_type,
      bedroomsMin: searchCriteria.bedroomsMin,
      bathroomsMin: searchCriteria.bathroomsMin,
    });

    return {
      features,
      results,
      response,
      count: results.length,
    };
  },
};

export default AgentAIService;
