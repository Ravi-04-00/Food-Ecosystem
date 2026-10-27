import React, { useState } from 'react';
import { productsService } from '../services/products.js';
import { INITIAL_SELLER_STATS } from '../services/mockData.js';
import { 
  Plus, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star, 
  Trash2, 
  Edit3, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  X,
  Sparkles,
  ShieldCheck,
  Eye
} from 'lucide-react';

const ADD_PRODUCT_STEPS = [
  '01 BASIC INFORMATION',
  '02 IMAGES',
  '03 PRICE',
  '04 INVENTORY',
  '05 DELIVERY',
  '06 REVIEW',
  '07 PUBLISH',
];

export const SellerDashboard = ({ products, onProductAdded }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product Form State
  const [form, setForm] = useState({
    name: 'Atelier Titanium Mechanical Keyboard',
    description: 'Aircraft-grade anodized titanium chassis with hot-swappable lubricated magnetic switches and PBT keycaps.',
    category: 'electronics',
    price: '21999',
    originalPrice: '26999',
    stock: '15',
    sku: 'WS-KB-TITAN-01',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    deliveryInfo: 'Insured express shipping from Geneva studio within 48h.',
  });

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const created = await productsService.createProduct({
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price) || 19999,
        originalPrice: Number(form.originalPrice) || 24999,
        stock: Number(form.stock) || 10,
        sku: form.sku,
        image: form.image,
        seller: 'Your Atelier Store',
      });
      onProductAdded(created);
      setIsAddProductOpen(false);
      setCurrentStep(1);
    } catch (err) {
      alert('Error publishing product: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-[#F5F5F5]">
      
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-[#A7A7AE] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6A85F]" />
            <span>MERCHANT & CREATOR ATELIER</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F5F5]">
            Seller <span className="italic font-serif text-[#D6A85F]">Dashboard</span>
          </h1>
        </div>

        <button
          onClick={() => setIsAddProductOpen(true)}
          className="physical-btn px-6 py-3 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold flex items-center space-x-2 shadow-xl hover:bg-[#F0C982]"
        >
          <Plus className="w-4 h-4 text-[#050505]" />
          <span>ADD NEW PRODUCT</span>
        </button>
      </div>

      {/* Seller Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-[#151519] border border-white/10 shadow-lg">
          <div className="flex justify-between text-xs font-mono text-[#A7A7AE]">
            <span>TOTAL SALES</span>
            <DollarSign className="w-4 h-4 text-[#D6A85F]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F5F5F5] mt-3">
            ₹{INITIAL_SELLER_STATS.totalSales.toLocaleString()}
          </div>
          <span className="text-[10px] text-[#D6A85F] font-mono mt-1 block">
            +18% THIS CYCLE
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[#151519] border border-white/10 shadow-lg">
          <div className="flex justify-between text-xs font-mono text-[#A7A7AE]">
            <span>ACTIVE PRODUCTS</span>
            <Package className="w-4 h-4 text-[#D6A85F]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F5F5F5] mt-3">
            {products.length}
          </div>
          <span className="text-[10px] text-[#A7A7AE] font-mono mt-1 block">
            100% INVENTORY SYNCHRONIZED
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[#151519] border border-white/10 shadow-lg">
          <div className="flex justify-between text-xs font-mono text-[#A7A7AE]">
            <span>ORDERS COMPLETED</span>
            <TrendingUp className="w-4 h-4 text-[#D6A85F]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F5F5F5] mt-3">
            {INITIAL_SELLER_STATS.ordersCount}
          </div>
          <span className="text-[10px] text-[#A7A7AE] font-mono mt-1 block">
            {INITIAL_SELLER_STATS.pendingOrders} PROCESSING
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-[#151519] border border-white/10 shadow-lg">
          <div className="flex justify-between text-xs font-mono text-[#A7A7AE]">
            <span>SELLER RATING</span>
            <Star className="w-4 h-4 text-[#D6A85F]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F5F5F5] mt-3">
            {INITIAL_SELLER_STATS.rating} / 5.0
          </div>
          <span className="text-[10px] text-[#D6A85F] font-mono mt-1 block font-semibold">
            TOP 1% VERIFIED ARTISAN
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#151519] border border-white/10 shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-serif text-2xl font-bold text-[#F5F5F5]">
            Catalogue Management ({products.length})
          </h3>
          <span className="text-xs text-[#A7A7AE] font-mono">POSTGRESQL REALTIME SYNC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-white/10 text-[#A7A7AE] font-mono uppercase text-[10px]">
                <th className="pb-3">PRODUCT</th>
                <th className="pb-3">CATEGORY</th>
                <th className="pb-3">PRICE</th>
                <th className="pb-3">STOCK</th>
                <th className="pb-3">RATING</th>
                <th className="pb-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-[#1C1C21] transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-[#0B0B0D]" />
                      <div>
                        <span className="font-serif font-bold text-sm text-[#F5F5F5] block line-clamp-1">{p.name}</span>
                        <span className="text-[10px] text-[#A7A7AE] font-mono">{p.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 uppercase text-[10px] font-mono text-[#A7A7AE]">{p.category}</td>
                  <td className="py-4 font-serif font-bold text-sm text-[#F5F5F5]">₹{p.price.toLocaleString()}</td>
                  <td className="py-4 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-[#1C1C21] text-[#F5F5F5] border border-white/10">
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-[#D6A85F] font-bold">★ {p.rating}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => alert(`Editing listing: ${p.name}`)}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-[#D6A85F] text-[#A7A7AE] hover:text-[#F5F5F5]"
                        title="Edit Product"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => alert(`Product ${p.id} archived from PostgreSQL database.`)}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-red-500 text-[#A7A7AE] hover:text-red-400"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT 7-STEP MODAL WIZARD */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div 
            className="relative w-full max-w-3xl bg-[#151519] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0B0B0D]">
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-[#D6A85F]" />
                <span className="text-xs uppercase font-sans tracking-luxury text-[#F5F5F5] font-bold">
                  NEW WSHOP PRODUCT COMMISSION
                </span>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#1C1C21] text-[#A7A7AE] hover:text-[#F5F5F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 7-Step Progress Indicator */}
            <div className="px-6 sm:px-8 py-4 border-b border-white/10 bg-[#151519]">
              <div className="flex items-center justify-between relative">
                {ADD_PRODUCT_STEPS.map((sTitle, idx) => {
                  const stepNum = idx + 1;
                  const isActive = currentStep === stepNum;
                  const isDone = currentStep > stepNum;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all border ${
                          isActive
                            ? 'bg-[#D6A85F] text-[#050505] border-[#D6A85F]'
                            : isDone
                            ? 'bg-[#1C1C21] text-[#D6A85F] border-[#D6A85F]/50'
                            : 'bg-[#0B0B0D] text-[#A7A7AE] border-white/10'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 text-[#D6A85F]" /> : stepNum}
                      </div>
                      <span className={`text-[8px] uppercase tracking-wider font-mono mt-1 hidden sm:inline ${isActive ? 'text-[#F5F5F5]' : 'text-[#A7A7AE]'}`}>
                        {sTitle.split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 text-xs font-sans min-h-[300px]">
              
              {/* STEP 01: BASIC INFORMATION */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      PRODUCT TITLE
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      CATEGORY
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none uppercase"
                    >
                      <option value="smartphones">Smartphones</option>
                      <option value="electronics">Audio & Electronics</option>
                      <option value="computers">Computers & Tech</option>
                      <option value="horology">Fine Horology</option>
                      <option value="gaming">Gaming</option>
                      <option value="cameras">Photography</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      EDITORIAL DESCRIPTION
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full p-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* STEP 02: IMAGES */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block">
                    PRIMARY MEDIA URL (STUDIO PHOTOGRAPHY)
                  </label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none"
                  />
                  {form.image && (
                    <div className="mt-2 h-44 rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B0D]">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 03: PRICE */}
              {currentStep === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      COMMISSION PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] font-mono text-base text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      ORIGINAL RETAIL PRICE (₹)
                    </label>
                    <input
                      type="number"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] font-mono text-base text-[#A7A7AE] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 04: INVENTORY */}
              {currentStep === 4 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      INITIAL STOCK COUNT
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] font-mono text-base text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block mb-1">
                      STOCK KEEPING UNIT (SKU)
                    </label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] font-mono text-xs text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 05: DELIVERY */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-wider text-[#A7A7AE] font-semibold block">
                    DELIVERY INFORMATION & TIME ESTIMATE
                  </label>
                  <textarea
                    value={form.deliveryInfo}
                    onChange={(e) => setForm({ ...form, deliveryInfo: e.target.value })}
                    rows={4}
                    className="w-full p-4 rounded-xl border border-white/15 bg-[#1C1C21] text-[#F5F5F5] focus:border-[#D6A85F] focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* STEP 06: REVIEW */}
              {currentStep === 6 && (
                <div className="p-4 rounded-2xl bg-[#0B0B0D] border border-white/10 space-y-2">
                  <span className="font-serif font-bold text-base text-[#F5F5F5] block">{form.name}</span>
                  <p className="text-[#A7A7AE] italic line-clamp-2">“{form.description}”</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 font-mono text-[11px]">
                    <div>PRICE: <strong className="text-[#F5F5F5]">₹{Number(form.price).toLocaleString()}</strong></div>
                    <div>STOCK: <strong className="text-[#F5F5F5]">{form.stock} units</strong></div>
                    <div>CATEGORY: <strong className="text-[#F5F5F5]">{form.category}</strong></div>
                    <div>SKU: <strong className="text-[#F5F5F5]">{form.sku}</strong></div>
                  </div>
                </div>
              )}

              {/* STEP 07: PUBLISH */}
              {currentStep === 7 && (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1C1C21] border border-[#D6A85F]/40 text-[#D6A85F] flex items-center justify-center mx-auto shadow-md">
                    <Sparkles className="w-6 h-6 text-[#D6A85F]" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-[#F5F5F5]">
                    Ready to Broadcast to WSHOP Network
                  </h4>
                  <p className="text-xs text-[#A7A7AE] max-w-sm mx-auto">
                    Listing will be validated by Django REST Framework serializers and indexed in PostgreSQL database.
                  </p>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="px-6 sm:px-8 py-5 border-t border-white/10 bg-[#0B0B0D] flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="text-xs uppercase font-sans tracking-luxury font-semibold text-[#A7A7AE] hover:text-[#F5F5F5] disabled:opacity-30"
              >
                Back
              </button>

              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="physical-btn px-6 py-2.5 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold hover:bg-[#F0C982]"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="physical-btn px-8 py-2.5 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold shadow-lg hover:bg-[#F0C982]"
                >
                  {isSubmitting ? 'INDEXING...' : 'PUBLISH LISTING'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
