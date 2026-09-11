import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middlewares/auth.js';
import * as ctrl from '../controllers/AdController.js';

const router = Router();

// Recherche publique (mais authentifie si token présent pour l'historique)
router.get('/', optionalAuth, ctrl.searchAds);

// Détail public
router.get('/:id', optionalAuth, ctrl.getAdDetail);

// Actions authentifiées
router.post('/', authMiddleware, ctrl.publishAd);
router.delete('/:id', authMiddleware, ctrl.deleteAd);
router.get('/me/mes-annonces', authMiddleware, ctrl.listMyAds);
router.post('/:id/contacter', authMiddleware, ctrl.contactAd);

export default router;
