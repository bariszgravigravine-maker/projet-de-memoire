import PropertyModel from '../models/PropertyModel.js';
import AdModel from '../models/AdModel.js';
import PhotoModel from '../models/PhotoModel.js';
import UserModel from '../models/UserModel.js';
import GeocodingService from './GeocodingService.js';
import NotificationService from './NotificationService.js';
import SearchCriteriaModel from '../models/SearchCriteriaModel.js';

/**
 * Service de gestion des biens et annonces.
 */
export const AdService = {
  /**
   * Publie une annonce avec géocodage automatique de l'adresse.
   */
  async publish(ownerId, data) {
    const { title, description, price, type, area, bedrooms, bathrooms, address, district, city, latitude, longitude, photos } = data;

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

    // Photos
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        await PhotoModel.create({ propertyId: property.id, url: photos[i], displayOrder: i });
      }
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
    return PropertyModel.search(criteria);
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
