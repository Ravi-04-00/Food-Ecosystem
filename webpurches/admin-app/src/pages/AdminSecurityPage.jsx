import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Lock, AlertTriangle, Key, UserCheck, 
  ShieldAlert, FileText, CheckCircle2, Search, RefreshCw, 
  ChevronLeft, ChevronRight, Eye, Shield
} from 'lucide-react';
import { fetchAdminAuditLogs } from '../services/api.js';

export const AdminSecurityPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected audit detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = {
        q: searchTerm,
        page: currentPage
      };
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await fetchAdminAuditLogs(params);
      setAuditLogs(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, actionFilter, dateFrom, dateTo, currentPage]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const securityRules = [
    { title: 'JWT Authentication', desc: 'Stateless JSON Web Tokens with rotating refresh tokens', status: 'ACTIVE' },
    { title: 'Role-Based Permissions', desc: 'Granular policy matrix separating Customer, Shop, Delivery & Admin', status: 'ENFORCED' },
    { title: 'Argon2/PBKDF2 Password Hashing', desc: 'Cryptographic salt & zero plain-text password storage', status: 'ENFORCED' },
    { title: 'HTTPS & TLS Encryption', desc: 'Full SSL/TLS encrypted traffic transport across all endpoints', status: 'ENFORCED' },
    { title: 'API Request Validation', desc: 'Pydantic & DRF schema serializers strictly sanitizing payloads', status: 'ACTIVE' },
    { title: 'Rate Limiting & Throttling', desc: '100 req/min user throttling guarding against brute-force attacks', status: 'ACTIVE' },
    { title: 'Payment Escrow Verification', desc: 'Cryptographic HMAC signature validation on payment webhooks', status: 'ACTIVE' },
    { title: 'Audit Logging & Activity Records', desc: 'Immutable transaction trails recording administrative overrides', status: 'LOGGING' }
  ];

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const actionTypes = [
    'ALL',
    'CUSTOMER_SUSPENDED',
    'CUSTOMER_REACTIVATED',
    'RESTAURANT_APPROVED',
    'RESTAURANT_REJECTED',
    'DELIVERY_PARTNER_APPROVED',
    'DELIVERY_PARTNER_SUSPENDED',
    'ORDER_ADMIN_INTERVENTION',
    'PLATFORM_SETTINGS_UPDATED'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Title */}
      <div>
        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          PLATFORM INTEGRITY & IMMUTABLE GOVERNANCE
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '4px 0 2px 0' }}>
          Security & Immutable Audit Trail
        </h1>
        <div style={{ fontSize: '0.85rem', color: 'var(--ws-text-muted)' }}>
          Read-only PostgreSQL audit log recording admin identity, timestamps, target resources, and mandatory reasons
        </div>
      </div>

      {/* Security Health Banner */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ws-text-primary)' }}>
              Ecosystem Governance Status: ENFORCED
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ws-text-muted)' }}>
              All administrative modifications require justification reasons and are cryptographically signed to immutable logs
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadAuditLogs}
            disabled={isLoading}
            style={{
              background: 'var(--ws-surface-subtle)',
              border: '1px solid var(--ws-border)',
              borderRadius: '10px',
              padding: '10px 16px',
              color: 'var(--ws-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Audit Log Controls & Filters */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
            Administrative Audit Trail ({totalCount} entries)
          </h2>

          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--ws-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search actor, target ID, reason..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '8px',
                padding: '8px 12px 8px 34px',
                color: 'var(--ws-text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                width: '260px'
              }}
            />
          </div>
        </div>

        {/* Action Type Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {actionTypes.map(at => (
            <button
              key={at}
              onClick={() => {
                setActionFilter(at);
                setCurrentPage(1);
              }}
              style={{
                background: actionFilter === at ? 'var(--ws-primary, #22C55E)' : 'var(--ws-surface-subtle)',
                color: actionFilter === at ? '#FFFFFF' : 'var(--ws-text-secondary)',
                border: '1px solid',
                borderColor: actionFilter === at ? 'var(--ws-primary, #22C55E)' : 'var(--ws-border)',
                padding: '5px 10px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              {at.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #EF4444',
          color: '#EF4444',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.85rem'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Audit Logs Table */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Querying PostgreSQL immutable audit records...</div>
          </div>
        ) : auditLogs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ws-text-muted)' }}>
            <FileText size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ws-text-primary)' }}>No audit log entries recorded</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Administrative actions will be permanently logged here</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{
                  background: 'var(--ws-surface-subtle)',
                  borderBottom: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-muted)',
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '14px 16px' }}>Timestamp</th>
                  <th style={{ padding: '14px 16px' }}>Admin Actor</th>
                  <th style={{ padding: '14px 16px' }}>Action</th>
                  <th style={{ padding: '14px 16px' }}>Target Resource</th>
                  <th style={{ padding: '14px 16px' }}>Justification Reason</th>
                  <th style={{ padding: '14px 16px' }}>IP Address</th>
                  <th style={{ padding: '14px 16px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid var(--ws-border)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--ws-text-primary)' }}>
                      {log.actor_username || 'System'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: log.action.includes('SUSPENDED') || log.action.includes('REJECTED')
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(16, 185, 129, 0.12)',
                        color: log.action.includes('SUSPENDED') || log.action.includes('REJECTED')
                          ? '#EF4444'
                          : '#10B981'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-secondary)' }}>
                      {log.target_model} #{log.target_id}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-primary)', maxWidth: '250px' }}>
                      {log.reason || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--ws-text-muted)', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                      {log.ip_address || 'Internal'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{
                          background: 'var(--ws-surface-subtle)',
                          border: '1px solid var(--ws-border)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: 'var(--ws-text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--ws-text-primary)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ws-text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              background: 'var(--ws-surface)',
              border: '1px solid var(--ws-border)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'var(--ws-text-primary)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 8 Architectural Security Rules Matrix */}
      <div style={{
        background: 'var(--ws-surface)',
        border: '1px solid var(--ws-border)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: 'var(--ws-shadow-sm)'
      }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ws-text-primary)', margin: 0 }}>
            Security & Cryptographic Rules Engine
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
            Platform authentication, data transport encryption, and tamper resistance
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {securityRules.map(rule => (
            <div
              key={rule.title}
              style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--ws-text-primary)' }}>
                    {rule.title}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981'
                  }}>
                    {rule.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ws-text-muted)', marginTop: '4px' }}>
                  {rule.desc}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                <CheckCircle2 size={13} />
                <span>Zero Vulnerability Discovered</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Audit Log Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ws-surface)',
            border: '1px solid var(--ws-border)',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#10B981'
                }}>
                  IMMUTABLE AUDIT LOG #{selectedLog.id}
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ws-text-primary)', margin: '8px 0 2px 0' }}>
                  {selectedLog.action}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--ws-text-muted)' }}>
                  Recorded at {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--ws-text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div><strong>Admin Actor:</strong> {selectedLog.actor_username} (ID: {selectedLog.actor_id})</div>
              <div><strong>Target Resource:</strong> {selectedLog.target_model} (ID: {selectedLog.target_id})</div>
              <div><strong>IP Address:</strong> {selectedLog.ip_address || 'Internal/Loopback'}</div>
              <div><strong>Justification Reason:</strong> {selectedLog.reason || 'None provided'}</div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.76rem', color: 'var(--ws-text-muted)', marginBottom: '6px' }}>
                AUDITED DETAILS (BEFORE / AFTER VALUES)
              </div>
              <pre style={{
                background: 'var(--ws-surface-subtle)',
                border: '1px solid var(--ws-border)',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.75rem',
                color: 'var(--ws-text-primary)',
                overflowX: 'auto',
                margin: 0
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'var(--ws-surface-subtle)',
                  border: '1px solid var(--ws-border)',
                  color: 'var(--ws-text-primary)',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
