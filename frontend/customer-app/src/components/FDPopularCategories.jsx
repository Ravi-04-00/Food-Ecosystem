import React from 'react';

/**
 * FDPopularCategories — Exact Reference Design Category Cards
 * Matches the reference image:
 * 7 cards: Burgers, Pizza, Chicken, South Indian, Chinese, Salads, Beverages
 * Soft light mint rounded cards (#EAF7ED), hover lift, clean dark green labels
 */
export const FDPopularCategories = ({ 
  selectedCategory = 'ALL', 
  onSelectCategory,
  onViewAll 
}) => {
  const referenceCategories = [
    {
      id: 'burgers',
      name: 'Burgers',
      query: 'Burger',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🍔'
    },
    {
      id: 'pizza',
      name: 'Pizza',
      query: 'Pizza',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🍕'
    },
    {
      id: 'chicken',
      name: 'Chicken',
      query: 'Chicken',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🍗'
    },
    {
      id: 'south-indian',
      name: 'South Indian',
      query: 'Dosa',
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🥞'
    },
    {
      id: 'chinese',
      name: 'Chinese',
      query: 'Noodles',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🥡'
    },
    {
      id: 'salads',
      name: 'Salads',
      query: 'Salad',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🥗'
    },
    {
      id: 'beverages',
      name: 'Beverages',
      query: 'Drinks',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
      iconEmoji: '🥤'
    }
  ];

  return (
    <section style={{ margin: '12px 0 28px 0' }}>
      {/* Header Row: Popular Categories & View All -> */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px'
      }}>
        <h2 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '1.35rem',
          fontWeight: 800,
          color: '#163D2B',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Popular Categories
        </h2>

        <button
          onClick={onViewAll || (() => onSelectCategory && onSelectCategory('ALL'))}
          style={{
            background: 'none',
            border: 'none',
            color: '#52B788',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'color 0.2s ease'
          }}
        >
          <span>View All</span>
          <span style={{ fontSize: '1rem' }}>→</span>
        </button>
      </div>

      {/* 7 Horizontal Category Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '14px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {referenceCategories.map(cat => {
          const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase() || 
                             selectedCategory?.toLowerCase() === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory && onSelectCategory(cat.query)}
              style={{
                background: isSelected ? '#D8F3DC' : '#EAF7ED',
                border: '1.5px solid',
                borderColor: isSelected ? '#52B788' : 'rgba(82, 183, 136, 0.18)',
                borderRadius: '20px',
                padding: '16px 12px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                userSelect: 'none',
                boxShadow: isSelected 
                  ? '0 6px 18px rgba(82, 183, 136, 0.25)' 
                  : '0 2px 8px rgba(22, 61, 43, 0.03)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="hover:-translate-y-1 hover:shadow-md transition-transform"
            >
              {/* Circular Food Thumbnail Container */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FFFFFF',
                overflow: 'hidden',
                boxShadow: '0 3px 10px rgba(22, 61, 43, 0.08)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span style="font-size: 2rem;">${cat.iconEmoji}</span>`;
                  }}
                />
              </div>

              {/* Label */}
              <span style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: isSelected ? 800 : 700,
                fontSize: '0.84rem',
                color: '#163D2B',
                letterSpacing: '-0.01em'
              }}>
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FDPopularCategories;
