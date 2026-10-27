import React, { useState } from 'react';
import { 
  Sparkles, X, Mic, MicOff, Camera, Send, Flame, Clock, 
  ArrowRight, ShoppingBag, Check, Zap, Cpu
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { queryAIAssistant, FALLBACK_FOODS } from '../services/api.js';

export const AIAssistantModal = () => {
  const { isAIOpen, setIsAIOpen, addToCart, setSelectedDish } = useCustomer();
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [addedItems, setAddedItems] = useState({});

  if (!isAIOpen) return null;

  const presetQueries = [
    'I want spicy chicken under ₹300',
    'Crisp vegetarian burger with truffle sauce',
    'Rich claypot dum biryani with raita',
    'Hot chocolate lava dessert'
  ];

  const handleExecuteQuery = async (queryText) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;
    setLoading(true);
    setAiResponse(null);

    const result = await queryAIAssistant(q);
    setAiResponse(result);
    setLoading(false);
  };

  const handleVoiceSimulate = () => {
    setIsListening(true);
    setInputQuery('Listening to voice query stream...');
    setTimeout(() => {
      setIsListening(false);
      const voiceQuery = 'I want spicy chicken under ₹300';
      setInputQuery(voiceQuery);
      handleExecuteQuery(voiceQuery);
    }, 2000);
  };

  const handleImageSearchSimulate = () => {
    setLoading(true);
    setInputQuery('Analyzing photo: [artisan_smash_cheeseburger.png]...');
    setTimeout(() => {
      setLoading(false);
      setAiResponse({
        query: 'Image Recognition: Double Smash Burger detected (99.4% confidence)',
        reply: '⚡ AI Visual Recognition identified: Double Smash Wagyu Burger with melted cheddar drape and caramelized sauce. Showing closest matching dishes available near you.',
        recommended_foods: FALLBACK_FOODS.slice(0, 3),
        predicted_eta: '16–20 mins',
        cyber_score: 99.8
      });
    }, 1600);
  };

  const handleAddDish = async (dish) => {
    try {
      await addToCart(dish, 1);
      setAddedItems({ ...addedItems, [dish.id]: true });
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [dish.id]: false }));
      }, 1200);
    } catch (err) {
      console.error('AI assistant add to cart error:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          borderRadius: '24px',
          background: 'var(--ws-surface)',
          border: '1px solid var(--ws-border)',
          boxShadow: 'var(--ws-shadow-lg)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ws-border)',
          background: 'var(--ws-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#8B5CF6'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                  WS AI FOOD COPILOT
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  ONLINE
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', margin: '2px 0 0 0' }}>
                Natural language dish curation, voice discovery & visual food recognition
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIOpen(false)}
            style={{
              padding: '8px',
              borderRadius: '50%',
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              color: 'var(--ws-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Preset Prompts Pills */}
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              TAP SUGGESTION TO SYNTHESIZE
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {presetQueries.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputQuery(preset);
                    handleExecuteQuery(preset);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: 'var(--ws-surface-subtle)',
                    border: '1px solid var(--ws-border)',
                    fontSize: '0.8rem',
                    color: 'var(--ws-text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textAlign: 'left'
                  }}
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Output Area */}
          {loading && (
            <div style={{
              padding: '32px 20px',
              borderRadius: '18px',
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}>
              <Cpu size={32} color="#8B5CF6" />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ws-text-primary)', margin: 0 }}>
                Compiling flavor profiles & scanning real-time kitchen nodes...
              </p>
            </div>
          )}

          {isListening && (
            <div style={{
              padding: '24px',
              borderRadius: '18px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#8B5CF6', margin: 0 }}>
                🎙️ Listening... Speak your food cravings clearly
              </p>
            </div>
          )}

          {aiResponse && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* AI Answer Message */}
              <div style={{
                padding: '16px 20px',
                borderRadius: '16px',
                background: 'var(--ws-surface-subtle)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontSize: '0.88rem',
                color: 'var(--ws-text-primary)',
                lineHeight: 1.5
              }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{aiResponse.reply}</p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--ws-border)',
                  fontSize: '0.75rem',
                  color: 'var(--ws-text-muted)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284C7', fontWeight: 600 }}>
                    <Clock size={14} /> Est. Prep: {aiResponse.predicted_eta || '18-24 mins'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
                    <Zap size={14} /> Match Confidence: {aiResponse.cyber_score || 99}%
                  </span>
                </div>
              </div>

              {/* Recommended Food Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  MATCHED DISHES IN YOUR GRID
                </span>
                {aiResponse.recommended_foods?.map((food) => (
                  <div
                    key={food.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: 'var(--ws-surface)',
                      border: '1px solid var(--ws-border)',
                      gap: '12px'
                    }}
                  >
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                      onClick={() => {
                        if (setSelectedDish) setSelectedDish(food);
                        setIsAIOpen(false);
                      }}
                    >
                      <div style={{ width: '54px', height: '54px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--ws-surface-subtle)' }}>
                        <img src={food.image} alt={food.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                          {food.name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>{food.restaurant_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#22C55E' }}>₹{food.price}</span>
                          <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>★ {food.rating || 4.9}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddDish(food)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: addedItems[food.id] ? '#10B981' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(255, 90, 31, 0.25)'
                      }}
                    >
                      {addedItems[food.id] ? <Check size={14} /> : <ShoppingBag size={14} />}
                      <span>{addedItems[food.id] ? 'ADDED' : 'ADD'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 20px', background: 'var(--ws-surface-subtle)', borderTop: '1px solid var(--ws-border)' }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteQuery(inputQuery);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--ws-surface)',
              borderRadius: '14px',
              border: '1px solid var(--ws-border)',
              padding: '8px 14px'
            }}>
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask e.g. 'Spicy chicken under ₹300'..."
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  color: 'var(--ws-text-primary)'
                }}
              />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleVoiceSimulate}
                  style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
                  title="Voice Command"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleImageSearchSimulate}
                  style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
                  title="Image Recognition Search"
                >
                  <Camera size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
