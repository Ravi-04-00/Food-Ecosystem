import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Flame, 
  Star, 
  Clock, 
  MapPin, 
  X, 
  Filter,
  Sparkles
} from 'lucide-react';
import { FoodCard } from '../components/FoodCard.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';

export const Shop = ({ 
  searchQuery, 
  setSearchQuery, 
  onViewProductDetails 
}) => {
  const { categories, restaurants, dishes, setAiAssistantOpen } = useFoodEcosystem();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [maxSpice, setMaxSpice] = useState(3);
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'rating' | 'prepTime' | 'priceLow' | 'priceHigh'
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');

  // Filtered dishes
  let filtered = dishes.filter((d) => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (selectedRestaurant !== 'all' && d.restaurantId !== selectedRestaurant) return false;
    if (vegOnly && !d.isVeg) return false;
    if (d.spiceLevel > maxSpice) return false;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchRest = d.restaurantName.toLowerCase().includes(q);
      const matchCat = d.category.toLowerCase().includes(q);
      const matchIng = d.ingredients && d.ingredients.some(i => i.toLowerCase().includes(q));
      if (!matchName && !matchRest && !matchCat && !matchIng) return false;
    }
    return true;
  });

  // Sorting
  if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'prepTime') {
    filtered.sort((a, b) => a.prepTime - b.prepTime);
  } else if (sortBy === 'priceLow') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'priceHigh') {
    filtered.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Search & AI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717]">
            Discover Food & Dishes
          </h1>
          <p className="text-xs text-[#6F7378]">
            Browse fresh cuisines from top artisan kitchens ({filtered.length} dishes found)
          </p>
        </div>

        {/* AI assistant trigger */}
        <button
          onClick={() => setAiAssistantOpen(true)}
          className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-[#FFF2EB] border border-[#FF6B35]/40 text-[#FF6B35] font-extrabold text-xs flex items-center space-x-2 shadow-xs hover:shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4 fill-[#FFC857]" />
          <span>Ask AI: "Craving spicy food under ₹300"</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="all">All Food Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Restaurant Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1.5">
              Restaurant
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="all">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated (4.8+)</option>
              <option value="prepTime">Fastest Prep Time</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>
          </div>

          {/* Dietary & Spice Toggles */}
          <div className="flex items-end space-x-3">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center space-x-1.5 ${
                vegOnly 
                  ? 'bg-[#EBF8F1] text-[#20B26B] border-[#20B26B]' 
                  : 'bg-[#FFF8EE] text-[#6F7378] border-[#EFE8DE] hover:border-[#20B26B]'
              }`}
            >
              <span>🥦</span>
              <span>Pure Veg</span>
            </button>

            <button
              onClick={() => setMaxSpice((s) => (s === 3 ? 1 : s === 1 ? 2 : 3))}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold bg-[#FFF8EE] text-[#FF3B30] border border-[#EFE8DE] hover:border-[#FF3B30] flex items-center justify-center space-x-1"
              title="Toggle max spice level"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{'🌶️'.repeat(maxSpice)}</span>
            </button>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedCategory !== 'all' || vegOnly || selectedRestaurant !== 'all' || (searchQuery && searchQuery.trim())) && (
          <div className="pt-2 border-t border-[#F2ECE1] flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#6F7378]">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="bg-[#FFF2EB] text-[#FF6B35] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                Category: {selectedCategory}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
              </span>
            )}
            {vegOnly && (
              <span className="bg-[#EBF8F1] text-[#20B26B] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                Pure Veg
                <X className="w-3 h-3 cursor-pointer" onClick={() => setVegOnly(false)} />
              </span>
            )}
            {searchQuery && (
              <span className="bg-[#FFF8EE] text-[#171717] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-[#EFE8DE]">
                Search: "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dishes Results Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((dish) => (
            <FoodCard 
              key={dish.id} 
              dish={dish} 
              onViewDetails={onViewProductDetails} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EFE8DE] p-8 space-y-3">
          <div className="text-4xl">🍽️</div>
          <h3 className="text-lg font-black text-[#171717]">No dishes match your filter</h3>
          <p className="text-xs text-[#6F7378] max-w-sm mx-auto">
            Try resetting your dietary preference or searching for biryani, pizza, or bowls.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedRestaurant('all');
              setVegOnly(false);
              setMaxSpice(3);
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-xl bg-[#FF6B35] text-white font-bold text-xs"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
