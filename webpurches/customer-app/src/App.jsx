import React, { useState, useEffect } from 'react';
import { CustomerProvider } from './context/CustomerContext.jsx';
import { CustomerNavbar } from './components/CustomerNavbar.jsx';
import { CustomerSidebar } from './components/CustomerSidebar.jsx';
import { CustomerBottomNav } from './components/CustomerBottomNav.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { FoodReelsPlayer } from './components/FoodReelsPlayer.jsx';
import { RestaurantsView } from './pages/RestaurantsView.jsx';
import { TrackingPage } from './pages/TrackingPage.jsx';
import { WishlistPage } from './pages/WishlistPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { FoodDetailsModal } from './components/FoodDetailsModal.jsx';
import { LocationPermissionModal } from './components/LocationPermissionModal.jsx';
import { CustomerAuthModal } from './pages/CustomerAuthModal.jsx';
import { AIAssistantModal } from './components/AIAssistantModal.jsx';
import { CustomerProfileModal } from './components/CustomerProfileModal.jsx';
import { OffersModal } from './components/OffersModal.jsx';
import { NotificationsModal } from './components/NotificationsModal.jsx';
import { FDCommonBrandIntro } from './components/FDCommonBrandIntro.jsx';
import { FDOrganicLogo } from './components/FDOrganicLogo.jsx';
import { CustomerRegistrationPage } from './pages/CustomerRegistrationPage.jsx';
import { CustomerSettingsPage } from './pages/CustomerSettingsPage.jsx';
import { SupportPage } from './pages/SupportPage.jsx';
import { FDLogoutModal } from './components/FDLogoutModal.jsx';
import { FDSessionExpiredModal } from './components/FDSessionExpiredModal.jsx';
import { CartConflictModal } from './components/CartConflictModal.jsx';
import { AddressManagerModal } from './components/AddressManagerModal.jsx';
import { OffersPage } from './pages/OffersPage.jsx';
import { useCustomer } from './context/CustomerContext.jsx';
import { usePWA } from './hooks/usePWA.js';
import { ConnectivityBanner } from './components/ConnectivityBanner.jsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.jsx';
import { SWUpdateToast } from './components/SWUpdateToast.jsx';

