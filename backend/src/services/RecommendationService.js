import InteractionModel from '../models/InteractionModel.js';
import UserModel from '../models/UserModel.js';
import TransactionModel from '../models/TransactionModel.js';

/**
 * Service de recommandation personnalisée (approche hybride).
 */
export const RecommendationService = {
  async getRecommendations(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const err = new Error('Utilisateur introuvable');
      err.status = 404;
      throw err;
    }

    // 1. Recommandations basées contenu (si historique)
    const contentBased = await InteractionModel.recommendContentBased(userId, 10);

    // 2. Si pas d'historique (cold start), on utilise la popularité
    //    + les préférences déclarées
    let recommendations = contentBased;
    if (recommendations.length < 5) {
      const popular = await InteractionModel.recommendPopular(15);
      // Filtrer selon les préférences déclarées
      recommendations = this.filterByPreferences(popular, user);
    }

    // 3. Score de pertinence (simple normalisation)
    return recommendations.map((r, i) => ({
      ...r,
      score: Math.max(0, 1 - i * 0.05),
    }));
  },

  filterByPreferences(biens, user) {
    const types = (user.preferred_types || []).map((t) => t.toLowerCase());
    const zones = (user.preferred_zones || []).map((z) => z.toLowerCase());
    if (types.length === 0 && zones.length === 0) return biens;
    const zoneMatch = (b) =>
      zones.some((z) =>
        (b.city && b.city.toLowerCase().includes(z)) ||
        (b.district && b.district.toLowerCase().includes(z))
      );
    // 1) Types préférés d'abord ; si rien ne matche, on garde tout.
    let filtered = types.length
      ? biens.filter((b) => b.property_type && types.includes(b.property_type.toLowerCase()))
      : biens;
    if (filtered.length === 0) filtered = biens;
    // 2) Les biens dans les zones préférées passent en premier.
    if (zones.length) {
      filtered = [...filtered].sort((a, b) => (zoneMatch(b) ? 1 : 0) - (zoneMatch(a) ? 1 : 0));
    }
    return filtered;
  },

  async estimatePrice(data) {
    return TransactionModel.estimatePrice(data);
  },
};

export default RecommendationService;
