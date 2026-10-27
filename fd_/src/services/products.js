import { api } from './api.js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './mockData.js';

export const productsService = {
  async getCategories() {
    try {
      return await api.get('/categories/');
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      return await api.get(`/products/${query ? '?' + query : ''}`);
    } catch {
      let filtered = [...INITIAL_PRODUCTS];
      if (params.category && params.category !== 'all') {
        filtered = filtered.filter(p => p.category === params.category);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.seller.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  async getProductById(id) {
    try {
      return await api.get(`/products/${id}/`);
    } catch {
      return INITIAL_PRODUCTS.find(p => p.id === id) || null;
    }
  },

  async createProduct(productData) {
    try {
      return await api.post('/products/', productData);
    } catch {
      const newProd = {
        ...productData,
        id: `wp-prod-${Date.now()}`,
        rating: 5.0,
        reviewCount: 0,
        availability: 'In Stock',
        sellerVerified: true,
      };
      INITIAL_PRODUCTS.unshift(newProd);
      return newProd;
    }
  }
};
