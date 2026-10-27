import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Play,
  Flame
} from 'lucide-react';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const FoodReelsModal = () => {
  const { 
    reels, 
    activeReelIndex, 
    setActiveReelIndex, 
    likeReel, 
    dishes, 
    setSelectedDishForModal 
  } = useFoodEcosystem();
  const { addToCart } = useCart();

  const [isMuted, setIsMuted] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState([
    { user: 'Siddharth R.', text: 'That steam aroma looks unreal! Ordering right now.' },
    { user: 'Ananya G.', text: 'Best woodfired pizza in Bengaluru hands down ❤️' },
  ]);
  const [showComments, setShowComments] = useState(false);

  if (activeReelIndex === null || activeReelIndex === undefined) return null;
  const currentReel = reels[activeReelIndex];
  if (!currentReel) return null;

  const connectedDish = dishes.find((d) => d.id === currentReel.dishId) || dishes[0];

  const handleNext = () => {
    if (activeReelIndex < reels.length - 1) {
      setActiveReelIndex(activeReelIndex + 1);
    } else {
      setActiveReelIndex(0);
    }
  };

  const handlePrev = () => {
    if (activeReelIndex > 0) {
      setActiveReelIndex(activeReelIndex - 1);
    } else {
      setActiveReelIndex(reels.length - 1);
    }
  };

  const handleOrderFromReel = () => {
    if (connectedDish) {
      addToCart(connectedDish, 1, []);
      setSelectedDishForModal(connectedDish);
      setActiveReelIndex(null);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentsList([...commentsList, { user: 'You', text: commentInput }]);
    setCommentInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Close button */}
      <button
        onClick={() => setActiveReelIndex(null)}
        className="fixed top-6 right-6 z-50 w-11 h-11 rounded-full bg-white/20 hover:bg-[#FF6B35] text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Reel Card Container */}
      <div 
        className="relative w-full max-w-sm h-full md:h-[88vh] rounded-none md:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Video / Animated Canvas */}
        <div className="absolute inset-0 z-0">
          <video 
            src={currentReel.videoUrl}
            poster={currentReel.thumbnail}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
        </div>

        {/* Top Header Bar */}
        <div className="relative z-10 p-5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Flame className="w-4 h-4 text-[#FF6B35] fill-current animate-pulse" />
            <span className="text-xs font-bold tracking-wider uppercase">FD Foods Reel</span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Floating Vertical Reel Interaction Column */}
        <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center space-y-5">
          {/* Like Button */}
          <button
            onClick={() => likeReel(currentReel.id)}
            className="flex flex-col items-center group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-75 shadow-lg ${
              currentReel.userLiked ? 'bg-[#FF3B30] text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}>
              <Heart className={`w-6 h-6 ${currentReel.userLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-white text-[11px] font-bold mt-1 drop-shadow">
              {currentReel.likes}
            </span>
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-75 shadow-lg">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-white text-[11px] font-bold mt-1 drop-shadow">
              {currentReel.comments}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Reel link copied to clipboard!');
            }}
            className="flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-75 shadow-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-white text-[11px] font-bold mt-1 drop-shadow">
              Share
            </span>
          </button>

          {/* Next / Prev Navigation */}
          <div className="flex flex-col space-y-2 pt-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center"
              title="Previous Reel"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center"
              title="Next Reel"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Connected Dish Card & 1-Click Order Button */}
        <div className="relative z-10 p-5 space-y-3">
          {/* Chef / Title Info */}
          <div>
            <span className="text-xs font-bold text-[#FFC857] drop-shadow-md">
              @{currentReel.restaurantName}
            </span>
            <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-md mt-0.5">
              {currentReel.title}
            </h3>
            <p className="text-xs text-white/80 line-clamp-2 mt-1 drop-shadow">
              {currentReel.chefNote}
            </p>
          </div>

          {/* Connected Dish Preview Card */}
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <img 
                src={connectedDish.image} 
                alt={connectedDish.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-extrabold text-[#171717] truncate">
                  {connectedDish.name}
                </h4>
                <div className="flex items-center space-x-2 text-xs font-bold text-[#FF6B35]">
                  <span>₹{connectedDish.price}</span>
                  <span className="text-[10px] text-[#20B26B]">⚡ 20m prep</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOrderFromReel}
              className="py-2.5 px-3.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-extrabold text-xs shadow-md shadow-[#FF6B35]/30 flex items-center space-x-1.5 flex-shrink-0 transition-transform active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ORDER NOW</span>
            </button>
          </div>
        </div>

        {/* Bottom Drawer: Comments Sheet */}
        {showComments && (
          <div className="absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-3xl p-5 shadow-2xl border-t border-[#EFE8DE] animate-slideUp max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
              <h4 className="font-extrabold text-sm text-[#171717]">
                Comments ({commentsList.length})
              </h4>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {commentsList.map((c, i) => (
                <div key={i} className="text-xs">
                  <span className="font-bold text-[#171717]">{c.user}: </span>
                  <span className="text-[#4A4D52]">{c.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
              <input 
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-xs p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FAF8F5] focus:outline-none"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-xs font-bold"
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodReelsModal;
