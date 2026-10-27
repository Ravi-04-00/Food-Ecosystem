import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Check, AlertCircle, Bot } from 'lucide-react';
import { INITIAL_PRODUCTS } from '../services/mockData.js';

export const AIDiscoveryModal = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [prompt, setPrompt] = useState('I need a flagship pro smartphone or studio noise cancelling headphones with long battery life.');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setAnalyzing(true);
    setResults(null);

    setTimeout(() => {
      setAnalyzing(false);
      setResults({
        intent: 'Flagship Mobility & Audiophile Fidelity',
        budgetMatched: 'Matched Against Certified Catalog',
        recommendations: [
          {
            product: INITIAL_PRODUCTS[0],
            reason: 'Features Grade 5 titanium, A18 Pro chip, 48MP Fusion triple camera, and 4K 120fps Dolby Vision.',
            confidence: '99% Neural Fit',
          },
          {
            product: INITIAL_PRODUCTS[1],
            reason: 'Industry-leading noise cancellation with 8 mics, carbon fiber drivers, and 30-hour battery life.',
            confidence: '96% Neural Fit',
          },
        ],
      });
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn text-[#F5F5F5]">
      <div 
        className="relative w-full max-w-2xl bg-[#151519] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0B0B0D]">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-[#D6A85F]" />
            <span className="text-xs uppercase font-sans tracking-luxury text-[#F5F5F5] font-bold">
              WSHOP AI PRODUCT DISCOVERY
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#1C1C21] text-[#A7A7AE] hover:text-[#F5F5F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-3">
            <label className="text-[10px] uppercase font-mono tracking-widest text-[#A7A7AE] font-semibold block">
              DESCRIBE YOUR DESIRED ACQUISITION OR TECHNICAL SPECIFICATION:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I need a premium laptop for 3D rendering under ₹3.5 lakh..."
                className="flex-1 h-12 px-4 rounded-xl border border-white/15 bg-[#1C1C21] text-xs font-sans text-[#F5F5F5] focus:outline-none focus:border-[#D6A85F]"
              />
              <button
                type="submit"
                disabled={analyzing}
                className="physical-btn px-6 rounded-xl bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase tracking-luxury font-bold flex items-center space-x-1.5 hover:bg-[#F0C982]"
              >
                <span>{analyzing ? 'REASONING...' : 'DISCOVER'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#050505]" />
              </button>
            </div>
          </form>

          {/* AI Results */}
          {results && (
            <div className="space-y-4 pt-4 border-t border-white/10 animate-fadeIn">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#A7A7AE]">DETECTED INTENT: <strong className="text-[#F5F5F5]">{results.intent}</strong></span>
                <span className="text-[#D6A85F] font-bold">{results.budgetMatched}</span>
              </div>

              <div className="space-y-3">
                {results.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#1C1C21] border border-white/10 hover:border-[#D6A85F]/50 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <img src={rec.product.image} alt={rec.product.name} className="w-14 h-14 rounded-xl object-cover bg-[#0B0B0D] border border-white/10 shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-serif font-bold text-sm text-[#F5F5F5]">{rec.product.name}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D6A85F] text-[#050505] font-bold">
                            {rec.confidence}
                          </span>
                        </div>
                        <p className="text-xs text-[#A7A7AE] mt-1 font-sans">{rec.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="font-serif font-bold text-base text-[#F5F5F5]">
                        ₹{rec.product.price.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(rec.product);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-full bg-[#D6A85F] text-[#050505] text-xs font-sans uppercase font-bold hover:bg-[#F0C982]"
                      >
                        VIEW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 text-[10px] text-[#A7A7AE] font-mono justify-center">
            <Bot className="w-3.5 h-3.5 text-[#D6A85F]" />
            <span>Deep Learning Cognitive Embedding Search Engine Active</span>
          </div>

        </div>
      </div>
    </div>
  );
};
