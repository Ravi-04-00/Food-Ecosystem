import React, { useState } from 'react';
import { 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Home, 
  Briefcase, 
  Building, 
  Smartphone, 
  QrCode, 
  Banknote, 
  Lock,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useFoodEcosystem } from '../context/FoodEcosystemContext.jsx';
import { GoogleMapMock } from '../components/GoogleMapMock.jsx';

export const Checkout = ({ onOrderSuccess, onBackToCart }) => {
  const { 
    items, 
    subtotal, 
    delivery, 
    taxes, 
    platformFee, 
    discount, 
    grandTotal, 
    appliedCoupon, 
    clearCart,
    cookingInstructions
  } = useCart();

  const { placeOrder, setLiveTrackerOpen } = useFoodEcosystem();

  // Multi-step Checkout States
  const [addressType, setAddressType] = useState('Home'); // 'Home' | 'Work' | 'Other'
  const [customerName, setCustomerName] = useState('Priya Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98450 77123');
  const [streetAddress, setStreetAddress] = useState('Apartment 4B, 12th Main Indiranagar, Bengaluru');
  const [cityPincode, setCityPincode] = useState('Bengaluru - 560038');
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [upiId, setUpiId] = useState('priya@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationStep, setVerificationStep] = useState(null);

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setVerificationStep('Initiating Secure Payment Gateway Handshake...');

    setTimeout(() => {
      setVerificationStep('Verifying Transaction Signature with Bank API...');
      
      setTimeout(() => {
        setVerificationStep('Payment Verified: 200 OK. Confirming Order with Restaurant Kitchen...');
        
        setTimeout(() => {
          setIsProcessing(false);
          const newOrder = placeOrder({
            customerName,
            phone: customerPhone,
            address: `${streetAddress}, ${cityPincode} (${addressType})`,
            items: items.map((i) => ({
              id: i.product.id,
              name: i.product.name,
              price: i.product.price,
              quantity: i.quantity,
              isVeg: i.product.isVeg,
              addOns: (i.selectedAddOns || []).map((a) => `${a.name} (+₹${a.price})`),
            })),
            itemTotal: subtotal,
            deliveryFee: delivery,
            taxes,
            couponApplied: appliedCoupon ? `${appliedCoupon.code} (-₹${discount})` : null,
            grandTotal,
            paymentMethod: paymentMethod === 'upi' ? `UPI (${upiId})` : paymentMethod === 'card' ? 'Credit Card (Visa)' : 'Cash on Delivery',
          });

          clearCart();
          if (onOrderSuccess) onOrderSuccess(newOrder);
        }, 800);
      }, 700);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-3 text-xs font-semibold text-[#6F7378]">
        <button onClick={onBackToCart} className="hover:text-[#FF6B35] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </button>
        <span>/</span>
        <span className="text-[#171717] font-bold">Secure Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Multi-Step Delivery Details & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: DELIVERY ADDRESS & CONTACT */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-[#F2ECE1]">
              <div className="w-7 h-7 rounded-xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center font-black text-xs">
                1
              </div>
              <h3 className="font-black text-base text-[#171717]">Delivery Address & Contact</h3>
            </div>

            {/* Address Type Badges */}
            <div className="flex items-center space-x-3">
              {[
                { type: 'Home', icon: Home },
                { type: 'Work', icon: Briefcase },
                { type: 'Other', icon: Building },
              ].map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => setAddressType(btn.type)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                    addressType === btn.type
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-sm'
                      : 'bg-[#FFF8EE] text-[#6F7378] border-[#EFE8DE] hover:border-[#FF6B35]'
                  }`}
                >
                  <btn.icon className="w-3.5 h-3.5" />
                  <span>{btn.type}</span>
                </button>
              ))}
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1">
                  Recipient Name
                </label>
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1">
                  Phone Number
                </label>
                <input 
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1">
                  Flat / Apartment / Street Address
                </label>
                <input 
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6F7378] mb-1">
                  City & Pincode
                </label>
                <input 
                  type="text"
                  value={cityPincode}
                  onChange={(e) => setCityPincode(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] text-[#171717] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: GOOGLE MAP PIN SELECTION */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5 pb-2">
              <div className="w-7 h-7 rounded-xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center font-black text-xs">
                2
              </div>
              <div>
                <h3 className="font-black text-base text-[#171717]">Pinpoint on Google Maps</h3>
                <p className="text-[11px] text-[#6F7378]">Drag or search to pinpoint exact doorstep drop-off</p>
              </div>
            </div>

            <GoogleMapMock 
              height="240px"
              mode="picker"
              onLocationSelect={(loc) => {
                setStreetAddress(loc.address);
              }}
            />
          </div>

          {/* STEP 3: PAYMENT METHOD SELECTION */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-[#F2ECE1]">
              <div className="w-7 h-7 rounded-xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center font-black text-xs">
                3
              </div>
              <h3 className="font-black text-base text-[#171717]">Payment Method (Verified Gateway)</h3>
            </div>

            <div className="space-y-3">
              {/* UPI Option */}
              <label 
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'upi' ? 'border-[#FF6B35] bg-[#FFF2EB]/50' : 'border-[#EFE8DE] bg-white'
                }`}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] text-[#FFC857] flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#171717]">UPI Instant Payment</h4>
                    <p className="text-[10px] text-[#6F7378]">Google Pay, PhonePe, Paytm, CRED</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  checked={paymentMethod === 'upi'} 
                  onChange={() => setPaymentMethod('upi')} 
                  className="accent-[#FF6B35]"
                />
              </label>

              {paymentMethod === 'upi' && (
                <div className="p-3 bg-[#FFF8EE] rounded-xl border border-[#F2ECE1] space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6F7378]">
                    Enter Virtual Payment Address (VPA)
                  </label>
                  <input 
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-[#EFE8DE] bg-white text-[#171717] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              )}

              {/* Cards Option */}
              <label 
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-[#FF6B35] bg-[#FFF2EB]/50' : 'border-[#EFE8DE] bg-white'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] text-[#FFC857] flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#171717]">Credit / Debit Card</h4>
                    <p className="text-[10px] text-[#6F7378]">Visa, Mastercard, RuPay, Amex</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  checked={paymentMethod === 'card'} 
                  onChange={() => setPaymentMethod('card')} 
                  className="accent-[#FF6B35]"
                />
              </label>

              {/* Cash On Delivery Option */}
              <label 
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-[#FF6B35] bg-[#FFF2EB]/50' : 'border-[#EFE8DE] bg-white'
                }`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF9EB] text-[#FFC857] flex items-center justify-center font-bold">
                    <Banknote className="w-4 h-4 text-[#20B26B]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#171717]">Cash on Delivery</h4>
                    <p className="text-[10px] text-[#6F7378]">Pay cash or scan QR when food arrives</p>
                  </div>
                </div>
                <input 
                  type="radio" 
                  checked={paymentMethod === 'cod'} 
                  onChange={() => setPaymentMethod('cod')} 
                  className="accent-[#FF6B35]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
            <h4 className="font-black text-sm text-[#171717] pb-3 border-b border-[#F2ECE1]">
              Order Summary ({items.length} items)
            </h4>

            {/* Items list */}
            <div className="space-y-3 divide-y divide-[#F2ECE1] max-h-56 overflow-y-auto">
              {items.map((item) => (
                <div key={item.cartItemId} className="pt-2 first:pt-0 flex justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-[#171717]">{item.quantity}x {item.product.name}</span>
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <div className="text-[10px] text-[#6F7378]">
                        + {item.selectedAddOns.map(a => a.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-[#171717]">
                    ₹{(item.product.price + (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Details */}
            <div className="pt-3 border-t border-[#F2ECE1] space-y-2 text-xs">
              <div className="flex justify-between text-[#4A4D52]">
                <span>Item Total</span>
                <span className="font-bold text-[#171717]">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#20B26B] font-bold">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-[#4A4D52]">
                <span>Delivery (20-min)</span>
                <span className="font-bold text-[#171717]">{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
              </div>
              <div className="flex justify-between text-[#4A4D52]">
                <span>GST (5%)</span>
                <span className="font-bold text-[#171717]">₹{taxes}</span>
              </div>
              <div className="flex justify-between text-[#4A4D52]">
                <span>Platform Fee</span>
                <span className="font-bold text-[#171717]">₹{platformFee}</span>
              </div>
              <div className="pt-3 border-t border-[#F2ECE1] flex justify-between items-baseline text-sm font-black text-[#171717]">
                <span>Grand Total</span>
                <span className="text-xl text-[#FF6B35]">₹{grandTotal}</span>
              </div>
            </div>

            {/* Security note */}
            <div className="p-3 bg-[#EBF8F1] rounded-2xl border border-[#20B26B]/30 flex items-center space-x-2 text-[11px] text-[#20B26B] font-bold">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Backend Verified Payment Gateway (256-Bit SSL Encrypted)</span>
            </div>

            {/* Processing banner or Place Order Button */}
            {isProcessing ? (
              <div className="p-4 bg-[#FFF8EE] rounded-2xl border border-[#FF6B35] text-center space-y-2">
                <div className="w-6 h-6 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#FF6B35] animate-pulse">
                  {verificationStep}
                </p>
              </div>
            ) : (
              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 px-4 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-sm shadow-xl shadow-[#FF6B35]/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>CONFIRM & PLACE ORDER (₹{grandTotal})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
