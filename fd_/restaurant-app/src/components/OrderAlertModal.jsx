import React from 'react';
import { Bell, X, MapPin, ChefHat, Clock, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';

export const OrderAlertModal = () => {
  const { newOrderAlert, setNewOrderAlert, handleAcceptOrder, handleRejectOrder } = useShop();

  if (!newOrderAlert) return null;

  const onAccept = () => {
    if (newOrderAlert.id && handleAcceptOrder) {
      handleAcceptOrder(newOrderAlert.id);
    }
    setNewOrderAlert(null);
  };

  const onReject = () => {
    if (newOrderAlert.id && handleRejectOrder) {
      handleRejectOrder(newOrderAlert.id);
    }
    setNewOrderAlert(null);
  };

  const items = Array.isArray(newOrderAlert.items) ? newOrderAlert.items : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-alert-title"
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white border border-stone-200 p-6 sm:p-7 shadow-2xl space-y-5 animate-scaleUp"
        style={{
          backgroundColor: 'var(--ws-surface, #FFFFFF)',
          borderColor: 'var(--ws-border, #E7E5E4)',
          color: 'var(--ws-text-primary, #1C1917)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Alert Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700">
                Incoming Live Order
              </span>
              <h2 id="order-alert-title" className="text-xl font-extrabold text-stone-900">
                Order #{newOrderAlert.order_number || newOrderAlert.id}
              </h2>
            </div>
          </div>

          <button
            onClick={() => setNewOrderAlert(null)}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Destination Summary */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-2 text-xs">
          <div className="flex items-center justify-between font-medium">
            <span className="font-bold text-stone-900 text-sm">
              {newOrderAlert.customer_name || 'Customer'}
            </span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Paid Online
            </span>
          </div>
          {newOrderAlert.delivery_address && (
            <div className="flex items-center gap-1.5 text-stone-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{newOrderAlert.delivery_address}</span>
            </div>
          )}
          {newOrderAlert.cooking_instructions && (
            <div className="pt-2 border-t border-stone-200/60 text-stone-700 italic">
              Special Note: "{newOrderAlert.cooking_instructions}"
            </div>
          )}
        </div>

        {/* Ordered Dishes List */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            Kitchen Preparation Items
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-stone-50 border border-stone-100"
              >
                <span className="font-semibold text-stone-800">
                  {item.quantity}× {item.name || item.food_name}
                </span>
                <span className="font-bold text-stone-900">
                  ₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-stone-100 text-sm font-bold text-stone-900">
            <span>Order Grand Total</span>
            <span className="text-lg font-black text-emerald-700">
              ₹{Number(newOrderAlert.grand_total || newOrderAlert.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onReject}
            className="py-3 px-4 rounded-xl border border-stone-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Decline Order
          </button>

          <button
            onClick={onAccept}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>Accept & Prepare</span>
          </button>
        </div>
      </div>
    </div>
  );
};
