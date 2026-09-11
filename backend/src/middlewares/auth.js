import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Middleware d'authentification JWT.
 * Vérifie le token dans l'en-tête Authorization: Bearer <token>.
 */
export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant. Authentification requise.' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

/**
 * Middleware optionnel : authentifie si le token est présent,
 * mais ne bloque pas la requête s'il est absent.
 */
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    } catch {
      // Token invalide: on continue sans utilisateur
    }
  }
  next();
};

/**
 * Middleware de restriction par rôle.
 * @param {string[]} roles - Rôles autorisés (ex: ['ADMIN']).
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' });
  }
  next();
};

export default authMiddleware;
