import { asyncHandler } from '../middlewares/errorHandler.js';
import { success } from '../utils/response.js';
import PreferenceModel from '../models/PreferenceModel.js';

/**
 * Catalogue des préférences de proximité (pour les puces de filtre du front).
 */
export const listPreferences = asyncHandler(async (req, res) => {
  const preferences = await PreferenceModel.findAll();
  success(res, { count: preferences.length, preferences });
});

export const preferenceStats = asyncHandler(async (req, res) => {
  const stats = await PreferenceModel.stats();
  success(res, stats);
});

export default { listPreferences, preferenceStats };
