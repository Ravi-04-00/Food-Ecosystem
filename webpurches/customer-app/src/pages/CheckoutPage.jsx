import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, Smartphone, 
  Wallet, Banknote, Building2, Lock, Sparkles, MapPin, Store, 
  AlertCircle, ChefHat, Clock, ShoppingBag, ChevronRight, Check,
  RefreshCw, XCircle, AlertTriangle, ExternalLink, Tag, Award, Percent, X
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext.jsx';
import { 
  apiInitializePayment, 
  apiVerifyPayment, 
  apiReportPaymentFailure,
  validateCouponCode,
  fetchCustomerLoyalty
} from '../services/api.js';
import { OffersModal } from '../components/OffersModal.jsx';
import { ScheduleSection } from '../components/ScheduleSection.jsx';

export const CheckoutPage = ({ onOrderSuccess, onBackToCart, onOpenAddressModal }) => {
  const { 
    cart = [], 
    cartRestaurant,
    cartSubtotal = 0,
    cartDeliveryFee = 30,
    cartPackagingFee = 15,
    cartGrandTotal = 0,
    selectedAddress,
    checkoutOrder,
    isPlacingOrder,
    orderError,
    setOrderError
  } = useCustomer();

  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [cookingNotes, setCookingNotes] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Phase 19 Coupon & Loyalty States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);

  const [loyaltyProfile, setLoyaltyProfile] = useState(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Phase 14 Online Payment States
  // 'SUMMARY' | 'INITIALIZING' | 'GATEWAY_MODAL' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  const [paymentPhase, setPaymentPhase] = useState('SUMMARY');
  const [paymentError, setPaymentError] = useState(null);
  const [verifiedPayment, setVerifiedPayment] = useState(null);
  const [sandboxInitData, setSandboxInitData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const safeCart = Array.isArray(cart) ? cart : [];
  const subtotal = Number(cartSubtotal || 0);
  const deliveryFee = safeCart.length > 0 ? (cartDeliveryFee || 30) : 0;
  const packagingFee = safeCart.length > 0 ? (cartPackagingFee || 15) : 0;

  // Load customer loyalty profile on mount
  useEffect(() => {
    const loadLoyalty = async () => {
      try {
        const data = await fetchCustomerLoyalty();
        if (data && data.profile) {
          setLoyaltyProfile(data.profile);
        }
      } catch (err) {
        // Non-critical if guest or unauthenticated
      }
    };
    loadLoyalty();
  }, []);

  // Recalculate loyalty discount when toggle changes
  useEffect(() => {
    if (useLoyaltyPoints && loyaltyProfile && loyaltyProfile.points >= (loyaltyProfile.min_points_to_redeem || 50)) {
      const rate = loyaltyProfile.points_to_inr_rate || 0.5;
      const maxDiscountFromPoints = subtotal * 0.5; // Max 50% of food subtotal
      const maxPointsAllowed = Math.min(loyaltyProfile.points, Math.floor(maxDiscountFromPoints / rate));
      const chosenPoints = Math.max(0, maxPointsAllowed);
      const discountVal = chosenPoints * rate;

      setPointsToRedeem(chosenPoints);
      setLoyaltyDiscount(discountVal);
    } else {
      setPointsToRedeem(0);
      setLoyaltyDiscount(0);
    }
  }, [useLoyaltyPoints, loyaltyProfile, subtotal]);

  // Authoritative total computation
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discount || 0) : 0;
  const pointsDiscount = useLoyaltyPoints ? Number(loyaltyDiscount || 0) : 0;
  const totalDiscount = couponDiscount + pointsDiscount;
  const grandTotal = subtotal > 0 ? Math.max(0, subtotal + deliveryFee + packagingFee - totalDiscount) : 0;
  const expectedPointsEarned = Math.floor(subtotal / 10);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput || '').trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCouponCode(code, subtotal, cartRestaurant?.id);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponInput(res.code);
        setCouponError(null);
      } else {
        setCouponError(res.message || 'Coupon could not be applied.');
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or ineligible coupon code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const paymentOptions = [
    { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm / QR)', icon: Smartphone, desc: 'Instant 0-fee payment via UPI ID or QR scanner' },
    { id: 'CARD', label: 'Credit or Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay & Amex (256-bit encrypted)' },
    { id: 'NET_BANKING', label: 'Net Banking', icon: Building2, desc: 'HDFC, ICICI, SBI, Axis and 40+ Indian banks' },
    { id: 'WALLET', label: 'Fast Delivery Balance Wallet', icon: Wallet, desc: 'Instant 1-tap checkout balance with 5% cashback' },
    { id: 'COD', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay cash or scan dynamic QR upon rider arrival' }
  ];

  // Initiate official Razorpay checkout or interactive sandbox modal
  const startOnlinePaymentFlow = async (order) => {
    setIsProcessingPayment(true);
    setPaymentPhase('INITIALIZING');
    setPaymentError(null);

    try {
      // 1. Initialize payment with server-side validated amount
      const initRes = await apiInitializePayment({
        order_id: order.id,
        payment_method: selectedMethod
      });
      setSandboxInitData(initRes);

      // 2. Check if official window.Razorpay SDK is loaded
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: initRes.key_id,
          amount: initRes.amount_minor_units,
          currency: initRes.currency || 'INR',
          name: 'Fast Delivery (FD)',
          description: `Order #${order.order_number}`,
          order_id: initRes.provider_order_id,
          prefill: {
            name: initRes.customer?.name || '',
            email: initRes.customer?.email || '',
            contact: initRes.customer?.phone || ''
          },
          theme: { color: '#22C55E' },
          handler: async (response) => {
            setPaymentPhase('VERIFYING');
            try {
              const verifyRes = await apiVerifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              setVerifiedPayment(verifyRes.payment);
              setPaymentPhase('SUCCESS');
            } catch (vErr) {
              setPaymentError(vErr.message || 'Payment signature verification failed.');
              setPaymentPhase('FAILED');
            }
          },
          modal: {
            ondismiss: async () => {
              await apiReportPaymentFailure({
                provider_order_id: initRes.provider_order_id,
                error_code: 'CHECKOUT_CANCELLED',
                reason: 'Customer closed Razorpay payment modal'
              });
              setPaymentPhase('CANCELLED');
              setPaymentError('You closed the payment window before completing payment.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response) => {
          await apiReportPaymentFailure({
            provider_order_id: initRes.provider_order_id,
            error_code: response.error?.code || 'GATEWAY_ERROR',
            error_description: response.error?.description || 'Provider reported payment decline'
          });
          setPaymentError(response.error?.description || 'Payment was declined by your bank or card issuer.');
          setPaymentPhase('FAILED');
        });
        rzp.open();
      } else {
        // Fallback to interactive Sandbox Simulator modal
        setPaymentPhase('GATEWAY_MODAL');
      }
    } catch (err) {
      console.error('Online payment initialization failed:', err);
      setPaymentError(err.message || 'Failed to initialize payment gateway.');
      setPaymentPhase('FAILED');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (safeCart.length === 0 && !placedOrder) {
      if (setOrderError) setOrderError('Cart is empty. Please add items before placing order.');
      return;
    }
    if (!selectedAddress && !placedOrder) {
      if (setOrderError) setOrderError('Please select or add a delivery address to complete your order.');
      return;
    }

    // Reuse existing order on retry to prevent duplicate food orders
    let currentOrder = placedOrder;
    if (!currentOrder) {
      try {
        currentOrder = await checkoutOrder({
          address_id: selectedAddress.id,
          payment_method: selectedMethod === 'COD' ? 'Cash on Delivery (COD)' : `Online (${selectedMethod})`,
          cooking_instructions: cookingNotes,
          coupon_code: appliedCoupon ? appliedCoupon.code : '',
          points_to_redeem: useLoyaltyPoints ? pointsToRedeem : 0
        });
        setPlacedOrder(currentOrder);
      } catch (err) {
        console.error('Order placement failed:', err);
        return;
      }
    }

    // Cash on Delivery
    if (selectedMethod === 'COD') {
      setPaymentPhase('SUCCESS');
      return;
    }

    // Online Payment via Razorpay
    await startOnlinePaymentFlow(currentOrder);
  };

  // Sandbox simulation handlers
  const handleSimulateSandboxSuccess = async () => {
    if (!sandboxInitData) return;
    setPaymentPhase('VERIFYING');
    try {
      const verifyRes = await apiVerifyPayment({
        razorpay_order_id: sandboxInitData.provider_order_id,
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_signature: `sim_sandbox_sig_${sandboxInitData.provider_order_id}`
      });
      setVerifiedPayment(verifyRes.payment);
      setPaymentPhase('SUCCESS');
    } catch (err) {
      setPaymentError(err.message || 'Signature verification failed.');
      setPaymentPhase('FAILED');
    }
  };

  const handleSimulateSandboxDecline = async () => {
    if (!sandboxInitData) return;
    await apiReportPaymentFailure({
      provider_order_id: sandboxInitData.provider_order_id,
      error_code: 'INSUFFICIENT_FUNDS',
      error_description: 'Card limit exceeded or payment declined by bank simulator'
    });
    setPaymentError('Payment was declined by the card issuer or issuing bank.');
    setPaymentPhase('FAILED');
  };

  const handleSimulateSandboxCancel = async () => {
    if (!sandboxInitData) return;
    await apiReportPaymentFailure({
      provider_order_id: sandboxInitData.provider_order_id,
      error_code: 'CHECKOUT_CANCELLED',
      reason: 'Customer cancelled checkout in test mode'
    });
    setPaymentPhase('CANCELLED');
    setPaymentError('Payment checkout was cancelled by the customer.');
  };

  // 1. PAYMENT VERIFYING SCREEN (SPINNER)
  if (paymentPhase === 'VERIFYING') {
    return (
      <div style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '40px 24px',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#22C55E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'spin 1.5s linear infinite'
        }}>
          <RefreshCw size={36} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
          Verifying Payment Cryptography...
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ws-text-secondary)', maxWidth: '420px', margin: 0 }}>
          Verifying HMAC-SHA256 signature with Razorpay and updating settlement records in PostgreSQL. Please do not refresh.
        </p>
      </div>
    );
  }

  // 2. PAYMENT INITIALIZING SCREEN (SPINNER)
  if (paymentPhase === 'INITIALIZING') {
    return (
      <div style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '40px 24px',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'spin 1.5s linear infinite'
        }}>
          <Lock size={36} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
          Securing Gateway Handshake...
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ws-text-secondary)', maxWidth: '420px', margin: 0 }}>
          Calculating server-side totals, validating order eligibility, and generating provider payment token...
        </p>
      </div>
    );
  }

  // 3. PAYMENT FAILED / CANCELLED SCREEN
  if (paymentPhase === 'FAILED' || paymentPhase === 'CANCELLED') {
    const isCancelled = paymentPhase === 'CANCELLED';
    return (
      <div style={{
        maxWidth: '580px',
        margin: '40px auto',
        padding: '36px 24px',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        boxShadow: 'var(--ws-shadow-md)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: isCancelled ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `2px solid ${isCancelled ? '#F59E0B' : '#EF4444'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isCancelled ? '#F59E0B' : '#EF4444'
        }}>
          {isCancelled ? <AlertTriangle size={42} /> : <XCircle size={42} />}
        </div>

        <div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            background: isCancelled ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isCancelled ? '#D97706' : '#DC2626',
            padding: '4px 12px',
            borderRadius: '999px',
            letterSpacing: '0.5px'
          }}>
            {isCancelled ? 'PAYMENT CANCELLED' : 'PAYMENT UNSUCCESSFUL'}
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '12px 0 6px 0' }}>
            {isCancelled ? 'Checkout Was Cancelled' : 'Payment Could Not Be Completed'}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--ws-text-secondary)', margin: 0 }}>
            {paymentError || (isCancelled 
              ? 'You exited the payment gateway window before the transaction was verified.' 
              : 'Your bank or payment provider declined the transaction.')}
          </p>
        </div>

        {/* Protection Note */}
        <div style={{
          width: '100%',
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          borderRadius: '16px',
          padding: '16px',
          textAlign: 'left',
          fontSize: '0.85rem',
          color: 'var(--ws-text-secondary)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <ShieldCheck size={20} color="#22C55E" style={{ flexShrink: 0 }} />
          <div>
            <strong>Safe Order Protection: </strong> 
            Your order <strong>#{placedOrder?.order_number}</strong> is safely preserved. Retrying payment will <em>never create duplicate food orders</em>.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessingPayment}
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={18} />
            <span>Retry Payment (₹{grandTotal.toFixed(0)})</span>
          </button>

          <button
            onClick={() => {
              setSelectedMethod('COD');
              setPaymentPhase('SUMMARY');
            }}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer'
            }}
          >
            Switch to Cash on Delivery (COD)
          </button>

          <button
            onClick={onBackToCart}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ws-text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  // 4. SANDBOX INTERACTIVE MODAL (When offline / testing without live browser popups)
  if (paymentPhase === 'GATEWAY_MODAL' && sandboxInitData) {
    return (
      <div style={{
        maxWidth: '560px',
        margin: '40px auto',
        padding: '32px 24px',
        background: 'var(--ws-surface)',
        border: '2px solid #22C55E',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ws-border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                Razorpay Checkout Simulator
              </div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
                SANDBOX / TEST MODE ACTIVE
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', background: 'var(--ws-surface-subtle)', padding: '4px 10px', borderRadius: '8px', color: 'var(--ws-text-secondary)', fontWeight: 700 }}>
            {sandboxInitData.currency}
          </span>
        </div>

        <div style={{
          background: 'var(--ws-surface-subtle)',
          borderRadius: '16px',
          padding: '18px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--ws-text-muted)' }}>Order Reference</span>
            <span style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>{placedOrder?.order_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--ws-text-muted)' }}>Provider Order ID</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#22C55E' }}>{sandboxInitData.provider_order_id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--ws-text-muted)' }}>Method Selected</span>
            <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>{selectedMethod}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', borderTop: '1px solid var(--ws-border)', paddingTop: '10px' }}>
            <span style={{ fontWeight: 800, color: 'var(--ws-text-primary)' }}>Payable Amount</span>
            <span style={{ fontWeight: 900, color: 'var(--ws-text-primary)' }}>₹{sandboxInitData.amount}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleSimulateSandboxSuccess}
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Check size={18} />
            <span>Complete Payment (Simulate Gateway Success)</span>
          </button>

          <button
            onClick={handleSimulateSandboxDecline}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Simulate Bank Decline (Test Failure)
          </button>

          <button
            onClick={handleSimulateSandboxCancel}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              color: 'var(--ws-text-primary)',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cancel Transaction
          </button>
        </div>
      </div>
    );
  }

  // 5. SUCCESS SCREEN (VERIFIED PAID / COD CONFIRMED)
  if (paymentPhase === 'SUCCESS' && placedOrder) {
    const addressSnapshot = placedOrder.delivery_address_snapshot || {};
    const formattedAddress = addressSnapshot.formatted_address || 
      addressSnapshot.street || 
      (selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : 'Your delivery address');

    const isOnlinePaid = verifiedPayment?.status === 'PAID' || placedOrder.payment_status === 'PAID';

    return (
      <div style={{
        maxWidth: '640px',
        margin: '40px auto',
        padding: '32px 24px',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        boxShadow: 'var(--ws-shadow-md)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Animated Celebration Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%)',
          border: '2px solid #22C55E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#22C55E'
        }}>
          <CheckCircle2 size={48} />
        </div>

        <div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#16A34A',
            padding: '4px 12px',
            borderRadius: '999px',
            letterSpacing: '0.5px'
          }}>
            {isOnlinePaid ? '✓ PAYMENT VERIFIED & ORDER CONFIRMED' : 'ORDER CONFIRMED & DISPATCHED TO KITCHEN'}
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '12px 0 6px 0' }}>
            Thank You for Your Order!
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--ws-text-secondary)', margin: 0 }}>
            Order reference: <strong style={{ color: '#22C55E' }}>{placedOrder.order_number}</strong>
          </p>
        </div>

        {/* Verified Payment Badge Details */}
        {isOnlinePaid && (
          <div style={{
            width: '100%',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1.5px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '16px',
            padding: '14px 18px',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem'
          }}>
            <div>
              <div style={{ fontWeight: 800, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} />
                <span>Razorpay HMAC Verified</span>
              </div>
              <div style={{ color: 'var(--ws-text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                Payment Ref: {verifiedPayment?.provider_payment_id || 'pay_settled'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 800, color: '#16A34A', background: '#FFFFFF', padding: '3px 8px', borderRadius: '6px' }}>
                PAID & SETTLED
              </span>
            </div>
          </div>
        )}

        {/* Order Details Card */}
        <div style={{
          width: '100%',
          background: 'var(--ws-surface-subtle)',
          border: '1px solid var(--ws-border)',
          borderRadius: '18px',
          padding: '20px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ws-border)', paddingBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Restaurant
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                {placedOrder.restaurant_name || cartRestaurant?.name || 'Kitchen Partner'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Order Status
              </span>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#16A34A' }}>
                {placedOrder.status || 'PLACED'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <MapPin size={18} color="#22C55E" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Delivering To ({addressSnapshot.label || addressSnapshot.address_type || 'Address'})
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--ws-text-secondary)', lineHeight: 1.4 }}>
                {formattedAddress}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border)', paddingTop: '12px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Payment Method
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ws-text-primary)' }}>
                {placedOrder.payment_method || selectedMethod} ({isOnlinePaid ? 'PAID' : (placedOrder.payment_status || 'PENDING')})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Paid / Billed
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
                ₹{Number(placedOrder.total || placedOrder.grand_total || grandTotal).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={() => onOrderSuccess && onOrderSuccess(placedOrder)}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>View Order Status & Track</span>
            <ChevronRight size={18} />
          </button>

          <button
            onClick={onBackToCart}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '14px',
              padding: '14px 20px',
              fontWeight: 700,
              fontSize: '0.92rem',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer'
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // 6. EMPTY CART SCREEN
  if (safeCart.length === 0 && !placedOrder) {
    return (
      <div style={{
        maxWidth: '520px',
        margin: '60px auto',
        textAlign: 'center',
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '48px 24px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '20px',
          background: 'rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          color: '#22C55E'
        }}>
          <ShoppingBag size={36} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: '0 0 8px 0' }}>
          Your Cart is Empty
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ws-text-secondary)', marginBottom: '24px' }}>
          Add dishes to your cart before proceeding to checkout.
        </p>
        <button
          onClick={onBackToCart}
          style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 28px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
          }}
        >
          Return to Cart & Explore
        </button>
      </div>
    );
  }

  // 7. DEFAULT CHECKOUT PAYMENT SUMMARY SCREEN
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Back Button & Header */}
      <div>
        <button
          onClick={onBackToCart}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ws-text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '8px'
          }}
        >
          <ArrowLeft size={16} /> Back to Cart
        </button>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
          Checkout & Secure Online Payment
        </h1>
        <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-secondary)', marginTop: '2px' }}>
          Review delivery details, select payment gateway, and complete your order
        </div>
      </div>

      {/* Backend Validation Error Banner */}
      {orderError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1.5px solid #EF4444',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#DC2626',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{orderError}</div>
          <button
            type="button"
            onClick={() => setOrderError(null)}
            style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 800, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Selected Delivery Address */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            1. DELIVERY ADDRESS
          </span>
          {onOpenAddressModal && (
            <button
              onClick={onOpenAddressModal}
              style={{
                background: 'none',
                border: 'none',
                color: '#22C55E',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + Add / Change Address
            </button>
          )}
        </div>

        {selectedAddress ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--ws-text-primary)' }}>
                  {selectedAddress.label || selectedAddress.address_type || 'Selected Location'}
                </strong>
                {selectedAddress.is_default && (
                  <span style={{
                    fontSize: '0.68rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#16A34A',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    DEFAULT
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--ws-text-secondary)', lineHeight: 1.4 }}>
                {[selectedAddress.street, selectedAddress.area_sector_locality, selectedAddress.city, selectedAddress.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '14px',
            padding: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ws-text-secondary)' }}>
              No delivery address selected. Please choose or add a delivery address.
            </p>
            {onOpenAddressModal && (
              <button
                onClick={onOpenAddressModal}
                style={{
                  background: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Select Address
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Restaurant Summary */}
      <ScheduleSection />
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'rgba(255, 90, 31, 0.1)',
          color: '#FF5A1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Store size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ORDERING FROM
          </span>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
            {cartRestaurant?.name || 'Local Kitchen Partner'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)' }}>
            {cartRestaurant?.address || 'Verified Delivery Kitchen'}
          </div>
        </div>
      </div>

      {/* 3. Cart Items Review */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          3. ITEMS IN ORDER ({safeCart.length})
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {safeCart.map((item) => {
            const unitPrice = Number(item.unit_price || item.price || 0);
            const qty = Number(item.quantity || 1);
            const itemTotal = unitPrice * qty;

            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderBottom: '1px solid var(--ws-border)',
                  paddingBottom: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.is_veg === false ? '#DC2626' : '#16A34A'
                    }} />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--ws-text-primary)' }}>
                      {item.food_name || item.name}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                      × {qty}
                    </span>
                  </div>

                  {item.customization?.variant && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)', marginLeft: '16px', marginTop: '2px' }}>
                      Variant: {item.customization.variant.name}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ws-text-primary)' }}>
                    ₹{itemTotal.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                    (₹{unitPrice.toFixed(0)} each)
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cooking notes */}
        <div style={{ marginTop: '4px', borderTop: '1px solid var(--ws-border)', paddingTop: '12px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ws-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <ChefHat size={15} color="#22C55E" />
            <span>Special Instructions for Kitchen (Optional)</span>
          </label>
          <input
            type="text"
            value={cookingNotes}
            onChange={(e) => setCookingNotes(e.target.value)}
            placeholder="e.g. Please send extra mint chutney, make less spicy..."
            maxLength={180}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--ws-border)',
              background: 'var(--ws-surface-subtle)',
              color: 'var(--ws-text-primary)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* 4. Smart Offers, Coupons & Loyalty Rewards */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            4. OFFERS & LOYALTY REWARDS (தள்ளுபடி & புள்ளிகள்)
          </span>
          <button
            type="button"
            onClick={() => setIsOffersModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#16A34A',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Tag size={14} />
            <span>View Available Offers ({isOffersModalOpen ? '...' : 'Explore'})</span>
          </button>
        </div>

        {/* Coupon Input Box */}
        <div style={{
          background: 'var(--ws-surface-subtle)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--ws-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} color="#22C55E" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
              Apply Coupon Code
            </span>
          </div>

          {appliedCoupon ? (
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <span style={{ fontWeight: 900, color: '#16A34A', fontSize: '0.92rem' }}>
                    {appliedCoupon.code}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 700 }}>
                    — Saved ₹{Number(appliedCoupon.discount).toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ws-text-secondary)', marginTop: '2px' }}>
                  {appliedCoupon.title || appliedCoupon.description || 'Promotional discount applied.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveCoupon}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                REMOVE
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter coupon code (e.g. TASTY20)"
                value={couponInput}
                onChange={e => {
                  setCouponInput(e.target.value);
                  setCouponError(null);
                }}
                disabled={isValidatingCoupon}
                style={{
                  flex: 1,
                  background: 'var(--ws-surface)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--ws-text-primary)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                disabled={isValidatingCoupon || !couponInput.trim()}
                style={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: isValidatingCoupon || !couponInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: !couponInput.trim() ? 0.6 : 1,
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)'
                }}
              >
                {isValidatingCoupon ? 'Validating...' : 'APPLY'}
              </button>
            </div>
          )}

          {couponError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: '#EF4444',
              fontWeight: 600
            }}>
              <AlertCircle size={14} />
              <span>{couponError}</span>
            </div>
          )}
        </div>

        {/* Loyalty Rewards Section */}
        {loyaltyProfile && (
          <div style={{
            background: 'var(--ws-surface-subtle)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid var(--ws-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#FBBF24" />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                    Fast Delivery Loyalty Points ({loyaltyProfile.tier} VIP)
                  </span>
                  <div style={{ fontSize: '0.74rem', color: 'var(--ws-text-muted)' }}>
                    Available: <strong style={{ color: '#16A34A' }}>{loyaltyProfile.points} pts</strong> (Worth ₹{loyaltyProfile.inr_value?.toFixed(2) || '0.00'})
                  </div>
                </div>
              </div>

              {loyaltyProfile.points >= (loyaltyProfile.min_points_to_redeem || 50) ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 800, color: '#16A34A' }}>
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={e => setUseLoyaltyPoints(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#22C55E', cursor: 'pointer' }}
                  />
                  <span>Redeem Points</span>
                </label>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)' }}>
                  Min {loyaltyProfile.min_points_to_redeem || 50} pts needed
                </span>
              )}
            </div>

            {useLoyaltyPoints && pointsToRedeem > 0 && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.78rem',
                color: '#D97706',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Redeeming {pointsToRedeem} points at ₹{loyaltyProfile.points_to_inr_rate || 0.5}/pt</span>
                <span style={{ fontWeight: 900 }}>- ₹{loyaltyDiscount.toFixed(2)} OFF</span>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: 'var(--ws-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>You will earn ~<strong>+{expectedPointsEarned} pts</strong> upon delivery!</span>
              <span>1 Pt = ₹{loyaltyProfile.points_to_inr_rate || 0.5}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Payment Method Card */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--ws-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            5. PAYMENT METHOD (RAZORPAY INTEGRATED)
          </span>
          <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
            ⚡ 256-Bit SSL Encrypted
          </span>
        </div>

        {paymentOptions.map(option => {
          const isSelected = selectedMethod === option.id;
          const Icon = option.icon;

          return (
            <div
              key={option.id}
              onClick={() => setSelectedMethod(option.id)}
              style={{
                border: '1px solid',
                borderColor: isSelected ? '#22C55E' : 'var(--ws-border)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                background: isSelected ? 'rgba(34, 197, 94, 0.08)' : 'var(--ws-surface-subtle)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: isSelected ? '#22C55E' : 'var(--ws-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isSelected ? '#22C55E' : 'transparent',
                flexShrink: 0
              }}>
                {isSelected && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }} />
                )}
              </div>

              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--ws-surface)',
                border: '1px solid var(--ws-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#22C55E' : 'var(--ws-text-secondary)',
                flexShrink: 0
              }}>
                <Icon size={20} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--ws-text-primary)', fontSize: '0.92rem' }}>
                  {option.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '2px' }}>
                  {option.desc}
                </div>
              </div>
            </div>
          );
        })}

        {/* Security Reassurance */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: '12px',
          color: '#10B981',
          fontSize: '0.78rem',
          fontWeight: 600,
          marginTop: '6px'
        }}>
          <ShieldCheck size={18} />
          <span>Server-Side Amount Validation • HMAC-SHA256 Signature Verification • PostgreSQL Ledger</span>
        </div>
      </div>

      {/* 5. Summary Total & Place Order Button */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        padding: '20px 24px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Bill Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--ws-border)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ws-text-secondary)' }}>
            <span>Item Subtotal ({safeCart.length} items)</span>
            <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>₹{subtotal.toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ws-text-secondary)' }}>
            <span>Express Delivery Fee</span>
            <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>₹{deliveryFee.toFixed(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ws-text-secondary)' }}>
            <span>Restaurant Packaging Charges</span>
            <span style={{ fontWeight: 700, color: 'var(--ws-text-primary)' }}>₹{packagingFee.toFixed(0)}</span>
          </div>
          {couponDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16A34A', fontWeight: 700 }}>
              <span>Coupon Discount ({appliedCoupon?.code})</span>
              <span>- ₹{couponDiscount.toFixed(2)}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#D97706', fontWeight: 700 }}>
              <span>Loyalty Points Redeemed ({pointsToRedeem} pts)</span>
              <span>- ₹{pointsDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
              FINAL PAYABLE
            </span>
            <span style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
              ₹{grandTotal.toFixed(0)}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, display: 'block' }}>
              ✓ Guaranteed Kitchen Delivery
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ws-text-muted)' }}>
              Est. Arrival in 22 mins
            </span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder || isProcessingPayment || (!selectedAddress && !placedOrder) || (safeCart.length === 0 && !placedOrder)}
          style={{
            background: (isPlacingOrder || isProcessingPayment || (!selectedAddress && !placedOrder) || (safeCart.length === 0 && !placedOrder))
              ? 'var(--ws-surface-subtle)' 
              : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '16px 24px',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: (isPlacingOrder || isProcessingPayment || (!selectedAddress && !placedOrder) || (safeCart.length === 0 && !placedOrder)) ? 'not-allowed' : 'pointer',
            boxShadow: (!selectedAddress && !placedOrder) ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            opacity: (!selectedAddress && !placedOrder) ? 0.6 : 1
          }}
        >
          {isPlacingOrder || isProcessingPayment ? (
            <span>Processing Secure Handshake...</span>
          ) : (
            <>
              <Lock size={18} />
              <span>{selectedMethod === 'COD' ? `CONFIRM ORDER (COD) • ₹${grandTotal.toFixed(0)}` : `PAY SECURELY WITH RAZORPAY • ₹${grandTotal.toFixed(0)}`}</span>
            </>
          )}
        </button>
      </div>

      {/* Offers Modal */}
      <OffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
        onApplyCode={(coupon) => {
          handleApplyCoupon(coupon.code);
          setIsOffersModalOpen(false);
        }}
        currentSubtotal={subtotal}
        restaurantId={cartRestaurant?.id}
      />

    </div>
  );
};
