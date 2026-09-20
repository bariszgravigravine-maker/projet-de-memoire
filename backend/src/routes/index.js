import { Router } from 'express';
import authRoutes from './authRoutes.js';
import adRoutes from './adRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import chatRoutes from './chatRoutes.js';
import criteriaRoutes from './criteriaRoutes.js';
import agentRoutes from './agentRoutes.js';
import adminRoutes from './adminRoutes.js';
import preferenceRoutes from './preferenceRoutes.js';
import proximityRoutes from './proximityRoutes.js';

const router = Router();

/**
 * Healthcheck simple.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'immo-backend', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', authRoutes); // alias pour /api/users/profile etc.
router.use('/annonces', adRoutes);
router.use('/favoris', favoriteRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/criteres', criteriaRoutes);
router.use('/agent', agentRoutes);
router.use('/admin', adminRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/proximite', proximityRoutes);

export default router;
