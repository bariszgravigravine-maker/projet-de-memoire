import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import * as ctrl from '../controllers/FavoriteController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listFavorites);
router.get('/:adId', ctrl.checkFavorite);
router.post('/', ctrl.addFavorite);
router.delete('/:adId', ctrl.removeFavorite);

export default router;
