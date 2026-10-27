import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight } from 'lucide-react';

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onSuggestionClick,
  onAIAssistClick,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const POPULAR_SUGGESTIONS = [
    'iPhone 16 Pro Max',
    'Sony Headphones',
    'MacBook M4',
    'Rolex Submariner',
    'PlayStation 5 Pro',
    'Canon EOS R5',
    'Dyson V15',
  ];

  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4 sm:px-6">
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl transition-all duration-300 bg-[#151519]/85">
        
        {/* Main Search Input Form */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-[#A7A7AE] absolute left-4 pointer-events-none" />
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search products, brands, categories or models..."
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-[#0B0B0D] border border-white/10 text-[#F5F5F5] placeholder-[#A7A7AE] font-sans text-sm sm:text-base focus:outline-none focus:border-[#D6A85F] focus:ring-1 focus:ring-[#D6A85F] shadow-inner transition-all"
          />

          <div className="absolute right-2 flex items-center space-x-1">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-[#A7A7AE] hover:text-[#F5F5F5] transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onAIAssistClick}
              className="px-3.5 py-2 rounded-xl bg-[#D6A85F] text-[#050505] hover:bg-[#F0C982] text-xs font-sans uppercase tracking-wider font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              title="Activate AI Product Discovery"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#050505]" />
              <span className="hidden sm:inline">AI SEARCH</span>
            </button>
          </div>
        </div>

        {/* Popular Atelier Suggestions Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-sans overflow-x-auto no-scrollbar gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#A7A7AE] shrink-0">
            SUGGESTED:
          </span>
          <div className="flex items-center space-x-2 shrink-0">
            {POPULAR_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSuggestionClick(tag)}
                className="px-3 py-1 rounded-full bg-[#1C1C21] hover:bg-[#25252D] text-[#A7A7AE] hover:text-[#F5F5F5] border border-white/10 hover:border-[#D6A85F] transition-all text-[11px]"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
