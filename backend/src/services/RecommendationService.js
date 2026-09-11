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
    if (!user.preferred_types || user.preferred_types.length === 0) return biens;
    const preferred = user.preferred_types.map((t) => t.toLowerCase());
    const filtered = biens.filter((b) =>
      b.property_type && preferred.includes(b.property_type.toLowerCase())
    );
    return filtered.length > 0 ? filtered : biens;
  },

  async estimatePrice(data) {
    return TransactionModel.estimatePrice(data);
  },
};

export default RecommendationService;
