import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  Flame, 
  ShoppingBag, 
  Compass, 
  Clock, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const AIAssistantModal = () => {
  const { 
    aiAssistantOpen, 
    setAiAssistantOpen, 
    dishes, 
    setSelectedDishForModal 
  } = useFoodEcosystem();
  const { addToCart } = useCart();

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your FD Foods AI Taste Concierge. What are you craving today? You can say: 'Spicy chicken under ₹300' or 'Healthy vegan bowl' or 'Midnight sweet craving'!",
      suggestions: [
        'Spicy chicken under ₹300',
        'Vegetarian healthy bowl',
        'Woodfired gourmet pizza',
        'Warm desserts under ₹250',
      ]
    }
  ]);
  const [recommendedDish, setRecommendedDish] = useState(null);

  if (!aiAssistantOpen) return null;

  const handleSend = (textToSend = null) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');

    // AI Query Parsing Logic
    setTimeout(() => {
      const lower = text.toLowerCase();
      let matched = null;

      if (lower.includes('biryani') || lower.includes('chicken') || lower.includes('mutton') || lower.includes('spicy')) {
        matched = dishes.find((d) => d.id === 'food-biryani-hyderabadi') || dishes[0];
      } else if (lower.includes('pizza') || lower.includes('cheese') || lower.includes('italian')) {
        matched = dishes.find((d) => d.id === 'food-pizza-burrata') || dishes[2];
      } else if (lower.includes('vegan') || lower.includes('healthy') || lower.includes('salad') || lower.includes('bowl')) {
        matched = dishes.find((d) => d.id === 'food-healthy-bowl') || dishes[7];
      } else if (lower.includes('dessert') || lower.includes('sweet') || lower.includes('waffle') || lower.includes('chocolate')) {
        matched = dishes.find((d) => d.id === 'food-dessert-waffle') || dishes[9];
      } else if (lower.includes('burger')) {
        matched = dishes.find((d) => d.id === 'food-burger-smash') || dishes[4];
      } else {
        matched = dishes[0];
      }

      setRecommendedDish(matched);

      const aiReply = {
        sender: 'ai',
        text: `Based on your craving for "${text}", I analyzed flavor profiles, current prep time, and 4.8+ ratings near you. Here is the perfect match:`,
        dish: matched,
      };

      setMessages((prev) => [...prev, aiReply]);
    }, 600);
  };

  const handleOrder = (dish) => {
    addToCart(dish, 1, []);
    setSelectedDishForModal(dish);
    setAiAssistantOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-[#EFE8DE] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#163D2B] to-[#1B4332] p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#52B788]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">FD Foods AI Concierge</h3>
              <p className="text-xs text-white/85">Smart Craving Assistant & Flavor Matcher</p>
            </div>
          </div>

          <button
            onClick={() => setAiAssistantOpen(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FFF8EE]">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                m.sender === 'user' 
                  ? 'bg-[#FF6B35] text-white rounded-br-none font-bold' 
                  : 'bg-white text-[#171717] rounded-bl-none border border-[#EFE8DE]'
              }`}>
                {m.text}
              </div>

              {/* Suggestions pills */}
              {m.suggestions && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {m.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      className="text-[11px] font-bold bg-white text-[#FF6B35] border border-[#FF6B35]/30 hover:bg-[#FFF2EB] px-3 py-1.5 rounded-full shadow-xs transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* AI Dish Recommendation Card */}
              {m.dish && (
                <div className="mt-3 bg-white p-3.5 rounded-2xl border border-[#FF6B35]/30 shadow-md w-full flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={m.dish.image} 
                      alt={m.dish.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-black text-[#171717] line-clamp-1">{m.dish.name}</h4>
                      <p className="text-[10px] text-[#6F7378]">{m.dish.restaurantName}</p>
                      <div className="flex items-center space-x-2 text-xs font-bold text-[#FF6B35] mt-0.5">
                        <span>₹{m.dish.price}</span>
                        <span className="text-[10px] text-[#20B26B]">⭐ {m.dish.rating} • {m.dish.deliveryEstimate}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOrder(m.dish)}
                    className="py-2 px-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-xs shadow-md shadow-[#FF6B35]/25 flex-shrink-0"
                  >
                    ORDER NOW
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-3 bg-white border-t border-[#F2ECE1] flex items-center space-x-2"
        >
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your craving (e.g. 'spicy biryani', 'healthy bowl')..."
            className="flex-1 text-xs p-3 rounded-2xl bg-[#FFF8EE] border border-[#EFE8DE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A27] text-white flex items-center justify-center transition-all shadow-md shadow-[#FF6B35]/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantModal;
