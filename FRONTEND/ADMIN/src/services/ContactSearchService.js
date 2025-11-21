import axiosInstance from '../utils/utils';

class ContactSearchService {
  static async getSearchCount(searchTerm) {
    try {
      const params = {};
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axiosInstance.get('/api/admin/GetSearchContactCount', { params });

      if (response.status === 200 && response.data.status === 'Success') {
        return response.data.totalRecords || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching contact search count:', error);
      return 0;
    }
  }

  static async searchContacts(searchTerm, page = 1, limit = 10) {
    try {
      const params = {
        page: page,
        limit: limit
      };

      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axiosInstance.get('/api/admin/SearchContact', { params });

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
      console.error('Error searching contacts:', error);
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

  static async performSearch(searchTerm, page = 1, limit = 10) {
    try {
      const totalCount = await this.getSearchCount(searchTerm);
      const searchResult = await this.searchContacts(searchTerm, page, limit);

      return {
        ...searchResult,
        totalCount
      };
    } catch (error) {
      console.error('Error performing contact search:', error);
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

  static debounceSearch(searchFn, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => searchFn.apply(this, args), delay);
    };
  }
}

export default ContactSearchService;
