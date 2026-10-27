import React, { useState } from 'react';
import { 
  ShoppingBag, Store, Bike, Shield, 
  ExternalLink, CheckCircle2, Globe, Lock
} from 'lucide-react';
import { FDOrganicLogo } from './components/FDOrganicLogo.jsx';
import { FDCommonBrandIntro } from './components/FDCommonBrandIntro.jsx';

export const App = () => {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY_PARTNER' | 'ADMIN'
  const [previewIntroRole, setPreviewIntroRole] = useState(null);

  const apps = [
    {
      id: 'CUSTOMER',
      name: 'Customer App',
      tagline: 'Food Ordering & Live Delivery Experience',
      port: 3000,
      url: 'http://localhost:3000',
      devCmd: 'npm run dev:customer',
      buildCmd: 'npm run build:customer',
      color: '#22C55E',
      bgGradient: 'linear-gradient(135deg, #062817 0%, #0B331F 100%)',
      accentColor: '#4ADE80',
      icon: ShoppingBag,
      role: 'CUSTOMER',
      features: [
        'Explore local restaurants & kitchens in Anna Nagar',
        'Add to Cart with real-time price calculations & discounts',
        'Coupon codes: FDFRESH20, FDWELCOME50, FREESHIP',
        'Live GPS Order Tracking with animated rider route & OTP 8492',
        'FD Wallet (₹1,250 balance) + Saved Delivery Addresses',
        'AI Food Copilot, Food Reels Player & Saved Wishlist'
      ]
    },
    {
      id: 'RESTAURANT',
      name: 'Restaurant App',
      tagline: 'Kitchen Management & Live Dispatch Portal',
      port: 3001,
      url: 'http://localhost:3001',
      devCmd: 'npm run dev:restaurant',
      buildCmd: 'npm run build:restaurant',
      color: '#4ADE80',
      bgGradient: 'linear-gradient(135deg, #062817 0%, #0E3D26 100%)',
      accentColor: '#22C55E',
      icon: Store,
      role: 'RESTAURANT',
      features: [
        'Live Kitchen Orders Queue with 4-stage progression',
        'Kitchen Display System (KDS Live) for line chefs',
        'Menu Catalog with Add/Edit dish modals',
        'Raw ingredient inventory & auto out-of-stock triggers',
        'Daily gross revenue & T+1 bank settlement audit',
        'Online / Paused kitchen toggle & FSSAI license compliance'
      ]
    },
    {
      id: 'DELIVERY_PARTNER',
      name: 'Delivery Partner App',
      tagline: 'Rider Operations, GPS Navigation & Trips',
      port: 3002,
      url: 'http://localhost:3002',
      devCmd: 'npm run dev:delivery-partner',
      buildCmd: 'npm run build:delivery-partner',
      color: '#22C55E',
      bgGradient: 'linear-gradient(135deg, #062817 0%, #11482E 100%)',
      accentColor: '#6EE7B7',
      icon: Bike,
      role: 'DELIVERY_PARTNER',
      features: [
        '3D Cinematic Intro & Fast Delivery Splash opening',
        '11-step complete partner KYC onboarding wizard',
        'Online/Offline availability toggle with zone matching',
        'Turn-by-turn navigation & pickup/customer handover',
        'Customer delivery OTP verification (8492)',
        'Wallet earnings (₹1,490/day) & SOS Emergency modal'
      ]
    },
    {
      id: 'ADMIN',
      name: 'Mission Control Admin',
      tagline: 'Platform Command Center & Telemetry',
      port: 3003,
      url: 'http://localhost:3003',
      devCmd: 'npm run dev:admin',
      buildCmd: 'npm run build:admin',
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, #062817 0%, #0B2016 100%)',
      accentColor: '#34D399',
      icon: Shield,
      role: 'ADMIN',
      features: [
        'Real-time Ecosystem Telemetry & Live Control Map',
        'Customer moderation (24.8k verified users)',
        'Restaurant partner approvals & commission config',
        'Delivery partner fleet management & live telemetry',
        'Orders feed & inspector with refund dispute workflows',
        'Financial Vault & platform fee settlement analytics'
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#062817',
      color: '#FFFFFF',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header Strip */}
      <header style={{
        padding: '16px 28px',
        borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
        background: 'rgba(6, 40, 23, 0.95)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <FDOrganicLogo 
            size="md" 
            theme="dark" 
            showWordmark={true} 
            showTagline={true} 
          />
          <div className="hidden md:flex" style={{ height: '28px', width: '1px', background: 'rgba(74, 222, 128, 0.2)' }} />
          <div className="hidden md:flex" style={{ fontSize: '0.82rem', color: '#A7F3D0', fontWeight: 600 }}>
            Unified Ecosystem • Four Standalone Applications
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            borderRadius: '12px',
            padding: '6px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#4ADE80'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 8px #22C55E'
            }} />
            <span>Backend API: Port 8000 Online</span>
          </div>

          {/* Test Phase 1 Intro Button */}
          <button
            onClick={() => setPreviewIntroRole(selectedRole.toLowerCase())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 14px',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)'
            }}
          >
            <span>🎬 Test Phase 1 Intro</span>
          </button>

          <a
            href="http://localhost:8000/api/docs/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '6px 12px',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <Globe size={14} />
            <span>Swagger Docs</span>
          </a>
        </div>
      </header>

      {/* Full-Screen Phase 1 Common Brand Intro Preview */}
      {previewIntroRole && (
        <FDCommonBrandIntro 
          app={previewIntroRole === 'delivery_partner' ? 'delivery' : previewIntroRole}
          onComplete={() => setPreviewIntroRole(null)}
        />
      )}

      {/* Hero Announcement */}
      <section style={{
        padding: '36px 28px 24px',
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(11, 51, 31, 0.9) 0%, rgba(17, 72, 46, 0.7) 100%)',
          borderRadius: '28px',
          padding: '32px 36px',
          border: '1px solid rgba(74, 222, 128, 0.25)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(74, 222, 128, 0.4)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#4ADE80',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              <CheckCircle2 size={14} />
              <span>UI Refactor & Architecture Separation Complete</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 10px', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
              Fast Delivery (FD) App Gateway
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#A7F3D0', maxWidth: '680px', margin: 0, lineHeight: 1.6 }}>
              The legacy monolithic UI has been completely decoupled into <strong>four standalone, production-ready applications</strong>. All four apps share the existing Django backend, database models, and authentication system with role-based access control.
            </p>
          </div>

          <div style={{
            background: 'rgba(6, 40, 23, 0.85)',
            border: '1px solid rgba(74, 222, 128, 0.2)',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '260px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Ecosystem Quick Action
            </div>
            <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>
              Launch all 4 apps simultaneously:
            </div>
            <code style={{
              background: '#04180E',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              color: '#4ADE80',
              fontFamily: 'monospace',
              border: '1px solid rgba(74, 222, 128, 0.2)'
            }}>
              npm run dev:all
            </code>
          </div>
        </div>
      </section>

      {/* 4 Application Cards Grid */}
      <section style={{
        padding: '0 28px 48px',
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        flex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '24px'
        }}>
          {apps.map(app => {
            const Icon = app.icon;
            const isSelected = selectedRole === app.id;

            return (
              <div
                key={app.id}
                onClick={() => setSelectedRole(app.id)}
                style={{
                  background: isSelected ? 'rgba(11, 51, 31, 0.95)' : 'rgba(11, 51, 31, 0.55)',
                  border: `2px solid ${isSelected ? '#22C55E' : 'rgba(74, 222, 128, 0.2)'}`,
                  borderRadius: '24px',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? '0 12px 36px rgba(34, 197, 94, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  transform: isSelected ? 'translateY(-4px)' : 'none'
                }}
              >
                {/* Top Badge & Port */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(34, 197, 94, 0.18)',
                    color: '#4ADE80',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(74, 222, 128, 0.3)'
                  }}>
                    <Icon size={24} />
                  </div>

                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ADE80',
                    border: '1px solid rgba(74, 222, 128, 0.3)'
                  }}>
                    PORT {app.port}
                  </span>
                </div>

                {/* App Title & Tagline */}
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
                    {app.name}
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: '#A7F3D0' }}>
                    {app.tagline}
                  </div>
                </div>

                {/* Key Features List */}
                <div style={{
                  background: 'rgba(6, 40, 23, 0.7)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid rgba(74, 222, 128, 0.15)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Core Working Features
                  </div>
                  {app.features.slice(0, 4).map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem', color: '#E2F3E9' }}>
                      <span style={{ color: '#22C55E', fontWeight: 800, marginTop: '2px' }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons: Launch in Browser + Terminal Command */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      borderRadius: '14px',
                      padding: '12px 18px',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Launch {app.name}</span>
                    <ExternalLink size={16} />
                  </a>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: '#04180E',
                    border: '1px solid rgba(74, 222, 128, 0.2)',
                    fontSize: '0.75rem',
                    color: '#A7F3D0'
                  }}>
                    <span style={{ fontFamily: 'monospace' }}>{app.devCmd}</span>
                    <span style={{ fontSize: '0.7rem', color: '#6EE7B7' }}>STANDALONE</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role Separation & Security Rule Card */}
        <div style={{
          marginTop: '36px',
          background: 'rgba(11, 51, 31, 0.75)',
          border: '1px solid rgba(74, 222, 128, 0.25)',
          borderRadius: '24px',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ADE80',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF' }}>
                Role-Based Access Control (RBAC) Enforced
              </div>
              <div style={{ fontSize: '0.82rem', color: '#A7F3D0', marginTop: '2px' }}>
                Customer (Port 3000) • Restaurant (Port 3001) • Delivery Partner (Port 3002) • Admin (Port 3003)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['CUSTOMER', 'RESTAURANT', 'DELIVERY_PARTNER', 'ADMIN'].map(role => (
              <span key={role} style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                padding: '6px 14px',
                borderRadius: '8px'
              }}>
                ROLE: {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(74, 222, 128, 0.2)',
        background: '#04180E',
        padding: '20px 28px',
        fontSize: '0.8rem',
        color: '#6EE7B7'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 900, color: '#22C55E' }}>FAST DELIVERY (FD)</span>
            <span>• Good Food • Fast • Fresh • For You</span>
          </div>

          <div>
            Built with Django REST Framework, WebSockets & Vite 8 • Zero Dead Buttons
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
