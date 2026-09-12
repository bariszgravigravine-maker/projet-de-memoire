import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { swaggerOptions } from './config/swagger.js';
import routes from './routes/index.js';
import { globalLimiter } from './middlewares/rateLimit.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { pool } from './config/db.js';

/**
 * Application Express — architecture MVC.
 */
const app = express();

// --- Sécurité & middlewares globaux ---
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(globalLimiter);

// --- Documentation Swagger / OpenAPI ---
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #6d28d9; }',
  customSiteTitle: 'ImmoGeo API — Documentation',
}));
// Spécification OpenAPI brute (pour import dans Postman/Insomnia)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// --- Healthcheck simple pour la vérification de déploiement (curl /health) ---
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.json({ status: 'degraded', db: 'disconnected' });
  }
});

// --- Routes API ---
app.use('/api', routes);

// --- Route racine ---
app.get('/', (req, res) => {
  res.json({
    name: 'ImmoGeo Backend',
    version: '1.0.0',
    description: 'Système de géolocalisation immobilière à assistance intelligente (Mistral AI)',
    docs: '/api/docs',
    health: '/api/health',
  });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

// --- Gestion des erreurs ---
app.use(errorHandler);

export default app;
