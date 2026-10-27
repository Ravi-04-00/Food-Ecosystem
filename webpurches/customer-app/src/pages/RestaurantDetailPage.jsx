import React, { useState, useEffect } from 'react';
import { 
  Star, Clock, MapPin, ArrowLeft, Search, Utensils, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Sparkles, Filter,
  ShieldCheck, Flag, Loader2, ThumbsUp, X 
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { FoodCardRetro } from '../components/FoodCardRetro.jsx';
import { 
  fetchRestaurantDetail, 
  fetchReviewsSummary, 
  fetchRestaurantReviews, 
  reportReview 
} from '../services/api.js';

export const RestaurantDetailPage = ({ restaurantId, onBack, onSelectFood }) => {
  const { addRecentlyViewedRestaurant, foods: globalFoods } = useCustomer();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phase 18: Tab switcher between Menu & Reviews
  const [activeViewTab, setActiveViewTab] = useState('menu'); // 'menu' | 'reviews'
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRatingFilter, setReviewRatingFilter] = useState(null);
  const [reviewSort, setReviewSort] = useState('newest');

  // Report modal state
  const [reportModalReviewId, setReportModalReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('ABUSIVE');
  const [reportExplanation, setReportExplanation] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState(null);

  // In-menu filter & search states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [menuSearch, setMenuSearch] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'

  const loadReviewsData = async () => {
    if (!restaurantId) return;
    setReviewsLoading(true);
    try {
      const [sumData, revList] = await Promise.all([
        fetchReviewsSummary('RESTAURANT', restaurantId),
        fetchRestaurantReviews(restaurantId, reviewSort, reviewRatingFilter)
      ]);
      setReviewsSummary(sumData);
      setReviews(revList);
    } catch (err) {
      console.warn('Reviews fetch fallback:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeViewTab === 'reviews') {
      loadReviewsData();
    }
  }, [activeViewTab, restaurantId, reviewSort, reviewRatingFilter]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModalReviewId) return;
    setReportSubmitting(true);
    try {
      await reportReview(reportModalReviewId, {
        reason: reportReason,
        explanation: reportExplanation
      });
      setReportFeedback('Thank you. Your report has been submitted for moderation review.');
      setTimeout(() => {
        setReportModalReviewId(null);
        setReportFeedback(null);
        setReportExplanation('');
      }, 2500);
    } catch (err) {
      setReportFeedback(err.message || 'Failed to submit report');
      setTimeout(() => setReportFeedback(null), 4000);
    } finally {
      setReportSubmitting(false);
    }
  };

  const loadRestaurant = async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRestaurantDetail(restaurantId);
      setRestaurant(data);
      if (addRecentlyViewedRestaurant) {
        addRecentlyViewedRestaurant(data);
      }
    } catch (err) {
      console.error('Failed to load restaurant detail:', err);
      if (err.message && err.message.includes('unavailable')) {
        setError('This restaurant is currently unavailable.');
      } else {
        setError('Backend server connect ஆகவில்லை. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, [restaurantId]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ height: '36px', width: '180px', background: 'var(--ws-surface-subtle)', borderRadius: '10px' }} />
        {/* Hero Banner Skeleton */}
        <div style={{
          height: '240px',
          borderRadius: '24px',
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--ws-border)', borderTopColor: 'var(--ws-primary)', animation: 'spin 1s linear infinite' }} />
        </div>
        {/* Menu Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px', marginTop: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: '320px', borderRadius: '20px', background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)' }} />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error || !restaurant) {
    return (
      <div style={{
        maxWidth: '560px',
        margin: '60px auto',
        textAlign: 'center',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '48px 24px',
        boxShadow: 'var(--ws-shadow-lg)'
      }}>
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: '#EF4444'
        }}>
          <AlertCircle size={34} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px' }}>
          {error || 'This restaurant is currently unavailable.'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', marginBottom: '24px' }}>
          The requested establishment details could not be retrieved from the food grid database.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onBack}
            style={{
              background: 'var(--ws-surface-subtle)',
              color: 'var(--ws-text-primary)',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Explore
          </button>
          <button
            onClick={loadRestaurant}
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Restaurant Open / Closed / Unavailable status
  const isOpen = restaurant.is_open !== false;
  const isApproved = restaurant.verification_status === 'APPROVED';
  const statusState = !isApproved 
    ? 'TEMPORARILY_UNAVAILABLE' 
    : isOpen 
      ? 'OPEN' 
      : 'CLOSED';

  // Menu Items: from restaurant.foods or matched from globalFoods
  const allRestaurantFoods = Array.isArray(restaurant.foods) && restaurant.foods.length > 0
    ? restaurant.foods
    : globalFoods.filter(f => f.restaurant === restaurant.id || f.restaurant_id === restaurant.id || f.restaurant_name === restaurant.name);

  // Filter food items inside this restaurant
  const filteredFoods = allRestaurantFoods.filter(dish => {
    // Category match
    const matchesCat = selectedCategory === 'ALL' ||
      dish.category_slug === selectedCategory ||
      dish.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
      dish.category === selectedCategory;

    // Dietary match
    const matchesDiet = dietaryFilter === 'ALL' ||
      (dietaryFilter === 'VEG' && dish.is_veg) ||
      (dietaryFilter === 'NON_VEG' && !dish.is_veg);

    // Search query match
    const matchesSearch = !menuSearch || 
      dish.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
      dish.short_description?.toLowerCase().includes(menuSearch.toLowerCase()) ||
      dish.category_name?.toLowerCase().includes(menuSearch.toLowerCase());

    return matchesCat && matchesDiet && matchesSearch;
  });

  // Extract menu categories
  const menuCategories = Array.isArray(restaurant.menu_categories) && restaurant.menu_categories.length > 0
    ? restaurant.menu_categories
    : Array.from(new Set(allRestaurantFoods.map(f => f.category_name).filter(Boolean))).map((catName, idx) => ({
        id: idx + 1,
        name: catName,
        slug: catName.toLowerCase().replace(/\s+/g, '-'),
        count: allRestaurantFoods.filter(f => f.category_name === catName).length
      }));

  const cuisinesList = Array.isArray(restaurant.cuisines)
    ? restaurant.cuisines
    : typeof restaurant.cuisines === 'string'
      ? restaurant.cuisines.split(',').map(c => c.trim())
      : ['Artisan Culinary'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Navigation Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--ws-text-primary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: 'var(--ws-shadow-sm)'
          }}
        >
          <ArrowLeft size={16} /> Back to Discover Kitchens
        </button>

        {/* Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: statusState === 'OPEN' 
            ? 'rgba(16, 185, 129, 0.12)' 
            : statusState === 'CLOSED'
              ? 'rgba(239, 68, 68, 0.12)'
              : 'rgba(245, 158, 11, 0.12)',
          color: statusState === 'OPEN' 
            ? '#10B981' 
            : statusState === 'CLOSED'
              ? '#EF4444'
              : '#D97706',
          border: '1px solid',
          borderColor: statusState === 'OPEN' 
            ? 'rgba(16, 185, 129, 0.3)' 
            : statusState === 'CLOSED'
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(245, 158, 11, 0.3)',
          borderRadius: '999px',
          padding: '6px 14px',
          fontWeight: 800,
          fontSize: '0.75rem',
          letterSpacing: '0.5px'
        }}>
          {statusState === 'OPEN' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          <span>{statusState === 'OPEN' ? 'OPEN FOR ORDERS' : statusState === 'CLOSED' ? 'CURRENTLY CLOSED' : 'TEMPORARILY UNAVAILABLE'}</span>
        </div>
      </div>

      {/* Restaurant Hero Profile Card */}
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '24px',
        border: '1px solid var(--ws-border)',
        boxShadow: 'var(--ws-shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Hero Image Banner */}
        <div style={{
          height: '240px',
          width: '100%',
          position: 'relative',
          backgroundColor: 'var(--ws-surface-subtle)',
          overflow: 'hidden'
        }}>
          <img
            src={restaurant.hero_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'}
            alt={restaurant.name}
            fetchpriority="high"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Restaurant Header Meta */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                  {restaurant.name}
                </h1>
                {restaurant.is_verified && (
                  <span style={{
                    background: 'rgba(22, 163, 74, 0.1)',
                    color: '#16A34A',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✓ Verified Kitchen
                  </span>
                )}
              </div>

              {restaurant.tagline && (
                <p style={{ fontSize: '0.95rem', color: 'var(--ws-text-secondary)', fontWeight: 600, margin: '6px 0 0' }}>
                  {restaurant.tagline}
                </p>
              )}

              {/* Cuisines Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                {cuisinesList.map((cuisine, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--ws-surface-subtle)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '8px',
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--ws-text-primary)'
                    }}
                  >
                    {cuisine}
                  </span>
                ))}
              </div>

              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ws-text-muted)', fontSize: '0.82rem', marginTop: '10px' }}>
                <MapPin size={15} color="#22C55E" />
                <span>{restaurant.address || 'Central Delivery Grid, Bengaluru'}</span>
              </div>
            </div>

            {/* Quick Metrics Badge Column */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '16px',
              padding: '12px 18px'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>RATING</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.15rem', fontWeight: 900, color: '#D97706' }}>
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  <span>{restaurant.rating || 4.8}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)' }}>{restaurant.review_count || 120}+ reviews</div>
              </div>

              <div style={{ width: '1px', background: 'var(--ws-border)', margin: '0 4px' }} />

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>PREPARATION</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                  {restaurant.delivery_time_text || '18-24 min'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)' }}>Dispatch speed</div>
              </div>

              <div style={{ width: '1px', background: 'var(--ws-border)', margin: '0 4px' }} />

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>COST ESTIMATE</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                  {restaurant.price_for_two || '₹450 for two'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ws-text-muted)' }}>Average price</div>
              </div>
            </div>
          </div>

          {restaurant.description && (
            <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', lineHeight: 1.5, margin: '8px 0 0', borderTop: '1px solid var(--ws-border)', paddingTop: '12px' }}>
              {restaurant.description}
            </p>
          )}
        </div>
      </div>

      {/* Phase 18: Kitchen Menu vs Reviews Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '2px solid var(--ws-border)',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveViewTab('menu')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeViewTab === 'menu' ? '3px solid #22C55E' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeViewTab === 'menu' ? '#15803D' : 'var(--ws-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Utensils size={18} />
          <span>Food Menu</span>
        </button>

        <button
          onClick={() => setActiveViewTab('reviews')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeViewTab === 'reviews' ? '3px solid #22C55E' : '3px solid transparent',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: activeViewTab === 'reviews' ? '#15803D' : 'var(--ws-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Star size={18} fill={activeViewTab === 'reviews' ? '#F59E0B' : 'none'} color="#F59E0B" />
          <span>Verified Reviews & Ratings ({reviewsSummary?.total_reviews ?? (restaurant.review_count || 0)})</span>
        </button>
      </div>

      {/* Menu Viewport */}
      {activeViewTab === 'menu' && (
      <>
      {/* Menu Controls: Search & Category Tabs */}
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '20px',
        border: '1px solid var(--ws-border)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        {/* Search & Dietary Filters in Restaurant Menu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--ws-surface-subtle)',
            border: '1px solid var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 14px',
            flex: 1,
            minWidth: '240px',
            maxWidth: '480px'
          }}>
            <Search size={18} color="#22C55E" />
            <input
              type="text"
              placeholder={`Search in ${restaurant.name}'s menu...`}
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '0.88rem',
                color: 'var(--ws-text-primary)',
                width: '100%'
              }}
            />
            {menuSearch && (
              <button
                onClick={() => setMenuSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--ws-text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Dietary Filter Segmented Control */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>DIETARY:</span>
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'VEG', label: '🟢 Veg Only' },
              { id: 'NON_VEG', label: '🔴 Non-Veg' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDietaryFilter(tab.id)}
                style={{
                  background: dietaryFilter === tab.id ? 'var(--ws-primary)' : 'var(--ws-surface-subtle)',
                  color: dietaryFilter === tab.id ? '#FFFFFF' : 'var(--ws-text-primary)',
                  border: '1px solid',
                  borderColor: dietaryFilter === tab.id ? 'var(--ws-primary)' : 'var(--ws-border)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Category Pills */}
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          borderTop: '1px solid var(--ws-border)',
          paddingTop: '14px'
        }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              background: selectedCategory === 'ALL' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'var(--ws-surface-subtle)',
              color: selectedCategory === 'ALL' ? '#FFFFFF' : 'var(--ws-text-primary)',
              border: '1px solid',
              borderColor: selectedCategory === 'ALL' ? 'transparent' : 'var(--ws-border)',
              borderRadius: '12px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            All Dishes ({allRestaurantFoods.length})
          </button>

          {menuCategories.map(cat => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => setSelectedCategory(cat.slug || cat.name)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'var(--ws-surface-subtle)',
                  color: isSelected ? '#FFFFFF' : 'var(--ws-text-primary)',
                  border: '1px solid',
                  borderColor: isSelected ? 'transparent' : 'var(--ws-border)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {cat.name} ({cat.count || allRestaurantFoods.filter(f => f.category_name === cat.name).length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Items List: Available & Unavailable Grouped */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              {selectedCategory === 'ALL' ? 'Complete Menu' : `${selectedCategory} Dishes`}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
              Showing {filteredFoods.length} dish{filteredFoods.length === 1 ? '' : 'es'}
            </div>
          </div>
        </div>

        {filteredFoods.length === 0 ? (
          <div style={{
            background: 'var(--ws-surface)',
            borderRadius: '20px',
            border: '1px solid var(--ws-border)',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'var(--ws-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#22C55E'
            }}>
              <Utensils size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 6px' }}>
              No food items found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', maxWidth: '400px', margin: '0 auto 16px' }}>
              No dishes match your selected filter or search keyword in this restaurant.
            </p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setMenuSearch(''); setDietaryFilter('ALL'); }}
              style={{
                background: 'var(--ws-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Reset Menu Filters
            </button>
          </div>
        ) : (
          <div className="fd-food-grid">
            {filteredFoods.map(dish => (
              <FoodCardRetro
                key={dish.id}
                food={dish}
                onSelectFood={onSelectFood}
                hideRestaurantName={true}
              />
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Phase 18: Reviews Viewport */}
      {activeViewTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Aggregate Rating Summary Card */}
          <div style={{
            background: 'var(--ws-surface)',
            borderRadius: '24px',
            border: '1px solid var(--ws-border)',
            padding: '24px 28px',
            boxShadow: 'var(--ws-shadow-sm)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            {/* Big Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1.5px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px',
                padding: '20px',
                textAlign: 'center',
                minWidth: '120px'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#D97706', lineHeight: 1 }}>
                  {reviewsSummary?.average_rating ?? (restaurant.rating || 4.8)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', margin: '6px 0 4px 0' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={14}
                      fill={s <= Math.round(Number(reviewsSummary?.average_rating || restaurant.rating || 4.8)) ? '#F59E0B' : 'none'}
                      color="#F59E0B"
                    />
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700 }}>
                  {reviewsSummary?.total_reviews ?? (restaurant.review_count || 0)} Verified Reviews
                </div>
              </div>

              {/* Sub metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                  Customer Ratings Breakdown
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--ws-text-secondary)' }}>
                  <ShieldCheck size={16} color="#22C55E" />
                  <span>100% Verified Orders Placed through Fast Delivery</span>
                </div>
                {reviewsSummary?.packaging_avg && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                    📦 Kitchen Packaging Score: <strong style={{ color: 'var(--ws-text-primary)' }}>{reviewsSummary.packaging_avg} ★</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Rating distribution bars */}
            <div style={{ flex: 1, minWidth: '260px', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[5, 4, 3, 2, 1].map(stars => {
                const total = reviewsSummary?.total_reviews || 1;
                const count = reviewsSummary?.distribution?.[stars] || 0;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                    <span style={{ width: '28px', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>{stars} ★</span>
                    <div style={{ flex: 1, height: '8px', background: 'var(--ws-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ width: '32px', textAlign: 'right', color: 'var(--ws-text-muted)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters & Sorting Bar */}
          <div style={{
            background: 'var(--ws-surface)',
            borderRadius: '16px',
            border: '1px solid var(--ws-border)',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Star Filters */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'All Reviews', value: null },
                { label: '5 ★', value: 5 },
                { label: '4 ★', value: 4 },
                { label: '3 ★', value: 3 },
                { label: '2 ★', value: 2 },
                { label: '1 ★', value: 1 }
              ].map(f => (
                <button
                  key={f.label}
                  onClick={() => setReviewRatingFilter(f.value)}
                  style={{
                    border: 'none',
                    background: reviewRatingFilter === f.value ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'var(--ws-surface-subtle)',
                    color: reviewRatingFilter === f.value ? '#FFFFFF' : 'var(--ws-text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--ws-text-muted)', fontWeight: 600 }}>Sort by:</span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value)}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {reviewsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 className="animate-spin" size={32} color="#22C55E" />
            </div>
          ) : reviews.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              borderRadius: '20px',
              border: '1px solid var(--ws-border)',
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Star size={40} color="#D8C7B5" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>No reviews found for this filter</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)', maxWidth: '380px', margin: 0 }}>
                Order from {restaurant.name} and be the first to share your verified dining review!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  style={{
                    background: 'var(--ws-surface)',
                    borderRadius: '18px',
                    border: '1px solid var(--ws-border)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: 'var(--ws-shadow-sm)'
                  }}
                >
                  {/* Top Bar: Reviewer Name, Verified Order, Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {rev.user_name?.[0] || 'C'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ws-text-primary)' }}>
                            {rev.user_name || 'Customer'}
                          </span>
                          {rev.is_verified_purchase && (
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              background: 'rgba(34, 197, 94, 0.12)',
                              color: '#15803D',
                              border: '1px solid rgba(34, 197, 94, 0.25)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <ShieldCheck size={11} color="#15803D" />
                              <span>Verified Order</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          {rev.order_number ? ` • Order #${rev.order_number}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={15}
                          fill={s <= rev.rating ? '#F59E0B' : 'none'}
                          color={s <= rev.rating ? '#F59E0B' : '#CBD5E1'}
                        />
                      ))}
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#D97706', marginLeft: '4px' }}>
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Sub tags if food item */}
                  {rev.target_type === 'FOOD_ITEM' && rev.product_name && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#15803D', background: 'rgba(34, 197, 94, 0.08)', padding: '4px 10px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                      <Utensils size={12} />
                      <span>Item: <strong>{rev.product_name}</strong></span>
                      {rev.food_quality_rating && <span>• Quality: {rev.food_quality_rating}★</span>}
                    </div>
                  )}

                  {/* Comment */}
                  {rev.comment && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      "{rev.comment}"
                    </p>
                  )}

                  {/* Actions / Report Review */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--ws-border)', paddingTop: '8px' }}>
                    <button
                      onClick={() => setReportModalReviewId(rev.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ws-text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Flag size={12} />
                      <span>Report Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 18: Abuse Report Modal */}
      {reportModalReviewId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--ws-surface, #FFFFFF)',
            borderRadius: '20px',
            border: '1px solid var(--ws-border)',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: 'var(--ws-text-primary)'
          }}>
            <button
              onClick={() => setReportModalReviewId(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
            >
              <X size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '0.78rem', fontWeight: 800 }}>
                <Flag size={16} />
                <span>COMMUNITY SAFETY & INTEGRITY</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 2px 0' }}>Report Review #{reportModalReviewId}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: 0 }}>
                Help keep the platform truthful, safe, and respectful.
              </p>
            </div>

            {reportFeedback ? (
              <div style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#15803D', padding: '14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                {reportFeedback}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Reason for report:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-bg)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="ABUSIVE">Abusive, profane, or harassing content</option>
                    <option value="IRRELEVANT">Irrelevant or spam / off-topic</option>
                    <option value="FRAUDULENT">Suspected fraudulent or fabricated</option>
                    <option value="PII">Exposes personal private information (PII)</option>
                    <option value="OTHER">Other policy violation</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Additional context (optional):
                  </label>
                  <textarea
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Provide specific details to assist moderation review..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-bg)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.82rem',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setReportModalReviewId(null)}
                    style={{
                      border: '1px solid var(--ws-border)',
                      background: 'none',
                      color: 'var(--ws-text-secondary)',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    style={{
                      border: 'none',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: reportSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
