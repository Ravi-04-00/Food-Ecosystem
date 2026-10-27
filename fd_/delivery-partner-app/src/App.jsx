import React, { useState, useEffect } from 'react';
import { DeliveryProvider, useDelivery } from './context/DeliveryContext.jsx';
import { Sidebar } from './components/navigation/Sidebar.jsx';
import { TopHeader } from './components/navigation/TopHeader.jsx';
import { MobileBottomNav } from './components/navigation/MobileBottomNav.jsx';
import { MoreSheet } from './components/navigation/MoreSheet.jsx';
import { ToastBanner } from './components/common/ToastBanner.jsx';
import { FDOpeningFlow } from './components/FDOpeningFlow.jsx';
import { LiveOrderRequestModal } from './components/modals/LiveOrderRequestModal.jsx';
import { HelpBottomSheet } from './components/modals/HelpBottomSheet.jsx';
import { FDLogoutModal } from './components/FDLogoutModal.jsx';
import { FDSessionExpiredModal } from './components/FDSessionExpiredModal.jsx';
import { SmartNotificationCenter } from './components/SmartNotificationCenter.jsx';
import { usePWA } from './hooks/usePWA.js';
import { ConnectivityBanner } from './components/ConnectivityBanner.jsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.jsx';
import { SWUpdateToast } from './components/SWUpdateToast.jsx';

// Pages
import { DashboardPage } from './pages/DashboardPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { BatchDeliveryPage } from './pages/BatchDeliveryPage.jsx';
import { EarningsPage } from './pages/EarningsPage.jsx';
import { WalletPage } from './pages/WalletPage.jsx';
import { SchedulePage } from './pages/SchedulePage.jsx';
import { IncentivesPage } from './pages/IncentivesPage.jsx';
import { DemandHeatmapPage } from './pages/DemandHeatmapPage.jsx';
import { VehiclePage } from './pages/VehiclePage.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { SafetyPage } from './pages/SafetyPage.jsx';
import { SupportPage } from './pages/SupportPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { DeliveryFeedbackPage } from './pages/DeliveryFeedbackPage.jsx';
import { fetchKYCStatus } from './services/api.js';

