import axiosInstance from '../utils/utils';

/**
 * UserSearchService - Handles server-side search operations for users
 * Implements the pagination-first approach with separate count and data APIs
 */
class UserSearchService {
  /**
   * Get total count of users matching search criteria
   * @param {string} searchTerm - Search term to filter users
   * @param {boolean} isSeller - Whether the user is a seller (affects API endpoint)
   * @param {string} district - District filter for sellers
   * @returns {Promise<number>} Total count of matching users
   */
  static async getSearchCount(searchTerm, isSeller = false, district = null) {
    try {
      const params = {};

      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (isSeller && district) {
        params.district = district;
      }

      const url = isSeller ? '/api/admin/users/by-district/count' : '/api/admin/GetSearchUsersCount';
      const response = await axiosInstance.get(url, { params });

      if (response.status === 200 && response.data.status === 'Success') {
        return response.data.totalRecords || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching search count:', error);
      return 0;
    }
  }

  /**
   * Search users with pagination
   * @param {string} searchTerm - Search term to filter users
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of records per page
   * @param {boolean} isSeller - Whether the user is a seller (affects API endpoint)
   * @param {string} district - District filter for sellers
   * @returns {Promise<{data: Array, pagination: Object}>} Search results with pagination info
   */
  static async searchUsers(searchTerm, page = 1, limit = 10, isSeller = false, district = null) {
    try {
      const params = {
        page: page,
        limit: limit
      };

      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (isSeller && district) {
        params.district = district;
      }

      const url = isSeller ? '/api/admin/users/by-district' : '/api/admin/SearchUsers';
      const response = await axiosInstance.get(url, { params });

      if (response.status === 200 && response.data.status === 'Success') {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            pageSize: limit,
            totalRecords: 0,
            totalPages: 0
          }
        };
      }

      return {
        data: [],
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalRecords: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        data: [],
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalRecords: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Combined search operation - gets count first, then data
   * @param {string} searchTerm - Search term to filter users
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of records per page
   * @param {boolean} isSeller - Whether the user is a seller (affects API endpoint)
   * @param {string} district - District filter for sellers
   * @returns {Promise<{data: Array, pagination: Object, totalCount: number}>} Complete search results
   */
  static async performSearch(searchTerm, page = 1, limit = 10, isSeller = false, district = null) {
    try {
      // First get the total count
      const totalCount = await this.getSearchCount(searchTerm, isSeller, district);

      // Then get the paginated data
      const searchResult = await this.searchUsers(searchTerm, page, limit, isSeller, district);

      return {
        ...searchResult,
        totalCount
      };
    } catch (error) {
      console.error('Error performing search:', error);
      return {
        data: [],
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalRecords: 0,
          totalPages: 0
        },
        totalCount: 0
      };
    }
  }

  /**
   * Debounced search function to prevent excessive API calls
   * @param {Function} searchFn - The search function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced search function
   */
  static debounceSearch(searchFn, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => searchFn.apply(this, args), delay);
    };
  }
}

export default UserSearchService;