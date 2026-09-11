import rateLimit from 'express-rate-limit';

/**
 * Limite de débit sur les endpoints sensibles (login, register, contact).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requêtes par fenêtre
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limite de débit globale (anti-spam).
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute
  message: { error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limite spécifique pour l'agent IA (coût Mistral).
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Trop de requêtes à l\'agent IA. Réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export default { authLimiter, globalLimiter, aiLimiter };
