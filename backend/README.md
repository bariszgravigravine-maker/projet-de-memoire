# Backend ImmoGeo — Node.js / Express / Mistral AI

Système de géolocalisation immobilière à assistance intelligente pour le Cameroun.

## Stack technique

- **Runtime** : Node.js 18+ (modules ES)
- **Framework** : Express.js 4
- **Base de données** : PostgreSQL 14+
- **Authentification** : JWT (jsonwebtoken + bcryptjs)
- **Temps réel** : Socket.IO (chat, notifications)
- **IA** : Mistral AI (agent virtuel de recherche en langage naturel)
- **Géocodage** : Nominatim / OpenStreetMap
- **Sécurité** : Helmet, CORS, Rate limiting
- **Documentation API** : Swagger / OpenAPI 3.0 (`/api/docs`)
- **Architecture** : MVC (Modèles / Vues-API / Contrôleurs)

## Structure

```
backend/
├── src/
│   ├── config/         # Configuration (DB, JWT, Mistral)
│   ├── models/         # Accès aux données (SQL)
│   ├── services/       # Logique métier
│   ├── controllers/    # Contrôleurs HTTP
│   ├── routes/         # Définition des routes API
│   ├── middlewares/    # Auth, rate limit, gestion erreurs
│   ├── utils/          # Utilitaires (réponses HTTP)
│   ├── db/             # Scripts d'init et de seed
│   ├── app.js          # Application Express
│   └── server.js       # Point d'entrée + Socket.IO
├── .env                # Variables d'environnement
├── .env.example        # Modèle de configuration
└── package.json
```

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Créer la base PostgreSQL :
```sql
CREATE DATABASE immo_db;
```

2. Copier `.env.example` en `.env` et remplir les variables.

3. Initialiser le schéma :
```bash
npm run db:init
```

4. (Optionnel) Peupler avec des données de démonstration :
```bash
npm run db:seed
```

## Démarrage

```bash
npm run dev    # mode développement (nodemon)
npm start      # mode production
```

Le serveur écoute sur `http://localhost:5000`.

## Documentation Swagger

Interface interactive disponible sur : **http://localhost:5000/api/docs**

Spécification OpenAPI brute (JSON) : **http://localhost:5000/api/docs.json**

39 endpoints documentés sur 9 modules : Health, Auth, Annonces, Favoris, Critères, Notifications, Chat, Agent IA, Admin.

## Comptes de test (après `db:seed`)

| Rôle  | Email           | Mot de passe |
|-------|-----------------|--------------|
| Admin | admin@immo.cm   | admin123     |
| Agent | agent@immo.cm   | agent123     |
| Agent | ndongo@immo.cm  | agent123     |
| User  | user@immo.cm    | user123      |

## Routes API

### Authentification
| Méthode | Route                    | Description                  | Auth |
|---------|--------------------------|------------------------------|------|
| POST    | /api/auth/register       | Inscription                  | Non  |
| POST    | /api/auth/login          | Connexion                    | Non  |
| GET     | /api/auth/profile        | Profil utilisateur           | Oui  |
| PUT     | /api/auth/profile        | Modifier le profil           | Oui  |
| PUT     | /api/auth/preferences    | Modifier les préférences     | Oui  |

### Annonces
| Méthode | Route                          | Description                  | Auth |
|---------|--------------------------------|------------------------------|------|
| GET     | /api/annonces                  | Recherche multicritère       | Non  |
| GET     | /api/annonces/:id              | Détail d'une annonce         | Non  |
| POST    | /api/annonces                  | Publier une annonce          | Oui  |
| DELETE  | /api/annonces/:id              | Supprimer une annonce        | Oui  |
| GET     | /api/annonces/me/mes-annonces  | Mes annonces                 | Oui  |
| POST    | /api/annonces/:id/contacter    | Contacter l'annonceur        | Oui  |

### Favoris
| Méthode | Route                          | Description                  | Auth |
|---------|--------------------------------|------------------------------|------|
| GET     | /api/favoris                   | Lister mes favoris           | Oui  |
| GET     | /api/favoris/:adId             | Vérifier si favori           | Oui  |
| POST    | /api/favoris                   | Ajouter aux favoris          | Oui  |
| DELETE  | /api/favoris/:adId             | Retirer des favoris          | Oui  |

