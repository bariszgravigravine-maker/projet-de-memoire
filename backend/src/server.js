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

// Présence en ligne : userId -> ensemble de sockets ouvertes (multi-onglets/appareils)
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[WS] Utilisateur connecté: ${socket.userId}`);
  // Rejoindre sa room personnelle pour les notifications/messages temps réel
  socket.join(`user:${socket.userId}`);

  // Enregistrer la socket et annoncer la présence si c'est la première
  const sockets = onlineUsers.get(socket.userId) || new Set();
  const wasOffline = sockets.size === 0;
  sockets.add(socket.id);
  onlineUsers.set(socket.userId, sockets);
  if (wasOffline) {
    io.emit('presence', { userId: socket.userId, online: true });
  }
  // Envoie la liste courante des utilisateurs en ligne au nouveau connecté
  socket.emit('online_users', [...onlineUsers.keys()]);

  socket.on('disconnect', () => {
    console.log(`[WS] Utilisateur déconnecté: ${socket.userId}`);
    const userSockets = onlineUsers.get(socket.userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.userId);
        io.emit('presence', { userId: socket.userId, online: false });
      }
    }
  });
});

// Expose io globalement pour les services (NotificationService, ChatService)
global.io = io;
global.onlineUsers = onlineUsers;

// --- Démarrage ---
async function start() {
  // Vérifie la connexion DB de manière asynchrone et non-bloquante.
  // Le serveur doit démarrer même si la base n'est pas encore initialisée.
  pool
    .query('SELECT 1')
    .then(() => {
      console.log('[DB] Connexion PostgreSQL établie.');
    })
    .catch((err) => {
      console.warn('[DB] Impossible de se connecter à PostgreSQL:', err.message);
      console.warn('[DB] Vérifiez que PostgreSQL est démarré et que la base "immo_db" existe.');
      console.warn('[DB] Lancez "npm run db:init" pour créer le schéma.');
    });

  server.listen(config.port, () => {
    console.log(`[Server] Backend démarré sur http://localhost:${config.port}`);
    console.log(`[Server] Prêt à recevoir des connexions.`);
    console.log(`[Server] Environnement: ${config.env}`);
    console.log(`[Server] Mistral AI: ${config.mistral.apiKey ? 'configuré' : 'NON configuré (clé manquante)'}`);
  });
}

start();

export { server, io };
