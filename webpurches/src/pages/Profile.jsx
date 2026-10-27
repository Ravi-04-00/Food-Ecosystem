import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, User, Package, Heart, LogOut, MapPin, Award, CreditCard, Sparkles } from 'lucide-react';

export const Profile = ({ onNavigateOrders }) => {
  const { user, logout } = useAuth();

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#EFE8DE]">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#52B788] font-bold block mb-1">
            FD FOODS ACCOUNT
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#171717]">
            Customer <span className="text-[#163D2B]">Profile</span>
          </h1>
        </div>

        <button
          onClick={logout}
          className="text-xs font-bold text-[#FF3B30] hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 flex items-center space-x-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="p-8 rounded-3xl bg-white border border-[#E1EBE3] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt="Avatar"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#52B788]"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-black text-[#171717]">{user?.name || 'Priya Sharma'}</h3>
              <ShieldCheck className="w-4 h-4 text-[#52B788]" />
            </div>
            <span className="text-xs text-[#6F7378] font-semibold block mt-0.5">{user?.email || 'priya.sharma@example.com'}</span>
            <span className="text-xs text-[#6F7378] font-semibold block">+91 98450 77123</span>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D8F3DC] text-[#163D2B] text-[10px] font-black uppercase border border-[#B7E4C7]">
                ★ FD FOODS ROYAL MEMBER
              </span>
              <span className="text-[10px] text-[#52B788] font-bold">Free Deliveries Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateOrders}
            className="px-5 py-2.5 rounded-2xl bg-[#163D2B] hover:bg-[#1B4332] text-white text-xs font-black shadow-md shadow-[#163D2B]/25 transition-all"
          >
            My Food Orders
          </button>
        </div>
      </div>

      {/* Loyalty & Saved Addresses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet & Rewards */}
        <div className="bg-white rounded-3xl p-6 border border-[#E1EBE3] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sm text-[#171717] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#52B788]" />
              FD Foods Wallet & Coins
            </h4>
            <span className="text-xs font-black text-[#52B788]">₹150 Balance</span>
          </div>

          <div className="p-4 bg-[#FFF8EE] rounded-2xl border border-[#F2ECE1] space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-[#6F7378]">Earned Coins:</span>
              <span className="text-[#FF6B35]">450 Coins (= ₹45 off)</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-[#6F7378]">Referral Bonus:</span>
              <span className="text-[#20B26B]">Active (Share Code: PRIYA50)</span>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-4">
          <h4 className="font-black text-sm text-[#171717] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF6B35]" />
            Saved Delivery Addresses
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#FFF8EE] rounded-2xl border border-[#F2ECE1]">
              <span className="font-black text-[#FF6B35] uppercase text-[10px] block">HOME (DEFAULT)</span>
              <p className="font-semibold text-[#171717] mt-0.5">Apartment 4B, 12th Main Indiranagar, Bengaluru - 560038</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#EFE8DE]">
              <span className="font-black text-[#6F7378] uppercase text-[10px] block">WORK</span>
              <p className="font-semibold text-[#171717] mt-0.5">WeWork Embassy GolfLinks, Intermediate Ring Road</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
