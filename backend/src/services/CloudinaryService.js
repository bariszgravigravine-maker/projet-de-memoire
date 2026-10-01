import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Service de stockage local des images.
 *
 * Remplace l'upload Cloudinary par un stockage sur le VPS dans
 * backend/uploads/. Les images sont servies publiquement par Express
 * (express.static) et Nginx via /uploads/*.
 *
 * L'interface (uploadImage, uploadImages, isConfigured) est conservée
 * pour ne pas modifier les services qui l'utilisent (AdService, AuthService).
 */

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://185.98.128.123:3001';

// Crée le dossier racine s'il n'existe pas
try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.error('[Storage] Impossible de créer uploads/:', e.message);
}

/**
 * Extrait le buffer binaire et l'extension à partir d'un Buffer ou d'une
 * chaîne base64 / data URL.
 */
function decodeInput(data) {
  if (Buffer.isBuffer(data)) {
    return { buffer: data, ext: 'jpg' };
  }
  if (typeof data === 'string') {
    // data:image/png;base64,xxxx
    const m = data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (m) {
      return { buffer: Buffer.from(m[2], 'base64'), ext: m[1] === 'jpeg' ? 'jpg' : m[1] };
    }
    // base64 simple
    return { buffer: Buffer.from(data, 'base64'), ext: 'jpg' };
  }
  return null;
}

/**
 * Stocke une image sur le disque et retourne son URL publique.
 * @param {Buffer|string} data - Buffer binaire ou chaîne base64 (data URL ou base64 simple)
 * @param {Object} opts - Options : { folder }
 * @returns {Promise<string|null>} URL publique de l'image, ou null si échec
 */
export async function uploadImage(data, opts = {}) {
  const decoded = decodeInput(data);
  if (!decoded) return null;

  const folder = opts.folder || 'nestfind/properties';
  // Nettoie le folder : nestfind/avatars → uploads/avatars
  const localFolder = folder.replace(/^nestfind\//, '');
  const dir = path.join(UPLOADS_DIR, localFolder);

  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const name = crypto.randomBytes(12).toString('hex') + '.' + decoded.ext;
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, decoded.buffer);

    const publicUrl = `${PUBLIC_BASE}/uploads/${localFolder}/${name}`;
    return publicUrl;
  } catch (err) {
    console.error('[Storage] Erreur upload local:', err.message);
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
 * Le stockage local est toujours "configuré" tant que le dossier existe.
 */
export function isConfigured() {
  return fs.existsSync(UPLOADS_DIR);
}

export default { uploadImage, uploadImages, isConfigured };
