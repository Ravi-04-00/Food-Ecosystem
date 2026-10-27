import React, { useState, useEffect } from 'react';
import { 
  Star, Clock, MapPin, Search, ChevronRight, AlertCircle, 
  RefreshCw, Utensils, CheckCircle2, XCircle, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { RestaurantDetailPage } from './RestaurantDetailPage.jsx';
import { fetchRestaurants } from '../services/api.js';

export const RestaurantsView = ({ onSelectFood }) => {
  const { 
    restaurants: initialRestaurants = [], 
    activeRestaurant, 
    setActiveRestaurant,
    loading: globalLoading = false, 
    error: globalError = null, 
    refreshData 
  } = useCustomer();

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [selectedRestId, setSelectedRestId] = useState(() => activeRestaurant?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState('ALL');
  const [sortBy, setSortBy] = useState('rating');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Sync when activeRestaurant changes in context
  useEffect(() => {
    if (activeRestaurant?.id) {
      setSelectedRestId(activeRestaurant.id);
    }
  }, [activeRestaurant]);

  // Load / Filter restaurants from API
  const loadFilteredRestaurants = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const data = await fetchRestaurants({
        search: searchQuery.trim(),
        cuisine: selectedCuisine !== 'ALL' ? selectedCuisine : undefined,
        is_open: openOnly ? true : undefined,
        min_rating: minRating !== 'ALL' ? minRating : undefined,
        sort: sortBy
      });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setRestaurants(list);
    } catch (err) {
      console.warn('Restaurants query failed:', err);
      setFetchError('Backend server connect ஆகவில்லை. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    // Debounce search & filters
    const timer = setTimeout(() => {
      loadFilteredRestaurants();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCuisine, openOnly, minRating, sortBy]);

  // If a restaurant is selected, show its full detail page
  if (selectedRestId) {
    return (
      <RestaurantDetailPage
        restaurantId={selectedRestId}
        onBack={() => {
          setSelectedRestId(null);
          if (setActiveRestaurant) setActiveRestaurant(null);
        }}
        onSelectFood={onSelectFood}
      />
    );
  }

  // Extract unique cuisines
  const allCuisines = Array.from(new Set(
    restaurants.flatMap(r => Array.isArray(r.cuisines) ? r.cuisines : (r.cuisines ? [r.cuisines] : []))
  )).filter(Boolean);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 80px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: 'var(--ws-shadow-sm)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{
              background: 'rgba(22, 163, 74, 0.1)',
              color: '#16A34A',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              ARTISAN FOOD GRID
            </span>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 4px', letterSpacing: '-0.5px' }}>
              Explore Restaurants & Cloud Kitchens
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', margin: 0 }}>
              Verified, hygienic and top-rated kitchen networks delivering fresh meals in your city.
            </p>
          </div>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCuisine('ALL');
              setOpenOnly(false);
              setMinRating('ALL');
              setSortBy('rating');
              loadFilteredRestaurants();
            }}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              padding: '8px 16px',
              color: 'var(--ws-text-primary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>Reset All</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--ws-surface-subtle)',
          border: '1.5px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '12px 18px'
        }}>
          <Search size={20} color="#22C55E" />
          <input
            type="text"
            placeholder="Search by restaurant name, cuisine or specialty dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--ws-text-primary)',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderTop: '1px solid var(--ws-border)', paddingTop: '16px' }}>
          
          {/* Left filters: Open Now & Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Open Now Toggle */}
            <button
              onClick={() => setOpenOnly(!openOnly)}
              style={{
                background: openOnly ? 'rgba(16, 185, 129, 0.15)' : 'var(--ws-surface-subtle)',
                color: openOnly ? '#10B981' : 'var(--ws-text-primary)',
                border: '1px solid',
                borderColor: openOnly ? '#10B981' : 'var(--ws-border)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: openOnly ? '#10B981' : '#94A3B8' }} />
              <span>Open Now Only</span>
            </button>

            {/* Min Rating Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>Rating:</span>
              {['ALL', '4.0', '4.5'].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  style={{
                    background: minRating === r ? 'var(--ws-primary)' : 'var(--ws-surface-subtle)',
                    color: minRating === r ? '#FFFFFF' : 'var(--ws-text-primary)',
                    border: '1px solid',
                    borderColor: minRating === r ? 'var(--ws-primary)' : 'var(--ws-border)',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {r === 'ALL' ? 'Any' : `★ ${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Sorting Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={13} /> SORT:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'var(--ws-surface-subtle)',
                color: 'var(--ws-text-primary)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
              <option value="price_low">Price Low to High</option>
              <option value="price_high">Price High to Low</option>
            </select>
          </div>
        </div>

        {/* Cuisine Chips */}
        {allCuisines.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}>
            <button
              onClick={() => setSelectedCuisine('ALL')}
              style={{
                background: selectedCuisine === 'ALL' ? 'var(--ws-primary)' : 'var(--ws-surface-subtle)',
                color: selectedCuisine === 'ALL' ? '#FFFFFF' : 'var(--ws-text-primary)',
                border: '1px solid',
                borderColor: selectedCuisine === 'ALL' ? 'var(--ws-primary)' : 'var(--ws-border)',
                borderRadius: '10px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              All Cuisines
            </button>
            {allCuisines.slice(0, 10).map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                style={{
                  background: selectedCuisine === cuisine ? 'var(--ws-primary)' : 'var(--ws-surface-subtle)',
                  color: selectedCuisine === cuisine ? '#FFFFFF' : 'var(--ws-text-primary)',
                  border: '1px solid',
                  borderColor: selectedCuisine === cuisine ? 'var(--ws-primary)' : 'var(--ws-border)',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {cuisine}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isFetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '22px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: '280px', borderRadius: '24px', background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)' }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {fetchError && !isFetching && (
        <div style={{
          background: 'var(--ws-surface)',
          borderRadius: '20px',
          border: '1px solid var(--ws-border)',
          padding: '40px 24px',
          textAlign: 'center',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#EF4444'
          }}>
            <AlertCircle size={30} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 6px' }}>
            {fetchError}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', marginBottom: '18px' }}>
            Failed to connect to the restaurant directory API.
          </p>
          <button
            onClick={loadFilteredRestaurants}
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      )}

      {/* Empty State: No Restaurants Found */}
      {!isFetching && !fetchError && restaurants.length === 0 && (
        <div style={{
          background: 'var(--ws-surface)',
          borderRadius: '24px',
          border: '1px solid var(--ws-border)',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'var(--ws-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#22C55E'
          }}>
            <Utensils size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px' }}>
            No restaurants found.
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
            No kitchens match your search criteria. Try modifying your filters or searching for different keywords.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCuisine('ALL');
              setOpenOnly(false);
              setMinRating('ALL');
            }}
            style={{
              background: 'var(--ws-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Restaurants Grid */}
      {!isFetching && !fetchError && restaurants.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Available Kitchens ({restaurants.length})
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
              Click any kitchen to inspect full menu
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '22px'
          }}>
            {restaurants.map(rest => {
              const isOpen = rest.is_open !== false;
              const isApproved = rest.verification_status === 'APPROVED';
              const status = !isApproved 
                ? 'TEMPORARILY_UNAVAILABLE' 
                : isOpen 
                  ? 'OPEN' 
                  : 'CLOSED';

              const cuisines = Array.isArray(rest.cuisines)
                ? rest.cuisines.join(' • ')
                : (rest.cuisine || 'Artisan Kitchen');

              return (
                <div
                  key={rest.id}
                  onClick={() => {
                    setSelectedRestId(rest.id);
                    if (setActiveRestaurant) setActiveRestaurant(rest);
                  }}
                  style={{
                    background: 'var(--ws-surface)',
                    borderRadius: '22px',
                    border: '1px solid var(--ws-border)',
                    boxShadow: 'var(--ws-shadow-sm)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--ws-shadow-lg)';
                    e.currentTarget.style.borderColor = 'var(--ws-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--ws-shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--ws-border)';
                  }}
                >
                  {/* Hero Image & Badges */}
                  <div style={{
                    height: '180px',
                    width: '100%',
                    position: 'relative',
                    backgroundColor: 'var(--ws-surface-subtle)',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={rest.hero_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'}
                      alt={rest.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      loading="lazy"
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
                      pointerEvents: 'none'
                    }} />

                    {/* Status Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: status === 'OPEN' 
                        ? 'rgba(16, 185, 129, 0.95)' 
                        : status === 'CLOSED'
                          ? 'rgba(239, 68, 68, 0.95)'
                          : 'rgba(245, 158, 11, 0.95)',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '4px 9px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                      {status === 'OPEN' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      <span>{status}</span>
                    </div>

                    {/* Featured / Verified Badge */}
                    {rest.is_verified && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(4px)',
                        color: '#16A34A',
                        borderRadius: '8px',
                        padding: '4px 9px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        ✓ VERIFIED
                      </div>
                    )}

                    {/* Delivery & Price Info overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '14px',
                      right: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '6px' }}>
                        <Clock size={12} />
                        <span>{rest.delivery_time_text || '18-24 min'}</span>
                      </div>
                      <span style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '6px' }}>
                        {rest.price_for_two || '₹450 for two'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rest.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#D97706',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          <span>{rest.rating || 4.8}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cuisines}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginTop: '6px' }}>
                        <MapPin size={13} color="#22C55E" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rest.address || 'Bengaluru Food Grid'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--ws-border)',
                      paddingTop: '10px',
                      marginTop: '4px'
                    }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                        {rest.review_count || 120}+ reviews
                      </span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: 'var(--ws-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <span>Browse Menu</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
