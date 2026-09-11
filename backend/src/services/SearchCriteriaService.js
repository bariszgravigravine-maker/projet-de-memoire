import SearchCriteriaModel from '../models/SearchCriteriaModel.js';

export const SearchCriteriaService = {
  async list(userId) {
    return SearchCriteriaModel.listByUser(userId);
  },

  async replace(userId, items) {
    return SearchCriteriaModel.replaceAll(userId, items);
  },

  async clear(userId) {
    await SearchCriteriaModel.clear(userId);
    return { success: true };
  },
};

export default SearchCriteriaService;
