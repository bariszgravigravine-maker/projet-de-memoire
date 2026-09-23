import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, created, noContent } from '../utils/response.js';
import AdService from '../services/AdService.js';
import InteractionModel from '../models/InteractionModel.js';
import { sanitizePreferenceCodes } from '../constants/preferences.js';

export const searchAds = asyncHandler(async (req, res) => {
  const criteria = {
    latMin: parseFloat(req.query.latMin),
    latMax: parseFloat(req.query.latMax),
    lonMin: parseFloat(req.query.lonMin),
    lonMax: parseFloat(req.query.lonMax),
    centerLat: parseFloat(req.query.centerLat),
    centerLon: parseFloat(req.query.centerLon),
    radius: parseFloat(req.query.radius),
    type: req.query.type,
    city: req.query.city,
    district: req.query.district,
    priceMin: parseFloat(req.query.priceMin),
    priceMax: parseFloat(req.query.priceMax),
    bedroomsMin: parseInt(req.query.bedroomsMin, 10),
    bathroomsMin: parseInt(req.query.bathroomsMin, 10),
    sortBy: req.query.sortBy,
  };

  // Préférences de proximité : ?preferences=lycee,hopital
  if (req.query.preferences) {
    const codes = sanitizePreferenceCodes(String(req.query.preferences).split(','));
    if (codes.length > 0) criteria.preferences = codes;
  }
  // ?hasPreferences=true|false (biens référencés vs biens basiques)
  if (req.query.hasPreferences === 'true') criteria.hasPreferences = true;
  else if (req.query.hasPreferences === 'false') criteria.hasPreferences = false;

  // Supprime les valeurs NaN/null
  Object.keys(criteria).forEach((k) => {
    if (criteria[k] == null || Number.isNaN(criteria[k])) delete criteria[k];
  });
  const results = await AdService.search(criteria);
  success(res, { count: results.length, results });
});

export const getAdDetail = asyncHandler(async (req, res) => {
  const ad = await AdService.getDetail(req.params.id);
  // Enregistre le visiteur (compte connecté ≠ propriétaire) — alimente le
  // compteur "visiteurs uniques" de la page Mes annonces.
  if (req.user?.id && req.user.id !== ad.owner_id) {
    InteractionModel.recordView({ userId: req.user.id, adId: req.params.id }).catch(() => {});
  }
  success(res, ad);
});

export const publishAd = asyncHandler(async (req, res) => {
  const result = await AdService.publish(req.user.id, req.body);
  created(res, result);
});

export const deleteAd = asyncHandler(async (req, res) => {
  await AdService.delete(req.user.id, req.params.id, req.user.role);
  noContent(res);
});

export const listMyAds = asyncHandler(async (req, res) => {
  const ads = await AdService.listByOwner(req.user.id);
  success(res, ads);
});

export const contactAd = asyncHandler(async (req, res) => {
  const contact = await AdService.contactAd(req.user.id, req.params.id);
  success(res, contact);
});

export default { searchAds, getAdDetail, publishAd, deleteAd, listMyAds, contactAd };
