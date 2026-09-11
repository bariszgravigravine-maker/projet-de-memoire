import FavoriteModel from '../models/FavoriteModel.js';
import InteractionModel from '../models/InteractionModel.js';

export const FavoriteService = {
  async add(userId, adId) {
    await FavoriteModel.add(userId, adId);
    await InteractionModel.recordFavorite({ userId, adId });
    return { success: true };
  },

  async remove(userId, adId) {
    await FavoriteModel.remove(userId, adId);
    await InteractionModel.removeFavorite({ userId, adId });
    return { success: true };
  },

  async list(userId) {
    return FavoriteModel.listByUser(userId);
  },

  async isFavorite(userId, adId) {
    return { isFavorite: await FavoriteModel.isFavorite(userId, adId) };
  },
};

export default FavoriteService;
