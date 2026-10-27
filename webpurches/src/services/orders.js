import { api } from './api.js';
import { INITIAL_ORDERS } from './mockData.js';

export const ordersService = {
  async getOrders() {
    try {
      return await api.get('/orders/');
    } catch {
      return INITIAL_ORDERS;
    }
  },

  async getOrderById(id) {
    try {
      return await api.get(`/orders/${id}/`);
    } catch {
      return INITIAL_ORDERS.find(o => o.id === id) || null;
    }
  },

  async createOrder(orderPayload) {
    try {
      return await api.post('/orders/', orderPayload);
    } catch {
      const newOrder = {
        id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        status: 'PROCESSING',
        trackingNumber: `WP-EXP-${Math.floor(100000 + Math.random() * 900000)}-IN`,
        items: orderPayload.items,
        shippingAddress: orderPayload.shippingAddress,
        payment: {
          method: orderPayload.paymentMethod || 'Razorpay Smart Escrow',
          transactionId: `TXN-${Date.now()}-WP`,
          status: 'PAID',
        },
        deliveryEstimate: '3–5 Business Days',
      };
      INITIAL_ORDERS.unshift(newOrder);
      return newOrder;
    }
  }
};
