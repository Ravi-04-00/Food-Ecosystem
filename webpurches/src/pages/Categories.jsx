import React, { useState } from 'react';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { Search, ChevronRight, Utensils } from 'lucide-react';

export const Categories = ({ onSelectCategory, onNavigateShop }) => {
  const { categories } = useFoodEcosystem();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (catId) => {
    if (onSelectCategory) onSelectCategory(catId);
    if (onNavigateShop) onNavigateShop();
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#EFE8DE]">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#52B788] block mb-1 font-bold">
            FD FOODS DIRECTORY
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717]">
            Culinary <span className="text-[#FF6B35]">Categories</span>
          </h1>
          <p className="text-xs text-[#6F7378] mt-2 max-w-xl">
            Explore authentic handi biryanis, Neapolitan pizzas, traditional thalis, and gourmet shakes.
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search food cuisines..."
            className="w-full h-11 px-4 rounded-2xl bg-white border border-[#EFE8DE] text-xs text-[#171717] placeholder-[#8C8F94] focus:outline-none focus:border-[#FF6B35]"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="group p-5 rounded-3xl bg-white border border-[#EFE8DE] hover:border-[#FF6B35] transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer flex items-center space-x-4"
          >
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F4F1EA] flex-shrink-0">
              <img 
                src={cat.image} 
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-[#171717] group-hover:text-[#FF6B35] transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[10px] font-bold text-[#FF6B35] bg-[#FFF2EB] px-2 py-0.5 rounded-md">
                  {cat.count}+ items
                </span>
              </div>
              <p className="text-xs text-[#6F7378] mt-1">
                Freshly prepared upon order
              </p>
              <div className="mt-3 flex items-center space-x-1 text-xs font-bold text-[#171717] group-hover:text-[#FF6B35]">
                <span>Explore Category</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
