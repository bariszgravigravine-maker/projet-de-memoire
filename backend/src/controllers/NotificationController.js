import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, noContent } from '../utils/response.js';
import NotificationService from '../services/NotificationService.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const notifs = await NotificationService.listByUser(req.user.id);
  success(res, notifs);
});

export const countUnread = asyncHandler(async (req, res) => {
  const result = await NotificationService.countUnread(req.user.id);
  success(res, result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notif = await NotificationService.markAsRead(req.user.id, req.params.id);
  success(res, notif);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead(req.user.id);
  noContent(res);
});

export default { listNotifications, countUnread, markAsRead, markAllAsRead };
