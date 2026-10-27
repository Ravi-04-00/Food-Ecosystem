import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_RESTAURANTS,
  INITIAL_PRODUCTS,
  INITIAL_REELS,
  INITIAL_POSTS,
  INITIAL_RIDERS,
  INITIAL_COUPONS,
  INITIAL_ORDERS
} from '../services/mockData.js';

const FoodEcosystemContext = createContext(null);

export const FoodEcosystemProvider = ({ children }) => {
  const [activeApp, setActiveApp] = useState('customer'); // 'customer' | 'restaurant' | 'delivery' | 'admin'
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [restaurants, setRestaurants] = useState(INITIAL_RESTAURANTS);
  const [dishes, setDishes] = useState(INITIAL_PRODUCTS);
  const [reels, setReels] = useState(INITIAL_REELS);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [riders, setRiders] = useState(INITIAL_RIDERS);
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  
  // Active live order being tracked by customer
  const [activeLiveOrderId, setActiveLiveOrderId] = useState(INITIAL_ORDERS[0]?.id || null);
  
  // Dish modal & Reels modal state
  const [selectedDishForModal, setSelectedDishForModal] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(null);
  const [liveTrackerOpen, setLiveTrackerOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Notification Toast for cross-app events
  const [ecosystemAlert, setEcosystemAlert] = useState(null);

  const triggerAlert = (title, message, type = 'info') => {
    setEcosystemAlert({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setEcosystemAlert(null);
    }, 4500);
  };

  // Place Order from Customer App
  const placeOrder = (orderPayload) => {
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const orderId = `WSF-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'placed', // 'placed' -> 'preparing' -> 'ready' -> 'on_the_way' -> 'delivered'
      otp: randomOtp,
      restaurant: orderPayload.restaurant || {
        id: 'rest-biryani-house',
        name: 'WS Dum Biryani House',
        address: 'Plot 42, 100ft Road, Indiranagar',
        lat: 12.9716,
        lng: 77.5946,
      },
      customer: {
        name: orderPayload.customerName || 'Priya Sharma',
        phone: orderPayload.phone || '+91 98450 77123',
        address: orderPayload.address || 'Apartment 4B, 12th Main Indiranagar, Bengaluru',
        lat: orderPayload.lat || 12.9785,
        lng: orderPayload.lng || 77.6405,
      },
      rider: {
        id: 'rider-rahul',
        name: 'Rahul Kumar',
        phone: '+91 98450 12849',
        rating: 4.9,
        vehicle: 'Hero Splendor • KA 03 EQ 4821',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        currentLocation: { lat: 12.9730, lng: 77.6020 },
      },
      items: orderPayload.items || [],
      itemTotal: orderPayload.itemTotal,
      deliveryFee: orderPayload.deliveryFee || 0,
      taxes: orderPayload.taxes || 20,
      platformFee: 5,
      couponApplied: orderPayload.couponApplied || null,
      grandTotal: orderPayload.grandTotal,
      paymentMethod: orderPayload.paymentMethod || 'UPI (Instant Verification)',
      paymentStatus: 'VERIFIED_PAID',
      estimatedDeliveryTime: '20-25 mins',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveLiveOrderId(orderId);
    setLiveTrackerOpen(true);

    triggerAlert(
      '🔔 Order Placed Successfully!',
      `Order #${orderId} broadcasted to Restaurant & Delivery Dispatch.`,
      'success'
    );

    return newOrder;
  };

  // Restaurant Portal Actions
  const restaurantAcceptOrder = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'preparing' } : o))
    );
    triggerAlert('🍳 Kitchen Preparing', `Order #${orderId} accepted. Chef started preparation!`, 'info');
  };

  const restaurantMarkReady = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'ready' } : o))
    );
    triggerAlert('📦 Order Packed & Ready', `Order #${orderId} is ready for Delivery Partner pickup!`, 'success');
  };

  // Delivery Partner Actions
  const riderAcceptDelivery = (orderId, riderId = 'rider-rahul') => {
    const assignedRider = riders.find((r) => r.id === riderId) || riders[0];
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'on_the_way',
              rider: {
                id: assignedRider.id,
                name: assignedRider.name,
                phone: assignedRider.phone,
                rating: assignedRider.rating,
                vehicle: `${assignedRider.vehicleType} • ${assignedRider.vehicleNumber}`,
                avatar: assignedRider.avatar,
                currentLocation: assignedRider.currentLocation,
              },
            }
          : o
      )
    );
    triggerAlert('🛵 Rider En-Route', `Rider ${assignedRider.name} is on the way to customer!`, 'info');
  };

  const riderVerifyOTPAndDeliver = (orderId, enteredOtp) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    if (enteredOtp.trim() !== order.otp) {
      return { success: false, message: 'Invalid 4-digit OTP. Please ask customer for correct OTP.' };
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
    );

    triggerAlert('🎉 Food Delivered!', `Order #${orderId} marked delivered. Payout credited to rider.`, 'success');
    return { success: true };
  };

  // Restaurant Menu Management
  const addDish = (dishData) => {
    const newDish = {
      ...dishData,
      id: `food-custom-${Date.now()}`,
      rating: 5.0,
      reviewCount: 1,
      isPopular: false,
      isFeatured: false,
    };
    setDishes((prev) => [newDish, ...prev]);
    triggerAlert('🍽️ Menu Updated', `Added "${newDish.name}" to restaurant menu.`, 'success');
    return newDish;
  };

  const toggleDishAvailability = (dishId) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d))
    );
  };

  // Delivery Partner Shift Toggle
  const toggleRiderOnline = (riderId) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, isOnline: !r.isOnline } : r))
    );
  };

  // Social Reels Interactions
  const likeReel = (reelId) => {
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, likes: r.likes + 1, userLiked: !r.userLiked } : r))
    );
  };

  const likePost = (postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1, userLiked: !p.userLiked } : p))
    );
  };

  // Reviews
  const submitReview = (orderId, review) => {
    triggerAlert('⭐ Review Submitted', 'Thank you for rating food and rider!', 'success');
  };

  // Currently active order object
  const activeLiveOrder = orders.find((o) => o.id === activeLiveOrderId) || orders[0] || null;

  return (
    <FoodEcosystemContext.Provider
      value={{
        activeApp,
        setActiveApp,
        categories,
        restaurants,
        dishes,
        reels,
        posts,
        riders,
        coupons,
        orders,
        activeLiveOrderId,
        setActiveLiveOrderId,
        activeLiveOrder,
        placeOrder,
        restaurantAcceptOrder,
        restaurantMarkReady,
        riderAcceptDelivery,
        riderVerifyOTPAndDeliver,
        addDish,
        toggleDishAvailability,
        toggleRiderOnline,
        likeReel,
        likePost,
        submitReview,
        selectedDishForModal,
        setSelectedDishForModal,
        activeReelIndex,
        setActiveReelIndex,
        liveTrackerOpen,
        setLiveTrackerOpen,
        aiAssistantOpen,
        setAiAssistantOpen,
        ecosystemAlert,
        triggerAlert,
      }}
    >
      {children}
    </FoodEcosystemContext.Provider>
  );
};

export const useFoodEcosystem = () => {
  const context = useContext(FoodEcosystemContext);
  if (!context) {
    throw new Error('useFoodEcosystem must be used within a FoodEcosystemProvider');
  }
  return context;
};
