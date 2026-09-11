import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import * as ctrl from '../controllers/SearchCriteriaController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listCriteria);
router.put('/', ctrl.replaceCriteria);
router.delete('/', ctrl.clearCriteria);

export default router;
