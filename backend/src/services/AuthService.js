import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import UserModel from '../models/UserModel.js';
import CloudinaryService from './CloudinaryService.js';

/**
 * Service d'authentification — inscription, connexion, profil, préférences.
 */
export const AuthService = {
  async register({ email, password, firstName, lastName, phone, role, budgetMax, preferredTypes, preferredZones }) {
    if (!email || !password) {
      const err = new Error('Email et mot de passe obligatoires');
      err.status = 400;
      throw err;
    }
    if (password.length < 6) {
      const err = new Error('Le mot de passe doit contenir au moins 6 caractères');
      err.status = 400;
      throw err;
    }
    if (await UserModel.existsByEmail(email)) {
      const err = new Error('Un compte existe déjà avec cet email');
      err.status = 409;
      throw err;
    }

    const user = await UserModel.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'USER',
      budgetMax,
      preferredTypes,
      preferredZones,
    });

    const token = this.generateToken(user);
    return { token, user: this.sanitize(user) };
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }
    const valid = await UserModel.verifyPassword(password, user.password_hash);
    if (!valid) {
      const err = new Error('Email ou mot de passe incorrect');
      err.status = 401;
      throw err;
    }
    const token = this.generateToken(user);
    return { token, user: this.sanitize(user) };
  },

  async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const err = new Error('Utilisateur introuvable');
      err.status = 404;
      throw err;
    }
    return this.sanitize(user);
  },

  async updateProfile(userId, data) {
    // Photo de profil : si le front envoie une data URL base64 (choisie dans
    // l'onboarding ou le profil), on l'upload vers Cloudinary d'abord.
    let profilePhotoUrl = data.profilePhotoUrl || null;
    const rawPhoto = data.profilePhoto || data.photo;
    if (typeof rawPhoto === 'string' && rawPhoto.startsWith('data:image')) {
      const uploaded = await CloudinaryService.uploadImage(rawPhoto, {
        folder: `nestfind/avatars`,
      });
      if (uploaded) profilePhotoUrl = uploaded;
    }
    const user = await UserModel.updateProfile(userId, { ...data, profilePhotoUrl });
    if (!user) {
      const err = new Error('Utilisateur introuvable');
      err.status = 404;
      throw err;
    }
    return this.sanitize(user);
  },

  async updatePreferences(userId, data) {
    const user = await UserModel.updatePreferences(userId, data);
    if (!user) {
      const err = new Error('Utilisateur introuvable');
      err.status = 404;
      throw err;
    }
    return this.sanitize(user);
  },

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: `${config.jwt.expiresIn}ms` }
    );
  },

  sanitize(user) {
    if (!user) return null;
    const { password_hash, ...rest } = user;
    return rest;
  },
};

export default AuthService;
