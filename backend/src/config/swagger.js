/**
 * Configuration Swagger / OpenAPI 3.0 pour l'API ImmoGeo.
 *
 * Documentation interactive disponible sur /api/docs
 */
export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ImmoGeo API',
      version: '1.0.0',
      description: `## Système de géolocalisation immobilière à assistance intelligente

API REST pour la recherche, la publication et la gestion d'annonces immobilières au Cameroun.

### Fonctionnalités principales

- **Authentification JWT** : inscription, connexion, profil, préférences
- **Annonces** : recherche multicritère géographique, publication, suppression, contact
- **Favoris** : sauvegarde d'annonces
- **Critères de recherche** : critères persistants avec alertes automatiques
- **Notifications temps réel** : nouvelles annonces, messages, contacts
- **Chat / Messagerie** : conversations entre utilisateurs via WebSocket
- **Agent IA (Mistral)** : recherche en langage naturel, recommandations, estimation de prix
- **Administration** : modération, validation d'annonces, gestion des utilisateurs

### Modèle Mistral AI

L'agent virtuel IA convertit un prompt en langage naturel en JSON structuré,
effectue la recherche en base, puis formate une réponse conversationnelle.

**Exemple :**
> "cherche moi une maison située à ngoa ekele avec 3 chambres 2 salons moins chère"

### Authentification

La plupart des endpoints nécessitent un token JWT obtenu via \`/api/auth/login\`.
Ajoutez l'en-tête : \`Authorization: Bearer <token>\``,
      contact: {
        name: 'Fredy',
        email: 'fredy@immo.cm',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/auth/login',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Health', description: 'Vérification de l\'état du serveur' },
      { name: 'Auth', description: 'Authentification et gestion de compte' },
      { name: 'Annonces', description: 'Recherche et gestion des annonces immobilières' },
      { name: 'Favoris', description: 'Gestion des favoris' },
      { name: 'Critères', description: 'Critères de recherche et alertes' },
      { name: 'Notifications', description: 'Notifications temps réel' },
      { name: 'Chat', description: 'Messagerie entre utilisateurs' },
      { name: 'Agent IA', description: 'Agent virtuel Mistral AI' },
      { name: 'Admin', description: 'Administration et modération' },
    ],
    paths: {
      // === HEALTH ===
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Vérification de l\'état du serveur',
          security: [],
          responses: {
            200: {
              description: 'Serveur opérationnel',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'immo-backend' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // === AUTH ===
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Inscription d\'un nouvel utilisateur',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@immo.cm' },
                    password: { type: 'string', minLength: 6, example: 'user123' },
                    firstName: { type: 'string', example: 'Fredy' },
                    lastName: { type: 'string', example: 'Atangana' },
                    phone: { type: 'string', example: '+237690000000' },
                    role: { type: 'string', enum: ['USER', 'AGENT', 'ADMIN'], default: 'USER' },
                    budgetMax: { type: 'number', example: 200000 },
                    preferredTypes: { type: 'array', items: { type: 'string' }, example: ['maison', 'appartement'] },
                    preferredZones: { type: 'array', items: { type: 'string' }, example: ['Yaoundé', 'Douala'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Compte créé avec succès' },
            400: { description: 'Données invalides' },
            409: { description: 'Email déjà utilisé' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Connexion utilisateur',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@immo.cm' },
                    password: { type: 'string', example: 'user123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Connexion réussie, token JWT renvoyé' },
            401: { description: 'Email ou mot de passe incorrect' },
          },
        },
      },
      '/api/auth/profile': {
        get: {
          tags: ['Auth'],
          summary: 'Consulter son profil',
          responses: {
            200: { description: 'Profil utilisateur' },
            401: { description: 'Non authentifié' },
          },
        },
        put: {
          tags: ['Auth'],
          summary: 'Modifier son profil',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profil modifié' },
            401: { description: 'Non authentifié' },
          },
        },
      },
      '/api/auth/preferences': {
        put: {
          tags: ['Auth'],
          summary: 'Modifier ses préférences de recherche',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    preferredTypes: { type: 'array', items: { type: 'string' }, example: ['maison', 'villa'] },
                    preferredZones: { type: 'array', items: { type: 'string' }, example: ['Yaoundé', 'Douala'] },
                    budgetMax: { type: 'number', example: 200000 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Préférences modifiées' },
            401: { description: 'Non authentifié' },
          },
        },
      },

      // === ANNONCES ===
      '/api/annonces': {
        get: {
          tags: ['Annonces'],
          summary: 'Recherche multicritère d\'annonces',
          security: [],
          parameters: [
            { name: 'latMin', in: 'query', schema: { type: 'number' }, description: 'Latitude minimale (bounding box)' },
            { name: 'latMax', in: 'query', schema: { type: 'number' }, description: 'Latitude maximale' },
            { name: 'lonMin', in: 'query', schema: { type: 'number' }, description: 'Longitude minimale' },
            { name: 'lonMax', in: 'query', schema: { type: 'number' }, description: 'Longitude maximale' },
            { name: 'centerLat', in: 'query', schema: { type: 'number' }, description: 'Latitude du centre (recherche par rayon)' },
            { name: 'centerLon', in: 'query', schema: { type: 'number' }, description: 'Longitude du centre' },
            { name: 'radius', in: 'query', schema: { type: 'number' }, description: 'Rayon en km' },
            { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Type de bien (maison, appartement, studio...)' },
            { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Ville' },
            { name: 'district', in: 'query', schema: { type: 'string' }, description: 'Quartier' },
            { name: 'priceMin', in: 'query', schema: { type: 'number' }, description: 'Prix minimum' },
            { name: 'priceMax', in: 'query', schema: { type: 'number' }, description: 'Prix maximum' },
            { name: 'bedroomsMin', in: 'query', schema: { type: 'integer' }, description: 'Nombre minimum de chambres' },
            { name: 'bathroomsMin', in: 'query', schema: { type: 'integer' }, description: 'Nombre minimum de douches/SDB' },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'recent'] }, description: 'Tri des résultats' },
          ],
          responses: {
            200: { description: 'Liste des annonces correspondantes' },
          },
        },
        post: {
          tags: ['Annonces'],
          summary: 'Publier une annonce (agent)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'price', 'type', 'city'],
                  properties: {
                    title: { type: 'string', example: 'Villa moderne à Bastos' },
                    description: { type: 'string', example: 'Villa spacieuse avec jardin clos.' },
                    price: { type: 'number', example: 250000 },
                    type: { type: 'string', example: 'maison' },
                    area: { type: 'number', example: 180 },
                    bedrooms: { type: 'integer', example: 4 },
                    bathrooms: { type: 'integer', example: 2 },
                    address: { type: 'string', example: 'Bastos' },
                    district: { type: 'string', example: 'Bastos' },
                    city: { type: 'string', example: 'Yaoundé' },
                    latitude: { type: 'number', example: 3.8896 },
                    longitude: { type: 'number', example: 11.5286 },
                    photos: { type: 'array', items: { type: 'string' }, example: ['https://example.com/photo1.jpg'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Annonce publiée avec succès' },
            400: { description: 'Données invalides' },
            401: { description: 'Non authentifié' },
          },
        },
      },
      '/api/annonces/{id}': {
        get: {
          tags: ['Annonces'],
          summary: 'Consulter le détail d\'une annonce',
          security: [],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Détail de l\'annonce' },
            404: { description: 'Annonce introuvable' },
          },
        },
        delete: {
          tags: ['Annonces'],
          summary: 'Supprimer une annonce',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            204: { description: 'Annonce supprimée' },
            403: { description: 'Vous n\'êtes pas le propriétaire' },
            404: { description: 'Annonce introuvable' },
          },
        },
      },
      '/api/annonces/me/mes-annonces': {
        get: {
          tags: ['Annonces'],
          summary: 'Lister mes annonces publiées',
          responses: {
            200: { description: 'Liste des annonces de l\'agent connecté' },
            401: { description: 'Non authentifié' },
          },
        },
      },
      '/api/annonces/{id}/contacter': {
        post: {
          tags: ['Annonces'],
          summary: 'Contacter l\'annonceur',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Coordonnées de l\'annonceur renvoyées' },
            400: { description: 'Vous êtes le propriétaire de cette annonce' },
            404: { description: 'Annonce introuvable' },
          },
        },
      },

      // === FAVORIS ===
      '/api/favoris': {
        get: {
          tags: ['Favoris'],
          summary: 'Lister mes favoris',
          responses: { 200: { description: 'Liste des favoris' }, 401: { description: 'Non authentifié' } },
        },
        post: {
          tags: ['Favoris'],
          summary: 'Ajouter une annonce aux favoris',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['adId'], properties: { adId: { type: 'string', format: 'uuid' } } },
              },
            },
          },
          responses: { 201: { description: 'Ajouté aux favoris' }, 401: { description: 'Non authentifié' } },
        },
      },
      '/api/favoris/{adId}': {
        get: {
          tags: ['Favoris'],
          summary: 'Vérifier si une annonce est en favori',
          parameters: [{ name: 'adId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Statut favori' } },
        },
        delete: {
          tags: ['Favoris'],
          summary: 'Retirer une annonce des favoris',
          parameters: [{ name: 'adId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 204: { description: 'Retiré des favoris' } },
        },
      },

      // === CRITERES ===
      '/api/criteres': {
        get: {
          tags: ['Critères'],
          summary: 'Lister mes critères de recherche',
          responses: { 200: { description: 'Liste des critères' } },
        },
        put: {
          tags: ['Critères'],
          summary: 'Remplacer mes critères de recherche',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    criteres: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          city: { type: 'string' },
                          district: { type: 'string' },
                          priceMin: { type: 'number' },
                          priceMax: { type: 'number' },
                          bedroomsMin: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Critères mis à jour' } },
        },
        delete: {
          tags: ['Critères'],
          summary: 'Effacer tous mes critères',
          responses: { 204: { description: 'Critères effacés' } },
        },
      },

      // === NOTIFICATIONS ===
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Lister mes notifications',
          responses: { 200: { description: 'Liste des notifications' } },
        },
      },
      '/api/notifications/unread/count': {
        get: {
          tags: ['Notifications'],
          summary: 'Compteur de notifications non lues',
          responses: { 200: { description: 'Nombre de notifications non lues' } },
        },
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Marquer une notification comme lue',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notification marquée comme lue' }, 404: { description: 'Notification introuvable' } },
        },
      },
      '/api/notifications/read/all': {
        put: {
          tags: ['Notifications'],
          summary: 'Marquer toutes les notifications comme lues',
          responses: { 204: { description: 'Toutes les notifications marquées comme lues' } },
        },
      },

      // === CHAT ===
      '/api/chat/conversations': {
        get: {
          tags: ['Chat'],
          summary: 'Lister mes conversations',
          responses: { 200: { description: 'Liste des conversations' } },
        },
        post: {
          tags: ['Chat'],
          summary: 'Ouvrir une conversation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['targetUserId'], properties: { targetUserId: { type: 'string', format: 'uuid' } } },
              },
            },
          },
          responses: { 201: { description: 'Conversation créée ou récupérée' } },
        },
      },
      '/api/chat/conversations/{conversationId}/messages': {
        get: {
          tags: ['Chat'],
          summary: 'Récupérer l\'historique des messages',
          parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Liste des messages' } },
        },
        post: {
          tags: ['Chat'],
          summary: 'Envoyer un message',
          parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', maxLength: 2000 } } },
              },
            },
          },
          responses: { 201: { description: 'Message envoyé' } },
        },
      },
      '/api/chat/unread/count': {
        get: {
          tags: ['Chat'],
          summary: 'Compteur de messages non lus',
          responses: { 200: { description: 'Nombre de messages non lus' } },
        },
      },

      // === AGENT IA ===
      '/api/agent/search': {
        post: {
          tags: ['Agent IA'],
          summary: 'Recherche en langage naturel via Mistral AI',
          description: 'L\'agent IA convertit le prompt en critères JSON, effectue la recherche en base et renvoie une réponse conversationnelle.\n\n**Exemple :** "cherche moi une maison située à ngoa ekele avec 3 chambres 2 salons moins chère"',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'cherche moi une maison située à ngoa ekele avec 3 chambres 2 salons moins chère' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Résultats de recherche + réponse conversationnelle IA',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          criteria: { type: 'object', description: 'Critères extraits par Mistral' },
                          results: { type: 'array', items: { type: 'object' } },
                          response: { type: 'string', description: 'Réponse conversationnelle de l\'IA' },
                          count: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
            500: { description: 'Erreur lors de l\'analyse IA' },
          },
        },
      },
      '/api/agent/recommendations': {
        get: {
          tags: ['Agent IA'],
          summary: 'Recommandations personnalisées',
          description: 'Recommandations basées sur l\'historique (content-based) ou la popularité (cold start).',
          responses: { 200: { description: 'Liste de recommandations' } },
        },
      },
      '/api/agent/estimate-price': {
        post: {
          tags: ['Agent IA'],
          summary: 'Estimation automatique du prix',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    propertyType: { type: 'string', example: 'maison' },
                    area: { type: 'number', example: 180 },
                    bedrooms: { type: 'integer', example: 4 },
                    bathrooms: { type: 'integer', example: 2 },
                    city: { type: 'string', example: 'Yaoundé' },
                    district: { type: 'string', example: 'Bastos' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Estimation de prix avec intervalle de confiance' } },
        },
      },
      '/api/agent/description': {
        post: {
          tags: ['Agent IA'],
          summary: 'Générer une description d\'annonce par IA',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'maison' },
                    area: { type: 'number', example: 180 },
                    bedrooms: { type: 'integer', example: 4 },
                    bathrooms: { type: 'integer', example: 2 },
                    city: { type: 'string', example: 'Yaoundé' },
                    district: { type: 'string', example: 'Bastos' },
                    price: { type: 'number', example: 250000 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Description générée par l\'IA' } },
        },
      },

      // === ADMIN ===
      '/api/admin/ads/pending': {
        get: {
          tags: ['Admin'],
          summary: 'Lister les annonces en attente de validation',
          responses: { 200: { description: 'Liste des annonces en attente' }, 403: { description: 'Rôle admin requis' } },
        },
      },
      '/api/admin/ads/{id}/validate': {
        put: {
          tags: ['Admin'],
          summary: 'Valider une annonce',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Annonce validée' } },
        },
      },
      '/api/admin/ads/{id}/reject': {
        put: {
          tags: ['Admin'],
          summary: 'Rejeter une annonce',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Annonce rejetée' } },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Lister tous les utilisateurs',
          responses: { 200: { description: 'Liste des utilisateurs' } },
        },
      },
      '/api/admin/users/{id}/status': {
        put: {
          tags: ['Admin'],
          summary: 'Modifier le statut d\'un utilisateur',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string', enum: ['ACTIF', 'SUSPENDU', 'SUPPRIME'] } } },
              },
            },
          },
          responses: { 200: { description: 'Statut modifié' } },
        },
      },
      '/api/admin/users/{id}': {
        delete: {
          tags: ['Admin'],
          summary: 'Supprimer un compte utilisateur',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 204: { description: 'Compte supprimé' } },
        },
      },
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Statistiques globales de la plateforme',
          responses: { 200: { description: 'Statistiques globales' } },
        },
      },
    },
  },
  apis: [],
};

export default swaggerOptions;
