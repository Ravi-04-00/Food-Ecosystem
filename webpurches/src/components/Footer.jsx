import React from 'react';
import { FDOrganicLogo } from './FDOrganicLogo.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { ShieldCheck, Heart, Sparkles, MapPin } from 'lucide-react';

export const Footer = ({ setActivePage }) => {
  const { setActiveApp } = useFoodEcosystem();

  return (
    <footer className="bg-[#171717] text-white border-t border-black/40 pt-16 pb-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Banner Row */}
        <div className="pb-12 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="bg-white/10 p-2.5 rounded-2xl inline-block">
              <FDOrganicLogo size="lg" theme="dark" showWordmark={true} showTagline={true} tagline="Fresh Choices. Royal Experiences." />
            </div>
            <h3 className="text-2xl sm:text-4xl text-white font-black tracking-tight mt-3">
              Delicious Food · Fast Delivery · Trusted by Millions
            </h3>
            <p className="text-xs text-white/70 max-w-lg">
              A unified food delivery technology platform uniting customers, artisan kitchens, delivery riders, and administrators through one real-time digital architecture.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#52B788] block">
              FD FOODS · ROYAL ECOSYSTEM
            </span>
            <span className="text-xs font-bold text-white/90">
              FRESH CHOICES · ROYAL EXPERIENCES
            </span>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-12 border-b border-white/10 text-xs">
          {/* Column 1: Customer App */}
          <div>
            <h5 className="uppercase font-black text-[#52B788] mb-4 tracking-wider">
              CUSTOMER APP
            </h5>
            <ul className="space-y-2 text-white/70">
              <li><button onClick={() => { setActiveApp('customer'); setActivePage('home'); }} className="hover:text-white transition-colors">Discover Food</button></li>
              <li><button onClick={() => { setActiveApp('customer'); setActivePage('shop'); }} className="hover:text-white transition-colors">Popular Restaurants</button></li>
              <li><button onClick={() => { setActiveApp('customer'); setActivePage('cart'); }} className="hover:text-white transition-colors">Food Cart</button></li>
              <li><button onClick={() => { setActiveApp('customer'); setActivePage('orders'); }} className="hover:text-white transition-colors">Live Order Tracker</button></li>
            </ul>
          </div>

          {/* Column 2: Restaurant Portal */}
          <div>
            <h5 className="uppercase font-black text-[#52B788] mb-4 tracking-wider">
              RESTAURANT PORTAL
            </h5>
            <ul className="space-y-2 text-white/70">
              <li><button onClick={() => setActiveApp('restaurant')} className="hover:text-white transition-colors">Kitchen Order Queue</button></li>
              <li><button onClick={() => setActiveApp('restaurant')} className="hover:text-white transition-colors">Manage Menu & Stock</button></li>
              <li><button onClick={() => setActiveApp('restaurant')} className="hover:text-white transition-colors">Sales & Payouts</button></li>
              <li><button onClick={() => setActiveApp('restaurant')} className="hover:text-white transition-colors">Publish Food Reels</button></li>
            </ul>
          </div>

          {/* Column 3: Rider Portal */}
          <div>
            <h5 className="uppercase font-black text-[#52B788] mb-4 tracking-wider">
              DELIVERY PARTNER
            </h5>
            <ul className="space-y-2 text-white/70">
              <li><button onClick={() => setActiveApp('delivery')} className="hover:text-white transition-colors">Rider Shift Dashboard</button></li>
              <li><button onClick={() => setActiveApp('delivery')} className="hover:text-white transition-colors">Google Maps Navigation</button></li>
              <li><button onClick={() => setActiveApp('delivery')} className="hover:text-white transition-colors">Trip Payouts & Tips</button></li>
              <li><button onClick={() => setActiveApp('delivery')} className="hover:text-white transition-colors">OTP Handover Proof</button></li>
            </ul>
          </div>

          {/* Column 4: Admin Center & Security */}
          <div>
            <h5 className="uppercase font-black text-[#52B788] mb-4 tracking-wider">
              ADMIN CONTROL
            </h5>
            <ul className="space-y-2 text-white/70">
              <li><button onClick={() => setActiveApp('admin')} className="hover:text-white transition-colors">City Live Google Map</button></li>
              <li><button onClick={() => setActiveApp('admin')} className="hover:text-white transition-colors">Fleet Dispatch Engine</button></li>
              <li><button onClick={() => setActiveApp('admin')} className="hover:text-white transition-colors">Partner Approvals</button></li>
              <li><button onClick={() => setActiveApp('admin')} className="hover:text-white transition-colors">Disputes & Audit Logs</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-black text-white">© 2026 FD FOODS ECOSYSTEM</span>
            <span>•</span>
            <span className="text-[#52B788] font-bold">FRESH CHOICES · ROYAL EXPERIENCES</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-white/70">
            <span>REACT 19 JSX</span>
            <span>·</span>
            <span>DJANGO CHANNELS</span>
            <span>·</span>
            <span>GOOGLE MAPS</span>
            <span>·</span>
            <span>POSTGRESQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
