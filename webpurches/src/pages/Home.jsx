import React, { useState } from 'react';
import { 
  Search, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  ArrowRight, 
  Percent, 
  TrendingUp, 
  Play, 
  Heart,
  CheckCircle2,
  Bike
} from 'lucide-react';
import { FoodCard } from '../components/FoodCard.jsx';
import { RestaurantCard } from '../components/RestaurantCard.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const Home = ({ 
  setActivePage, 
  searchQuery, 
  setSearchQuery, 
  onSelectCategory,
  onViewProductDetails 
}) => {
  const { 
    categories, 
    restaurants, 
    dishes, 
    reels, 
    posts, 
    coupons, 
    setActiveReelIndex,
    setAiAssistantOpen,
    setLiveTrackerOpen
  } = useFoodEcosystem();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'veg' | 'non-veg' | 'top-rated'
  const [selectedCuisine, setSelectedCuisine] = useState(null);

  // Filter dishes
  const filteredDishes = dishes.filter((d) => {
    if (activeTab === 'veg' && !d.isVeg) return false;
    if (activeTab === 'non-veg' && d.isVeg) return false;
    if (activeTab === 'top-rated' && d.rating < 4.8) return false;
    if (selectedCuisine && d.category !== selectedCuisine) return false;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.restaurantName.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* 1. HERO BANNER WITH PROMO HIGHLIGHTS */}
      <section className="relative px-4 sm:px-6 pt-4 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FF6B35] via-[#FF5B22] to-[#E6460C] text-white p-6 sm:p-10 shadow-xl shadow-[#FF6B35]/20">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl transform translate-x-32 -translate-y-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#FFC857]/20 rounded-full filter blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-black uppercase tracking-wider text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
                <span>Future Food Delivery Ecosystem</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                Delicious food delivered to your door in <span className="underline decoration-[#FFC857] decoration-4">20 mins</span>.
              </h1>

              <p className="text-sm sm:text-base text-white/90 max-w-xl font-medium leading-relaxed">
                Discover authentic Awadhi dum handis, blistered woodfired pizzas, and healthy organic bowls from top artisan chefs in your city.
              </p>

              {/* Quick AI Search Bar in Hero */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-lg">
                <button
                  onClick={() => setAiAssistantOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-white text-[#FF6B35] hover:bg-[#FFF8EE] font-black text-xs sm:text-sm shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-[#FFC857] text-[#FF6B35]" />
                  <span>AI Craving Concierge</span>
                </button>

                <button
                  onClick={() => setActiveReelIndex(0)}
                  className="px-6 py-3.5 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-black text-xs sm:text-sm border border-white/30 backdrop-blur-md flex items-center justify-center space-x-2 transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current text-[#FFC857]" />
                  <span>Watch Food Reels</span>
                </button>
              </div>

              {/* Guarantees Badges */}
              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#FFC857]" /> 100% Hygienic Packaging
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#FFC857]" /> Live GPS Google Maps
                </span>
                <span className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#FFC857]" /> Code: WELCOME50
                </span>
              </div>
            </div>

            {/* Right Promo Food Floating Visual */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative w-80 h-80 mx-auto">
                <img 
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80" 
                  alt="Royal Biryani"
                  className="w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white/30 animate-float"
                />
                {/* Floating Discount Badge */}
                <div className="absolute -bottom-4 -left-4 bg-white text-[#171717] px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2.5 border border-[#EFE8DE]">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center font-black">
                    🛵
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#6F7378] uppercase">Fastest In Town</p>
                    <p className="text-xs font-black text-[#171717]">Average Delivery: 22m</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
              Explore by Craving
            </h2>
            <p className="text-xs text-[#6F7378]">Hand-crafted culinary categories</p>
          </div>

          {selectedCuisine && (
            <button
              onClick={() => setSelectedCuisine(null)}
              className="text-xs font-bold text-[#FF6B35] hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto pb-3 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCuisine === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCuisine(isSelected ? null : cat.id)}
                className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-lg shadow-[#FF6B35]/25 scale-105' 
                    : 'bg-white hover:bg-[#FFF8EE] text-[#171717] border-[#EFE8DE] shadow-xs hover:border-[#FF6B35]/30'
                }`}
                style={{ width: '105px' }}
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 bg-[#F4F1EA]">
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-extrabold truncate w-full text-center">
                  {cat.label}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#8C8F94]'}`}>
                  {cat.count}+ dishes
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. ACTIVE COUPON CODES CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {coupons.map((coupon) => (
            <div 
              key={coupon.code}
              className="bg-white rounded-2xl p-4 border border-[#EFE8DE] shadow-xs flex items-center justify-between hover:border-[#FF6B35]/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF9EB] text-[#FFC857] flex items-center justify-center font-black">
                  🏷️
                </div>
                <div>
                  <span className="font-mono text-xs font-black text-[#171717] tracking-wider bg-[#FFF2EB] text-[#FF6B35] px-2 py-0.5 rounded-md border border-[#FF6B35]/20">
                    {coupon.code}
                  </span>
                  <p className="text-[11px] text-[#6F7378] font-medium mt-1 truncate max-w-[150px]">
                    {coupon.description}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-[#20B26B] bg-[#EBF8F1] px-2 py-1 rounded-md">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FOOD DISCOVERY REELS SECTION (SOCIAL GRAPH) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EFEB] text-[#FF3B30] flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
                FD Foods Reels · Watch & Order
              </h2>
              <p className="text-xs text-[#6F7378]">Short video clips from top restaurant kitchens</p>
            </div>
          </div>

          <button
            onClick={() => setActiveReelIndex(0)}
            className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-1"
          >
            <span>Watch All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              onClick={() => setActiveReelIndex(index)}
              className="relative aspect-[9/16] rounded-3xl overflow-hidden group cursor-pointer shadow-md bg-black"
            >
              <img 
                src={reel.thumbnail} 
                alt={reel.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

              {/* Play Icon Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Top Likes Pill */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Heart className="w-3 h-3 text-[#FF3B30] fill-current" />
                <span>{reel.likes}</span>
              </div>

              {/* Bottom Info & Order CTA */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[10px] font-bold text-[#FFC857] truncate">
                  {reel.restaurantName}
                </p>
                <h4 className="text-xs font-extrabold leading-tight line-clamp-2 mt-0.5 mb-1.5">
                  {reel.title}
                </h4>
                <div className="bg-[#FF6B35] text-white text-[10px] font-black py-1 px-2.5 rounded-xl text-center shadow-md">
                  ORDER DISH (₹{reel.price})
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TOP ARTISAN RESTAURANTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
              Recommended Restaurants
            </h2>
            <p className="text-xs text-[#6F7378]">Top-rated dining partners near your GPS location</p>
          </div>

          <button
            onClick={() => setActivePage('shop')}
            className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-1"
          >
            <span>View All ({restaurants.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((rest) => (
            <RestaurantCard 
              key={rest.id}
              restaurant={rest}
              onClick={() => {
                // filter by this restaurant in shop
                setSearchQuery(rest.name);
                setActivePage('shop');
              }}
            />
          ))}
        </div>
      </section>

      {/* 6. POPULAR DISHES DISCOVERY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
              Trending Food Dishes
            </h2>
            <p className="text-xs text-[#6F7378]">Crafted with love, prepared fresh upon order</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-[#EFE8DE] shadow-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-[#FF6B35] text-white' : 'text-[#6F7378] hover:text-[#171717]'
              }`}
            >
              All Dishes
            </button>
            <button
              onClick={() => setActiveTab('veg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'veg' ? 'bg-[#20B26B] text-white' : 'text-[#6F7378] hover:text-[#171717]'
              }`}
            >
              🥦 Pure Veg
            </button>
            <button
              onClick={() => setActiveTab('non-veg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'non-veg' ? 'bg-[#FF3B30] text-white' : 'text-[#6F7378] hover:text-[#171717]'
              }`}
            >
              🍗 Non-Veg
            </button>
            <button
              onClick={() => setActiveTab('top-rated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'top-rated' ? 'bg-[#FFC857] text-[#171717]' : 'text-[#6F7378] hover:text-[#171717]'
              }`}
            >
              ⭐ 4.8+ Rated
            </button>
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDishes.map((dish) => (
            <FoodCard 
              key={dish.id}
              dish={dish}
              onViewDetails={onViewProductDetails}
            />
          ))}
        </div>
      </section>

      {/* 7. SOCIAL FOOD GRAPH / CHEF POSTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DE] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
                Chef's Journal · Social Food Graph
              </h2>
              <p className="text-xs text-[#6F7378]">Daily updates from our master kitchens</p>
            </div>
            <span className="text-xs font-bold text-[#FF6B35]">Fresh From Kitchens</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-[#FFF8EE] rounded-2xl p-5 border border-[#F2ECE1] space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={post.avatar} 
                    alt={post.author}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#FF6B35]"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs text-[#171717]">{post.author}</h4>
                    <p className="text-[10px] text-[#6F7378]">{post.restaurantName} • {post.timeAgo}</p>
                  </div>
                </div>

                <p className="text-xs text-[#3A3D42] leading-relaxed">
                  {post.caption}
                </p>

                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-[#E5DACD]">
                  <img 
                    src={post.image} 
                    alt={post.dishName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-[#171717] truncate">{post.dishName}</p>
                      <p className="text-xs font-bold text-[#FF6B35]">₹{post.price}</p>
                    </div>
                    <button
                      onClick={() => {
                        const d = dishes.find((item) => item.id === post.dishId) || dishes[0];
                        onViewProductDetails(d);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FF6B35] text-white text-[11px] font-black"
                    >
                      ORDER
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
