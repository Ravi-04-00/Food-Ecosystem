import React from 'react';

export const CategoryCard = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 my-6">
      {/* Horizontal categories container with smooth touch scrolling and no scrollbar */}
      <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-2">
        {/* 'ALL' pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-luxury font-semibold transition-all shrink-0 border ${
            selectedCategory === 'all'
              ? 'bg-[#D6A85F] text-[#050505] border-[#D6A85F] font-bold shadow-md'
              : 'bg-[#151519] hover:bg-[#1C1C21] text-[#A7A7AE] hover:text-[#F5F5F5] border-white/10 hover:border-[#D6A85F]/50'
          }`}
        >
          <span>ALL RELEASES</span>
        </button>

        {/* Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.id)}
              className={`relative px-5 py-2.5 rounded-full text-xs uppercase tracking-luxury font-semibold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-[#D6A85F] text-[#050505] border-[#D6A85F] font-bold shadow-md'
                  : 'bg-[#151519] hover:bg-[#1C1C21] text-[#A7A7AE] hover:text-[#F5F5F5] border-white/10 hover:border-[#D6A85F]/50'
              }`}
            >
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#050505] inline-block mr-2 align-middle animate-pulse" />
              )}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