const CustomerMain = () => {
  const { 
    showLogoutConfirm, 
    cancelLogout, 
    confirmLogout, 
    isLoggingOut, 
    showSessionExpired, 
    setShowSessionExpired, 
    logoutFeedback,
    cartConflict,
    resolveConflict,
    currentUser,
    authState
  } = useCustomer();
  const pwa = usePWA();

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (pwa.isStandalone || sessionStorage.getItem('fd_customer_intro_seen') === 'true') {
      return false;
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState('explore');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [offersModalOpen, setOffersModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [checkoutAmount, setCheckoutAmount] = useState(457);
  const [disputeOrderNumber, setDisputeOrderNumber] = useState(null);

  const handleSelectAddress = (addr) => {
    // Address updated
  };

  const handleCompleteIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem('fd_customer_intro_seen', 'true');
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--ws-bg)',
      color: 'var(--ws-text-primary)',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Phase 1: Common Brand Intro & Splash Screen (2-4s) */}
      {showIntro && (
        <FDCommonBrandIntro 
          app="customer" 
          onComplete={handleCompleteIntro} 
        />
      )}

      {/* Unified Customer Sidebar: Persistent on Desktop (>=1024px), adaptive drawer on Tablet/Mobile (<1024px) */}
      <CustomerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenRegister={() => setActiveTab('register')}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', width: '100%' }}>
        {/* Network Connectivity Status Probe & Banner */}
        <ConnectivityBanner 
          isOnline={pwa.isOnline}
          isBackendReachable={pwa.isBackendReachable}
          isCheckingHealth={pwa.isCheckingHealth}
          showOnlineRestored={pwa.showOnlineRestored}
          onRetry={pwa.verifyConnectivity}
          role="customer"
        />

        {/* PWA Home Screen Installation Guidance */}
        <PWAInstallBanner 
          isStandalone={pwa.isStandalone}
          isInstallable={pwa.isInstallable}
          installDismissed={pwa.installDismissed}
          platform={pwa.platform}
          onPromptInstall={pwa.promptInstall}
          onDismissInstall={pwa.dismissInstall}
          appName="Fast Delivery (FD)"
        />

        {/* Top Horizontal Navigation Header */}
        <CustomerNavbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onOpenRegister={() => setActiveTab('register')}
          onOpenLocationModal={() => {
            if (currentUser || authState?.isAuthenticated) {
              setAddressModalOpen(true);
            } else {
              setLocationModalOpen(true);
            }
          }}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenOffers={() => setOffersModalOpen(true)}
          onOpenNotifications={() => setNotificationsModalOpen(true)}
          onReplayIntro={handleReplayIntro}
        />

        {/* Dynamic Page Container */}
        <style>{`
          .customer-main-viewport {
            padding: 24px 28px;
            max-width: 1440px;
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
          }
          @media (max-width: 767.5px) {
            .customer-main-viewport {
              padding: 16px 14px calc(80px + env(safe-area-inset-bottom, 16px)) !important;
            }
          }
        `}</style>
        <main className="customer-main-viewport" style={{ flex: 1, boxSizing: 'border-box', width: '100%' }}>
        {(activeTab === 'explore' || activeTab === 'search') && (
          <ExplorePage 
            onSelectFood={(dish) => setSelectedFood(dish)}
            onGoToReels={() => setActiveTab('reels')}
            onOpenLocationModal={() => {
              if (currentUser || authState?.isAuthenticated) {
                setAddressModalOpen(true);
              } else {
                setLocationModalOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'reels' && (
          <FoodReelsPlayer 
            onSelectFood={(dish) => setSelectedFood(dish)}
            onGoToCart={() => setActiveTab('cart')}
          />
        )}

        {activeTab === 'restaurants' && (
          <RestaurantsView onSelectFood={(dish) => setSelectedFood(dish)} />
        )}

        {activeTab === 'offers' && (
          <OffersPage 
            onGoToCart={() => setActiveTab('cart')}
            onApplyCouponToCart={(coupon) => {
              setActiveTab('checkout');
            }}
          />
        )}

        {activeTab === 'wishlist' && (
          <WishlistPage 
            onContinueShopping={() => setActiveTab('explore')} 
            onSelectFood={(dish) => setSelectedFood(dish)}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingPage 
            onBackHome={() => setActiveTab('explore')} 
          />
        )}

        {activeTab === 'cart' && (
          <CartPage 
            onProceedCheckout={(total) => {
              setCheckoutAmount(total);
              setActiveTab('checkout');
            }} 
            onContinueShopping={() => setActiveTab('explore')} 
            onOpenAddressModal={() => setAddressModalOpen(true)}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutPage 
            totalAmount={checkoutAmount}
            onBackToCart={() => setActiveTab('cart')}
            onOpenAddressModal={() => setAddressModalOpen(true)}
            onOrderSuccess={(order) => {
              setActiveTab('orders');
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersPage 
            onContinueShopping={() => setActiveTab('explore')}
            onTrackOrder={(order) => {
              setActiveTab('tracking');
            }}
            onDisputeOrder={(orderNum) => {
              setDisputeOrderNumber(orderNum);
              setActiveTab('support');
            }}
          />
        )}

        {activeTab === 'support' && (
          <SupportPage 
            initialOrderNumber={disputeOrderNumber}
            onBackToOrders={() => {
              setDisputeOrderNumber(null);
              setActiveTab('orders');
            }}
          />
        )}

        {activeTab === 'register' && (
          <CustomerRegistrationPage 
            onNavigateToLogin={() => {
              setActiveTab('explore');
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigateHome={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'settings' && (
          <CustomerSettingsPage 
            onOpenAuth={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals & Overlays */}
      <FoodDetailsModal 
        food={selectedFood} 
        onClose={() => setSelectedFood(null)} 
      />

      <LocationPermissionModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectAddress={handleSelectAddress}
      />

      {/* Single-Restaurant Cart Conflict Resolution Modal */}
      <CartConflictModal
        isOpen={Boolean(cartConflict)}
        conflictData={cartConflict}
        onKeepExisting={() => resolveConflict(false)}
        onClearAndAdd={() => resolveConflict(true)}
      />

      {/* Customer Address Manager Modal */}
      <AddressManagerModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />

      <CustomerAuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      <CustomerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      <OffersModal
        isOpen={offersModalOpen}
        onClose={() => setOffersModalOpen(false)}
        onApplyCode={(code) => {
          // Code applied
        }}
      />

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />

      <AIAssistantModal />

      {/* Phase 4: Logout Confirmation Modal */}
      <FDLogoutModal
        isOpen={showLogoutConfirm}
        onClose={cancelLogout}
        onConfirm={async () => {
          await confirmLogout();
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        isLoggingOut={isLoggingOut}
      />

      {/* Phase 4: Session Expired Modal */}
      <FDSessionExpiredModal
        isOpen={showSessionExpired}
        onLoginAgain={() => {
          setShowSessionExpired(false);
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
      />

      {/* Phase 4: Logout Success Feedback Toast */}
      {logoutFeedback && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 4000,
          background: '#064E3B',
          color: '#ECFDF5',
          border: '1.5px solid #34D399',
          borderRadius: '14px',
          padding: '12px 20px',
          boxShadow: '0 12px 30px rgba(6, 78, 59, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 800,
          animation: 'fadeIn 0.2s ease'
        }}>
          <span>✓</span>
          <span>{logoutFeedback}</span>
        </div>
      )}

      {/* Exact Reference Footer Bar: Delicious Food | Fast Delivery | Trusted by Millions */}
      <footer style={{
        background: '#163D2B',
        color: '#FFFFFF',
        padding: '18px 24px',
        fontSize: '0.82rem',
        marginTop: 'auto',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px' 
        }}>
          {/* Left Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.80rem', color: '#D8F3DC', fontWeight: 500 }}>
            <span>Delicious Food</span>
            <span style={{ color: '#52B788' }}>|</span>
            <span>Fast Delivery</span>
            <span style={{ color: '#52B788' }}>|</span>
            <span>Trusted by Millions</span>
          </div>

          {/* Center Brand Monogram & Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FDOrganicLogo 
              size="sm" 
              theme="dark"
              showWordmark={true} 
              showTagline={true} 
              tagline="Fresh Choices. Royal Experiences."
            />
          </div>

          {/* Right Mission Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B7E4C7', fontSize: '0.78rem', fontWeight: 500 }}>
            <span>Food</span>
            <span style={{ color: '#52B788' }}>•</span>
            <span>People</span>
            <span style={{ color: '#52B788' }}>•</span>
            <span>Community</span>
            <span style={{ color: '#52B788' }}>•</span>
            <span>A Healthier Tomorrow</span>
          </div>
        </div>
      </footer>

      {/* Customer Mobile Fixed Bottom Navigation */}
      <CustomerBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
    </div>

    {/* Background Service Worker Update Banner */}
    <SWUpdateToast 
      swUpdateAvailable={pwa.swUpdateAvailable} 
      onApplyUpdate={pwa.applyUpdate} 
    />
  </div>
  );
};

export const App = () => {
  return (
    <CustomerProvider>
      <CustomerMain />
    </CustomerProvider>
  );
};

export default App;
