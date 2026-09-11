import { asyncHandler } from '../middlewares/errorHandler.js';
import { success, noContent } from '../utils/response.js';
import SearchCriteriaService from '../services/SearchCriteriaService.js';

export const listCriteria = asyncHandler(async (req, res) => {
  const criteria = await SearchCriteriaService.list(req.user.id);
  success(res, criteria);
});

export const replaceCriteria = asyncHandler(async (req, res) => {
  const criteria = await SearchCriteriaService.replace(req.user.id, req.body.criteres || []);
  success(res, criteria);
});

export const clearCriteria = asyncHandler(async (req, res) => {
  await SearchCriteriaService.clear(req.user.id);
  noContent(res);
});

export default { listCriteria, replaceCriteria, clearCriteria };
