// Test exhaustif de toutes les routes du backend ImmoGeo
const http = require('http');

const BASE = { hostname: 'localhost', port: 5000 };
let token = null;
let userId = null;
let agentToken = null;
let agentId = null;
let adminToken = null;
let adId = null;
let conversationId = null;
let notificationId = null;

const results = [];

function log(name, status, detail = '') {
  const icon = status === 'OK' ? '[OK]' : status === 'FAIL' ? '[FAIL]' : '[WARN]';
  results.push({ name, status, detail });
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

function req(method, path, body = null, auth = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    if (auth) headers['Authorization'] = `Bearer ${auth}`;

    const opts = { ...BASE, path, method, headers };
    const r = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(buf);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: buf });
        }
      });
    });
    r.on('error', reject);
    r.setTimeout(60000, () => { r.destroy(new Error('Timeout')); });
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  console.log('=== TEST EXHAUSTIF DU BACKEND IMMOGEO ===\n');

  // ============================================================
  // 1. HEALTHCHECK
  // ============================================================
  console.log('\n--- Healthcheck ---');
  let r = await req('GET', '/api/health');
  log('GET /api/health', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // 2. AUTHENTIFICATION
  // ============================================================
  console.log('\n--- Authentification ---');

  // Inscription
  r = await req('POST', '/api/auth/register', {
    email: 'testuser@immo.cm', password: 'test123', firstName: 'Test', lastName: 'User', phone: '+237699999999'
  });
  log('POST /api/auth/register', r.status === 201 ? 'OK' : 'WARN', `HTTP ${r.status}`);
  if (r.status === 201) { token = r.data.data.token; userId = r.data.data.user.id; }
  else if (r.data.error && r.data.error.includes('existe')) { log('  (compte existe deja)', 'WARN'); }

  // Inscription agent
  r = await req('POST', '/api/auth/register', {
    email: 'testagent@immo.cm', password: 'agent123', firstName: 'Test', lastName: 'Agent', phone: '+237698888888', role: 'AGENT'
  });
  log('POST /api/auth/register (agent)', r.status === 201 ? 'OK' : 'WARN', `HTTP ${r.status}`);
  if (r.status === 201) { agentToken = r.data.data.token; agentId = r.data.data.user.id; }

  // Login utilisateur
  r = await req('POST', '/api/auth/login', { email: 'user@immo.cm', password: 'user123' });
  log('POST /api/auth/login (user)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  if (r.status === 200) { token = r.data.data.token; userId = r.data.data.user.id; }

  // Login agent
  r = await req('POST', '/api/auth/login', { email: 'agent@immo.cm', password: 'agent123' });
  log('POST /api/auth/login (agent)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  if (r.status === 200) { agentToken = r.data.data.token; agentId = r.data.data.user.id; }

  // Login admin
  r = await req('POST', '/api/auth/login', { email: 'admin@immo.cm', password: 'admin123' });
  log('POST /api/auth/login (admin)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  if (r.status === 200) { adminToken = r.data.data.token; }

  // Login echec
  r = await req('POST', '/api/auth/login', { email: 'user@immo.cm', password: 'wrongpass' });
  log('POST /api/auth/login (mauvais mdp)', r.status === 401 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Profil
  r = await req('GET', '/api/auth/profile', null, token);
  log('GET /api/auth/profile', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Profil sans token
  r = await req('GET', '/api/auth/profile');
  log('GET /api/auth/profile (sans token)', r.status === 401 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Modifier profil
  r = await req('PUT', '/api/auth/profile', { firstName: 'Fredy', phone: '+237690000001' }, token);
  log('PUT /api/auth/profile', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Modifier preferences
  r = await req('PUT', '/api/auth/preferences', { preferredTypes: ['maison', 'villa'], preferredZones: ['Yaoundé', 'Douala'], budgetMax: 200000 }, token);
  log('PUT /api/auth/preferences', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // 3. ANNONCES
  // ============================================================
  console.log('\n--- Annonces ---');

  // Recherche publique
  r = await req('GET', '/api/annonces');
  log('GET /api/annonces (recherche publique)', r.status === 200 ? 'OK' : 'FAIL', `${r.status}, ${r.data.data ? r.data.data.count : 0} resultats`);

  // Recherche avec filtres
  r = await req('GET', '/api/annonces?type=maison&priceMax=400000');
  log('GET /api/annonces?type=maison&priceMax=400000', r.status === 200 ? 'OK' : 'FAIL', `${r.status}, ${r.data.data ? r.data.data.count : 0} resultats`);

  // Recuperer un ad_id depuis la recherche
  if (r.data.data && r.data.data.results && r.data.data.results.length > 0) {
    adId = r.data.data.results[0].ad_id;
  }

  // Detail d'une annonce
  if (adId) {
    r = await req('GET', `/api/annonces/${adId}`);
    log('GET /api/annonces/:id (detail)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  }

  // Publier une annonce (agent)
  r = await req('POST', '/api/annonces', {
    title: 'Appartement test à Bastos',
    description: 'Appartement de test pour validation API',
    price: 200000,
    type: 'appartement',
    area: 85,
    bedrooms: 3,
    bathrooms: 2,
    address: 'Bastos',
    district: 'Bastos',
    city: 'Yaoundé',
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d8e6?w=800']
  }, agentToken);
  log('POST /api/annonces (publier)', r.status === 201 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  if (r.status === 201 && r.data.data) {
    const newAdId = r.data.data.ad ? r.data.data.ad.id : null;
    if (newAdId) {
      // Supprimer cette annonce
      r = await req('DELETE', `/api/annonces/${newAdId}`, null, agentToken);
      log('DELETE /api/annonces/:id (supprimer)', r.status === 204 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
    }
  }

  // Mes annonces
  r = await req('GET', '/api/annonces/me/mes-annonces', null, agentToken);
  log('GET /api/annonces/me/mes-annonces', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Contacter l'annonceur
  if (adId) {
    r = await req('POST', `/api/annonces/${adId}/contacter`, null, token);
    log('POST /api/annonces/:id/contacter', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  }

  // ============================================================
  // 4. FAVORIS
  // ============================================================
  console.log('\n--- Favoris ---');

  // Ajouter favori
  if (adId) {
    r = await req('POST', '/api/favoris', { adId }, token);
    log('POST /api/favoris (ajouter)', r.status === 201 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

    // Verifier favori
    r = await req('GET', `/api/favoris/${adId}`, null, token);
    log('GET /api/favoris/:adId (verifier)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, isFavorite=${r.data.data ? r.data.data.isFavorite : '?'}`);

    // Lister favoris
    r = await req('GET', '/api/favoris', null, token);
    log('GET /api/favoris (lister)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

    // Retirer favori
    r = await req('DELETE', `/api/favoris/${adId}`, null, token);
    log('DELETE /api/favoris/:adId (retirer)', r.status === 204 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  }

  // ============================================================
  // 5. CRITERES DE RECHERCHE
  // ============================================================
  console.log('\n--- Criteres de recherche ---');

  // Remplacer criteres
  r = await req('PUT', '/api/criteres', {
    criteres: [
      { type: 'maison', city: 'Yaoundé', district: 'Bastos', priceMax: 300000, bedroomsMin: 3 },
      { type: 'appartement', city: 'Douala', priceMax: 200000 }
    ]
  }, token);
  log('PUT /api/criteres (remplacer)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Lister criteres
  r = await req('GET', '/api/criteres', null, token);
  log('GET /api/criteres (lister)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, ${Array.isArray(r.data.data) ? r.data.data.length : 0} criteres`);

  // Effacer criteres
  r = await req('DELETE', '/api/criteres', null, token);
  log('DELETE /api/criteres (effacer)', r.status === 204 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // 6. NOTIFICATIONS
  // ============================================================
  console.log('\n--- Notifications ---');

  // Lister notifications
  r = await req('GET', '/api/notifications', null, token);
  log('GET /api/notifications (lister)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  if (r.status === 200 && Array.isArray(r.data.data) && r.data.data.length > 0) {
    notificationId = r.data.data[0].id;
  }

  // Compteur non lues
  r = await req('GET', '/api/notifications/unread/count', null, token);
  log('GET /api/notifications/unread/count', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, count=${r.data.data ? r.data.data.count : '?'}`);

  // Marquer comme lue
  if (notificationId) {
    r = await req('PUT', `/api/notifications/${notificationId}/read`, null, token);
    log('PUT /api/notifications/:id/read', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  }

  // Marquer toutes comme lues
  r = await req('PUT', '/api/notifications/read/all', null, token);
  log('PUT /api/notifications/read/all', r.status === 204 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // 7. CHAT / MESSAGERIE
  // ============================================================
  console.log('\n--- Chat / Messagerie ---');

  // Ouvrir conversation (user contacte agent)
  r = await req('POST', '/api/chat/conversations', { targetUserId: agentId }, token);
  log('POST /api/chat/conversations (ouvrir)', r.status === 201 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  if (r.status === 201 && r.data.data) {
    conversationId = r.data.data.id;
  }

  // Si pas recupere, lister pour trouver
  if (!conversationId) {
    r = await req('GET', '/api/chat/conversations', null, token);
    log('GET /api/chat/conversations (lister)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
    if (r.status === 200 && Array.isArray(r.data.data) && r.data.data.length > 0) {
      conversationId = r.data.data[0].id;
    }
  } else {
    r = await req('GET', '/api/chat/conversations', null, token);
    log('GET /api/chat/conversations (lister)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);
  }

  // Envoyer message
  if (conversationId) {
    r = await req('POST', `/api/chat/conversations/${conversationId}/messages`, { content: 'Bonjour, est-ce que la maison est encore disponible ?' }, token);
    log('POST /api/chat/conversations/:id/messages (envoyer)', r.status === 201 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

    // Recuperer messages
    r = await req('GET', `/api/chat/conversations/${conversationId}/messages`, null, token);
    log('GET /api/chat/conversations/:id/messages (historique)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, ${Array.isArray(r.data.data) ? r.data.data.length : 0} messages`);
  }

  // Messages non lus
  r = await req('GET', '/api/chat/unread/count', null, token);
  log('GET /api/chat/unread/count', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, count=${r.data.data ? r.data.data.count : '?'}`);

  // ============================================================
  // 8. AGENT IA (MISTRAL)
  // ============================================================
  console.log('\n--- Agent IA (Mistral) ---');

  // Recherche en langage naturel
  r = await req('POST', '/api/agent/search', { message: 'cherche moi une maison situee a ngoa ekele avec 3 chambres 2 salons moins chere' });
  log('POST /api/agent/search (Mistral)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, ${r.data.data ? r.data.data.count : 0} resultats`);

  // Recommandations
  r = await req('GET', '/api/agent/recommendations', null, token);
  log('GET /api/agent/recommendations', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, ${r.data.data ? r.data.data.count : 0} recommandations`);

  // Estimation de prix
  r = await req('POST', '/api/agent/estimate-price', { propertyType: 'maison', city: 'Yaoundé', district: 'Bastos', area: 180, bedrooms: 4, bathrooms: 2 });
  log('POST /api/agent/estimate-price', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, prix=${r.data.data ? r.data.data.estimatedPrice : '?'} FCFA`);

  // Generation description (agent)
  r = await req('POST', '/api/agent/description', { type: 'maison', area: 180, bedrooms: 4, bathrooms: 2, city: 'Yaoundé', district: 'Bastos', price: 250000 }, agentToken);
  log('POST /api/agent/description (IA genere)', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // 9. ADMINISTRATION
  // ============================================================
  console.log('\n--- Administration ---');

  // Annonces en attente
  r = await req('GET', '/api/admin/ads/pending', null, adminToken);
  log('GET /api/admin/ads/pending', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Lister utilisateurs
  r = await req('GET', '/api/admin/users', null, adminToken);
  log('GET /api/admin/users', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, ${Array.isArray(r.data.data) ? r.data.data.length : 0} users`);

  // Statistiques globales
  r = await req('GET', '/api/admin/stats', null, adminToken);
  log('GET /api/admin/stats', r.status === 200 ? 'OK' : 'FAIL', `HTTP ${r.status}, totalAds=${r.data.data ? r.data.data.totalAds : '?'}`);

  // Admin sans token
  r = await req('GET', '/api/admin/stats');
  log('GET /api/admin/stats (sans token)', r.status === 401 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Admin avec token utilisateur (pas admin)
  r = await req('GET', '/api/admin/stats', null, token);
  log('GET /api/admin/stats (token user, pas admin)', r.status === 403 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // 10. SECURITE
  // ============================================================
  console.log('\n--- Securite ---');

  // Route inexistante
  r = await req('GET', '/api/inexistant');
  log('GET /api/inexistant (404)', r.status === 404 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // Favoris sans token
  r = await req('GET', '/api/favoris');
  log('GET /api/favoris (sans token)', r.status === 401 ? 'OK' : 'FAIL', `HTTP ${r.status}`);

  // ============================================================
  // RESUME
  // ============================================================
  console.log('\n=== RESUME ===');
  const ok = results.filter(r => r.status === 'OK').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  console.log(`Total: ${results.length} | OK: ${ok} | FAIL: ${fail} | WARN: ${warn}`);
  console.log(`Reussite: ${((ok / results.length) * 100).toFixed(1)}%\n`);

  // Tableau detaille
  console.log('=== TABLEAU DETAILLE ===');
  results.forEach((r, i) => {
    const icon = r.status === 'OK' ? 'OK' : r.status === 'FAIL' ? 'FAIL' : 'WARN';
    console.log(`${i + 1}\t${icon}\t${r.name}\t${r.detail}`);
  });
}

run().catch(err => console.error('Erreur fatale:', err));
