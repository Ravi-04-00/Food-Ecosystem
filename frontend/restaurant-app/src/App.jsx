import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext.jsx';
import { RestaurantSidebar } from './components/RestaurantSidebar.jsx';
import { ShopNavbar } from './components/ShopNavbar.jsx';
import { RestaurantBottomNav } from './components/RestaurantBottomNav.jsx';
import { ShopDashboard } from './pages/ShopDashboard.jsx';
import { OrdersQueuePage } from './pages/OrdersQueuePage.jsx';
import { MenuManagerPage } from './pages/MenuManagerPage.jsx';
import { RevenueAnalyticsPage } from './pages/RevenueAnalyticsPage.jsx';
import { KitchenDisplayPage } from './pages/KitchenDisplayPage.jsx';
import { InventoryManagerPage } from './pages/InventoryManagerPage.jsx';
import { FoodCreationModal } from './components/FoodCreationModal.jsx';
import { RestaurantProfileModal } from './components/RestaurantProfileModal.jsx';
import { FDCommonBrandIntro } from './components/FDCommonBrandIntro.jsx';
import { RestaurantAuthModal } from './pages/RestaurantAuthModal.jsx';
import { RestaurantRegistrationPage } from './pages/RestaurantRegistrationPage.jsx';
import { RestaurantSettingsPage } from './pages/RestaurantSettingsPage.jsx';
import { RestaurantReviewsPage } from './pages/RestaurantReviewsPage.jsx';
import { RestaurantDisputesPage } from './pages/RestaurantDisputesPage.jsx';
import { RestaurantSettlementsPage } from './pages/RestaurantSettlementsPage.jsx';
import { RestaurantKYCPage } from './pages/RestaurantKYCPage.jsx';
import { OrderAlertModal } from './components/OrderAlertModal.jsx';
import { fetchKYCStatus } from './services/api.js';
import { FDLogoutModal } from './components/FDLogoutModal.jsx';
import { FDSessionExpiredModal } from './components/FDSessionExpiredModal.jsx';
import { SmartNotificationCenter } from './components/SmartNotificationCenter.jsx';
import { usePWA } from './hooks/usePWA.js';
import { ConnectivityBanner } from './components/ConnectivityBanner.jsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.jsx';
import { SWUpdateToast } from './components/SWUpdateToast.jsx';

