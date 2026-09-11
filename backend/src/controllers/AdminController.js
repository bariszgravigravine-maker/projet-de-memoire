import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, noContent } from '../utils/response.js';
import AdModel from '../models/AdModel.js';
import UserModel from '../models/UserModel.js';

export const listPendingAds = asyncHandler(async (req, res) => {
  const ads = await AdModel.listPending(req.query);
  success(res, ads);
});

export const validateAd = asyncHandler(async (req, res) => {
  const ad = await AdModel.updateStatus(req.params.id, 'ACTIVE');
  success(res, ad);
});

export const rejectAd = asyncHandler(async (req, res) => {
  const ad = await AdModel.updateStatus(req.params.id, 'REJETEE');
  success(res, ad);
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.listAll(req.query);
  success(res, users);
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await UserModel.setStatus(req.params.id, req.body.status);
  success(res, user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  await UserModel.delete(req.params.id);
  noContent(res);
});

export const getStats = asyncHandler(async (req, res) => {
  // Statistiques globales simplifiées
  const allAds = await AdModel.listAll({ limit: 10000 });
  const allUsers = await UserModel.listAll({ limit: 10000 });
  success(res, {
    totalAds: allAds.length,
    activeAds: allAds.filter((a) => a.status === 'ACTIVE').length,
    pendingAds: allAds.filter((a) => a.status === 'EN_ATTENTE').length,
    totalUsers: allUsers.length,
    agents: allUsers.filter((u) => u.role === 'AGENT').length,
  });
});

export default { listPendingAds, validateAd, rejectAd, listUsers, setUserStatus, deleteUser, getStats };
