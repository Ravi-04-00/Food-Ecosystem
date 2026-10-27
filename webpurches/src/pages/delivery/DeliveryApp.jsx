import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  Power,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useFoodEcosystem } from '../../context/FoodEcosystemContext.jsx';
import { GoogleMapMock } from '../../components/GoogleMapMock.jsx';

export const DeliveryApp = () => {
  const { 
    riders, 
    orders, 
    riderAcceptDelivery, 
    riderVerifyOTPAndDeliver,
    toggleRiderOnline 
  } = useFoodEcosystem();

  const currentRider = riders[0]; // "Rahul Kumar"
  const [isOnline, setIsOnline] = useState(currentRider.isOnline);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'requests' | 'earnings'

  // Orders that are ready for pickup or on_the_way
  const pendingRequests = orders.filter((o) => o.status === 'ready' || o.status === 'preparing');
  const activeDelivery = orders.find((o) => o.status === 'on_the_way' && o.rider?.id === currentRider.id) || orders.find((o) => o.status === 'on_the_way');

  const handleToggleShift = () => {
    setIsOnline(!isOnline);
    toggleRiderOnline(currentRider.id);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!activeDelivery) return;

    const res = riderVerifyOTPAndDeliver(activeDelivery.id, enteredOtp);
    if (!res.success) {
      setOtpError(res.message);
    } else {
      setOtpError(null);
      setEnteredOtp('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Rider Header Bar with Online/Offline Toggle */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img 
            src={currentRider.avatar} 
            alt={currentRider.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FF6B35] shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#171717]">
                {currentRider.name}
              </h1>
              <span className="bg-[#FFF9EB] text-[#B87A00] font-black text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                <Star className="w-3 h-3 fill-[#FFC857] text-[#FFC857]" /> {currentRider.rating}
              </span>
            </div>
            <p className="text-xs text-[#6F7378] mt-0.5">
              {currentRider.vehicleType} • {currentRider.vehicleNumber} • {currentRider.deliveriesCount} Lifetime Trips
            </p>
          </div>
        </div>

        {/* Online / Offline Shift Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleShift}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center space-x-2 shadow-sm ${
              isOnline 
                ? 'bg-[#20B26B] hover:bg-[#1A9358] text-white' 
                : 'bg-[#6F7378] hover:bg-[#5A5D61] text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'RIDER ONLINE (READY)' : 'OFFLINE (ON BREAK)'}</span>
          </button>
        </div>
      </div>

      {/* Rider Shift KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EFE8DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F7378]">Today's Earnings</span>
          <h3 className="text-2xl font-black text-[#FF6B35] mt-0.5">₹765</h3>
          <span className="text-[10px] text-[#20B26B] font-bold">9 trips completed</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EFE8DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F7378]">Trip Incentive</span>
          <h3 className="text-2xl font-black text-[#171717] mt-0.5">+₹150</h3>
          <span className="text-[10px] text-[#FF6B35] font-bold">3 trips to next bonus</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EFE8DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F7378]">Active Requests</span>
          <h3 className="text-2xl font-black text-[#171717] mt-0.5">{pendingRequests.length}</h3>
          <span className="text-[10px] text-[#6F7378]">Nearby orders</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EFE8DE] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F7378]">Login Hours</span>
          <h3 className="text-2xl font-black text-[#171717] mt-0.5">5.4 hrs</h3>
          <span className="text-[10px] text-[#20B26B] font-bold">100% on-time delivery</span>
        </div>
      </div>

      {/* Main Delivery Partner Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Delivery with Turn-by-Turn GPS Map & OTP Delivery Proof */}
        <div className="lg:col-span-8 space-y-6">
          {activeDelivery ? (
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center font-bold">
                    🛵
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#171717]">
                      Active Order #{activeDelivery.id}
                    </h3>
                    <p className="text-[11px] text-[#20B26B] font-bold">EN ROUTE TO CUSTOMER</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-[#6F7378]">Trip Payout:</span>
                  <span className="text-sm font-black text-[#FF6B35] block">₹85.00</span>
                </div>
              </div>

              {/* Turn-by-Turn Route Navigation Map */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#20B26B]" />
                    Google Maps Turn-by-Turn Navigation
                  </span>
                  <span className="text-xs font-extrabold text-[#FF6B35]">
                    2.4 km remaining • 8 mins
                  </span>
                </div>

                <GoogleMapMock 
                  height="340px"
                  mode="rider_nav"
                  restaurant={activeDelivery.restaurant}
                  customer={activeDelivery.customer}
                  rider={currentRider}
                  status="on_the_way"
                />
              </div>

              {/* Waypoints: Pickup Restaurant & Drop Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pickup Point */}
                <div className="p-4 bg-[#FFF8EE] rounded-2xl border border-[#F2ECE1] space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#FF6B35]">1. PICKUP AT</span>
                  <h4 className="font-extrabold text-[#171717]">{activeDelivery.restaurant.name}</h4>
                  <p className="text-[11px] text-[#6F7378] truncate">{activeDelivery.restaurant.address}</p>
                  <a 
                    href={`tel:${activeDelivery.restaurant.phone || '+918041289000'}`}
                    className="inline-flex items-center gap-1 text-[#FF6B35] font-bold text-[11px] pt-1"
                  >
                    <Phone className="w-3 h-3" /> Call Restaurant Kitchen
                  </a>
                </div>

                {/* Drop Point */}
                <div className="p-4 bg-[#EBF8F1] rounded-2xl border border-[#20B26B]/30 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#20B26B]">2. DROP TO</span>
                  <h4 className="font-extrabold text-[#171717]">{activeDelivery.customer.name}</h4>
                  <p className="text-[11px] text-[#6F7378] truncate">{activeDelivery.customer.address}</p>
                  <a 
                    href={`tel:${activeDelivery.customer.phone}`}
                    className="inline-flex items-center gap-1 text-[#20B26B] font-bold text-[11px] pt-1"
                  >
                    <Phone className="w-3 h-3" /> Call Customer
                  </a>
                </div>
              </div>

              {/* Delivery Proof & Customer OTP Verification */}
              <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EFE8DE] space-y-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#20B26B]" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-[#171717]">
                    Delivery Completion Proof (Customer 4-Digit OTP)
                  </h4>
                </div>
                <p className="text-xs text-[#6F7378]">
                  Ask the customer for their 4-digit security code upon doorstep handover:
                </p>

                <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder={`Enter 4-digit OTP (e.g. ${activeDelivery.otp})`}
                    maxLength={4}
                    className="flex-1 font-mono text-center tracking-widest text-base font-black p-3 rounded-xl border border-[#EFE8DE] bg-white focus:outline-none focus:border-[#20B26B]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#20B26B] hover:bg-[#1A9358] text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VERIFY OTP & COMPLETE DELIVERY</span>
                  </button>
                </form>

                {otpError && (
                  <p className="text-xs text-[#FF3B30] font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {otpError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EFE8DE] shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center text-3xl mx-auto">
                🛵
              </div>
              <h3 className="font-black text-base text-[#171717]">No Active Delivery in Progress</h3>
              <p className="text-xs text-[#6F7378] max-w-sm mx-auto">
                Check the incoming requests queue on the right to accept your next food delivery and earn instant payouts.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Incoming Delivery Requests Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
              <h3 className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
                Available Trips ({pendingRequests.length})
              </h3>
              <span className="text-[10px] text-[#20B26B] font-bold">Auto-matching</span>
            </div>

            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-[#FFF8EE] border border-[#F2ECE1] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-black text-[#171717]">Order #{req.id}</span>
                  <span className="font-black text-[#FF6B35] text-sm">₹85 Payout</span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-[#171717]">Pickup: {req.restaurant.name}</p>
                  <p className="text-[11px] text-[#6F7378]">Distance: 2.1 km pickup • 3.8 km drop</p>
                  <p className="text-[11px] text-[#20B26B] font-bold">Est. Time: 22 mins</p>
                </div>

                <button
                  onClick={() => riderAcceptDelivery(req.id, currentRider.id)}
                  className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ACCEPT DELIVERY REQUEST</span>
                </button>
              </div>
            ))}

            {pendingRequests.length === 0 && (
              <div className="p-6 text-center text-xs text-[#8C8F94] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#EFE8DE]">
                No pending requests in your immediate radius.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryApp;