const ShopMain = () => {
  const {
    showLogoutConfirm,
    cancelLogout,
    confirmLogout,
    showSessionExpired,
    handleSessionExpired,
    logoutFeedback,
    isLoggingOut
  } = useShop();
  const pwa = usePWA();

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (pwa.isStandalone || sessionStorage.getItem('fd_restaurant_intro_seen') === 'true') {
      return false;
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const handleCompleteIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem('fd_restaurant_intro_seen', 'true');
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
          app="restaurant" 
          onComplete={handleCompleteIntro} 
        />
      )}

      {/* Unified Restaurant Sidebar: Permanent on desktop (>=1024px), adaptive drawer on tablet/mobile (<1024px) */}
      <RestaurantSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Operations Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Network Connectivity Status Probe & Banner */}
        <ConnectivityBanner 
          isOnline={pwa.isOnline}
          isBackendReachable={pwa.isBackendReachable}
          isCheckingHealth={pwa.isCheckingHealth}
          showOnlineRestored={pwa.showOnlineRestored}
          onRetry={pwa.verifyConnectivity}
          role="restaurant"
        />

        {/* PWA Home Screen Installation Guidance */}
        <PWAInstallBanner 
          isStandalone={pwa.isStandalone}
          isInstallable={pwa.isInstallable}
          installDismissed={pwa.installDismissed}
          platform={pwa.platform}
          onPromptInstall={pwa.promptInstall}
          onDismissInstall={pwa.dismissInstall}
          appName="Fast Delivery Partner"
        />

        {/* Top Header */}
        <ShopNavbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAddFood={() => setAddFoodOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onReplayIntro={handleReplayIntro}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
          onOpenRegister={() => setActiveTab('register')}
        />

        {/* Dynamic Page Container */}
        <style>{`
          .restaurant-main-viewport {
            padding: 24px 28px;
            max-width: 1440px;
            width: 100%;
            margin: 0 auto;
          }
          @media (max-width: 767.5px) {
            .restaurant-main-viewport {
              padding: 16px 14px calc(80px + env(safe-area-inset-bottom, 16px)) !important;
            }
          }
        `}</style>
        <main className="restaurant-main-viewport" style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <ShopDashboard 
            onNavigate={setActiveTab}
            onOpenAddFood={() => setAddFoodOpen(true)}
          />
        )}

        {activeTab === 'orders' && <OrdersQueuePage />}

        {activeTab === 'kds' && <KitchenDisplayPage />}

        {activeTab === 'menu' && (
          <MenuManagerPage onOpenAddFood={() => setAddFoodOpen(true)} />
        )}

        {activeTab === 'inventory' && <InventoryManagerPage />}

        {activeTab === 'disputes' && <RestaurantDisputesPage />}

        {activeTab === 'reviews' && <RestaurantReviewsPage />}

        {(activeTab === 'revenue' || activeTab === 'settlements') && <RestaurantSettlementsPage />}

        {activeTab === 'register' && (
          <RestaurantRegistrationPage 
            onNavigateToLogin={() => {
              setActiveTab('dashboard');
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            onNavigateHome={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'settings' && (
          <RestaurantSettingsPage onOpenAuth={() => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }} />
        )}

        {activeTab === 'kyc' && <RestaurantKYCPage />}
      </main>

      {/* Smart Notifications Center */}
      <SmartNotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigateResource={(type) => {
          if (type === 'Order') setActiveTab('orders');
          else if (type === 'Restaurant') setActiveTab('dashboard');
        }}
      />

      {/* Live Order Incoming Dispatch Alert */}
      <OrderAlertModal />

      {/* Add Food Form Modal */}
      <FoodCreationModal
        isOpen={addFoodOpen}
        onClose={() => setAddFoodOpen(false)}
      />

      {/* Restaurant Profile & Settings Modal */}
      <RestaurantProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Restaurant Partner Login / Register Modal */}
      <RestaurantAuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => {
          fetchKYCStatus()
            .then(data => {
              if (data && data.kyc_required && data.status && data.status !== 'APPROVED') {
                setActiveTab('kyc');
              }
            })
            .catch(() => {});
        }}
      />

      {/* Phase 4: Logout Confirmation Dialog */}
      <FDLogoutModal
        isOpen={showLogoutConfirm}
        isLoading={isLoggingOut}
        onCancel={cancelLogout}
        onConfirm={async () => {
          await confirmLogout();
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
      />

      {/* Phase 4: Session Expired Dialog */}
      <FDSessionExpiredModal
        isOpen={showSessionExpired}
        onLoginAgain={() => {
          handleSessionExpired();
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
      />

      {/* Phase 4: Logout Feedback Toast */}
      {logoutFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #0A2E1B 0%, #15803D 100%)',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(10, 46, 27, 0.35)',
          border: '1px solid #4ADE80',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          <span>✨</span>
          <span>{logoutFeedback}</span>
        </div>
      )}

      {/* Modern Ecosystem Footer */}
      <footer style={{
        background: 'var(--ws-surface)',
        color: 'var(--ws-text-secondary)',
        borderTop: '1px solid var(--ws-border)',
        padding: '24px 20px',
        fontSize: '0.82rem',
        marginTop: '40px',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 900, fontSize: '1rem', color: '#22C55E' }}>FAST DELIVERY</span>
            <span style={{ color: 'var(--ws-text-muted)' }}>• Restaurant & Kitchen Partner Command Hub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--ws-text-muted)', fontSize: '0.78rem' }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ADE80',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 700
            }}>
              App 2: Restaurant Partner • Port 3001
            </span>
            <span>Real-time Kitchen Dispatch Active</span>
          </div>
        </div>
      </footer>

      {/* Fixed Mobile Bottom Navigation */}
      <RestaurantBottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSidebar={() => setSidebarOpen(true)} 
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
    <ShopProvider>
      <ShopMain />
    </ShopProvider>
  );
};

export default App;
