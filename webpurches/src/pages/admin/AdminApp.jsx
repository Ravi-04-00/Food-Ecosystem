import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Store, 
  Bike, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Search, 
  Eye, 
  TrendingUp,
  SlidersHorizontal,
  Filter
} from 'lucide-react';
import { useFoodEcosystem } from '../../context/FoodEcosystemContext.jsx';
import { GoogleMapMock } from '../../components/GoogleMapMock.jsx';

export const AdminApp = () => {
  const { restaurants, riders, orders, categories, dishes } = useFoodEcosystem();

  const [activeAdminTab, setActiveAdminTab] = useState('live_map'); // 'live_map' | 'restaurants' | 'riders' | 'orders'

  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0) + 142800;
  const activeOrdersCount = orders.filter((o) => o.status !== 'delivered').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Admin Title & Master Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#20B26B] text-white flex items-center justify-center font-black">
              ⚙️
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#171717]">
              FD FOODS Admin Control Center
            </h1>
          </div>
          <p className="text-xs text-[#6F7378] mt-1">
            Real-time ecosystem command center monitoring restaurants, delivery riders, live routing, and security.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#20B26B] animate-pulse" />
          <span className="text-xs font-black text-[#20B26B] bg-[#EBF8F1] px-3 py-1.5 rounded-xl border border-[#20B26B]/30">
            SYSTEM HEALTH: 100% OPERATIONAL
          </span>
        </div>
      </div>

      {/* Global Ecosystem KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F7378]">
            <span>Gross Merchandise Value</span>
            <DollarSign className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mt-1">
            ₹{totalRevenue.toLocaleString()}
          </h2>
          <span className="text-[11px] text-[#20B26B] font-bold mt-1 block">
            +24.6% this week
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F7378]">
            <span>Active Live Deliveries</span>
            <Bike className="w-4 h-4 text-[#20B26B]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#FF6B35] mt-1">
            {activeOrdersCount} Live
          </h2>
          <span className="text-[11px] text-[#6F7378] mt-1 block">
            Avg trip duration: 19 mins
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F7378]">
            <span>Active Restaurants</span>
            <Store className="w-4 h-4 text-[#FFC857]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mt-1">
            {restaurants.length} Verified
          </h2>
          <span className="text-[11px] text-[#20B26B] font-bold mt-1 block">
            0 pending dispute tickets
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F7378]">
            <span>Rider Fleet Online</span>
            <Users className="w-4 h-4 text-[#20B26B]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#20B26B] mt-1">
            {riders.filter(r => r.isOnline).length} Active
          </h2>
          <span className="text-[11px] text-[#6F7378] mt-1 block">
            99.2% fulfillment rate
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex space-x-2 border-b border-[#EFE8DE] pb-2">
        <button
          onClick={() => setActiveAdminTab('live_map')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'live_map' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          🗺️ Live City Google Map
        </button>

        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'orders' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          📦 All Ecosystem Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('restaurants')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'restaurants' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          🏪 Restaurant Partners ({restaurants.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('riders')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeAdminTab === 'riders' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          🛵 Fleet & Riders ({riders.length})
        </button>
      </div>

      {/* 1. ADMIN LIVE MAP */}
      {activeAdminTab === 'live_map' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-[#171717]">
                Live City Fleet & Orders Tracking Map
              </h3>
              <p className="text-xs text-[#6F7378]">
                Real-time geographic distribution of restaurant hubs, motorcycle riders, and customer destinations.
              </p>
            </div>
            <span className="text-xs font-bold text-[#FF6B35]">
              Google Maps Platform Real-Time Feed
            </span>
          </div>

          <GoogleMapMock 
            height="440px"
            mode="admin"
            status="on_the_way"
          />
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TABLE */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
          <h3 className="font-black text-base text-[#171717]">Live & Historical Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8EE] text-[#6F7378] font-bold uppercase tracking-wider border-b border-[#EFE8DE]">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE1]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FFF8EE]/50">
                    <td className="p-3 font-mono font-black text-[#171717]">#{o.id}</td>
                    <td className="p-3 font-semibold">{o.restaurant.name}</td>
                    <td className="p-3 text-[#6F7378]">{o.customer.name}</td>
                    <td className="p-3 font-medium">{o.items.length} items</td>
                    <td className="p-3 font-black text-[#FF6B35]">₹{o.grandTotal}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        o.status === 'delivered' ? 'bg-[#EBF8F1] text-[#20B26B]' : 'bg-[#FFF2EB] text-[#FF6B35]'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-[#20B26B] font-bold">{o.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RESTAURANTS APPROVAL TABLE */}
      {activeAdminTab === 'restaurants' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
          <h3 className="font-black text-base text-[#171717]">Onboarded Restaurant Hubs</h3>
          <div className="divide-y divide-[#F2ECE1]">
            {restaurants.map((r) => (
              <div key={r.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <img 
                    src={r.avatar} 
                    alt={r.name}
                    className="w-12 h-12 rounded-2xl object-cover bg-[#F4F1EA]"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-[#171717]">{r.name}</h4>
                    <p className="text-xs text-[#6F7378]">{r.address}</p>
                    <span className="text-[10px] text-[#FF6B35] font-bold">{r.cuisines.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="bg-[#EBF8F1] text-[#20B26B] font-bold px-2.5 py-1 rounded-xl">
                    Verified & Live
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RIDERS FLEET */}
      {activeAdminTab === 'riders' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
          <h3 className="font-black text-base text-[#171717]">Delivery Fleet Logistics</h3>
          <div className="divide-y divide-[#F2ECE1]">
            {riders.map((r) => (
              <div key={r.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <img 
                    src={r.avatar} 
                    alt={r.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-[#20B26B]"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-[#171717]">{r.name}</h4>
                    <p className="text-xs text-[#6F7378]">{r.vehicleType} • {r.vehicleNumber}</p>
                    <span className="text-[10px] text-[#B87A00] font-bold">⭐ {r.rating} ({r.deliveriesCount} trips)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className={`px-2.5 py-1 rounded-xl font-bold ${
                    r.isOnline ? 'bg-[#EBF8F1] text-[#20B26B]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {r.isOnline ? 'Online (Shift Active)' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApp;
