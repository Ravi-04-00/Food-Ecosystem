import React, { useEffect, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import {
  fetchDeliverySlots,
  fetchScheduledOrders,
  createScheduledOrder,
  cancelScheduledOrder
} from '../services/api.js';

/** Schedule-current-cart-in-a-future-slot + my scheduled orders (cancel). */
export const ScheduleSection = () => {
  const { cart = [], cartRestaurant, selectedAddress } = useCustomer();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotId, setSlotId] = useState('');
  const [mine, setMine] = useState([]);
  const [msg, setMsg] = useState(null);
  const [booking, setBooking] = useState(false);

  const load = async () => {
    if (!cartRestaurant?.id) return;
    setLoading(true);
    try {
      setSlots(await fetchDeliverySlots(cartRestaurant.id));
      setMine(await fetchScheduledOrders());
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Failed to load slots' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [cartRestaurant?.id]);

  const book = async () => {
    if (!slotId) {
      setMsg({ type: 'error', text: 'Pick a delivery slot first.' });
      return;
    }
    if (!cart.length) {
      setMsg({ type: 'error', text: 'Your cart is empty.' });
      return;
    }
    setBooking(true);
    setMsg(null);
    try {
      const items = cart.map(it => ({
        food_item_id: it?.product?.id ?? it?.product_id ?? it?.food_id ?? it?.id,
        quantity: it?.quantity || 1
      })).filter(i => i.food_item_id);
      const created = await createScheduledOrder({
        restaurant_id: cartRestaurant.id,
        slot_id: Number(slotId),
        items,
        address_id: selectedAddress?.id,
        idempotency_key: `SCH-UI-${Date.now()}`
      });
      setMsg({ type: 'success', text: `Scheduled for ${created.slot_start}. Pay on release — nothing charged yet.` });
      setSlotId('');
      setMine(await fetchScheduledOrders());
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Scheduling failed' });
    } finally {
      setBooking(false);
    }
  };

  const cancel = async (id) => {
    try {
      await cancelScheduledOrder(id, 'Changed my mind');
      setMine(await fetchScheduledOrders());
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Cancel failed' });
    }
  };

  if (!cartRestaurant?.id) return null;

  return (
    <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '20px', padding: '20px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarClock size={17} /> Schedule for Later
      </h3>
      <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginBottom: '12px' }}>
        Book a future slot. Stock, hours and price are re-checked at release; payment stays pending until then.
      </div>
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '10px', fontWeight: 700, fontSize: '0.82rem',
          background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          color: msg.type === 'error' ? '#EF4444' : '#15803D' }}>
          {msg.text}
        </div>
      )}
      {loading && <div style={{ color: '#64748B' }}>Loading slots…</div>}
      {!loading && slots.length === 0 && (
        <div style={{ color: '#64748B', fontSize: '0.84rem' }}>No future slots for this restaurant yet.</div>
      )}
      {slots.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={slotId} onChange={e => setSlotId(e.target.value)}
            style={{ flex: '1 1 220px', padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--ws-border)' }}>
            <option value="">Choose a slot…</option>
            {slots.map(s => (
              <option key={s.id} value={s.id}>
                {new Date(s.slot_start).toLocaleString()} · {s.spots_left} spots left
              </option>
            ))}
          </select>
          <button type="button" onClick={book} disabled={booking}
            style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#22C55E', color: '#fff', fontWeight: 800, cursor: booking ? 'wait' : 'pointer' }}>
            {booking ? 'Booking…' : 'Book Slot'}
          </button>
        </div>
      )}
      {mine.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mine.filter(m => m.status === 'CONFIRMED').map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px', background: 'var(--ws-surface-subtle)' }}>
              <span>#{m.id} · {m.slot_start ? new Date(m.slot_start).toLocaleString() : ''} · ₹{m.grand_total}</span>
              <button type="button" onClick={() => cancel(m.id)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <X size={13} /> Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
