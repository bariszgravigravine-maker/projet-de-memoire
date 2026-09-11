import { Router } from 'express';
import multer from 'multer';
import { aiLimiter } from '../middlewares/rateLimit.js';
import { authMiddleware, optionalAuth } from '../middlewares/auth.js';
import * as ctrl from '../controllers/AgentController.js';

const router = Router();

// Configuration multer : stockage en mémoire (buffer) pour conversion base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo max par image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Images uniquement.'));
    }
  },
});

// Recherche par agent IA — accessible à tous (visiteur ou utilisateur)
router.post('/search', aiLimiter, optionalAuth, ctrl.agentSearch);

// Génération de description d'annonce par IA — agent seulement
router.post('/description', authMiddleware, ctrl.generateDescription);

// Recommandations personnalisées
router.get('/recommendations', authMiddleware, ctrl.getRecommendations);

// Estimation de prix
router.post('/estimate-price', ctrl.estimatePrice);

// Analyse d'image avec vision IA (Pixtral)
// Accepte : multipart/form-data (champ "images") ou JSON ({ images: [...] })
router.post(
  '/analyze-image',
  aiLimiter,
  optionalAuth,
  upload.array('images', 5),
  ctrl.analyzeImage
);

// Extraction de caractéristiques immobilières depuis une image
router.post(
  '/extract-features',
  aiLimiter,
  optionalAuth,
  upload.array('images', 5),
  ctrl.extractFeatures
);

// Recherche par image : analyse l'image et cherche des biens similaires en base
router.post(
  '/search-by-image',
  aiLimiter,
  optionalAuth,
  upload.array('images', 5),
  ctrl.searchByImage
);

export default router;
