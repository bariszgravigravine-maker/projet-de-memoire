import { Router } from 'express';
import * as ctrl from '../controllers/PreferenceController.js';

const router = Router();

// Catalogue public (le visiteur peut filtrer sans être connecté)
router.get('/', ctrl.listPreferences);
router.get('/stats', ctrl.preferenceStats);

export default router;
