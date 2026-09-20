import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'immo_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if ((process.env.NODE_ENV || 'development') === 'production') {
        throw new Error('JWT_SECRET est obligatoire en production. Définissez-le dans le fichier .env.');
      }
      return 'dev_only_secret_do_not_use_in_prod';
    })(),
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN, 10) || 86400000,
  },

  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
    apiUrl: process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions',
    model: process.env.MISTRAL_MODEL || 'codestral-latest',
    visionModel: process.env.MISTRAL_VISION_MODEL || 'pixtral-12b-2409',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  nominatim: {
    url: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search',
  },
};

export default config;
