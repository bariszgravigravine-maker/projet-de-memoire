/**
 * Middleware de gestion centralisée des erreurs.
 * À placer en dernier middleware dans la chaîne Express.
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Erreur interne du serveur';

  if (status >= 500) {
    console.error('[ERROR]', status, message, err.stack);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 && { stack: err.stack }),
  });
};

/**
 * Wrapper pour les contrôleurs async afin de capturer les erreurs.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default errorHandler;
