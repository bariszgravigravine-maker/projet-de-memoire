import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, created, noContent } from '../utils/response.js';
import FavoriteService from '../services/FavoriteService.js';

export const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await FavoriteService.list(req.user.id);
  success(res, favorites);
});

export const checkFavorite = asyncHandler(async (req, res) => {
  const result = await FavoriteService.isFavorite(req.user.id, req.params.adId);
  success(res, result);
});

export const addFavorite = asyncHandler(async (req, res) => {
  await FavoriteService.add(req.user.id, req.body.adId);
  created(res, { success: true });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await FavoriteService.remove(req.user.id, req.params.adId);
  noContent(res);
});

export default { listFavorites, checkFavorite, addFavorite, removeFavorite };
