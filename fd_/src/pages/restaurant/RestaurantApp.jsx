import React, { useState } from 'react';
import { 
  Store, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Flame, 
  TrendingUp, 
  Package, 
  Bell, 
  ChefHat, 
  Utensils, 
  AlertCircle, 
  Check, 
  X,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useFoodEcosystem } from '../../context/FoodEcosystemContext.jsx';

export const RestaurantApp = () => {
  const { 
    restaurants, 
    dishes, 
    orders, 
    restaurantAcceptOrder, 
    restaurantMarkReady, 
    addDish, 
    toggleDishAvailability 
  } = useFoodEcosystem();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu' | 'analytics'
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [addFoodModalOpen, setAddFoodModalOpen] = useState(false);

  // Form state for adding dish
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('biryani');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);
  const [newDishSpice, setNewDishSpice] = useState(2);
  const [newDishPrep, setNewDishPrep] = useState('20');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishIngredients, setNewDishIngredients] = useState('');

  const currentRestaurant = restaurants[0]; // "WS Dum Biryani House"

  // Filter orders relevant to this restaurant
  const incomingOrders = orders.filter((o) => o.status === 'placed');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready' || o.status === 'on_the_way');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const restaurantDishes = dishes.filter((d) => d.restaurantId === currentRestaurant.id || !d.restaurantId);

  const handleCreateDish = (e) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice) return;

    addDish({
      name: newDishName,
      restaurantId: currentRestaurant.id,
      restaurantName: currentRestaurant.name,
      category: newDishCategory,
      price: parseInt(newDishPrice, 10),
      originalPrice: Math.round(parseInt(newDishPrice, 10) * 1.2),
      discount: '15% OFF',
      isVeg: newDishVeg,
      spiceLevel: newDishSpice,
      prepTime: parseInt(newDishPrep, 10),
      shortDescription: newDishDesc || 'Freshly prepared specialty dish.',
      ingredients: newDishIngredients ? newDishIngredients.split(',').map(s => s.trim()) : ['Spices', 'Fresh Herbs'],
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      addOns: [
        { id: 'addon-extra-curd', name: 'Fresh Raita Dip', price: 25 },
      ],
      isAvailable: true,
    });

    setAddFoodModalOpen(false);
    setNewDishName('');
    setNewDishPrice('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
      {/* Top Restaurant Partner Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF2EB] text-[#FF6B35] flex items-center justify-center text-2xl border border-[#FF6B35]/20 shadow-xs">
            🏪
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#171717]">
                {currentRestaurant.name}
              </h1>
              <span className="bg-[#EBF8F1] text-[#20B26B] font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
                Verified Partner
              </span>
            </div>
            <p className="text-xs text-[#6F7378] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
              {currentRestaurant.address} • ⭐ {currentRestaurant.rating} ({currentRestaurant.reviewCount} reviews)
            </p>
          </div>
        </div>

        {/* Store Open / Closed Switch & Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsStoreOpen(!isStoreOpen)}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 border ${
              isStoreOpen 
                ? 'bg-[#EBF8F1] text-[#20B26B] border-[#20B26B]' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-[#20B26B] animate-pulse' : 'bg-red-600'}`} />
            <span>{isStoreOpen ? 'KITCHEN OPEN FOR ORDERS' : 'STORE CLOSED'}</span>
          </button>

          <button
            onClick={() => setAddFoodModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-[#FF6B35] hover:bg-[#E85A27] text-white text-xs font-black shadow-md shadow-[#FF6B35]/25 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-[#EFE8DE] pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
            activeTab === 'orders' 
              ? 'bg-[#FF6B35] text-white shadow-sm' 
              : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Live Orders Queue ({incomingOrders.length + preparingOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
            activeTab === 'menu' 
              ? 'bg-[#FF6B35] text-white shadow-sm' 
              : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu & Stock Management</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
            activeTab === 'analytics' 
              ? 'bg-[#FF6B35] text-white shadow-sm' 
              : 'text-[#6F7378] hover:text-[#171717]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sales & Payouts</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* New Incoming Order Audio/Banner Alert */}
          {incomingOrders.length > 0 && (
            <div className="p-4 bg-[#FFF2EB] border-2 border-[#FF6B35] rounded-3xl flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="font-black text-sm text-[#FF6B35]">
                    {incomingOrders.length} New Incoming Food Order Waiting for Kitchen Acceptance!
                  </h3>
                  <p className="text-xs text-[#6F7378]">
                    Accept promptly to ensure guaranteed 20-minute delivery promise.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: NEW INCOMING ORDERS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                <h3 className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] animate-ping" />
                  New Orders ({incomingOrders.length})
                </h3>
              </div>

              {incomingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl p-5 border border-[#FF6B35]/30 shadow-md space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black text-[#171717]">#{order.id}</span>
                    <span className="text-[10px] bg-[#FFF2EB] text-[#FF6B35] font-black px-2 py-0.5 rounded-full uppercase">
                      JUST PLACED
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="text-xs">
                    <p className="font-extrabold text-[#171717]">{order.customer.name}</p>
                    <p className="text-[11px] text-[#6F7378] truncate">{order.customer.address}</p>
                  </div>

                  {/* Items */}
                  <div className="bg-[#FFF8EE] rounded-2xl p-3 border border-[#F2ECE1] space-y-1 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-semibold">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="text-[#FF6B35]">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs font-black">
                    <span>Total Amount:</span>
                    <span className="text-sm text-[#FF6B35]">₹{order.grandTotal}</span>
                  </div>

                  {/* Accept Order CTA */}
                  <button
                    onClick={() => restaurantAcceptOrder(order.id)}
                    className="w-full py-2.5 rounded-xl bg-[#20B26B] hover:bg-[#1A9358] text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>ACCEPT & START COOKING</span>
                  </button>
                </div>
              ))}

              {incomingOrders.length === 0 && (
                <div className="p-8 text-center text-xs text-[#8C8F94] bg-white rounded-3xl border border-dashed border-[#EFE8DE]">
                  No new pending orders in queue.
                </div>
              )}
            </div>

            {/* COLUMN 2: IN KITCHEN / PREPARING */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                <h3 className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFC857]" />
                  In Kitchen ({preparingOrders.length})
                </h3>
              </div>

              {preparingOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl p-5 border border-[#FFE7A8] shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black text-[#171717]">#{order.id}</span>
                    <span className="text-[10px] bg-[#FFF9EB] text-[#B87A00] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> PREPARING
                    </span>
                  </div>

                  <div className="text-xs">
                    <p className="font-extrabold text-[#171717]">{order.customer.name}</p>
                    <p className="text-[11px] text-[#6F7378]">{order.items.length} items being cooked</p>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-2xl p-3 border border-[#EFE8DE] space-y-1 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-semibold">
                        <span>{it.quantity}x {it.name}</span>
                        <span>₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mark Ready CTA */}
                  <button
                    onClick={() => restaurantMarkReady(order.id)}
                    className="w-full py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>MARK READY FOR PICKUP</span>
                  </button>
                </div>
              ))}

              {preparingOrders.length === 0 && (
                <div className="p-8 text-center text-xs text-[#8C8F94] bg-white rounded-3xl border border-dashed border-[#EFE8DE]">
                  No dishes currently in active preparation.
                </div>
              )}
            </div>

            {/* COLUMN 3: READY / RIDER DISPATCH */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                <h3 className="font-extrabold text-sm text-[#171717] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#20B26B]" />
                  Out for Delivery ({readyOrders.length})
                </h3>
              </div>

              {readyOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-3xl p-5 border border-[#EFE8DE] shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black text-[#171717]">#{order.id}</span>
                    <span className="text-[10px] bg-[#EBF8F1] text-[#20B26B] font-black px-2 py-0.5 rounded-full uppercase">
                      {order.status === 'ready' ? 'WAITING FOR RIDER' : 'ON THE WAY'}
                    </span>
                  </div>

                  <div className="text-xs">
                    <p className="font-extrabold text-[#171717]">Rider: {order.rider?.name || 'Assigned'}</p>
                    <p className="text-[11px] text-[#6F7378]">{order.rider?.vehicle || 'Hero Splendor'}</p>
                  </div>

                  <div className="p-2.5 bg-[#FFF8EE] rounded-xl text-[11px] text-[#6F7378]">
                    <span>Drop address: {order.customer.address}</span>
                  </div>
                </div>
              ))}

              {readyOrders.length === 0 && (
                <div className="p-8 text-center text-xs text-[#8C8F94] bg-white rounded-3xl border border-dashed border-[#EFE8DE]">
                  No orders currently out with delivery partners.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU & STOCK MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-[#171717]">Restaurant Menu Catalog</h3>
              <p className="text-xs text-[#6F7378]">Manage live stock availability, pricing and variants</p>
            </div>
            <button
              onClick={() => setAddFoodModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-black shadow-sm"
            >
              + Add Dish
            </button>
          </div>

          <div className="divide-y divide-[#F2ECE1]">
            {restaurantDishes.map((dish) => (
              <div key={dish.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <img 
                    src={dish.image} 
                    alt={dish.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-[#F4F1EA]"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-[2px] border-2 flex items-center justify-center ${
                        dish.isVeg ? 'border-[#20B26B]' : 'border-[#FF3B30]'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${dish.isVeg ? 'bg-[#20B26B]' : 'bg-[#FF3B30]'}`} />
                      </div>
                      <h4 className="font-extrabold text-sm text-[#171717]">{dish.name}</h4>
                    </div>
                    <p className="text-xs text-[#6F7378]">{dish.category} • {dish.prepTime}m prep</p>
                    <p className="text-xs font-black text-[#FF6B35] mt-0.5">₹{dish.price}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleDishAvailability(dish.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                      dish.isAvailable !== false
                        ? 'bg-[#EBF8F1] text-[#20B26B] border-[#20B26B]'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {dish.isAvailable !== false ? 'IN STOCK' : 'OUT OF STOCK'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SALES & REVENUE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F7378]">Today's Total Sales</span>
              <h2 className="text-3xl font-black text-[#FF6B35] mt-1">₹14,840</h2>
              <span className="text-[11px] text-[#20B26B] font-bold">+18% from yesterday</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F7378]">Orders Completed</span>
              <h2 className="text-3xl font-black text-[#171717] mt-1">{orders.length + 38}</h2>
              <span className="text-[11px] text-[#6F7378] font-bold">Avg prep time: 18m</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DE] shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F7378]">Customer Rating</span>
              <h2 className="text-3xl font-black text-[#FFC857] mt-1">4.85 ★</h2>
              <span className="text-[11px] text-[#6F7378] font-bold">Based on 1,420 reviews</span>
            </div>
          </div>
        </div>
      )}

      {/* ADD FOOD MODAL */}
      {addFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EFE8DE] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
              <h3 className="font-black text-lg text-[#171717]">Add New Dish to Menu</h3>
              <button onClick={() => setAddFoodModalOpen(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-black" />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#6F7378] mb-1">Dish Name</label>
                <input 
                  type="text" 
                  value={newDishName} 
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Mutton Galouti Kebab"
                  className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6F7378] mb-1">Category</label>
                  <select 
                    value={newDishCategory} 
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                  >
                    <option value="biryani">Biryani</option>
                    <option value="pizza">Pizza</option>
                    <option value="burger">Burger</option>
                    <option value="north-indian">North Indian</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#6F7378] mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    value={newDishPrice} 
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    placeholder="280"
                    className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6F7378] mb-1">Preparation Time (mins)</label>
                  <input 
                    type="number" 
                    value={newDishPrep} 
                    onChange={(e) => setNewDishPrep(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#6F7378] mb-1">Dietary Type</label>
                  <select 
                    value={newDishVeg ? 'veg' : 'non-veg'} 
                    onChange={(e) => setNewDishVeg(e.target.value === 'veg')}
                    className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                  >
                    <option value="veg">Pure Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#6F7378] mb-1">Fresh Ingredients (comma separated)</label>
                <input 
                  type="text" 
                  value={newDishIngredients} 
                  onChange={(e) => setNewDishIngredients(e.target.value)}
                  placeholder="Cardamom, pure ghee, saffron, tender meat"
                  className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#6F7378] mb-1">Description</label>
                <textarea 
                  value={newDishDesc} 
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  placeholder="Slow cooked with royal spices..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-[#EFE8DE] bg-[#FFF8EE] font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FF6B35] hover:bg-[#E85A27] text-white font-black text-xs shadow-md mt-2"
              >
                Publish Dish to Menu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantApp;
