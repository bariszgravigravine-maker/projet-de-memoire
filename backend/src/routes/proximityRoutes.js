import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { success } from '../utils/response.js';
import { optionalAuth } from '../middlewares/auth.js';
import ProximityService from '../services/ProximityService.js';
import GeocodingService from '../services/GeocodingService.js';

const router = Router();

/**
 * GET /api/proximite?lat=&lon=
 *
 * Après un clic sur la mini-map de publication : renvoie en un seul appel
 *  - le vrai nom du quartier/ville/adresse (géocodage inversé Nominatim),
 *  - les équipements de proximité détectés automatiquement (Overpass) avec
 *    leur distance réelle — codes du catalogue `preferences`.
 * Les deux lookups sont indépendants : si l'un échoue, l'autre répond quand même.
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    const err = new Error('Paramètres lat et lon obligatoires');
    err.status = 400;
    throw err;
  }

  const [preferences, location] = await Promise.all([
    ProximityService.detectNearby(lat, lon).catch((e) => {
      console.error('[Proximite] Overpass KO:', e.message);
      return [];
    }),
    GeocodingService.reverse(lat, lon).catch(() => null),
  ]);

  success(res, { preferences, location });
}));

export default router;
