import { api } from './api.js';

export const authService = {
  async login(email, password) {
    try {
      const res = await api.post('/auth/login/', { email, password });
      api.setToken(res.access);
      return res.user;
    } catch {
      // Mock login for demo
      const user = {
        id: 'usr-1',
        email,
        name: email.split('@')[0].toUpperCase(),
        role: email.includes('seller') ? 'SELLER' : 'CUSTOMER',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        joined: '2026',
      };
      api.setToken('mock_jwt_token_wp_atelier');
      localStorage.setItem('wp_user', JSON.stringify(user));
      return user;
    }
  },

  async register(data) {
    try {
      const res = await api.post('/auth/register/', data);
      api.setToken(res.access);
      return res.user;
    } catch {
      const user = {
        id: `usr-${Date.now()}`,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        role: data.role || 'CUSTOMER',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        joined: '2026',
      };
      api.setToken('mock_jwt_token_wp_atelier');
      localStorage.setItem('wp_user', JSON.stringify(user));
      return user;
    }
  },

  getCurrentUser() {
    const saved = localStorage.getItem('wp_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: 'usr-default',
      name: 'VIKRAMADITYA S.',
      email: 'client@atelier.wp',
      role: 'CUSTOMER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      joined: '2026',
    };
  },

  logout() {
    api.setToken(null);
    localStorage.removeItem('wp_user');
  }
};
