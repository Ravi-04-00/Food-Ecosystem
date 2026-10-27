import React, { useEffect, useState } from 'react';
import {
  fetchAdminRestaurants,
  fetchAdminDishes,
  createAdminDish,
  updateAdminDish,
  deleteAdminDish,
  fetchAdminMenuCategories
} from '../services/api.js';

/** Admin dish management: pick a restaurant, manage its dishes (real APIs). */
export const AdminDishesPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', is_available: true });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchAdminRestaurants({ page_size: 100 }).then(
      r => setRestaurants(r?.results || r || []),
      () => setRestaurants([]));
  }, []);

  const loadDishes = async (rid) => {
    if (!rid) return;
    setLoading(true);
    setError(null);
    try {
      const [d, c] = await Promise.all([
        fetchAdminDishes(rid), fetchAdminMenuCategories(rid)]);
      setDishes(d);
      setCategories(c);
    } catch (err) {
      setError(err?.message || 'Failed to load dishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDishes([]);
    setCategories([]);
    setEditing(null);
    if (restaurantId) loadDishes(restaurantId);
  }, [restaurantId]);

  const startEdit = (dish) => {
    setEditing(dish);
    setForm({
      name: dish.name || '',
      price: dish.price ?? '',
      category: dish.category_id || dish.category || '',
      description: dish.description || dish.short_description || '',
      is_available: dish.is_available !== false
    });
    setImageFile(null);
    setFormError(null);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', price: '', category: '', description: '', is_available: true });
    setImageFile(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) {
      setFormError('Select a restaurant first.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Dish name is required.');
      return;
    }
    if (!(Number(form.price) > 0)) {
      setFormError('Price must be greater than zero.');
      return;
    }
    if (!form.category) {
      setFormError('Select a menu category.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('price', Number(form.price).toFixed(2));
      fd.append('category', form.category);
      fd.append('restaurant_id', restaurantId);
      fd.append('description', form.description.trim());
      fd.append('is_available', form.is_available);
      if (imageFile) fd.append('food_image', imageFile);
      if (editing) {
        await updateAdminDish(editing.id, fd);
      } else {
        await createAdminDish(fd);
      }
      resetForm();
      await loadDishes(restaurantId);
    } catch (err) {
      setFormError(err?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dish) => {
    if (!window.confirm(`Delete "${dish.name}"? Order history keeps its snapshot.`)) return;
    try {
      await deleteAdminDish(dish.id);
      await loadDishes(restaurantId);
    } catch (err) {
      setError(err?.message || 'Delete failed.');
    }
  };

  const toggleAvailable = async (dish) => {
    try {
      await updateAdminDish(dish.id, { is_available: !dish.is_available });
      await loadDishes(restaurantId);
    } catch (err) {
      setError(err?.message || 'Update failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '60px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>Menu Dishes</h1>
        <div style={{ fontSize: '0.84rem', color: '#6E6259' }}>
          Pick a restaurant, then add or edit its dishes. Saved only after backend confirmation.
        </div>
      </div>

      <div style={{ background: '#fff', border: '2.5px solid #241A17', borderRadius: '18px', padding: '18px', boxShadow: '0 4px 0 #241A17' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>
          Restaurant *
          <select value={restaurantId} onChange={e => setRestaurantId(e.target.value)}
            style={{ display: 'block', width: '100%', maxWidth: '420px', marginTop: '6px', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
            <option value="">Select a restaurant…</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.verification_status})</option>
            ))}
          </select>
        </label>
      </div>

      {restaurantId && (
        <div style={{ background: '#fff', border: '2.5px solid #241A17', borderRadius: '18px', padding: '18px', boxShadow: '0 4px 0 #241A17' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{editing ? 'Edit Dish' : 'Add Dish'}</h3>
          {formError && <div style={{ color: '#B91C1C', fontWeight: 700, marginBottom: '10px' }}>{formError}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Dish name *
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Price (₹) *
              <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Category *
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                <option value="">{categories.length ? 'Select…' : 'No categories — create one in the restaurant app'}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Dish photo
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
                style={{ display: 'block', marginTop: '4px' }} />
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, gridColumn: '1 / -1' }}>Description
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                style={{ display: 'block', width: '100%', marginTop: '4px', padding: '9px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
            </label>
            <label style={{ fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="checkbox" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} />
              Available for ordering
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="submit" disabled={saving}
                style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#15803D', color: '#fff', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Dish'}
              </button>
              {editing && (
                <button type="button" onClick={resetForm}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {restaurantId && (
        <div style={{ background: '#fff', border: '2.5px solid #241A17', borderRadius: '18px', padding: '18px', boxShadow: '0 4px 0 #241A17' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Dishes ({dishes.length})</h3>
          {loading && <div>Loading…</div>}
          {error && <div style={{ color: '#B91C1C', fontWeight: 700 }}>{error}</div>}
          {!loading && !error && dishes.length === 0 && <div>No dishes yet. Add the first one above.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dishes.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.84rem' }}>
                <span><strong>{d.name}</strong> · ₹{d.price} · {d.category_name || ''} · {d.is_available ? 'Available' : 'Hidden'}</span>
                <span style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => startEdit(d)} style={{ cursor: 'pointer' }}>Edit</button>
                  <button type="button" onClick={() => toggleAvailable(d)} style={{ cursor: 'pointer' }}>
                    {d.is_available ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => handleDelete(d)} style={{ cursor: 'pointer', color: '#B91C1C' }}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
