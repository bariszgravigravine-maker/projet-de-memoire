import { v2 as cloudinary } from 'cloudinary';

/**
 * Service d'upload d'images vers Cloudinary.
 *
 * Variables d'environnement requises :
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 * ou
 *   - CLOUDINARY_URL (alternative)
 *
 * Si Cloudinary n'est pas configuré, les fonctions renvoient null
 * (le frontend peut alors replier sur le base64 local).
 */

let configured = false;

function configure() {
  if (configured) return true;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const url = process.env.CLOUDINARY_URL;

  if (url) {
    cloudinary.config({ url });
    configured = true;
    return true;
  }
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    configured = true;
    return true;
  }
  return false;
}

/**
 * Upload une image (buffer ou base64) vers Cloudinary.
 * @param {Buffer|string} data - Buffer binaire ou chaîne base64 (data URL ou base64 simple)
 * @param {Object} opts - Options : { folder, public_id, resource_type }
 * @returns {Promise<string|null>} URL sécurisée HTTPS de l'image, ou null si Cloudinary non configuré
 */
export async function uploadImage(data, opts = {}) {
  if (!configure()) return null;
  const folder = opts.folder || 'nestfind/properties';
  const resourceType = opts.resource_type || 'image';

  try {
    let uploadPayload = data;
    // Si data est un Buffer, on le convertit en data URL
    if (Buffer.isBuffer(data)) {
      const b64 = data.toString('base64');
      uploadPayload = `data:image/jpeg;base64,${b64}`;
    } else if (typeof data === 'string' && data.startsWith('data:image')) {
      // déjà une data URL, on l'utilise telle quelle
      uploadPayload = data;
    } else if (typeof data === 'string') {
      // base64 simple sans préfixe
      uploadPayload = `data:image/jpeg;base64,${data}`;
    }

    const result = await cloudinary.uploader.upload(uploadPayload, {
      folder,
      resource_type: resourceType,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    return result?.secure_url || result?.url || null;
  } catch (err) {
    console.error('[Cloudinary] Erreur upload:', err.message);
    return null;
  }
}

/**
 * Upload plusieurs images en parallèle.
 * @param {Array<Buffer|string>} items
 * @param {Object} opts
 * @returns {Promise<Array<string>>} URLs (les null sont filtrés)
 */
export async function uploadImages(items, opts = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const results = await Promise.all(items.map((it) => uploadImage(it, opts)));
  return results.filter((url) => Boolean(url));
}

/**
 * Indique si Cloudinary est correctement configuré.
 */
export function isConfigured() {
  return configure();
}

export default { uploadImage, uploadImages, isConfigured };
