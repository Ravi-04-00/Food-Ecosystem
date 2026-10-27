import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  Sparkles, 
  Bike, 
  Store, 
  ShieldCheck, 
  User, 
  Flame, 
  SlidersHorizontal,
  ChevronDown,
  Clock,
  Heart
} from 'lucide-react';
import { WSLogo } from './WSLogo.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';

export const Navbar = ({ 
  activePage, 
  setActivePage, 
  searchQuery, 
  setSearchQuery 
}) => {
  const { count, grandTotal, wishlist } = useCart();
  const { 
    activeApp, 
    setActiveApp, 
    orders, 
    setLiveTrackerOpen, 
    setAiAssistantOpen,
    setActiveReelIndex
  } = useFoodEcosystem();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('100ft Road, Indiranagar, Bengaluru');

  const popularLocations = [
    '100ft Road, Indiranagar, Bengaluru',
    'Koramangala 4th Block, Bengaluru',
    'Lavelle Road, Near UB City',
    'HSR Layout Sector 2, Bengaluru',
    'Whitefield Main Road, Bengaluru',
  ];

  const hasLiveOrder = orders.some((o) => o.status !== 'delivered');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE8DE] shadow-xs">
      {/* 1. TOP ECOSYSTEM APP PORTAL SWITCHER BAR */}
      <div className="bg-[#171717] text-white px-4 py-2 border-b border-black/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#20B26B] animate-pulse" />
            <span className="font-extrabold tracking-wider text-[11px] uppercase text-[#FFF8EE]">
              FD FOODS CONNECTED ECOSYSTEM:
            </span>
          </div>

          {/* Interactive Portal Switcher Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveApp('customer');
                setActivePage('home');
              }}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
                activeApp === 'customer' 
                  ? 'bg-[#FF6B35] text-white shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🍕</span>
              <span>Customer App</span>
            </button>

            <button
              onClick={() => setActiveApp('restaurant')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
                activeApp === 'restaurant' 
                  ? 'bg-[#FF6B35] text-white shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🏪</span>
              <span>Restaurant Portal</span>
            </button>

            <button
              onClick={() => setActiveApp('delivery')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
                activeApp === 'delivery' 
                  ? 'bg-[#FF6B35] text-white shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🛵</span>
              <span>Rider App</span>
            </button>

            <button
              onClick={() => setActiveApp('admin')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 ${
                activeApp === 'admin' 
                  ? 'bg-[#20B26B] text-white shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>⚙️</span>
              <span>Admin Center</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo & Delivery Location Picker */}
        <div className="flex items-center space-x-6">
          <div onClick={() => { setActiveApp('customer'); setActivePage('home'); }}>
            <WSLogo size="md" showTagline={true} />
          </div>

          {/* Location Selector (Google Maps Pin) */}
          <div className="hidden lg:relative lg:block">
            <button
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center space-x-2 text-xs font-semibold text-[#171717] hover:text-[#FF6B35] bg-[#FFF8EE] px-3.5 py-2 rounded-2xl border border-[#EFE8DE] transition-all"
            >
              <MapPin className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-[#6F7378] uppercase">Deliver To</span>
                <span className="truncate max-w-[190px] font-bold text-[#171717]">{selectedLocation}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#6F7378]" />
            </button>

            {locationDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#EFE8DE] p-3 z-50 animate-fadeIn">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6F7378] px-2 py-1">
                  Popular Delivery Locations
                </p>
                {popularLocations.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setLocationDropdownOpen(false);
                    }}
                    className="w-full text-left text-xs p-2.5 rounded-xl hover:bg-[#FFF8EE] text-[#171717] font-medium flex items-center space-x-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span className="truncate">{loc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Food Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C8F94] absolute left-3.5" />
            <input 
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search dishes, biryani, pizza, restaurants, cuisines..."
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-2xl bg-[#FFF8EE] border border-[#EFE8DE] text-[#171717] placeholder-[#8C8F94] focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Right Action Icons & Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* AI Craving Assistant Button */}
          <button
            onClick={() => setAiAssistantOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#FFF2EB] to-[#FFF9EB] border border-[#FF6B35]/30 text-[#FF6B35] font-extrabold text-xs shadow-xs hover:shadow-md transition-all animate-float"
            title="Ask AI Craving Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#FFC857] text-[#FF6B35]" />
            <span className="hidden sm:inline">AI Craving</span>
          </button>

          {/* Food Reels Shortcut */}
          <button
            onClick={() => setActiveReelIndex(0)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-white border border-[#EFE8DE] text-[#171717] hover:text-[#FF3B30] font-bold text-xs shadow-xs hover:shadow-sm transition-all"
            title="Watch Food Reels"
          >
            <Flame className="w-3.5 h-3.5 text-[#FF3B30] fill-current" />
            <span className="hidden sm:inline">Reels</span>
          </button>

          {/* Live Order Tracker Trigger */}
          {hasLiveOrder && (
            <button
              onClick={() => setLiveTrackerOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-[#EBF8F1] border border-[#20B26B]/50 text-[#20B26B] font-extrabold text-xs shadow-xs hover:bg-[#20B26B] hover:text-white transition-all animate-pulse-green"
              title="Track Live Delivery"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Track Live</span>
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={() => {
              setActiveApp('customer');
              setActivePage('wishlist');
            }}
            className="w-10 h-10 rounded-2xl bg-[#FFF8EE] border border-[#EFE8DE] text-[#171717] hover:text-[#FF3B30] flex items-center justify-center transition-all relative"
            title="Wishlist"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3B30] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => {
              setActiveApp('customer');
              setActivePage('cart');
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-extrabold text-xs shadow-md shadow-[#FF6B35]/25 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <div className="flex items-center space-x-1.5">
              <span>₹{grandTotal}</span>
              {count > 0 && (
                <span className="bg-white text-[#FF6B35] px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {count}
                </span>
              )}
            </div>
          </button>

          {/* Profile / Login */}
          <button
            onClick={() => {
              setActiveApp('customer');
              setActivePage('profile');
            }}
            className="w-10 h-10 rounded-2xl bg-[#FFF8EE] border border-[#EFE8DE] text-[#171717] hover:text-[#FF6B35] flex items-center justify-center transition-all"
            title="Customer Profile"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
