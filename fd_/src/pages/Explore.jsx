import React, { useState } from 'react';
import { Orb } from '../components/Orb.jsx';
import { Sparkles, Eye, ShoppingBag, ArrowRight, Layers, Box, Globe, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { INITIAL_PRODUCTS } from '../services/mockData.js';

export const Explore = ({ onViewProductDetails, onBuyNow }) => {
  const { addToCart } = useCart();
  const [activeStage, setActiveStage] = useState('orbit');
  const featuredHeadphones = INITIAL_PRODUCTS[0];

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-fadeIn text-[#F5F5F5]">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-pill border border-white/10 bg-[#151519]/80">
          <Sparkles className="w-3.5 h-3.5 text-[#D6A85F]" />
          <span className="text-[11px] font-sans font-semibold uppercase tracking-luxury text-[#F5F5F5]">
            FUTURE 3D SPATIAL COMMERCE
          </span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#F5F5F5]">
          The WSHOP <span className="italic font-serif text-[#D6A85F]">Experience</span>
        </h1>
        <p className="text-sm sm:text-base text-[#A7A7AE] font-sans">
          Four distinct physical dimensions: WS Orbit, Product Stage, Seller Studio, and Spatial Collection.
        </p>
      </div>

      {/* Stage Selector Pills */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap items-center bg-[#151519] p-1.5 rounded-full border border-white/10 gap-1">
          {[
            { id: 'orbit', label: 'WS ORBIT' },
            { id: 'stage', label: 'WS PRODUCT STAGE' },
            { id: 'studio', label: 'WS SELLER STUDIO' },
            { id: 'collection', label: 'WS COLLECTION' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveStage(st.id)}
              className={`px-5 py-2 text-xs font-sans tracking-luxury uppercase rounded-full transition-all font-bold ${
                activeStage === st.id
                  ? 'bg-[#D6A85F] text-[#050505] shadow-md'
                  : 'text-[#A7A7AE] hover:text-[#F5F5F5]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage 1: WS ORBIT */}
      {activeStage === 'orbit' && (
        <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#151519]">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] block">
              DIMENSION 01 · CORE ICONOGRAPHY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F5F5]">
              The Glass Sphere & Titanium Orbit
            </h2>
            <p className="text-sm text-[#A7A7AE] font-sans leading-relaxed">
              Representing transparent trust and mathematical precision. A floating 3D WS monogram encased inside Crown Glass refraction with twin elliptical titanium orbital rings.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#1C1C21] border border-white/10">
                <span className="text-[10px] text-[#A7A7AE] block">REFRACTION</span>
                <strong className="text-[#F5F5F5]">Crown Glass IOR 1.52</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#1C1C21] border border-white/10">
                <span className="text-[10px] text-[#A7A7AE] block">TITANIUM SPECULAR</span>
                <strong className="text-[#F5F5F5]">0.98 Mirror Reflectance</strong>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 h-[420px] flex items-center justify-center">
            <Orb className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Stage 2: WS PRODUCT STAGE */}
      {activeStage === 'stage' && (
        <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#151519]">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D6A85F] font-bold block">
              DIMENSION 02 · 360° PHYSICAL AUDIT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F5F5]">
              {featuredHeadphones.name}
            </h2>
            <p className="text-sm text-[#A7A7AE] font-sans leading-relaxed">
              Experience products as tactile physical objects. Inspect the Grade 5 titanium bevels, acoustic diaphragms, and premium materials in full studio lighting.
            </p>
            <div className="font-serif text-3xl font-bold text-[#F5F5F5]">
              ₹{featuredHeadphones.price.toLocaleString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => addToCart(featuredHeadphones, 1)}
                className="physical-btn px-6 py-3 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold shadow-lg hover:bg-[#F0C982]"
              >
                ADD TO CART
              </button>
              <button
                onClick={() => onViewProductDetails(featuredHeadphones)}
                className="px-6 py-3 rounded-full bg-[#1C1C21] border border-white/15 text-xs font-sans uppercase tracking-luxury font-semibold text-[#F5F5F5] hover:border-[#D6A85F]"
              >
                FULL SPECIFICATION
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative h-[420px] rounded-3xl overflow-hidden bg-[#0B0B0D] border border-white/10 flex items-center justify-center shadow-inner group">
            <img
              src={featuredHeadphones.image}
              alt="Headphones"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#151519]/90 backdrop-blur-md border border-white/10 flex justify-between items-center text-xs">
              <span className="font-mono text-[#F5F5F5]">360° Studio Raytracing</span>
              <span className="text-[#D6A85F] font-semibold">Active Simulation</span>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: WS SELLER STUDIO */}
      {activeStage === 'studio' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#151519] border border-white/10 text-white space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#D6A85F] block">
                DIMENSION 03 · MERCHANT WORKSHOPS
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#F5F5F5] mt-1">
                Verified Global Creator Studios
              </h3>
            </div>
            <ShieldCheck className="w-8 h-8 text-[#D6A85F]" />
          </div>
          <p className="text-sm text-[#A7A7AE] max-w-2xl font-sans leading-relaxed">
            Merchants on WSHOP run independent, high-throughput digital ateliers. From Zurich spatial sound laboratories to Cupertino silicon labs and Swiss horology houses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs font-sans">
            <div className="p-5 rounded-2xl bg-[#1C1C21] border border-white/10">
              <strong className="block text-[#F5F5F5] font-serif text-base">Atelier Soundworks Zurich</strong>
              <span className="text-[#A7A7AE] block mt-1">Planar Magnetic Acoustic Engineering</span>
              <span className="text-[#D6A85F] font-mono text-[10px] mt-2 block">100% On-Time Dispatch</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#1C1C21] border border-white/10">
              <strong className="block text-[#F5F5F5] font-serif text-base">Geneva Horology Lab</strong>
              <span className="text-[#A7A7AE] block mt-1">Chronometer Craftsmanship & Precision</span>
              <span className="text-[#D6A85F] font-mono text-[10px] mt-2 block">Top 1% Certified</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#1C1C21] border border-white/10">
              <strong className="block text-[#F5F5F5] font-serif text-base">Cupertino Studio Lab</strong>
              <span className="text-[#A7A7AE] block mt-1">Pro Computing Silicon & Displays</span>
              <span className="text-[#D6A85F] font-mono text-[10px] mt-2 block">Certified Master Merchant</span>
            </div>
          </div>
        </div>
      )}

      {/* Stage 4: WS COLLECTION */}
      {activeStage === 'collection' && (
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10 space-y-6 bg-[#151519]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] block">
              DIMENSION 04 · ARTIFACT GALLERY
            </span>
            <h3 className="font-serif text-3xl font-bold text-[#F5F5F5] mt-1">
              Curated Permanent Collection
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INITIAL_PRODUCTS.slice(0, 3).map((prod) => (
              <div key={prod.id} className="p-4 rounded-2xl bg-[#1C1C21] border border-white/10 shadow-lg">
                <img src={prod.image} alt={prod.name} className="w-full h-48 object-cover rounded-xl mb-3 bg-[#0B0B0D]" />
                <h4 className="font-serif font-bold text-sm text-[#F5F5F5]">{prod.name}</h4>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className="font-mono font-bold text-[#F5F5F5]">₹{prod.price.toLocaleString()}</span>
                  <button
                    onClick={() => onViewProductDetails(prod)}
                    className="text-[#D6A85F] font-bold uppercase hover:underline"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
