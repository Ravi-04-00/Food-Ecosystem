import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, Clock, Trash2, ArrowUpRight, Flame, Store,
  Utensils, Tag, SlidersHorizontal, Check, ChevronDown, RotateCcw,
  Sparkles, Filter, AlertCircle
} from 'lucide-react';
import {
  fetchSearchSuggestions,
  fetchUserSearchHistory,
  clearUserSearchHistory
} from '../services/api.js';

export const SmartSearchBar = ({
  searchQuery,
  onSearchChange,
  onPerformSearch,
  filters = {},
  onFilterChange,
  onResetFilters,
  onSelectFood,
  onSelectRestaurant,
  onSelectCuisine,
  availableCuisines = [],
  availableCategories = []
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const containerRef = useRef(null);

  // Load user recent search history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchUserSearchHistory();
        setRecentSearches(history || []);
      } catch {
        // Non-critical if unauthenticated
      }
    };
    loadHistory();
  }, []);

  // Debounced Search Suggestions
  useEffect(() => {
    const trimmed = (searchQuery || '').trim();
    if (trimmed.length < 1) {
      setSuggestions(null);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchSearchSuggestions(trimmed);
        setSuggestions(res);
      } catch {
        // Fail silently
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearHistory = async () => {
    await clearUserSearchHistory();
    setRecentSearches([]);
  };

  const handleSelectRecentQuery = (query) => {
    onSearchChange(query);
    setIsFocused(false);
    if (onPerformSearch) onPerformSearch(query);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsFocused(false);
    if (onPerformSearch) onPerformSearch(searchQuery);
  };

  // Count active filters
  const activeFilterCount = [
    filters.category && filters.category !== 'ALL',
    filters.cuisine && filters.cuisine !== 'ALL',
    filters.dietary && filters.dietary !== 'ALL',
    filters.min_price || filters.max_price,
    filters.min_rating && filters.min_rating !== 'ALL',
    filters.is_open,
    filters.sort && filters.sort !== 'relevance'
  ].filter(Boolean).length;

  const popularPicks = ['Biryani', 'Chicken 65', 'Burger', 'Dosa', 'பிரியாணி', 'Ramen', 'Chettinad'];

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', position: 'relative' }}>
      {/* 1. Main Search Bar Input */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--ws-surface)',
        border: '1.5px solid',
        borderColor: isFocused ? 'var(--ws-primary)' : 'var(--ws-border)',
        borderRadius: '18px',
        padding: '10px 16px',
        boxShadow: isFocused ? '0 0 0 3px rgba(34, 197, 94, 0.15)' : 'var(--ws-shadow-sm)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <Search size={20} color={isFocused ? '#22C55E' : 'var(--ws-text-muted)'} />

        <input
          type="text"
          placeholder="Search dishes or kitchens in English / தமிழ் (e.g. 'Biryani', 'Burger', 'பிரியாணி')..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--ws-text-primary)'
          }}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              setSuggestions(null);
            }}
            title="Clear search"
            style={{
              background: 'var(--ws-surface-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ws-text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeFilterCount > 0 ? 'rgba(34, 197, 94, 0.15)' : 'var(--ws-surface-subtle)',
            border: '1px solid',
            borderColor: activeFilterCount > 0 ? '#22C55E' : 'var(--ws-border)',
            borderRadius: '12px',
            padding: '8px 14px',
            color: activeFilterCount > 0 ? '#16A34A' : 'var(--ws-text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span style={{
              background: '#22C55E',
              color: '#FFFFFF',
              borderRadius: '999px',
              width: '18px',
              height: '18px',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 18px',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
          }}
        >
          Search
        </button>
      </form>

      {/* 2. Debounced Suggestions & Recent Searches Dropdown */}
      {isFocused && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '6px',
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: 'var(--ws-shadow-lg, 0 14px 34px rgba(0,0,0,0.18))',
          zIndex: 50,
          maxHeight: '440px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Active typed suggestions */}
          {searchQuery && suggestions && (
            <>
              {/* Foods Match */}
              {suggestions.foods && suggestions.foods.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Matching Dishes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestions.foods.map((food) => (
                      <div
                        key={food.id}
                        onClick={() => {
                          setIsFocused(false);
                          if (onSelectFood) onSelectFood(food);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'var(--ws-surface-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            border: `1.5px solid ${food.is_veg ? '#10B981' : '#EF4444'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: food.is_veg ? '#10B981' : '#EF4444' }} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                              {food.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', marginLeft: '8px' }}>
                              by {food.restaurant__name}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--ws-text-primary)', fontSize: '0.85rem' }}>
                          ₹{food.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchens Match */}
              {suggestions.restaurants && suggestions.restaurants.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Matching Kitchens
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestions.restaurants.map((rest) => (
                      <div
                        key={rest.id}
                        onClick={() => {
                          setIsFocused(false);
                          if (onSelectRestaurant) onSelectRestaurant(rest);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'var(--ws-surface-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Store size={16} color="#22C55E" />
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                            {rest.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B' }}>★ {rest.rating}</span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: rest.is_open ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: rest.is_open ? '#16A34A' : '#EF4444'
                          }}>
                            {rest.is_open ? 'OPEN' : 'CLOSED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuisines & Categories Matches */}
              {suggestions.cuisines && suggestions.cuisines.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Matching Cuisines
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {suggestions.cuisines.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          if (onSelectCuisine) onSelectCuisine(c);
                        }}
                        style={{
                          background: 'rgba(34, 197, 94, 0.12)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#16A34A',
                          cursor: 'pointer'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty Query: Show Recent Searches & Trending Keywords */}
          {!searchQuery && (
            <>
              {recentSearches.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recentSearches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectRecentQuery(item.query)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--ws-surface-subtle)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          color: 'var(--ws-text-primary)',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Clock size={12} color="var(--ws-text-muted)" />
                        <span>{item.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Discovery Pills */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Flame size={13} color="#F97316" />
                  <span>Trending Food Queries</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {popularPicks.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectRecentQuery(term)}
                      style={{
                        background: 'var(--ws-surface-subtle)',
                        border: '1px solid var(--ws-border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--ws-text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. Advanced Filter Controls Drawer */}
      {showFilterDrawer && (
        <div style={{
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--ws-shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
              Discovery Filters & Sorting
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={13} />
                <span>Reset All</span>
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Dietary Preference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>Dietary</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'VEG', label: '🌱 Pure Veg' },
                  { id: 'NON_VEG', label: '🍗 Non-Veg' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onFilterChange('dietary', item.id)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: filters.dietary === item.id ? '#22C55E' : 'var(--ws-border)',
                      background: filters.dietary === item.id ? 'rgba(34, 197, 94, 0.12)' : 'var(--ws-surface-subtle)',
                      color: filters.dietary === item.id ? '#16A34A' : 'var(--ws-text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>Price Segment</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'ALL', label: 'Any', min: null, max: null },
                  { id: 'UNDER_200', label: '< ₹200', min: null, max: 200 },
                  { id: '200_400', label: '₹200-400', min: 200, max: 400 },
                  { id: 'ABOVE_400', label: '₹400+', min: 400, max: null }
                ].map(item => {
                  const isSelected = filters.price_bracket === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onFilterChange('price_bracket', item.id);
                        onFilterChange('min_price', item.min);
                        onFilterChange('max_price', item.max);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 6px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? '#22C55E' : 'var(--ws-border)',
                        background: isSelected ? 'rgba(34, 197, 94, 0.12)' : 'var(--ws-surface-subtle)',
                        color: isSelected ? '#16A34A' : 'var(--ws-text-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min Rating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>Minimum Rating</label>
              <select
                value={filters.min_rating || 'ALL'}
                onChange={(e) => onFilterChange('min_rating', e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">All Ratings</option>
                <option value="4.8">★ 4.8 & above (Top Rated)</option>
                <option value="4.5">★ 4.5 & above</option>
                <option value="4.0">★ 4.0 & above</option>
              </select>
            </div>

            {/* Sort Strategy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>Sort By</label>
              <select
                value={filters.sort || 'relevance'}
                onChange={(e) => onFilterChange('sort', e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="relevance">Relevance & Affinity</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newly Added</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