### Critères de recherche
| Méthode | Route                    | Description                  | Auth |
|---------|--------------------------|------------------------------|------|
| GET     | /api/criteres            | Lister mes critères          | Oui  |
| PUT     | /api/criteres            | Remplacer mes critères       | Oui  |
| DELETE  | /api/criteres            | Effacer mes critères         | Oui  |

### Notifications
| Méthode | Route                              | Description                | Auth |
|---------|------------------------------------|----------------------------|------|
| GET     | /api/notifications                 | Lister mes notifications   | Oui  |
| GET     | /api/notifications/unread/count    | Compteur non lues          | Oui  |
| PUT     | /api/notifications/:id/read        | Marquer comme lue          | Oui  |
| PUT     | /api/notifications/read/all        | Tout marquer comme lu      | Oui  |

### Chat / Messagerie
| Méthode | Route                                          | Description              | Auth |
|---------|------------------------------------------------|--------------------------|------|
| GET     | /api/chat/conversations                        | Mes conversations        | Oui  |
| POST    | /api/chat/conversations                        | Ouvrir une conversation  | Oui  |
| GET     | /api/chat/conversations/:id/messages           | Messages d'une conv.     | Oui  |
| POST    | /api/chat/conversations/:id/messages           | Envoyer un message       | Oui  |
| GET     | /api/chat/unread/count                         | Messages non lus         | Oui  |

### Agent Virtuel IA (Mistral)
| Méthode | Route                          | Description                              | Auth |
|---------|--------------------------------|------------------------------------------|------|
| POST    | /api/agent/search              | Recherche en langage naturel via IA      | Non  |
| POST    | /api/agent/description         | Générer une description d'annonce        | Oui  |
| GET     | /api/agent/recommendations     | Recommandations personnalisées           | Oui  |
| POST    | /api/agent/estimate-price      | Estimation automatique du prix           | Non  |

### Administration
| Méthode | Route                          | Description                  | Auth  |
|---------|--------------------------------|------------------------------|-------|
| GET     | /api/admin/ads/pending         | Annonces en attente          | Admin |
| PUT     | /api/admin/ads/:id/validate    | Valider une annonce          | Admin |
| PUT     | /api/admin/ads/:id/reject      | Rejeter une annonce          | Admin |
| GET     | /api/admin/users               | Lister les utilisateurs      | Admin |
| PUT     | /api/admin/users/:id/status    | Modifier le statut           | Admin |
| DELETE  | /api/admin/users/:id           | Supprimer un compte          | Admin |
| GET     | /api/admin/stats               | Statistiques globales        | Admin |

## Exemple : recherche par agent IA

```bash
curl -X POST http://localhost:5000/api/agent/search \
  -H "Content-Type: application/json" \
  -d '{"message": "cherche moi une maison située à ngoa ekele avec 3 chambres 2 salons moins chère"}'
```

**Flux :**
1. Le backend transmet le message à Mistral AI.
2. Mistral renvoie un JSON structuré :
```json
{
  "type": "maison",
  "near": "ngoa ekele",
  "bedroomsMin": 3,
  "bathroomsMin": 2,
  "sortBy": "price_asc",
  "radiusKm": 5
}
```
3. Le backend géocode "ngoa ekele" via Nominatim.
4. Le backend effectue la recherche SQL avec les critères extraits.
5. Mistral formate une réponse conversationnelle avec les résultats.

## WebSocket (temps réel)

Connexion : `ws://localhost:5000` avec authentification JWT.

Événements reçus par le client :
- `notification` : nouvelle notification
- `message` : nouveau message de chat

## Sécurité

- Mots de passe hachés (bcrypt, 10 rounds)
- JWT avec expiration configurable
- Rate limiting (auth : 20 req/15min, IA : 15 req/min, global : 100 req/min)
- Helmet (en-têtes de sécurité)
- CORS configurable
- Validation des entrées
