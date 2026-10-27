import React, { useState } from 'react';
import { 
  Plus, Trash2, Power, Clock, Check, AlertCircle, 
  Search, Filter, Edit3, Layers, UtensilsCrossed, 
  Eye, EyeOff, ArrowUpDown, ChevronRight, CheckCircle2,
  X, Calendar, Sparkles, Loader2
} from 'lucide-react';
import { useShop } from '../context/ShopContext.jsx';
import { FoodCreationModal } from '../components/FoodCreationModal.jsx';
import { CategoryModal } from '../components/CategoryModal.jsx';

export const MenuManagerPage = ({ onOpenAddFood }) => {
  const {
    menuItems,
    toggleItemAvailability,
    deleteMenuItem,
    menuCategories,
    removeCategory,
    toggleCategoryStatus,
    toggleMenuItemSoldOut,
    updateMenuItemSchedule,
    loadFoods,
    loadCategories
  } = useShop();

  const [activeTab, setActiveTab] = useState('foods'); // 'foods' | 'categories'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [dietaryFilter, setDietaryFilter] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'SOLD_OUT' | 'OFFLINE'

  // Food Item Modal state
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  // Phase 22: Menu Scheduling Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingFood, setSchedulingFood] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    available_from_time: '',
    available_to_time: '',
    meal_periods: []
  });
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Category deletion warning modal state
  const [deleteWarning, setDeleteWarning] = useState('');

  // Helper: check if dish is currently within its schedule
  const getDishScheduleInfo = (item) => {
    const hasTimeWindow = Boolean(item.available_from_time && item.available_to_time);
    const hasMealPeriods = Array.isArray(item.meal_periods) && item.meal_periods.length > 0;
    
    if (!hasTimeWindow && !hasMealPeriods) {
      return { isScheduled: false, inWindow: true, label: '' };
    }

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    let inWindow = true;
    let label = '';

    if (hasTimeWindow) {
      const [fromH, fromM] = (item.available_from_time || '00:00').split(':').map(Number);
      const [toH, toM] = (item.available_to_time || '23:59').split(':').map(Number);
      const fromMin = fromH * 60 + fromM;
      const toMin = toH * 60 + toM;

      if (fromMin <= toMin) {
        inWindow = currentMin >= fromMin && currentMin <= toMin;
      } else {
        inWindow = currentMin >= fromMin || currentMin <= toMin;
      }
      label = `${item.available_from_time.slice(0, 5)} - ${item.available_to_time.slice(0, 5)}`;
    } else if (hasMealPeriods) {
      label = item.meal_periods.join(', ');
    }

    return { isScheduled: true, inWindow, label };
  };

  const handleOpenSchedule = (item) => {
    setSchedulingFood(item);
    setScheduleForm({
      available_from_time: item.available_from_time || '',
      available_to_time: item.available_to_time || '',
      meal_periods: Array.isArray(item.meal_periods) ? [...item.meal_periods] : []
    });
    setScheduleError(null);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!schedulingFood) return;
    setIsSavingSchedule(true);
    try {
      await updateMenuItemSchedule(schedulingFood.id, scheduleForm);
      setScheduleModalOpen(false);
      setSchedulingFood(null);
    } catch (err) {
      setScheduleError('Failed to update dish schedule: ' + (err.message || 'Error'));
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleOpenAddFood = () => {
    setEditingFood(null);
    setFoodModalOpen(true);
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
    setFoodModalOpen(true);
  };

  const handleDeleteFood = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from your restaurant menu?`)) {
      try {
        await deleteMenuItem(id);
      } catch (err) {
        setDeleteWarning(err?.message || `Failed to delete "${name}". Please try again.`);
      }
    }
  };

  const handleOpenAddCategory = (initialName = '') => {
    setEditingCategory(initialName ? { name: initialName, display_order: 0, is_active: true } : null);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (cat) => {
    // Check if food items depend on this category
    const dependentCount = menuItems.filter(f => 
      f.category === cat.id || 
      f.category_id === cat.id || 
      f.menu_category === cat.id ||
      f.category_name?.toLowerCase() === cat.name.toLowerCase()
    ).length;

    if (dependentCount > 0 || (cat.food_count && cat.food_count > 0)) {
      setDeleteWarning(
        `Cannot delete category "${cat.name}" because ${dependentCount || cat.food_count} food item(s) are assigned to it. Please reassign or delete the food items first.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        await removeCategory(cat.id);
      } catch (err) {
        setDeleteWarning(err.message || 'Cannot delete category.');
      }
    }
  };

  // Filtered Food Items
  const filteredFoods = menuItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategoryFilter === 'ALL' ||
      String(item.category) === String(selectedCategoryFilter) ||
      String(item.category_id) === String(selectedCategoryFilter) ||
      item.category_name?.toLowerCase() === selectedCategoryFilter.toLowerCase();

    const matchesDiet = dietaryFilter === 'ALL' ||
      (dietaryFilter === 'VEG' && (item.dietary_type === 'VEG' || item.is_veg === true)) ||
      (dietaryFilter === 'NON_VEG' && (item.dietary_type === 'NON_VEG' || item.is_veg === false));

    const matchesAvail = availabilityFilter === 'ALL' ||
      (availabilityFilter === 'AVAILABLE' && item.is_available !== false && !item.is_sold_out) ||
      (availabilityFilter === 'SOLD_OUT' && Boolean(item.is_sold_out)) ||
      (availabilityFilter === 'OFFLINE' && item.is_available === false) ||
      (availabilityFilter === 'ONLINE' && item.is_available !== false);

    return matchesSearch && matchesCategory && matchesDiet && matchesAvail;
  });

  const exampleCategories = [
    'Starters',
    'Main Course',
    'Biryani',
    'Rice',
    'Breads',
    'Desserts',
    'Drinks'
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px', paddingBottom: '60px' }}>
      
      {/* Category Deletion Warning Modal */}
      {deleteWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            borderRadius: '20px',
            border: '1px solid #EF4444',
            padding: '24px 28px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--ws-shadow-lg)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#EF4444'
            }}>
              <AlertCircle size={30} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px' }}>
              Category Deletion Blocked
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
              {deleteWarning}
            </p>
            <button
              onClick={() => setDeleteWarning('')}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px 32px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            MENU & FOOD CATALOG MANAGEMENT • PHASE 8
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
            Restaurant Menu Studio
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--ws-text-secondary)', margin: 0 }}>
            Manage your restaurant-owned menu categories, food items, prices, images, descriptions, and availability.
          </p>
        </div>

        {/* Tab Switcher & Quick Add Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'var(--ws-surface-subtle)',
            borderRadius: '14px',
            padding: '4px',
            border: '1px solid var(--ws-border)'
          }}>
            <button
              onClick={() => setActiveTab('foods')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'foods' ? 'var(--ws-surface)' : 'transparent',
                color: activeTab === 'foods' ? '#10B981' : 'var(--ws-text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'foods' ? 'var(--ws-shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <UtensilsCrossed size={15} />
              <span>Dishes ({menuItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'categories' ? 'var(--ws-surface)' : 'transparent',
                color: activeTab === 'categories' ? '#10B981' : 'var(--ws-text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'categories' ? 'var(--ws-shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={15} />
              <span>Categories ({menuCategories.length})</span>
            </button>
          </div>

          {activeTab === 'foods' ? (
            <button
              onClick={handleOpenAddFood}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 20px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={17} />
              <span>+ Add Dish</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddCategory('')}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '11px 20px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={17} />
              <span>+ Create Category</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: FOOD ITEMS / DISHES MANAGEMENT                         */}
      {/* ============================================================== */}
      {activeTab === 'foods' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filters Bar */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '12px',
              padding: '8px 14px',
              minWidth: '260px',
              flex: 1
            }}>
              <Search size={16} color="var(--ws-text-muted)" />
              <input
                type="text"
                placeholder="Search food by dish name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.85rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">All Categories ({menuCategories.length})</option>
                {menuCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Dietary Filter */}
              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">All Dietary</option>
                <option value="VEG">● Veg Only</option>
                <option value="NON_VEG">▲ Non-Veg Only</option>
              </select>

              {/* Availability Filter */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--ws-border)',
                  background: 'var(--ws-surface-subtle)',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              >
                <option value="ALL">All Availability</option>
                <option value="AVAILABLE">🟢 Available (In Stock)</option>
                <option value="SOLD_OUT">🟡 Sold Out (Today)</option>
                <option value="OFFLINE">🔴 Offline (Disabled)</option>
              </select>
            </div>
          </div>

          {/* Empty State */}
          {filteredFoods.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '24px',
              padding: '60px 24px',
              textAlign: 'center'
            }}>
              <UtensilsCrossed size={48} color="var(--ws-text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                No food items match your criteria
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', margin: '6px 0 20px' }}>
                {menuItems.length === 0 
                  ? 'Your menu is currently empty. Start by adding your signature dishes!' 
                  : 'Try resetting your search query or category filters.'}
              </p>
              <button
                onClick={handleOpenAddFood}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                + Add Your First Dish
              </button>
            </div>
          ) : (
            /* Foods Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: '22px'
            }}>
              {filteredFoods.map(item => {
                const isVeg = item.dietary_type === 'VEG' || item.is_veg === true;
                const isOffline = item.is_available === false;
                const isSoldOut = Boolean(item.is_sold_out);
                const catName = item.category_name || item.category || 'Artisan Dish';
                const sched = getDishScheduleInfo(item);

                let statusBadge = {
                  label: 'AVAILABLE',
                  color: '#10B981',
                  bg: 'rgba(16, 185, 129, 0.12)',
                  border: 'rgba(16, 185, 129, 0.3)'
                };
                if (isOffline) {
                  statusBadge = {
                    label: 'OFFLINE',
                    color: '#9CA3AF',
                    bg: 'rgba(156, 163, 175, 0.15)',
                    border: 'rgba(156, 163, 175, 0.3)'
                  };
                } else if (isSoldOut) {
                  statusBadge = {
                    label: 'SOLD OUT',
                    color: '#F59E0B',
                    bg: 'rgba(245, 158, 11, 0.15)',
                    border: 'rgba(245, 158, 11, 0.3)'
                  };
                }

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--ws-surface)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: 'var(--ws-shadow-sm)',
                      opacity: isOffline ? 0.65 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Dish Image Banner */}
                      <div style={{
                        position: 'relative',
                        height: '170px',
                        background: 'var(--ws-surface-subtle)',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
                          pointerEvents: 'none'
                        }} />

                        {/* Veg / Non-Veg Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: isVeg ? '#10B981' : '#EF4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}>
                          <span>{isVeg ? '● VEG' : '▲ NON-VEG'}</span>
                        </div>

                        {/* Display Order Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 800
                        }}>
                          Order #{item.display_order ?? 0}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div style={{ padding: '16px 18px 10px' }}>
                        {/* Category & 3-State Availability Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            background: 'var(--ws-surface-subtle)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--ws-text-muted)'
                          }}>
                            {catName}
                          </span>

                          {/* 3-State Badge: Available / Sold Out / Offline */}
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: statusBadge.color,
                            background: statusBadge.bg,
                            border: `1px solid ${statusBadge.border}`,
                            borderRadius: '6px',
                            padding: '2px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            ● {statusBadge.label}
                          </span>
                        </div>

                        {/* Dish Title */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                          {item.name}
                        </h3>

                        {/* Description */}
                        <p style={{
                          fontSize: '0.8rem',
                          color: 'var(--ws-text-secondary)',
                          margin: 0,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {item.description || item.full_description || item.short_description || 'Freshly prepared specialty dish with signature seasoning.'}
                        </p>

                        {/* Menu Schedule Badge */}
                        {sched.isScheduled && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: sched.inWindow ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            border: `1px solid ${sched.inWindow ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: sched.inWindow ? '#10B981' : '#D97706'
                          }}>
                            <Clock size={12} />
                            <span>⏰ {sched.label} • {sched.inWindow ? 'Serving Now' : 'Off Schedule'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Price & Quick Controls */}
                    <div style={{ padding: '0 18px 16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderTop: '1px solid var(--ws-border)',
                        marginBottom: '10px'
                      }}>
                        <div>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                            ₹{parseFloat(item.price).toFixed(2)}
                          </span>
                          <span style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: (item.stock ?? 50) < 10 ? '#EF4444' : 'var(--ws-text-muted)'
                          }}>
                            Stock: {item.stock ?? 50} left
                          </span>
                        </div>

                        {/* Quick Sold-Out & Status Controls */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => toggleMenuItemSoldOut(item.id, !item.is_sold_out)}
                            title={isSoldOut ? 'Mark dish in stock' : 'Mark dish temporarily sold out'}
                            style={{
                              background: isSoldOut ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                              border: `1px solid ${isSoldOut ? '#F59E0B' : 'rgba(16, 185, 129, 0.3)'}`,
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: isSoldOut ? '#D97706' : '#10B981',
                              cursor: 'pointer'
                            }}
                          >
                            {isSoldOut ? 'Sold Out' : 'In Stock'}
                          </button>

                          <button
                            onClick={() => toggleItemAvailability(item.id)}
                            title={isOffline ? 'Enable dish online' : 'Disable dish offline'}
                            style={{
                              background: !isOffline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              border: `1px solid ${!isOffline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: !isOffline ? '#10B981' : '#EF4444',
                              cursor: 'pointer'
                            }}
                          >
                            {!isOffline ? 'Active' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      {/* Edit, Schedule & Delete Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenSchedule(item)}
                          style={{
                            background: 'var(--ws-surface-subtle)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '8px',
                            padding: '7px 4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: 'var(--ws-text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Clock size={12} color="#10B981" />
                          <span>Hours</span>
                        </button>

                        <button
                          onClick={() => handleEditFood(item)}
                          style={{
                            background: 'var(--ws-surface-subtle)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '8px',
                            padding: '7px 4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: 'var(--ws-text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit3 size={12} color="#3B82F6" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteFood(item.id, item.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '7px 4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MENU CATEGORIES MANAGEMENT                              */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Quick Category Setup Suggestion Box */}
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '20px',
            padding: '20px 24px',
            boxShadow: 'var(--ws-shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Layers size={18} color="#10B981" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                Example Menu Categories (1-Click Create)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', margin: '0 0 14px' }}>
              Categories belong to your restaurant and organize dishes for customer browsing. Click any preset to quickly configure:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {exampleCategories.map(example => {
                const alreadyExists = menuCategories.some(c => c.name.toLowerCase() === example.toLowerCase());
                return (
                  <button
                    key={example}
                    disabled={alreadyExists}
                    onClick={() => handleOpenAddCategory(example)}
                    style={{
                      background: alreadyExists ? 'var(--ws-surface-subtle)' : 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid',
                      borderColor: alreadyExists ? 'var(--ws-border)' : 'rgba(16, 185, 129, 0.3)',
                      color: alreadyExists ? 'var(--ws-text-muted)' : '#10B981',
                      borderRadius: '10px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: alreadyExists ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{alreadyExists ? '✓ ' + example : '+ ' + example}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories List */}
          {menuCategories.length === 0 ? (
            <div style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '24px',
              padding: '60px 24px',
              textAlign: 'center'
            }}>
              <Layers size={48} color="var(--ws-text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                No categories created yet
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', margin: '6px 0 20px' }}>
                Create categories to organize your appetizers, entrees, desserts, and drinks.
              </p>
              <button
                onClick={() => handleOpenAddCategory('')}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                + Create Your First Category
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: '18px'
            }}>
              {menuCategories.map(cat => {
                const assignedDishes = menuItems.filter(f => 
                  f.category === cat.id || 
                  f.category_id === cat.id || 
                  f.menu_category === cat.id ||
                  f.category_name?.toLowerCase() === cat.name.toLowerCase()
                ).length;
                const count = cat.food_count !== undefined ? cat.food_count : assignedDishes;
                const isCatActive = cat.is_active !== false;

                return (
                  <div
                    key={cat.id}
                    style={{
                      background: 'var(--ws-surface)',
                      border: '1px solid var(--ws-border)',
                      borderRadius: '20px',
                      padding: '20px',
                      boxShadow: 'var(--ws-shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                      opacity: isCatActive ? 1 : 0.72
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
                              {cat.name}
                            </h3>
                            <span style={{
                              background: isCatActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isCatActive ? '#10B981' : '#EF4444',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '0.68rem',
                              fontWeight: 800
                            }}>
                              {isCatActive ? 'ACTIVE' : 'DISABLED'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                            Display Order #{cat.display_order ?? 0}
                          </span>
                        </div>

                        {/* Dishes Count Pill */}
                        <span style={{
                          background: 'var(--ws-surface-subtle)',
                          borderRadius: '10px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--ws-text-primary)'
                        }}>
                          {count} {count === 1 ? 'Dish' : 'Dishes'}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: '0.82rem', color: 'var(--ws-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {cat.description || 'No description provided for this category.'}
                      </p>
                    </div>

                    {/* Controls */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--ws-border)'
                    }}>
                      {/* Active Toggle Button */}
                      <button
                        onClick={() => toggleCategoryStatus(cat.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isCatActive ? '#10B981' : 'var(--ws-text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        {isCatActive ? <Eye size={15} /> : <EyeOff size={15} />}
                        <span>{isCatActive ? 'Hide Category' : 'Unhide Category'}</span>
                      </button>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditCategory(cat)}
                          style={{
                            background: 'var(--ws-surface-subtle)',
                            border: '1px solid var(--ws-border)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--ws-text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit3 size={13} color="#10B981" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          title="Delete category"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Food Creation & Editing Modal */}
      <FoodCreationModal
        isOpen={foodModalOpen}
        onClose={() => {
          setFoodModalOpen(false);
          setEditingFood(null);
        }}
        initialFood={editingFood}
        onSaved={() => loadFoods()}
      />

      {/* Category Creation & Editing Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        initialCategory={editingCategory}
        onSaved={() => loadCategories()}
      />

      {/* PHASE 22: DISH MEAL PERIOD & TIME SCHEDULING MODAL */}
      {scheduleModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  MENU TIME SCHEDULING
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '2px 0 0 0' }}>
                  {schedulingFood?.name}
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ws-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--ws-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Configure specific serving hours or meal periods (e.g. Breakfast-only specials). Customers cannot cart or order this dish outside these hours.
            </p>

            {scheduleError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#EF4444',
                fontSize: '0.82rem',
                fontWeight: 600
              }}>
                {scheduleError}
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '8px' }}>
                Quick Preset Templates
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: '🍳 Breakfast (07:00 - 11:00)', from: '07:00:00', to: '11:00:00', periods: ['BREAKFAST'] },
                  { label: '🍱 Lunch (12:00 - 15:30)', from: '12:00:00', to: '15:30:00', periods: ['LUNCH'] },
                  { label: '🍛 Dinner (18:30 - 23:00)', from: '18:30:00', to: '23:00:00', periods: ['DINNER'] },
                  { label: '🌙 Late Night (23:00 - 04:00)', from: '23:00:00', to: '04:00:00', periods: ['LATE_NIGHT'] }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setScheduleForm({
                      available_from_time: preset.from,
                      available_to_time: preset.to,
                      meal_periods: preset.periods
                    })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid var(--ws-border)',
                      background: 'var(--ws-surface-subtle)',
                      color: 'var(--ws-text-primary)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Window Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                  Available From (HH:MM)
                </label>
                <input
                  type="time"
                  value={scheduleForm.available_from_time ? scheduleForm.available_from_time.slice(0, 5) : ''}
                  onChange={(e) => setScheduleForm(prev => ({
                    ...prev,
                    available_from_time: e.target.value ? `${e.target.value}:00` : ''
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--ws-border)',
                    background: 'var(--ws-surface-subtle)',
                    color: 'var(--ws-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '4px' }}>
                  Available To (HH:MM)
                </label>
                <input
                  type="time"
                  value={scheduleForm.available_to_time ? scheduleForm.available_to_time.slice(0, 5) : ''}
                  onChange={(e) => setScheduleForm(prev => ({
                    ...prev,
                    available_to_time: e.target.value ? `${e.target.value}:00` : ''
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--ws-border)',
                    background: 'var(--ws-surface-subtle)',
                    color: 'var(--ws-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Meal Periods Checkbox Group */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ws-text-primary)', display: 'block', marginBottom: '6px' }}>
                Meal Periods Flag
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['BREAKFAST', 'LUNCH', 'DINNER', 'LATE_NIGHT'].map(period => {
                  const isChecked = (scheduleForm.meal_periods || []).includes(period);
                  return (
                    <label key={period} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--ws-text-primary)'
                    }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const curr = scheduleForm.meal_periods || [];
                          const next = e.target.checked ? [...curr, period] : curr.filter(p => p !== period);
                          setScheduleForm(prev => ({ ...prev, meal_periods: next }));
                        }}
                        style={{ accentColor: '#10B981' }}
                      />
                      <span>{period}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Clear Restriction Option */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={() => setScheduleForm({
                  available_from_time: null,
                  available_to_time: null,
                  meal_periods: []
                })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Clear Schedule (Make Available 24/7)
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid var(--ws-border)',
                  background: 'transparent',
                  color: 'var(--ws-text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isSavingSchedule ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