const DeliveryOperationsApp = () => {
  const { 
    showLogoutConfirm, 
    cancelLogout, 
    confirmLogout, 
    showSessionExpired, 
    handleSessionExpired, 
    logoutFeedback, 
    isLoggingOut,
    promptLogout
  } = useDelivery();
  const pwa = usePWA();

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
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (pwa.isStandalone || sessionStorage.getItem('bp_intro_seen') === 'true') {
      return false;
    }
    return true;
  });

  const handleCompleteIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem('bp_intro_seen', 'true');
    // Direct newly logged-in partners to KYC unless already approved.
    fetchKYCStatus()
      .then(data => {
        if (data && data.kyc_required && data.status && data.status !== 'APPROVED') {
          setActiveTab('documents');
        }
      })
      .catch(() => {
        // Stay on dashboard if status check fails
      });
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bp-bg-canvas)',
      color: 'var(--bp-text-primary)',
      display: 'flex',
      flexDirection: 'row',
      transition: 'background-color 0.25s ease, color 0.25s ease'
    }}>
      {/* FD Brand Opening Flow (Intro 2-4s -> Splash -> Partner Login Screen) */}
      {showIntro && (
        <FDOpeningFlow onAuthenticated={handleCompleteIntro} />
      )}

      {/* Operations Navigation Drawer (hidden by default, hamburger opens) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Operations Viewport */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        position: 'relative'
      }}>
        {/* Network Connectivity Status Probe & Banner */}
        <ConnectivityBanner 
          isOnline={pwa.isOnline}
          isBackendReachable={pwa.isBackendReachable}
          isCheckingHealth={pwa.isCheckingHealth}
          showOnlineRestored={pwa.showOnlineRestored}
          onRetry={pwa.verifyConnectivity}
          role="delivery"
        />

        {/* PWA Home Screen Installation Guidance */}
        <PWAInstallBanner 
          isStandalone={pwa.isStandalone}
          isInstallable={pwa.isInstallable}
          installDismissed={pwa.installDismissed}
          platform={pwa.platform}
          onPromptInstall={pwa.promptInstall}
          onDismissInstall={pwa.dismissInstall}
          appName="Fast Delivery Driver"
        />

        {/* Top Operations Header */}
        <TopHeader 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onReplayIntro={handleReplayIntro}
          onOpenMore={() => setMoreSheetOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          sidebarOpen={sidebarOpen}
        />

        {/* Dynamic Page Container */}
        <style>{`
          .delivery-main-viewport {
            flex: 1;
            padding: 24px 20px;
            width: 100%;
            max-width: 1440px;
            margin: 0 auto;
            box-sizing: border-box;
          }
          @media (max-width: 767.5px) {
            .delivery-main-viewport {
              padding: 16px 14px calc(96px + env(safe-area-inset-bottom, 16px)) !important;
            }
          }
        `}</style>
        <main className="delivery-main-viewport">
          {activeTab === 'dashboard' && (
            <DashboardPage 
              onGoToOrders={() => setActiveTab('orders')}
              onGoToBatch={() => setActiveTab('batch')}
              onOpenHelp={() => setHelpOpen(true)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersPage 
              onGoToTrip={() => setActiveTab('dashboard')}
              onGoToBatch={() => setActiveTab('batch')}
            />
          )}

          {activeTab === 'batch' && (
            <BatchDeliveryPage 
              onGoToLiveTrip={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'earnings' && (
            <EarningsPage 
              onGoToWallet={() => setActiveTab('wallet')}
            />
          )}

          {activeTab === 'feedback' && (
            <DeliveryFeedbackPage />
          )}

          {activeTab === 'wallet' && (
            <WalletPage />
          )}

          {activeTab === 'schedule' && (
            <SchedulePage />
          )}

          {activeTab === 'incentives' && (
            <IncentivesPage />
          )}

          {activeTab === 'heatmap' && (
            <DemandHeatmapPage 
              onGoToMap={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'vehicle' && (
            <VehiclePage />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage />
          )}

          {activeTab === 'safety' && (
            <SafetyPage />
          )}

          {activeTab === 'support' && (
            <SupportPage />
          )}

          {activeTab === 'profile' && (
            <ProfilePage 
              onGoToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              onReplayIntro={handleReplayIntro}
              onLogout={promptLogout}
            />
          )}
        </main>

        {/* Phase 4: Logout Confirmation Dialog */}
        <FDLogoutModal
          isOpen={showLogoutConfirm}
          isLoading={isLoggingOut}
          onCancel={cancelLogout}
          onConfirm={async () => {
            await confirmLogout();
            setShowIntro(true);
          }}
        />

        {/* Phase 4: Session Expired Dialog */}
        <FDSessionExpiredModal
          isOpen={showSessionExpired}
          onLoginAgain={() => {
            handleSessionExpired();
            setShowIntro(true);
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

        {/* Global Toast Notifications */}
        <ToastBanner />

        {/* Live Incoming Order Request Modal */}
        <LiveOrderRequestModal />

        {/* Smart Dispatch Notifications Center */}
        <SmartNotificationCenter 
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onNavigateResource={(type) => {
            if (type === 'Order') setActiveTab('orders');
          }}
        />

        {/* Universal Help & Support Bottom Sheet */}
        <HelpBottomSheet 
          isOpen={helpOpen} 
          onClose={() => setHelpOpen(false)} 
          contextScreen={activeTab} 
        />

        {/* Mobile Secondary Modules "More" Drawer Sheet */}
        <MoreSheet 
          isOpen={moreSheetOpen}
          onClose={() => setMoreSheetOpen(false)}
          onSelectTab={(tabId) => setActiveTab(tabId)}
        />

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMore={() => setMoreSheetOpen(true)}
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
    <DeliveryProvider>
      <DeliveryOperationsApp />
    </DeliveryProvider>
  );
};

export default App;
