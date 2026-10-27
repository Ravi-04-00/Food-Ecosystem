import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Star, ShoppingBag, Eye, Volume2, VolumeX } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';

export const FoodReelsPlayer = ({ onSelectFood, onGoToCart }) => {
  const { reels = [], addToCart } = useCustomer();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [isMuted, setIsMuted] = useState(true);

  const reelList = Array.isArray(reels) && reels.length > 0 ? reels : [
    {
      id: 1,
      title: 'Secret Retro Smash Burger Crust',
      restaurant_name: 'WS Burger House',
      rating: 4.9,
      price: 189,
      likes_count: 3420,
      comments_count: 148,
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-delicious-burger-42861-large.mp4',
      food_id: 1,
      food_name: 'Chicken Burger'
    },
    {
      id: 2,
      title: 'Authentic Claypot Dum Biryani',
      restaurant_name: 'Kinetic Biryani Vault',
      rating: 4.95,
      price: 349,
      likes_count: 5120,
      comments_count: 284,
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-bowl-of-spicy-noodles-43187-large.mp4',
      food_id: 3,
      food_name: 'Royal Dum Biryani'
    }
  ];

  const currentReel = reelList[currentIndex] || reelList[0];

  const toggleLike = (id) => {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id) => {
    setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOrderNow = async () => {
    const dish = {
      id: currentReel.food_id || 1,
      name: currentReel.food_name || currentReel.title,
      price: currentReel.price || 189,
      restaurant_name: currentReel.restaurant_name,
      rating: currentReel.rating || 4.8
    };
    try {
      await addToCart(dish, 1);
      onGoToCart();
    } catch (err) {
      console.error('FoodReels addToCart error:', err);
    }
  };

  const handleViewFood = () => {
    const dish = {
      id: currentReel.food_id || 1,
      name: currentReel.food_name || currentReel.title,
      price: currentReel.price || 189,
      restaurant_name: currentReel.restaurant_name,
      rating: currentReel.rating || 4.8
    };
    onSelectFood(dish);
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '0 auto',
      height: 'calc(100vh - 120px)',
      maxHeight: '740px',
      position: 'relative',
      borderRadius: '24px',
      border: '3px solid #241A17',
      boxShadow: '0 12px 36px rgba(36, 26, 23, 0.25)',
      overflow: 'hidden',
      backgroundColor: '#241A17'
    }}>
      {/* Video Stream Element */}
      <video
        key={currentReel.video_url}
        src={currentReel.video_url}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* Audio Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(36, 26, 23, 0.7)',
          border: '1.5px solid #FFFFFF',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          cursor: 'pointer',
          zIndex: 10
        }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Floating Right Interaction Bar */}
      <div style={{
        position: 'absolute',
        right: '14px',
        bottom: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '18px',
        zIndex: 10
      }}>
        {/* Like */}
        <button
          onClick={() => toggleLike(currentReel.id)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '2px'
          }}
        >
          <div style={{
            background: 'rgba(36, 26, 23, 0.75)',
            border: '2px solid #FFFFFF',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: likes[currentReel.id] ? '#F45B32' : '#FFFFFF'
          }}>
            <Heart size={22} fill={likes[currentReel.id] ? '#F45B32' : 'none'} />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 800 }}>
            {Number(currentReel.likes_count || 1200) + (likes[currentReel.id] ? 1 : 0)}
          </span>
        </button>

        {/* Comment */}
        <button
          onClick={() => alert('Community comments modal')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '2px'
          }}
        >
          <div style={{
            background: 'rgba(36, 26, 23, 0.75)',
            border: '2px solid #FFFFFF',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <MessageCircle size={22} />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#FFFFFF', fontWeight: 800 }}>
            {currentReel.comments_count || 84}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          style={{
            background: 'rgba(36, 26, 23, 0.75)',
            border: '2px solid #FFFFFF',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <Share2 size={20} />
        </button>

        {/* Bookmark */}
        <button
          onClick={() => toggleBookmark(currentReel.id)}
          style={{
            background: 'rgba(36, 26, 23, 0.75)',
            border: '2px solid #FFFFFF',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: bookmarks[currentReel.id] ? '#F2C14E' : '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <Bookmark size={20} fill={bookmarks[currentReel.id] ? '#F2C14E' : 'none'} />
        </button>
      </div>

      {/* Bottom Food & Order Card Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(36, 26, 23, 0.95) 0%, rgba(36, 26, 23, 0.6) 80%, transparent 100%)',
        padding: '24px 18px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#F2C14E',
              color: '#241A17',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.72rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Star size={11} fill="#241A17" /> {currentReel.rating || 4.8}
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem' }}>
              {currentReel.restaurant_name}
            </span>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', margin: '4px 0 0 0' }}>
            {currentReel.food_name || currentReel.title}
          </h3>
          <div style={{ fontSize: '1rem', fontWeight: 900, color: '#F2C14E', marginTop: '2px' }}>
            ₹{currentReel.price}
          </div>
        </div>

        {/* 2 Primary CTA Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleViewFood}
            style={{
              flex: 1,
              background: '#FFFFFF',
              color: '#241A17',
              border: '2px solid #241A17',
              borderRadius: '12px',
              padding: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 0 #241A17'
            }}
          >
            <Eye size={16} />
            <span>View Food</span>
          </button>

          <button
            onClick={handleOrderNow}
            style={{
              flex: 1,
              background: '#F45B32',
              color: '#FFFFFF',
              border: '2px solid #241A17',
              borderRadius: '12px',
              padding: '10px',
              fontWeight: 900,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 0 #241A17'
            }}
          >
            <ShoppingBag size={16} />
            <span>Order Now</span>
          </button>
        </div>

        {/* Next / Previous Reel Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '4px' }}>
          {reelList.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: currentIndex === idx ? '24px' : '6px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: currentIndex === idx ? '#F45B32' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
