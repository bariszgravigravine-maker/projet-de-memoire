import PropertyModel from '../models/PropertyModel.js';
import AdModel from '../models/AdModel.js';
import PhotoModel from '../models/PhotoModel.js';
import UserModel from '../models/UserModel.js';
import GeocodingService from './GeocodingService.js';
import NotificationService from './NotificationService.js';
import SearchCriteriaModel from '../models/SearchCriteriaModel.js';
import CloudinaryService from './CloudinaryService.js';
import PreferenceModel from '../models/PreferenceModel.js';
import { resolveDistrict, resolveCity } from '../utils/placeResolver.js';

/**
 * Détecte si une URL de photo est une data URL base64 (à uploader vers Cloudinary).
 */
function isDataUrl(str) {
  return typeof str === 'string' && str.startsWith('data:image');
}

/**
 * Service de gestion des biens et annonces.
 */
export const AdService = {
  /**
   * Publie une annonce avec géocodage automatique de l'adresse.
   * Les photos base64 sont uploadées vers Cloudinary si configuré.
   */
  async publish(ownerId, data) {
    const { title, description, price, type, area, bedrooms, bathrooms, address, district, city, latitude, longitude, photos, preferences } = data;

    if (!title || !price || !type || !city) {
      const err = new Error('Titre, prix, type et ville sont obligatoires');
      err.status = 400;
      throw err;
    }

    // Géocodage automatique si latitude/longitude non fournies
    let lat = latitude;
    let lon = longitude;
    if ((lat == null || lon == null) && address) {
      const geo = await GeocodingService.geocode(`${address} ${district || ''} ${city}`);
      if (geo) {
        lat = geo.latitude;
        lon = geo.longitude;
      }
    }
    // Fallback: centre du Cameroun si toujours rien
    if (lat == null) lat = 3.8667;
    if (lon == null) lon = 11.5167;

    const property = await PropertyModel.create({
      ownerId,
      type,
      area,
      bedrooms,
      bathrooms,
      address: address || '',
      district,
      city,
      latitude: lat,
      longitude: lon,
    });

    // Photos : upload Cloudinary si base64, sinon on garde l'URL telle quelle
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        let photoUrl = photos[i];
        if (isDataUrl(photoUrl)) {
          const uploaded = await CloudinaryService.uploadImage(photoUrl, {
            folder: `nestfind/properties/${property.id}`,
          });
          if (uploaded) photoUrl = uploaded;
        }
        await PhotoModel.create({ propertyId: property.id, url: photoUrl, displayOrder: i });
      }
    }

    // Préférences de proximité (facultatif) : un bien sans préférence reste
    // un "bien basique", sinon il est considéré comme "référencé".
    if (Array.isArray(preferences) && preferences.length > 0) {
      await PreferenceModel.replaceForProperty(property.id, preferences);
    }

    const ad = await AdModel.create({
      ownerId,
      propertyId: property.id,
      title,
      description,
      price,
      status: 'ACTIVE',
    });

    // Incrémente le compteur d'annonces actives
    await UserModel.incrementStat(ownerId, 'active_ads_count', 1);

    // Déclenche les notifications aux utilisateurs dont les critères correspondent
    await NotificationService.notifyMatchingCriteria(ad, property);

    return { ad, property };
  },

  async delete(ownerId, adId, role) {
    const ad = await AdModel.findById(adId);
    if (!ad) {
      const err = new Error('Annonce introuvable');
      err.status = 404;
      throw err;
    }
    if (ad.owner_id !== ownerId && role !== 'ADMIN') {
      const err = new Error('Vous n\'êtes pas le propriétaire de cette annonce');
      err.status = 403;
      throw err;
    }
    const wasActive = ad.status === 'ACTIVE';
    await AdModel.updateStatus(adId, 'SUPPRIMEE');
    if (wasActive) {
      await UserModel.incrementStat(ownerId, 'active_ads_count', -1);
    }
    return { success: true };
  },

  async getDetail(adId) {
    const ad = await AdModel.findDetail(adId);
    if (!ad) {
      const err = new Error('Annonce introuvable');
      err.status = 404;
      throw err;
    }
    await AdModel.incrementViews(adId);
    await UserModel.incrementStat(ad.owner_id, 'total_views', 1);
    const photos = await PhotoModel.findByProperty(ad.property_id);
    return { ...ad, photos };
  },

  async listByOwner(ownerId) {
    return AdModel.findByOwner(ownerId);
  },

  async search(criteria) {
    // Résolution canonique des lieux : "?district=Ngoa ekele" → "Ngoa-Ekellé"
    // (orthographe exacte en base). Sans ça, l'API directe /ads échouait sur
    // les variantes tiret/espace/accent alors que le quartier existe.
    const resolved = { ...criteria };
    if (resolved.district) {
      const d = await resolveDistrict(resolved.district);
      if (d) resolved.district = d;
    }
    if (resolved.city) {
      const c = await resolveCity(resolved.city);
      if (c) resolved.city = c;
    }
    return PropertyModel.search(resolved);
  },

  async contactAd(demandeurId, adId) {
    const ad = await AdModel.findDetail(adId);
    if (!ad) {
      const err = new Error('Annonce introuvable');
      err.status = 404;
      throw err;
    }
    if (ad.owner_id === demandeurId) {
      const err = new Error('Vous êtes le propriétaire de cette annonce');
      err.status = 400;
      throw err;
    }
    await UserModel.incrementStat(ad.owner_id, 'total_contacts', 1);
    await NotificationService.create({
      recipientId: ad.owner_id,
      type: 'NOUVEAU_CONTACT',
      content: `Nouveau contact pour votre annonce "${ad.title}".`,
      adId,
    });
    return {
      ownerId: ad.owner_id,
      ownerFirstName: ad.owner_first_name,
      ownerLastName: ad.owner_last_name,
      ownerPhone: ad.owner_phone,
      ownerEmail: ad.owner_email,
    };
  },
};

export default AdService;
