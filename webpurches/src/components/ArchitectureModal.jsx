import React, { useState } from 'react';
import { X, Layers, Database, Server, Cpu, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

const API_ROUTES = [
  { method: 'POST', path: '/api/auth/login/', desc: 'JWT Token authentication & session handshake', response: '{"access": "eyJhbG...", "refresh": "eyJhbG...", "user": {"id": 1, "role": "CUSTOMER"}}' },
  { method: 'GET', path: '/api/products/', desc: 'Fetch catalogue with category and price filters', response: '[{"id": "ws-prod-iphone16", "name": "Apple iPhone 16 Pro Max", "price": 139900, "stock": 24}]' },
  { method: 'POST', path: '/api/orders/', desc: 'Create order with escrow verification', response: '{"id": "ORD-2026-9481", "status": "PROCESSING", "tracking": "WS-EXP-890241-IN"}' },
  { method: 'POST', path: '/api/payments/create/', desc: 'Initiate gateway escrow transaction', response: '{"transactionId": "TXN-90412850-WS", "status": "AUTHORIZED", "currency": "INR"}' },
  { method: 'POST', path: '/api/payments/webhook/', desc: 'Cryptographic webhook status verification', response: '{"status": "PAID", "verified": true, "timestamp": "2026-03-28T10:14:00Z"}' },
  { method: 'GET', path: '/api/sellers/1/', desc: 'Fetch verified merchant profile and ratings', response: '{"store": "Apple Authorized Atelier", "verified": true, "score": 4.9}' },
];

export const ArchitectureModal = ({ isOpen, onClose }) => {
  const [selectedRoute, setSelectedRoute] = useState(API_ROUTES[1]);
  const [testOutput, setTestOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTest = () => {
    setIsLoading(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsLoading(false);
      setTestOutput(selectedRoute.response);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn text-[#F5F5F5]">
      <div 
        className="relative w-full max-w-4xl bg-[#151519] rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0B0B0D]">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-4 h-4 text-[#D6A85F]" />
            <span className="text-xs uppercase font-sans tracking-luxury text-[#F5F5F5] font-bold">
              WSHOP FULL-STACK ARCHITECTURE · DJANGO REST API + POSTGRESQL
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#1C1C21] text-[#A7A7AE] hover:text-[#F5F5F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          
          {/* Topology diagram */}
          <div className="p-6 rounded-2xl bg-[#0B0B0D] text-white space-y-4 font-mono text-xs border border-white/10">
            <div className="flex justify-between pb-3 border-b border-white/10">
              <span className="text-[#D6A85F] font-bold">PROJECT TOPOLOGY</span>
              <span className="text-[#A7A7AE]">REACT JSX ↔ DJANGO REST ↔ POSTGRESQL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[#151519] border border-white/10 space-y-1">
                <Globe className="w-5 h-5 mx-auto text-[#D6A85F] mb-1" />
                <span className="font-bold text-[#F5F5F5] block">⚛️ FRONTEND</span>
                <span className="text-[10px] text-[#A7A7AE] block">HTML5 / CSS3 / JavaScript</span>
                <span className="text-[10px] text-[#A7A7AE] block">React + JSX (No TSX)</span>
              </div>

              <div className="p-4 rounded-xl bg-[#151519] border border-white/10 space-y-1">
                <Server className="w-5 h-5 mx-auto text-[#D6A85F] mb-1" />
                <span className="font-bold text-[#F5F5F5] block">🌐 API & BACKEND</span>
                <span className="text-[10px] text-[#A7A7AE] block">Python & Django</span>
                <span className="text-[10px] text-[#A7A7AE] block">Django REST Framework</span>
              </div>

              <div className="p-4 rounded-xl bg-[#151519] border border-white/10 space-y-1">
                <Database className="w-5 h-5 mx-auto text-[#D6A85F] mb-1" />
                <span className="font-bold text-[#F5F5F5] block">🐘 DATABASE</span>
                <span className="text-[10px] text-[#A7A7AE] block">PostgreSQL</span>
                <span className="text-[10px] text-[#A7A7AE] block">Products, Orders, Escrow, Chat</span>
              </div>
            </div>
          </div>

          {/* Interactive REST API Route Tester */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-sans tracking-luxury font-bold text-[#F5F5F5]">
                ENDPOINTS & DATA PIPELINES
              </span>
              <span className="text-[10px] font-mono text-[#D6A85F]">
                JWT HANDSHAKE READY
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Route list (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                {API_ROUTES.map((route, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedRoute(route);
                      setTestOutput(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all ${
                      selectedRoute.path === route.path
                        ? 'border-[#D6A85F] bg-[#1C1C21] text-[#F5F5F5] shadow-xs'
                        : 'border-white/10 bg-[#151519] text-[#A7A7AE] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        route.method === 'GET' ? 'bg-[#D6A85F]/20 text-[#D6A85F]' : 'bg-white/10 text-white'
                      }`}>
                        {route.method}
                      </span>
                      <span className="font-bold">{route.path}</span>
                    </div>
                    <span className="text-[10px] text-[#A7A7AE] font-sans mt-1 block truncate">
                      {route.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Inspector Console (7 cols) */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0B0B0D] border border-white/10 text-white font-mono text-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D6A85F] animate-pulse" />
                    <span className="text-[#A7A7AE] text-[10px] uppercase">BACKEND RESPONSE INSPECTOR</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTest}
                    className="px-3 py-1 rounded-full bg-[#D6A85F] text-[#050505] font-bold text-[10px] uppercase hover:bg-[#F0C982]"
                  >
                    {isLoading ? 'EXECUTING...' : 'DISPATCH REQUEST'}
                  </button>
                </div>

                <div className="space-y-1 text-[#A7A7AE]">
                  <div>METHOD: <span className="text-[#D6A85F]">{selectedRoute.method}</span></div>
                  <div>URI: <span className="text-white">{selectedRoute.path}</span></div>
                  <div>HEADER: <span className="text-[#A7A7AE]">Authorization: Bearer &lt;JWT_ACCESS_TOKEN&gt;</span></div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#A7A7AE] block mb-1">
                    JSON RESPONSE PAYLOAD:
                  </span>
                  <pre className="p-3 rounded-xl bg-[#050505] text-[#D6A85F] overflow-x-auto text-[11px] border border-white/5">
                    {testOutput || selectedRoute.response}
                  </pre>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
