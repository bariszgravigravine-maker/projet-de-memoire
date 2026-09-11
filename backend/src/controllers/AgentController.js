import { asyncHandler } from '../middlewares/errorHandler.js';
import { success } from '../utils/response.js';
import AgentAIService from '../services/AgentAIService.js';
import RecommendationService from '../services/RecommendationService.js';
import MistralService from '../services/MistralService.js';

/**
 * Contrôleur de l'agent virtuel IA.
 * Endpoint principal : POST /api/agent/search
 * Corps : { "message": "cherche moi une maison située à ngoa ekele avec 3 chambres 2 salons" }
 */
export const agentSearch = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Le message est obligatoire.' });
  }
  // userId optionnel (le visiteur anonyme peut aussi utiliser l'agent)
  const userId = req.user ? req.user.id : null;
  const result = await AgentAIService.searchByNaturalLanguage(message, userId);
  success(res, result);
});

export const generateDescription = asyncHandler(async (req, res) => {
  const description = await AgentAIService.generateAdDescription(req.body);
  success(res, { description });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await RecommendationService.getRecommendations(req.user.id);
  success(res, { count: recommendations.length, recommendations });
});

export const estimatePrice = asyncHandler(async (req, res) => {
  const estimation = await RecommendationService.estimatePrice(req.body);
  success(res, estimation);
});

/**
 * Analyse d'image avec vision IA (Pixtral).
 * Corps : { "images": ["url1", ...], "prompt": "question optionnelle" }
 * ou multipart/form-data avec un champ "images" (fichiers) et "prompt" (texte).
 */
export const analyzeImage = asyncHandler(async (req, res) => {
  let images = [];
  let prompt = req.body.prompt || null;

  // Cas 1 : fichiers uploadés via multipart/form-data
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const b64 = file.buffer.toString('base64');
      const mime = file.mimetype || 'image/jpeg';
      images.push(`data:${mime};base64,${b64}`);
    }
  } else if (Array.isArray(req.body.images)) {
    // Cas 2 : URLs ou data URIs en JSON
    images = req.body.images;
  } else if (typeof req.body.image === 'string') {
    // Cas 3 : image unique en JSON
    images = [req.body.image];
  }

  if (images.length === 0) {
    return res.status(400).json({ error: 'Aucune image fournie.' });
  }

  const description = await MistralService.analyzeImage(images, prompt);
  success(res, { description, imageCount: images.length });
});

/**
 * Extraction de caractéristiques immobilières depuis une image.
 * Corps : { "images": ["url1", ...] } ou multipart/form-data.
 */
export const extractFeatures = asyncHandler(async (req, res) => {
  let images = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const b64 = file.buffer.toString('base64');
      const mime = file.mimetype || 'image/jpeg';
      images.push(`data:${mime};base64,${b64}`);
    }
  } else if (Array.isArray(req.body.images)) {
    images = req.body.images;
  } else if (typeof req.body.image === 'string') {
    images = [req.body.image];
  }

  if (images.length === 0) {
    return res.status(400).json({ error: 'Aucune image fournie.' });
  }

  const features = await MistralService.extractPropertyFeatures(images);
  success(res, features);
});

/**
 * Recherche par image : analyse l'image, extrait les caractéristiques,
 * cherche des biens similaires en base, et renvoie des propositions.
 * Corps : { "images": ["data:..."], "prompt": "question optionnelle" }
 * ou multipart/form-data avec un champ "images" (fichiers).
 */
export const searchByImage = asyncHandler(async (req, res) => {
  let images = [];
  let prompt = req.body.prompt || null;

  // Cas 1 : fichiers uploadés via multipart/form-data
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const b64 = file.buffer.toString('base64');
      const mime = file.mimetype || 'image/jpeg';
      images.push(`data:${mime};base64,${b64}`);
    }
  } else if (Array.isArray(req.body.images)) {
    images = req.body.images;
  } else if (typeof req.body.image === 'string') {
    images = [req.body.image];
  }

  if (images.length === 0) {
    return res.status(400).json({ error: 'Aucune image fournie.' });
  }

  const userId = req.user ? req.user.id : null;
  const result = await AgentAIService.searchByImage(images, userId);
  success(res, result);
});

export default { agentSearch, generateDescription, getRecommendations, estimatePrice, analyzeImage, extractFeatures, searchByImage };
