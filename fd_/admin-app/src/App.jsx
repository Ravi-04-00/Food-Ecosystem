import React, { useState, useEffect } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext.jsx';
import { AdminSidebar } from './components/AdminSidebar.jsx';
import { AdminHeader } from './components/AdminHeader.jsx';
import { AdminBottomNav } from './components/AdminBottomNav.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { LiveControlMap } from './components/LiveControlMap.jsx';
import { RestaurantManagerPage } from './pages/RestaurantManagerPage.jsx';
import { FleetManagerPage } from './pages/FleetManagerPage.jsx';
import { OrdersOverviewPage } from './pages/OrdersOverviewPage.jsx';
import { CustomerManagerPage } from './pages/CustomerManagerPage.jsx';
import { AdminRevenuePage } from './pages/AdminRevenuePage.jsx';
import { AdminReportsPage } from './pages/AdminReportsPage.jsx';
import { AdminSupportPage } from './pages/AdminSupportPage.jsx';
import { AdminSecurityPage } from './pages/AdminSecurityPage.jsx';
import { PlatformSettingsPage } from './pages/PlatformSettingsPage.jsx';
import { AdminReviewsModerationPage } from './pages/AdminReviewsModerationPage.jsx';
import { AdminOffersLoyaltyPage } from './pages/AdminOffersLoyaltyPage.jsx';
import { AdminDispatchPage } from './pages/AdminDispatchPage.jsx';
import { AdminSettlementsPage } from './pages/AdminSettlementsPage.jsx';
import { AdminDishesPage } from './pages/AdminDishesPage.jsx';
import { OrderInspectorModal } from './components/OrderInspectorModal.jsx';
import { SmartNotificationCenter } from './components/SmartNotificationCenter.jsx';
import { ThemeToggle } from './components/ThemeToggle.jsx';
import { LanguageToggle } from './components/LanguageToggle.jsx';
import { RealtimeStatusIndicator } from './components/RealtimeStatusIndicator.jsx';
import { useTranslation } from './utils/i18n.js';
import { FDCommonBrandIntro } from './components/FDCommonBrandIntro.jsx';
import { AdminAuthModal } from './components/AdminAuthModal.jsx';
import { FDLogoutModal } from './components/FDLogoutModal.jsx';
import { FDSessionExpiredModal } from './components/FDSessionExpiredModal.jsx';
import { Bell } from 'lucide-react';
import { fetchNotificationUnreadCount } from './services/api.js';
import { usePWA } from './hooks/usePWA.js';
import { ConnectivityBanner } from './components/ConnectivityBanner.jsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.jsx';
import { PWAInstallButton } from './components/PWAInstallButton.jsx';
import { SWUpdateToast } from './components/SWUpdateToast.jsx';

