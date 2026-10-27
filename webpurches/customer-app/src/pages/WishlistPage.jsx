import React from 'react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { FoodCardRetro } from '../components/FoodCardRetro.jsx';

export const WishlistPage = ({ onContinueShopping, onSelectFood }) => {
  const { wishlist = [], wishlistError, setSelectedDish } = useCustomer();
  const safeWishlist = Array.isArray(wishlist) ? wishlist : [];

  const handleSelect = (dish) => {
    if (onSelectFood) onSelectFood(dish);
    else if (setSelectedDish) setSelectedDish(dish);
  };

  const errorBanner = wishlistError ? (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 0' }}>
      <div style={{
        padding: '12px 16px',
        borderRadius: '16px',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FECACA',
        color: '#DC2626',
        fontSize: '0.8rem',
        fontWeight: 700
      }}>
        {wishlistError} — please retry. Your list below shows the last saved state.
      </div>
    </div>
  ) : null;

  if (safeWishlist.length === 0) {
    return (
      <>
      {errorBanner}
      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '64px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#F7FBF7',
          border: '1px solid #E1EBE3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#52B788'
        }}>
          <Heart size={32} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#163D2B', margin: 0 }}>
          Your Wishlist is Empty
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#65776B', maxWidth: '420px', margin: 0, lineHeight: 1.5 }}>
          Save your favorite dishes while browsing to quickly reorder, monitor discounts, and access chef specials.
        </p>
        <button
          onClick={onContinueShopping}
          type="button"
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            backgroundColor: '#163D2B',
            color: '#FFFFFF',
            fontSize: '0.86rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(22, 61, 43, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Discover Fresh Dishes</span>
          <ArrowRight size={16} />
        </button>
      </div>
      </>
    );
  }

  return (
    <>
    {errorBanner}
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ paddingBottom: '14px', borderBottom: '1px solid #E1EBE3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#163D2B', margin: 0 }}>
            Saved Dishes
          </h1>
          <span style={{ fontSize: '0.80rem', color: '#65776B' }}>
            {safeWishlist.length} item{safeWishlist.length === 1 ? '' : 's'} saved in your wishlist
          </span>
        </div>
      </div>

      <div className="fd-food-grid">
        {safeWishlist.map(food => (
          <FoodCardRetro
            key={food.id}
            food={food}
            onSelectFood={handleSelect}
          />
        ))}
      </div>
    </div>
    </>
  );
};
