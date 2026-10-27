import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Star, Flame, Sparkles, Clock, 
  ArrowRight, SlidersHorizontal, Sun, Utensils,
  AlertCircle, RefreshCw, RotateCcw, Tag, Compass, ChevronRight, 
  Zap, CheckCircle2, XCircle, History, ArrowUpDown
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { FoodCardRetro } from '../components/FoodCardRetro.jsx';
import { RestaurantDetailPage } from './RestaurantDetailPage.jsx';
import { SmartSearchBar } from '../components/SmartSearchBar.jsx';
import { FDReferenceHero } from '../components/FDReferenceHero.jsx';
import { FDPopularCategories } from '../components/FDPopularCategories.jsx';
import { FDRestaurantCard } from '../components/FDRestaurantCard.jsx';
import { FDTrustAndPromoSection } from '../components/FDTrustAndPromoSection.jsx';
import { 
  fetchFoods, 
  fetchRestaurants, 
  searchCatalog, 
  fetchDiscoverySections, 
  fetchPersonalizedRecommendations 
} from '../services/api.js';

export const ExplorePage = ({ onSelectFood, onGoToReels, onOpenLocationModal, onSelectRestaurant }) => {
  const { 
    foods: contextFoods = [], 
    restaurants: contextRestaurants = [], 
    categories = [],
    recentlyViewedRestaurants = [],
    recentlyViewedFoods = [],
    addRecentlyViewedRestaurant,
    loading: initialLoading = false, 
    error: initialError = null, 
    refreshData,
    setIsAIOpen,
    addToCart,
    currentUser
  } = useCustomer();

  // Active view: either discovery home or selected restaurant detail
  const [selectedRestId, setSelectedRestId] = useState(null);

  // Discovery Filters & Search State
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState('ALL');
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    dietary: 'ALL',
    price_bracket: 'ALL',
    min_price: null,
    max_price: null,
    min_rating: 'ALL',
    is_open: null,
    sort: 'relevance'
  });

  // Server-Side Search & Discovery States
  const [searchResults, setSearchResults] = useState(null);
  const [isServerSearching, setIsServerSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [discoverySections, setDiscoverySections] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);

  // Fetch real PostgreSQL discovery sections & personalized recommendations
  useEffect(() => {
    let isMounted = true;
    const loadDiscovery = async () => {
      try {
        setLoadingDiscovery(true);
        const [secRes, recRes] = await Promise.allSettled([
          fetchDiscoverySections(),
          fetchPersonalizedRecommendations(8)
        ]);
        if (isMounted) {
          if (secRes.status === 'fulfilled' && secRes.value) {
            setDiscoverySections(secRes.value);
          }
          if (recRes.status === 'fulfilled' && recRes.value) {
            setRecommendations(recRes.value);
          }
        }
      } catch (err) {
        console.error('Error fetching discovery sections:', err);
      } finally {
        if (isMounted) setLoadingDiscovery(false);
      }
    };
    loadDiscovery();
    return () => { isMounted = false; };
  }, []);

  // Time-of-day greeting & curation
  const [mealTime, setMealTime] = useState('Evening');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setMealTime('Breakfast');
    else if (hour >= 11 && hour < 16) setMealTime('Lunch');
    else if (hour >= 16 && hour < 22) setMealTime('Evening');
    else setMealTime('Late Night');
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setSearchPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine if search or filters are active
  const isSearchOrFilterActive = Boolean(
    debouncedSearch || 
    (selectedCategory && selectedCategory !== 'ALL') || 
    (selectedCuisine && selectedCuisine !== 'ALL') || 
    (filters.dietary && filters.dietary !== 'ALL') || 
    filters.min_price || 
    filters.max_price || 
    (filters.min_rating && filters.min_rating !== 'ALL') || 
    filters.is_open !== null ||
    openOnly
  );

  // Run server-side catalog search when query or filters change
  useEffect(() => {
    if (!isSearchOrFilterActive) {
      setSearchResults(null);
      return;
    }

    let isMounted = true;
    const runSearch = async () => {
      setIsServerSearching(true);
      try {
        const res = await searchCatalog({
          q: debouncedSearch,
          category: selectedCategory,
          cuisine: selectedCuisine,
          dietary: filters.dietary,
          min_price: filters.min_price,
          max_price: filters.max_price,
          min_rating: filters.min_rating !== 'ALL' ? filters.min_rating : (minRating !== 'ALL' ? minRating : undefined),
          is_open: filters.is_open !== null ? filters.is_open : (openOnly ? true : undefined),
          sort: filters.sort !== 'relevance' ? filters.sort : sortBy,
          page: searchPage,
          page_size: 12
        });
        if (isMounted) setSearchResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setIsServerSearching(false);
      }
    };

    runSearch();
    return () => { isMounted = false; };
  }, [debouncedSearch, selectedCategory, selectedCuisine, filters, openOnly, minRating, sortBy, searchPage, isSearchOrFilterActive]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('ALL');
    setSelectedCuisine('ALL');
    setOpenOnly(false);
    setMinRating('ALL');
    setSortBy('relevance');
    setFilters({
      dietary: 'ALL',
      price_bracket: 'ALL',
      min_price: null,
      max_price: null,
      min_rating: 'ALL',
      is_open: null,
      sort: 'relevance'
    });
    setSearchPage(1);
    setSearchResults(null);
  };

  const handleOpenRestaurant = (rest) => {
    if (!rest) return;
    if (addRecentlyViewedRestaurant) {
      addRecentlyViewedRestaurant(rest);
    }
    setSelectedRestId(rest.id);
    if (onSelectRestaurant) {
      onSelectRestaurant(rest);
    }
  };

  // Dietary filter helpers mapped to filters state
  const dietaryFilter = filters.dietary || 'ALL';
  const setDietaryFilter = (val) => setFilters(prev => ({ ...prev, dietary: val }));

  // Safe arrays
  const safeFoods = Array.isArray(contextFoods) ? contextFoods : [];
  const safeRestaurants = Array.isArray(contextRestaurants) ? contextRestaurants : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Filtered Foods
  const filteredFoods = useMemo(() => {
    return safeFoods.filter(item => {
      if (!item) return false;

      // Category filter
      const matchesCat = selectedCategory === 'ALL' || 
        item.category_slug === selectedCategory || 
        item.category_name?.toLowerCase() === selectedCategory.toLowerCase() ||
        item.category === selectedCategory;

      // Dietary filter
      const matchesDiet = dietaryFilter === 'ALL' || 
        (dietaryFilter === 'VEG' && item.is_veg) || 
        (dietaryFilter === 'NON_VEG' && !item.is_veg);

      // Search match
      let matchesSearch = true;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const text = `${item.name || ''} ${item.restaurant_name || ''} ${item.category_name || ''} ${item.short_description || ''} ${item.description || ''}`.toLowerCase();
        matchesSearch = text.includes(q);
      }

      return matchesCat && matchesDiet && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price_high') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'popular') return (b.review_count || 0) - (a.review_count || 0);
      return (b.rating || 4.8) - (a.rating || 4.8);
    });
  }, [safeFoods, selectedCategory, dietaryFilter, debouncedSearch, sortBy]);

  // Filtered Restaurants
  const filteredRestaurants = useMemo(() => {
    return safeRestaurants.filter(rest => {
      if (!rest) return false;

      // Open now filter
      if (openOnly && rest.is_open === false) return false;

      // Rating filter
      if (minRating !== 'ALL') {
        const ratingVal = parseFloat(minRating);
        if (parseFloat(rest.rating || 0) < ratingVal) return false;
      }

      // Category / Cuisine match
      let matchesCat = true;
      if (selectedCategory !== 'ALL') {
        const catLower = selectedCategory.toLowerCase();
        const cuisines = Array.isArray(rest.cuisines) ? rest.cuisines.map(c => c.toLowerCase()) : [];
        const hasCuisine = cuisines.some(c => c.includes(catLower));
        const servesCategory = safeFoods.some(f => 
          (f.restaurant === rest.id || f.restaurant_id === rest.id || f.restaurant_name === rest.name) &&
          (f.category_slug === selectedCategory || f.category_name?.toLowerCase() === catLower)
        );
        matchesCat = hasCuisine || servesCategory;
      }

      // Search match
      let matchesSearch = true;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const cuisinesText = Array.isArray(rest.cuisines) ? rest.cuisines.join(' ').toLowerCase() : '';
        const nameText = `${rest.name || ''} ${rest.tagline || ''} ${rest.address || ''}`.toLowerCase();
        const servesFood = safeFoods.some(f => 
          (f.restaurant === rest.id || f.restaurant_id === rest.id || f.restaurant_name === rest.name) &&
          (f.name?.toLowerCase().includes(q) || f.category_name?.toLowerCase().includes(q))
        );
        matchesSearch = nameText.includes(q) || cuisinesText.includes(q) || servesFood;
      }

      return matchesCat && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'popular') return (b.review_count || 0) - (a.review_count || 0);
      return (b.rating || 4.8) - (a.rating || 4.8);
    });
  }, [safeRestaurants, safeFoods, openOnly, minRating, selectedCategory, debouncedSearch, sortBy]);

  // Curated subsets
  const featuredRestaurants = useMemo(() => {
    return safeRestaurants
      .filter(r => r.is_verified || parseFloat(r.rating || 0) >= 4.85)
      .slice(0, 4);
  }, [safeRestaurants]);

  const popularRestaurants = useMemo(() => {
    return [...safeRestaurants]
      .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
      .slice(0, 4);
  }, [safeRestaurants]);

  const recommendedFoods = useMemo(() => {
    return safeFoods.slice(0, 6);
  }, [safeFoods]);

  // Server-Search Result Mappings with Fallback
  const displayRestaurants = searchResults ? (searchResults.restaurants || []) : filteredRestaurants;
  const displayFoods = searchResults ? (searchResults.foods || []) : filteredFoods;
  const totalRestaurants = searchResults ? (searchResults.total_restaurants ?? filteredRestaurants.length) : filteredRestaurants.length;
  const totalFoods = searchResults ? (searchResults.total_foods ?? filteredFoods.length) : filteredFoods.length;
  const totalPages = searchResults ? (searchResults.total_pages || 1) : 1;

  // If a restaurant is selected, render dedicated RestaurantDetailPage
  if (selectedRestId) {
    return (
      <RestaurantDetailPage
        restaurantId={selectedRestId}
        onBack={() => setSelectedRestId(null)}
        onSelectFood={onSelectFood}
      />
    );
  }

  // Full Page Loading Skeleton State
  if (initialLoading && safeFoods.length === 0 && safeRestaurants.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '80px' }}>
        <div style={{
          background: 'var(--ws-surface)',
          borderRadius: '24px',
          border: '1px solid var(--ws-border)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ height: '22px', width: '220px', background: 'var(--ws-surface-subtle)', borderRadius: '8px' }} />
          <div style={{ height: '36px', width: '100%', maxWidth: '380px', background: 'var(--ws-surface-subtle)', borderRadius: '10px' }} />
          <div style={{ height: '52px', width: '100%', background: 'var(--ws-surface-subtle)', borderRadius: '16px' }} />
        </div>

        {/* Categories Skeleton */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ width: '130px', height: '46px', borderRadius: '14px', background: 'var(--ws-surface-subtle)', flexShrink: 0 }} />
          ))}
        </div>

        {/* Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '300px', borderRadius: '20px', background: 'var(--ws-surface-subtle)', border: '1px solid var(--ws-border)' }} />
          ))}
        </div>
      </div>
    );
  }

  // Full Page Network Error State
  if (initialError && safeFoods.length === 0 && safeRestaurants.length === 0) {
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
          <AlertCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px' }}>
          Backend server connect ஆகவில்லை. Please try again.
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', marginBottom: '24px' }}>
          {initialError || 'Could not connect to the FD FOODS discovery service. Please verify that the Django REST backend is running.'}
        </p>
        <button
          onClick={refreshData}
          style={{
            background: 'linear-gradient(135deg, #52B788 0%, #1B4332 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(82, 183, 136, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* 1. Exact Reference FD Foods Hero Section with 2–3 Featured Items */}
      <FDReferenceHero 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPerformSearch={(q) => {
          setSearchQuery(q);
          setDebouncedSearch(q);
          setSearchPage(1);
        }}
        onSelectTag={(tag) => {
          setSearchQuery(tag);
          setDebouncedSearch(tag);
          setSearchPage(1);
        }}
        onOpenLocationModal={onOpenLocationModal}
        currentLocation={currentUser?.delivery_address || currentUser?.city || 'Chennai Central'}
        featuredFoods={safeFoods.slice(0, 3)}
        onSelectFood={onSelectFood}
        onAddToCart={addToCart}
        isLoading={initialLoading}
      />

      {/* 2. Exact Reference Popular Categories Section */}
      <FDPopularCategories 
        selectedCategory={selectedCategory}
        onSelectCategory={(catQuery) => {
          if (catQuery === 'ALL') {
            setSelectedCategory('ALL');
            setSearchQuery('');
            setDebouncedSearch('');
          } else {
            setSearchQuery(catQuery);
            setDebouncedSearch(catQuery);
          }
          setSearchPage(1);
        }}
        onViewAll={() => {
          setSelectedCategory('ALL');
          setSearchQuery('');
          setDebouncedSearch('');
        }}
      />

      {/* 3. Food Categories Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
              Food Categories
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
              Dynamic categories from backend ({safeCategories.length} available)
            </span>
          </div>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{ background: 'none', border: 'none', color: '#52B788', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset Category
            </button>
          )}
        </div>

        {safeCategories.length === 0 ? (
          <div style={{ padding: '16px', background: 'var(--ws-surface)', borderRadius: '14px', border: '1px solid var(--ws-border)', textAlign: 'center', color: 'var(--ws-text-secondary)', fontSize: '0.85rem' }}>
            No categories available.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none'
          }}>
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                background: selectedCategory === 'ALL' 
                  ? 'linear-gradient(135deg, #52B788 0%, #1B4332 100%)' 
                  : 'var(--ws-surface)',
                color: selectedCategory === 'ALL' ? '#FFFFFF' : 'var(--ws-text-primary)',
                border: '1px solid',
                borderColor: selectedCategory === 'ALL' ? 'transparent' : 'var(--ws-border)',
                borderRadius: '14px',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: selectedCategory === 'ALL' ? '0 4px 12px rgba(82, 183, 136, 0.35)' : 'var(--ws-shadow-sm)',
                fontWeight: 700,
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span style={{ fontSize: '1.15rem' }}>🍽️</span>
              <span>All ({safeFoods.length})</span>
            </button>

            {safeCategories.map(cat => {
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => setSelectedCategory(cat.slug || cat.name)}
                  style={{
                    background: isSelected 
                      ? 'linear-gradient(135deg, #52B788 0%, #1B4332 100%)' 
                      : 'var(--ws-surface)',
                    color: isSelected ? '#FFFFFF' : 'var(--ws-text-primary)',
                    border: '1px solid',
                    borderColor: isSelected ? 'transparent' : 'var(--ws-border)',
                    borderRadius: '14px',
                    padding: '10px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(82, 183, 136, 0.35)' : 'var(--ws-shadow-sm)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>{cat.icon || '🍛'}</span>
                  <span>{cat.name} {cat.product_count !== undefined ? `(${cat.product_count})` : ''}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FILTER & SORT CONTROLS BAR */}
      <div style={{
        background: 'var(--ws-surface)',
        borderRadius: '18px',
        border: '1px solid var(--ws-border)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        {/* Left: Dietary Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)' }}>DIET:</span>
          {[
            { id: 'ALL', label: 'All Dishes' },
            { id: 'VEG', label: '🟢 Veg Only' },
            { id: 'NON_VEG', label: '🔴 Non-Veg' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setDietaryFilter(opt.id)}
              style={{
                background: dietaryFilter === opt.id ? 'var(--ws-primary)' : 'var(--ws-surface-subtle)',
                color: dietaryFilter === opt.id ? '#FFFFFF' : 'var(--ws-text-primary)',
                border: '1px solid',
                borderColor: dietaryFilter === opt.id ? 'var(--ws-primary)' : 'var(--ws-border)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}

          {/* Open Now filter */}
          <button
            onClick={() => setOpenOnly(!openOnly)}
            style={{
              background: openOnly ? 'rgba(16, 185, 129, 0.15)' : 'var(--ws-surface-subtle)',
              color: openOnly ? '#10B981' : 'var(--ws-text-primary)',
              border: '1px solid',
              borderColor: openOnly ? '#10B981' : 'var(--ws-border)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: openOnly ? '#10B981' : '#94A3B8' }} />
            <span>Open Now</span>
          </button>
        </div>

        {/* Right: Sorting Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={12} /> SORT:
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
            <option value="recommended">Recommended</option>
            <option value="rating">Top Rated (★)</option>
            <option value="popular">Most Popular</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

          {isSearchOrFilterActive && (
            <button
              onClick={handleResetFilters}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '6px 10px',
                color: '#EF4444',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* SEARCH / FILTER ACTIVE RESULTS VIEW */}
      {isSearchOrFilterActive ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Searching Status Indicator */}
          {isServerSearching && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(82, 183, 136, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(82, 183, 136, 0.25)',
              color: '#163D2B',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Searching catalog across dishes, kitchens, and cuisines...</span>
            </div>
          )}

          {/* Completely Empty State when both restaurants and foods yield 0 */}
          {!isServerSearching && displayRestaurants.length === 0 && displayFoods.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              borderRadius: '24px',
              border: '1px solid var(--ws-border)',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: 'var(--ws-shadow-sm)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'var(--ws-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#52B788'
              }}>
                <Utensils size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 6px' }}>
                No matching results found
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', maxWidth: '460px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                We could not find kitchens or dishes matching <strong style={{ color: 'var(--ws-text-primary)' }}>"{debouncedSearch || 'your selected filters'}"</strong>.
              </p>
              <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: '6px',
                background: 'var(--ws-surface-subtle)',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid var(--ws-border)',
                textAlign: 'left',
                fontSize: '0.78rem',
                color: 'var(--ws-text-muted)',
                marginBottom: '20px'
              }}>
                <div>💡 <strong>Tamil search:</strong> பிரியாணி, சிக்கன், தோசை, பரோட்டா, சாம்பார்</div>
                <div>💡 <strong>English search:</strong> Biryani, Chicken, Dosa, Parotta, Burger</div>
                <div>💡 <strong>Tip:</strong> Try relaxing price or dietary filters.</div>
              </div>
              <div>
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: 'var(--ws-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 22px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Reset All Filters & Search
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Matching Restaurants Result */}
              {displayRestaurants.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                        Matching Restaurants ({totalRestaurants})
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                        Kitchens matching your criteria
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '18px' }}>
                    {displayRestaurants.map(rest => (
                      <div
                        key={rest.id}
                        onClick={() => handleOpenRestaurant(rest)}
                        style={{
                          background: 'var(--ws-surface)',
                          borderRadius: '18px',
                          border: '1px solid var(--ws-border)',
                          padding: '16px',
                          display: 'flex',
                          gap: '14px',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--ws-shadow-sm)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--ws-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--ws-border)'; }}
                      >
                        <div style={{ width: '64px', height: '64px', borderRadius: '14px', overflow: 'hidden', backgroundColor: 'var(--ws-surface-subtle)', flexShrink: 0 }}>
                          <img src={rest.hero_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80'} alt={rest.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {rest.name}
                            </h4>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              ★ {rest.rating}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {Array.isArray(rest.cuisines) ? rest.cuisines.join(', ') : (rest.cuisine || 'Gourmet')}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--ws-text-muted)', marginTop: '6px' }}>
                            <span>⏱️ {rest.delivery_time_text || '20 min'}</span>
                            <span>• {rest.is_open ? '🟢 Open' : '🔴 Closed'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Food Items Result */}
              {displayFoods.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                        Matching Food Items ({totalFoods})
                      </h2>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
                        Dishes matching your selection
                      </span>
                    </div>
                  </div>

                  <div className="fd-food-grid">
                    {displayFoods.map(food => (
                      <FoodCardRetro
                        key={food.id}
                        food={food}
                        onSelectFood={onSelectFood}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Server Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 0',
                  borderTop: '1px solid var(--ws-border)'
                }}>
                  <button
                    disabled={searchPage <= 1}
                    onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: searchPage <= 1 ? 'var(--ws-surface-subtle)' : 'var(--ws-surface)',
                      color: searchPage <= 1 ? 'var(--ws-text-muted)' : 'var(--ws-text-primary)',
                      cursor: searchPage <= 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    ← Previous
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ws-text-muted)' }}>
                    Page {searchPage} of {totalPages}
                  </span>
                  <button
                    disabled={searchPage >= totalPages}
                    onClick={() => setSearchPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: searchPage >= totalPages ? 'var(--ws-surface-subtle)' : 'var(--ws-surface)',
                      color: searchPage >= totalPages ? 'var(--ws-text-muted)' : 'var(--ws-text-primary)',
                      cursor: searchPage >= totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      ) : (
        /* DEFAULT HOMEPAGE SECTIONS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* EXACT REFERENCE: Top Rated Restaurants (The Green Bowl, Spice Villa, Pizza Palace, Good Food Kitchen) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#163D2B',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Top Rated Restaurants
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {[
                {
                  id: safeRestaurants[0]?.id || 1,
                  name: 'The Green Bowl',
                  rating: 4.5,
                  delivery_time_text: '25-30 min',
                  cuisines: ['Healthy', 'Salads'],
                  price_for_two_text: '₹120 for two',
                  hero_image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
                  is_open: true
                },
                {
                  id: safeRestaurants[1]?.id || 2,
                  name: 'Spice Villa',
                  rating: 4.3,
                  delivery_time_text: '25-30 min',
                  cuisines: ['North Indian'],
                  price_for_two_text: '₹180 for two',
                  hero_image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
                  is_open: true
                },
                {
                  id: safeRestaurants[2]?.id || 3,
                  name: 'Pizza Palace',
                  rating: 4.4,
                  delivery_time_text: '25-35 min',
                  cuisines: ['Italian', 'Pizza'],
                  price_for_two_text: '₹200 for two',
                  hero_image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
                  is_open: true
                },
                {
                  id: safeRestaurants[3]?.id || 4,
                  name: 'Good Food Kitchen',
                  rating: 4.2,
                  delivery_time_text: '20-25 min',
                  cuisines: ['Chinese'],
                  price_for_two_text: '₹150 for two',
                  hero_image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
                  is_open: true
                }
              ].map(rest => (
                <FDRestaurantCard 
                  key={rest.name}
                  restaurant={rest}
                  onClick={() => handleOpenRestaurant(rest)}
                />
              ))}
            </div>
          </div>

          {/* EXACT REFERENCE: Center Feature Trust Badges & Promo Card */}
          <FDTrustAndPromoSection onExploreClick={() => {
            if (safeRestaurants[0]) handleOpenRestaurant(safeRestaurants[0]);
          }} />

          {/* 1. Personalized Recommendations (Phase 20) */}
          {recommendations?.items?.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.07) 0%, rgba(16, 185, 129, 0.02) 100%)',
              borderRadius: '26px',
              border: '1px solid rgba(34, 197, 94, 0.22)',
              padding: '24px',
              boxShadow: 'var(--ws-shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={22} color="#52B788" />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#163D2B', margin: 0 }}>
                      {recommendations.personalized ? 'Personalized For You ✨' : 'Curated Specialty Recommendations ✨'}
                    </h2>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600, marginTop: '3px' }}>
                    {recommendations.strategy}
                  </div>
                </div>
                <div style={{
                  background: '#D8F3DC',
                  color: '#163D2B',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(82, 183, 136, 0.35)',
                  letterSpacing: '0.4px'
                }}>
                  {recommendations.personalized ? 'TASTE AFFINITY MATCH' : 'VERIFIED PICKS'}
                </div>
              </div>

              <div className="fd-food-grid">
                {recommendations.items.map((entry, idx) => {
                  const food = entry.food || entry;
                  return (
                    <div key={food.id || idx} style={{ position: 'relative' }}>
                      {entry.reason && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '12px',
                          zIndex: 10,
                          background: '#1F2937',
                          color: '#34D399',
                          border: '1px solid rgba(52, 211, 153, 0.4)',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          maxWidth: '90%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <Sparkles size={11} /> {entry.reason}
                        </div>
                      )}
                      <FoodCardRetro food={food} onSelectFood={onSelectFood} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Explore by Cuisine (Phase 20) */}
          {discoverySections?.cuisines?.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Explore by Cuisine 🍲
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Authentic regional cuisines and culinary traditions
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                {discoverySections.cuisines.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedCuisine(c.name);
                      setSearchPage(1);
                    }}
                    style={{
                      background: selectedCuisine === c.name ? 'var(--ws-primary)' : 'var(--ws-surface)',
                      color: selectedCuisine === c.name ? '#FFFFFF' : 'var(--ws-text-primary)',
                      border: '1px solid',
                      borderColor: selectedCuisine === c.name ? 'var(--ws-primary)' : 'var(--ws-border)',
                      borderRadius: '14px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'var(--ws-shadow-sm)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>🍽️ {c.name}</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>({c.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Popular Dishes Ranked by Verified Order Volume (Phase 20) */}
          {discoverySections?.popular_foods?.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Most Popular Dishes 🔥
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Ranked by completed order volume across platform deliveries
                  </div>
                </div>
              </div>
              <div className="fd-food-grid">
                {discoverySections.popular_foods.map(food => (
                  <FoodCardRetro
                    key={food.id}
                    food={food}
                    onSelectFood={onSelectFood}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. Trending Kitchens in Past 30 Days (Phase 20) */}
          {discoverySections?.trending_restaurants?.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Trending Kitchens 🚀
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Highest order momentum and top ratings over the past 30 days
                  </div>
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '20px'
              }}>
                {discoverySections.trending_restaurants.map(rest => (
                  <div
                    key={rest.id}
                    onClick={() => handleOpenRestaurant(rest)}
                    style={{
                      background: 'var(--ws-surface)',
                      borderRadius: '22px',
                      border: '1px solid var(--ws-border)',
                      boxShadow: 'var(--ws-shadow-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--ws-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--ws-border)'; }}
                  >
                    <div style={{ height: '170px', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--ws-surface-subtle)' }}>
                      <img src={rest.hero_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'} alt={rest.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(239, 68, 68, 0.95)', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                        🔥 TRENDING
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700 }}>
                        <span>⏱️ {rest.delivery_time_text || '20 min'}</span>
                        <span>{rest.price_for_two || '₹400 for two'}</span>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>{rest.name}</h3>
                        <span style={{ color: '#D97706', fontSize: '0.78rem', fontWeight: 700 }}>★ {rest.rating}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', margin: '4px 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {Array.isArray(rest.cuisines) ? rest.cuisines.join(' • ') : (rest.cuisine || 'Fast Gourmet')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                        <span>{rest.is_open ? '🟢 Open Now' : '🔴 Closed'}</span>
                        <span style={{ color: 'var(--ws-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Inspect Kitchen <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Special Deals & Discounts (Phase 20) */}
          {discoverySections?.discounted_foods?.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Special Deals & Discounts 🏷️
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Active kitchen discounts and special promotional pricing
                  </div>
                </div>
              </div>
              <div className="fd-food-grid">
                {discoverySections.discounted_foods.map(food => (
                  <FoodCardRetro
                    key={food.id}
                    food={food}
                    onSelectFood={onSelectFood}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 6. Freshly Added Dishes (Phase 20) */}
          {discoverySections?.newly_added_foods?.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Freshly Added to Menu 🆕
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    The newest creations recently introduced by partner restaurants
                  </div>
                </div>
              </div>
              <div className="fd-food-grid">
                {discoverySections.newly_added_foods.map(food => (
                  <FoodCardRetro
                    key={food.id}
                    food={food}
                    onSelectFood={onSelectFood}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 7. Featured Restaurants Section */}
          {featuredRestaurants.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Featured Restaurants ⭐
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Certified kitchens meeting the highest hygiene and culinary standards
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '20px'
              }}>
                {featuredRestaurants.map(rest => (
                  <div
                    key={rest.id}
                    onClick={() => handleOpenRestaurant(rest)}
                    style={{
                      background: 'var(--ws-surface)',
                      borderRadius: '22px',
                      border: '1px solid var(--ws-border)',
                      boxShadow: 'var(--ws-shadow-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--ws-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--ws-border)'; }}
                  >
                    <div style={{ height: '170px', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--ws-surface-subtle)' }}>
                      <img src={rest.hero_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'} alt={rest.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(22, 163, 74, 0.95)', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                        FEATURED
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700 }}>
                        <span>⏱️ {rest.delivery_time_text || '18-24 min'}</span>
                        <span>{rest.price_for_two || '₹450 for two'}</span>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>{rest.name}</h3>
                        <span style={{ color: '#D97706', fontSize: '0.78rem', fontWeight: 700 }}>★ {rest.rating}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', margin: '4px 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {Array.isArray(rest.cuisines) ? rest.cuisines.join(' • ') : (rest.cuisine || 'Signature Menu')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                        <span>{rest.is_open ? '🟢 Open Now' : '🔴 Closed'}</span>
                        <span style={{ color: 'var(--ws-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Browse Menu <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Popular Restaurants Section */}
          {popularRestaurants.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Popular Restaurants 🔥
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Most ordered from kitchens with top review counts
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '20px'
              }}>
                {popularRestaurants.map(rest => (
                  <div
                    key={rest.id}
                    onClick={() => handleOpenRestaurant(rest)}
                    style={{
                      background: 'var(--ws-surface)',
                      borderRadius: '22px',
                      border: '1px solid var(--ws-border)',
                      boxShadow: 'var(--ws-shadow-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--ws-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--ws-border)'; }}
                  >
                    <div style={{ height: '170px', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--ws-surface-subtle)' }}>
                      <img src={rest.hero_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'} alt={rest.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(245, 158, 11, 0.95)', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                        POPULAR CHOICE
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 700 }}>
                        <span>⏱️ {rest.delivery_time_text || '20 min'}</span>
                        <span>{rest.price_for_two || '₹400 for two'}</span>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>{rest.name}</h3>
                        <span style={{ color: '#D97706', fontSize: '0.78rem', fontWeight: 700 }}>★ {rest.rating} ({rest.review_count}+)</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', margin: '4px 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {Array.isArray(rest.cuisines) ? rest.cuisines.join(' • ') : (rest.cuisine || 'Fast Gourmet')}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border)', paddingTop: '10px', fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
                        <span>{rest.is_open ? '🟢 Open Now' : '🔴 Closed'}</span>
                        <span style={{ color: 'var(--ws-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Inspect Kitchen <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Recommended Foods Section */}
          {recommendedFoods.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                    Recommended Foods ✨
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                    Curated culinary specialties prepared fresh
                  </div>
                </div>
              </div>

              <div className="fd-food-grid">
                {recommendedFoods.map(food => (
                  <FoodCardRetro
                    key={food.id}
                    food={food}
                    onSelectFood={onSelectFood}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 7. Recently Viewed Section (where architecture supports it) */}
          {(recentlyViewedRestaurants.length > 0 || recentlyViewedFoods.length > 0) && (
            <div style={{
              background: 'var(--ws-surface-subtle)',
              borderRadius: '24px',
              border: '1px solid var(--ws-border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="#52B788" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#163D2B', margin: 0 }}>
                  Recently Viewed by You
                </h3>
              </div>

              {/* Recently viewed restaurants */}
              {recentlyViewedRestaurants.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Recently Viewed Kitchens
                  </div>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                    {recentlyViewedRestaurants.map(r => (
                      <div
                        key={r.id}
                        onClick={() => handleOpenRestaurant(r)}
                        style={{
                          background: 'var(--ws-surface)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '14px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          minWidth: '220px',
                          flexShrink: 0
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                          <img src={r.hero_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=100&q=80'} alt={r.name || 'Restaurant'} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>
                            ★ {r.rating}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently viewed food items */}
              {recentlyViewedFoods.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Recently Inspected Dishes
                  </div>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                    {recentlyViewedFoods.map(f => (
                      <div
                        key={f.id}
                        onClick={() => onSelectFood(f)}
                        style={{
                          background: 'var(--ws-surface)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '14px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          minWidth: '220px',
                          flexShrink: 0
                        }}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                          <img src={f.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&q=80'} alt={f.name || 'Food item'} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ws-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-primary)', fontWeight: 800 }}>
                            ₹{Number(f.price || 0).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. Restaurant Discovery Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Restaurant Discovery 🏪
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                  Explore all verified cloud kitchens in your sector ({safeRestaurants.length} establishments)
                </div>
              </div>
            </div>

            {safeRestaurants.length === 0 ? (
              <div style={{ padding: '32px', background: 'var(--ws-surface)', borderRadius: '20px', border: '1px solid var(--ws-border)', textAlign: 'center', color: 'var(--ws-text-secondary)' }}>
                No restaurants found.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '20px'
              }}>
                {safeRestaurants.map(rest => (
                  <div
                    key={rest.id}
                    onClick={() => handleOpenRestaurant(rest)}
                    style={{
                      background: 'var(--ws-surface)',
                      borderRadius: '20px',
                      border: '1px solid var(--ws-border)',
                      boxShadow: 'var(--ws-shadow-sm)',
                      padding: '16px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--ws-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--ws-border)'; }}
                  >
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--ws-surface-subtle)',
                      flexShrink: 0
                    }}>
                      <img src={rest.hero_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80'} alt={rest.name || 'Restaurant'} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rest.name}
                        </h4>
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#D97706',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          ★ {rest.rating}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {Array.isArray(rest.cuisines) ? rest.cuisines.join(', ') : (rest.cuisine || 'Fast Gourmet')}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 600 }}>
                        <span>⏱️ {rest.delivery_time_text || '18-24 min'}</span>
                        <span>• {rest.price_for_two || '₹450 for two'}</span>
                        <span>• {rest.is_open ? '🟢 Open' : '🔴 Closed'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