const AdminMain = () => {
  const {
    authState,
    showLogoutConfirm,
    cancelLogout,
    confirmLogout,
    showSessionExpired,
    handleSessionExpired,
    logoutFeedback,
    isLoggingOut,
    promptLogout
  } = useAdmin();
  const { t } = useTranslation();
  const pwa = usePWA();

  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (pwa.isStandalone || sessionStorage.getItem('fd_admin_intro_seen') === 'true') {
      return false;
    }
    return true;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const data = await fetchNotificationUnreadCount();
      if (data && typeof data.unread_count === 'number') {
        setUnreadCount(data.unread_count);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 20000);
    return () => clearInterval(interval);
  }, [authState]);

  const handleCompleteIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem('fd_admin_intro_seen', 'true');
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
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Phase 1: Common Brand Intro & Splash Screen (2-4s) */}
      {showIntro && (
        <FDCommonBrandIntro 
          app="admin" 
          onComplete={handleCompleteIntro} 
        />
      )}

      {/* Admin Mission Control Authentication Modal */}
      <AdminAuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Admin Navigation Drawer (hidden by default, hamburger opens) */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Network Connectivity Status Probe & Banner */}
        <ConnectivityBanner 
          isOnline={pwa.isOnline}
          isBackendReachable={pwa.isBackendReachable}
          isCheckingHealth={pwa.isCheckingHealth}
          showOnlineRestored={pwa.showOnlineRestored}
          onRetry={pwa.verifyConnectivity}
          role="admin"
        />

        {/* PWA Home Screen Installation Guidance */}
        <PWAInstallBanner 
          isStandalone={pwa.isStandalone}
          isInstallable={pwa.isInstallable}
          installDismissed={pwa.installDismissed}
          platform={pwa.platform}
          onPromptInstall={pwa.promptInstall}
          onDismissInstall={pwa.dismissInstall}
          appName="Fast Delivery Mission Control"
        />

        {/* Minimal Clean Top Admin Navbar */}
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        {/* Dynamic Page Router */}
        <style>{`
          .admin-main-viewport {
            padding: 24px 28px;
          }
          @media (max-width: 767.5px) {
            .admin-main-viewport {
              padding: 16px 14px calc(80px + env(safe-area-inset-bottom, 16px)) !important;
            }
          }
        `}</style>
        <main className="admin-main-viewport" style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}

          {activeTab === 'dispatch' && <AdminDispatchPage />}

          {activeTab === 'customers' && <CustomerManagerPage />}

          {activeTab === 'restaurants' && <RestaurantManagerPage />}
          {activeTab === 'menu' && <AdminDishesPage />}

          {activeTab === 'fleet' && <FleetManagerPage />}

          {activeTab === 'orders' && <OrdersOverviewPage />}

          {(activeTab === 'payments' || activeTab === 'revenue') && <AdminRevenuePage />}

          {activeTab === 'settlements' && <AdminSettlementsPage />}

          {activeTab === 'reports' && <AdminReportsPage />}

          {activeTab === 'maps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: 0 }}>
                  Live Ecosystem Telemetry Map
                </h1>
                <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
                  Interactive live telemetry of restaurants, riders, and delivery destinations
                </div>
              </div>
              <div style={{ border: '1px solid var(--ws-border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--ws-shadow-sm)' }}>
                <LiveControlMap height="640px" />
              </div>
            </div>
          )}

          {activeTab === 'reviews' && <AdminReviewsModerationPage />}

          {activeTab === 'offers' && <AdminOffersLoyaltyPage />}

          {activeTab === 'reels' && (
            <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--ws-shadow-sm)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>Food Reels Moderation</h2>
              <p style={{ color: 'var(--ws-text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                All kitchen video reels are vetted for quality, hygiene standards, and 1-click food menu connectivity.
              </p>
            </div>
          )}

          {activeTab === 'posts' && (
            <div style={{ background: 'var(--ws-surface)', border: '1px solid var(--ws-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--ws-shadow-sm)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>Restaurant Announcements & Posts</h2>
              <p style={{ color: 'var(--ws-text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                Feed updates, new menu launches, and chef special announcements.
              </p>
            </div>
          )}

          {activeTab === 'support' && <AdminSupportPage />}

          {activeTab === 'security' && <AdminSecurityPage />}

          {activeTab === 'settings' && (
            <PlatformSettingsPage onOpenAuth={() => setAuthModalOpen(true)} />
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <AdminBottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenSidebar={() => setSidebarOpen(true)} 
        />
      </div>

      {/* Phase 4: Logout Confirmation Dialog */}
      <FDLogoutModal
        isOpen={showLogoutConfirm}
        isLoading={isLoggingOut}
        onCancel={cancelLogout}
        onConfirm={async () => {
          await confirmLogout();
          setAuthModalOpen(true);
        }}
      />

      {/* Phase 4: Session Expired Dialog */}
      <FDSessionExpiredModal
        isOpen={showSessionExpired}
        onLoginAgain={() => {
          handleSessionExpired();
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

      {/* Phase 17: Smart Notification Center Modal */}
      <SmartNotificationCenter
        isOpen={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          loadUnreadCount();
        }}
        onNavigateResource={(type) => {
          if (type === 'Order') setActiveTab('orders');
          else if (type === 'Restaurant') setActiveTab('restaurants');
          else if (type === 'Delivery') setActiveTab('fleet');
          else if (type === 'Payment') setActiveTab('payments');
        }}
      />

      {/* Inspector Modal */}
      <OrderInspectorModal />

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
    <AdminProvider>
      <AdminMain />
    </AdminProvider>
  );
};

export default App;
