import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  ChefHat, 
  Store, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  Share2, 
  ChevronRight, 
  Bike 
} from 'lucide-react';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { GoogleMapMock } from './GoogleMapMock.jsx';

export const LiveOrderTracker = ({ isOpen, onClose }) => {
  const { 
    activeLiveOrder, 
    orders, 
    setActiveLiveOrderId, 
    submitReview,
    liveTrackerOpen,
    setLiveTrackerOpen
  } = useFoodEcosystem();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!isOpen && !liveTrackerOpen) return null;
  const order = activeLiveOrder || orders[0];
  if (!order) return null;

  const handleClose = () => {
    if (onClose) onClose();
    setLiveTrackerOpen(false);
  };

  // Stage mapping
  // 'placed' -> 'preparing' -> 'ready' -> 'on_the_way' -> 'delivered'
  const stages = [
    { key: 'placed', label: 'Order Placed', time: '8:05 PM', desc: 'Payment verified & order confirmed' },
    { key: 'preparing', label: 'Kitchen Preparing', time: '8:08 PM', desc: 'Master chef cooking your meal' },
    { key: 'ready', label: 'Ready for Pickup', time: '8:18 PM', desc: 'Sealed in thermal packaging' },
    { key: 'on_the_way', label: 'On The Way', time: '8:22 PM', desc: 'Rider en route to your address' },
    { key: 'delivered', label: 'Delivered', time: '8:30 PM', desc: 'Enjoy your fresh hot food!' },
  ];

  const getStageIndex = (st) => {
    switch (st) {
      case 'placed': return 0;
      case 'accepted': return 1;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'on_the_way': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(order.status);
  const isDelivered = order.status === 'delivered';

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    submitReview(order.id, { rating, text: reviewText });
    setReviewSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EFE8DE] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#F2ECE1] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center font-black">
              🛵
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-[#171717]">
                  Live Order #{order.id}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  isDelivered 
                    ? 'bg-[#EBF8F1] text-[#20B26B]' 
                    : 'bg-[#FFF2EB] text-[#FF6B35] animate-pulse'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#6F7378]">
                From <span className="font-semibold text-[#171717]">{order.restaurant.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Delivery OTP Badge */}
            <div className="bg-[#FFF9EB] border border-[#FFE7A8] px-3 py-1.5 rounded-2xl flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-[#8C6D00]">Delivery OTP:</span>
              <span className="font-mono text-sm font-extrabold text-[#171717] tracking-widest bg-white px-2 py-0.5 rounded-lg border border-[#FFE7A8]">
                {order.otp}
              </span>
            </div>

            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-[#F4F1EA] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Interactive Google Map Route View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#20B26B] animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Real-Time GPS Route Tracking
                </h4>
              </div>
              <span className="text-xs font-bold text-[#FF6B35]">
                ETA: {order.estimatedDeliveryTime || '14 mins away'}
              </span>
            </div>

            <GoogleMapMock 
              height="320px"
              mode="tracking"
              restaurant={order.restaurant}
              customer={order.customer}
              rider={order.rider}
              status={order.status}
            />
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-[#FFF8EE] rounded-3xl p-5 border border-[#F2ECE1]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F7378] mb-4">
              Order Timeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {stages.map((stage, idx) => {
                const isPassed = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={stage.key} className="flex flex-col items-center text-center relative">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-sm mb-2 ${
                      isPassed 
                        ? 'bg-[#FF6B35] text-white shadow-[#FF6B35]/30' 
                        : 'bg-white text-[#9B9DA2] border border-[#EFE8DE]'
                    } ${isCurrent ? 'ring-4 ring-[#FF6B35]/20 animate-pulse-orange' : ''}`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-bold leading-tight ${isPassed ? 'text-[#171717]' : 'text-[#9B9DA2]'}`}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-[#6F7378] mt-0.5">
                      {stage.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rider Card & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rider Information */}
            <div className="p-4 rounded-2xl bg-white border border-[#EFE8DE] shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <img 
                  src={order.rider.avatar} 
                  alt={order.rider.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[#FF6B35]"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-extrabold text-sm text-[#171717]">{order.rider.name}</h4>
                    <span className="text-[10px] bg-[#FFF9EB] text-[#B87A00] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" /> {order.rider.rating}
                    </span>
                  </div>
                  <p className="text-xs text-[#6F7378]">{order.rider.vehicle}</p>
                  <p className="text-[10px] text-[#20B26B] font-bold mt-0.5">Verified Delivery Partner</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a 
                  href={`tel:${order.rider.phone}`}
                  className="w-10 h-10 rounded-xl bg-[#FFF2EB] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center transition-all shadow-sm"
                  title="Call Delivery Partner"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Restaurant Info & Call */}
            <div className="p-4 rounded-2xl bg-white border border-[#EFE8DE] shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8EE] text-[#FF6B35] flex items-center justify-center text-xl border border-[#F2ECE1]">
                  🏪
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#171717]">{order.restaurant.name}</h4>
                  <p className="text-xs text-[#6F7378] truncate max-w-[180px]">{order.restaurant.address}</p>
                  <p className="text-[10px] text-[#FF6B35] font-bold mt-0.5">Kitchen Contact Available</p>
                </div>
              </div>

              <a 
                href={`tel:${order.restaurant.phone || '+918041289000'}`}
                className="w-10 h-10 rounded-xl bg-[#FFF2EB] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white flex items-center justify-center transition-all shadow-sm"
                title="Call Restaurant"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Ordered Food Items List & Receipt Summary */}
          <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#EFE8DE]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F7378] mb-3">
              Order Summary ({order.items.length} items)
            </h4>

            <div className="divide-y divide-[#EFE8DE] space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#FF6B35]">{item.quantity}x</span>
                    <span className="font-bold text-[#171717]">{item.name}</span>
                    {item.addOns && item.addOns.length > 0 && (
                      <span className="text-[10px] text-[#6F7378]">({item.addOns.join(', ')})</span>
                    )}
                  </div>
                  <span className="font-bold text-[#171717]">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DACD] flex items-center justify-between text-xs font-extrabold text-[#171717]">
              <span>Grand Total Paid ({order.paymentMethod})</span>
              <span className="text-base text-[#FF6B35]">₹{order.grandTotal}</span>
            </div>
          </div>

          {/* Delivered State: Customer Review Trigger */}
          {isDelivered && (
            <div className="bg-[#EBF8F1] rounded-3xl p-6 border border-[#20B26B]/30 animate-fadeIn">
              <div className="flex items-center space-x-2.5 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#20B26B]" />
                <h4 className="font-extrabold text-sm text-[#171717]">
                  Order Delivered! How was the food and delivery?
                </h4>
              </div>

              {!reviewSubmitted ? (
                <form onSubmit={handleReviewSubmit} className="space-y-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-[#6F7378]">Rate Experience:</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`w-5 h-5 ${star <= rating ? 'fill-[#FFC857] text-[#FFC857]' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input 
                    type="text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write a quick comment about the taste, packaging or speed..."
                    className="w-full text-xs p-3 rounded-xl border border-[#20B26B]/40 bg-white focus:outline-none focus:border-[#20B26B]"
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#20B26B] hover:bg-[#1A9358] text-white font-bold text-xs shadow-md transition-all"
                  >
                    Submit 5-Star Feedback
                  </button>
                </form>
              ) : (
                <div className="text-xs font-bold text-[#20B26B]">
                  ✨ Thank you! Your review has been published to the restaurant and delivery partner profile.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveOrderTracker;
