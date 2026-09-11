import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, created } from '../utils/response.js';
import AuthService from '../services/AuthService.js';

export const register = asyncHandler(async (req, res) => {
  const result = await AuthService.register(req.body);
  created(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body);
  success(res, result);
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await AuthService.getProfile(req.user.id);
  success(res, user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await AuthService.updateProfile(req.user.id, req.body);
  success(res, user);
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await AuthService.updatePreferences(req.user.id, req.body);
  success(res, user);
});

export default { register, login, getProfile, updateProfile, updatePreferences };
