import React from 'react';
import { 
  Package, 
  Bike, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Phone, 
  Navigation,
  RotateCcw
} from 'lucide-react';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export const Orders = ({ onExploreMarketplace }) => {
  const { orders, setActiveLiveOrderId, setLiveTrackerOpen } = useFoodEcosystem();
  const { addToCart } = useCart();

  const handleTrackLive = (orderId) => {
    setActiveLiveOrderId(orderId);
    setLiveTrackerOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#EFE8DE]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717]">
            Your Food Orders & Tracking
          </h1>
          <p className="text-xs text-[#6F7378] mt-1">
            Real-time delivery progress, OTP verification, and order receipts
          </p>
        </div>
        <span className="text-xs font-bold text-[#FF6B35] bg-[#FFF2EB] px-3 py-1.5 rounded-xl border border-[#FF6B35]/20">
          {orders.length} Active & Past Orders
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-[#EFE8DE] space-y-4">
          <div className="text-4xl">🛵</div>
          <h3 className="text-xl font-black text-[#171717]">No Orders Placed Yet</h3>
          <p className="text-xs text-[#6F7378] max-w-sm mx-auto">
            Your next hot meal is just a few clicks away. Explore delicious biryanis, pizzas, and artisan burgers!
          </p>
          <button
            onClick={onExploreMarketplace}
            className="px-6 py-3 rounded-2xl bg-[#FF6B35] text-white text-xs font-black shadow-md shadow-[#FF6B35]/30 hover:bg-[#E85A27] transition-all"
          >
            ORDER FOOD NOW
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isDelivered = order.status === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-5"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2ECE1]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-sm text-[#171717]">
                        Order #{order.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isDelivered 
                          ? 'bg-[#EBF8F1] text-[#20B26B]' 
                          : 'bg-[#FFF2EB] text-[#FF6B35] animate-pulse'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-[#6F7378] mt-0.5 block">
                      From <strong className="text-[#171717]">{order.restaurant.name}</strong> • Delivery OTP: <strong className="font-mono text-[#FF6B35] bg-[#FFF2EB] px-1.5 py-0.5 rounded">{order.otp}</strong>
                    </span>
                  </div>

                  {/* Live Tracker CTA */}
                  <div>
                    <button
                      onClick={() => handleTrackLive(order.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-xs shadow-md shadow-[#FF6B35]/25 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>TRACK LIVE ON MAP</span>
                    </button>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-[#FF6B35]">{item.quantity}x</span>
                        <span className="font-bold text-[#171717]">{item.name}</span>
                        {item.addOns && item.addOns.length > 0 && (
                          <span className="text-[10px] text-[#6F7378]">({item.addOns.join(', ')})</span>
                        )}
                      </div>
                      <span className="font-black text-[#171717]">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Footer details: Address & Total */}
                <div className="pt-3 border-t border-[#F2ECE1] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6F7378] gap-2">
                  <div className="truncate max-w-md">
                    <span>Delivered to: </span>
                    <strong className="text-[#171717]">{order.customer.address}</strong>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#171717]">Total Paid ({order.paymentMethod}): </span>
                    <strong className="text-sm font-black text-[#FF6B35]">₹{order.grandTotal}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
