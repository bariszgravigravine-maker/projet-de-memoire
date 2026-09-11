import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { config } from './config/index.js';
import { pool } from './config/db.js';

/**
 * Point d'entrée du serveur.
 * Lance Express + Socket.IO pour le temps réel (chat, notifications).
 */
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Authentification WebSocket via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentification WebSocket requise'));
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Token WebSocket invalide'));
  }
});

io.on('connection', (socket) => {
  console.log(`[WS] Utilisateur connecté: ${socket.userId}`);
  // Rejoindre sa room personnelle pour les notifications/messages temps réel
  socket.join(`user:${socket.userId}`);

  socket.on('disconnect', () => {
    console.log(`[WS] Utilisateur déconnecté: ${socket.userId}`);
  });
});

// Expose io globalement pour les services (NotificationService, ChatService)
global.io = io;

// --- Démarrage ---
async function start() {
  // Vérifie la connexion DB
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connexion PostgreSQL établie.');
  } catch (err) {
    console.error('[DB] Impossible de se connecter à PostgreSQL:', err.message);
    console.error('[DB] Vérifiez que PostgreSQL est démarré et que la base "immo_db" existe.');
    console.error('[DB] Lancez "npm run db:init" pour créer le schéma.');
  }

  server.listen(config.port, () => {
    console.log(`[Server] Backend démarré sur http://localhost:${config.port}`);
    console.log(`[Server] Environnement: ${config.env}`);
    console.log(`[Server] Mistral AI: ${config.mistral.apiKey ? 'configuré' : 'NON configuré (clé manquante)'}`);
  });
}

start();

export { server, io };
