/**
 * Phase 28: Fast Delivery Real-Time Event Reliability & Synchronization Client
 * Singleton WebSocket Connection Manager for Admin Mission Control.
 */

export const ConnectionState = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  DISCONNECTED: 'DISCONNECTED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FAILED: 'FAILED'
};

class RealtimeConnectionManager {
  constructor(appRole = 'ADMIN', endpoint = '/FD/ecosystem/') {
    this.appRole = appRole;
    this.endpoint = endpoint;
    this.ws = null;
    this.state = ConnectionState.DISCONNECTED;
    
    this.listeners = new Map();
    this.stateListeners = new Set();
    this.reconcileHandlers = new Set();

    this.minDelay = 1000;
    this.maxDelay = 15000;
    this.factor = 1.5;
    this.jitter = 0.2;
    this.retryCount = 0;
    this.maxRetries = 10;
    this.retryTimer = null;
    this.isExplicitDisconnect = false;

    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
    this.heartbeatIntervalMs = 25000;
    this.heartbeatTimeoutMs = 6000;

    this.processedEventIds = new Set();
    this.maxProcessedCacheSize = 150;
    this.entityVersionMap = new Map();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.state === ConnectionState.DISCONNECTED || this.state === ConnectionState.FAILED) {
          this.retryCount = 0;
          this.connect();
        }
      });
      window.addEventListener('offline', () => {
        this.setState(ConnectionState.DISCONNECTED);
      });
    }
  }

  getAuthToken() {
    if (typeof localStorage === 'undefined') return null;
    return (
      localStorage.getItem(`fd_${this.appRole.toLowerCase()}_token`) ||
      localStorage.getItem('fd_admin_token') ||
      localStorage.getItem('fd_access_token')
    );
  }

  connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitDisconnect = false;
    this.setState(this.retryCount > 0 ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const isStandardPort = window.location.port === '' || window.location.port === '80' || window.location.port === '443';
    let url;
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) {
      url = `${import.meta.env.VITE_WS_URL.replace(/\/+$/, '')}${this.endpoint}`;
    } else if (isStandardPort) {
      url = `${protocol}//${host}${this.endpoint}`;
    } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
      // Derive the WS target from the API base so both always hit the same
      // backend (e.g. a fallback port when 8000 is occupied). Canonical
      // :8000 is used only when no API base is configured.
      try {
        const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL, window.location.origin);
        const wsProto = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        url = `${wsProto}//${apiUrl.host}${this.endpoint}`;
      } catch {
        url = `${protocol}//${host}:8000${this.endpoint}`;
      }
    } else {
      url = `${protocol}//${host}:8000${this.endpoint}`;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        const wasReconnecting = (this.state === ConnectionState.RECONNECTING);
        this.retryCount = 0;
        this.setState(ConnectionState.CONNECTED);
        this.startHeartbeat();

        const token = this.getAuthToken();
        if (token) {
          this.send({ action: 'authenticate', token });
        }

        if (wasReconnecting) {
          this.triggerReconciliation();
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.ws.onerror = () => {};

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;

        if (event.code === 4001 || event.code === 4003) {
          this.setState(ConnectionState.UNAUTHORIZED);
          return;
        }

        if (this.isExplicitDisconnect) {
          this.setState(ConnectionState.DISCONNECTED);
          return;
        }

        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (typeof window === 'undefined' || this.isExplicitDisconnect) return;
    if (!navigator.onLine) {
      this.setState(ConnectionState.DISCONNECTED);
      return;
    }

    if (this.retryCount >= this.maxRetries) {
      this.setState(ConnectionState.FAILED);
      return;
    }

    this.setState(ConnectionState.RECONNECTING);
    this.retryCount += 1;

    const rawDelay = Math.min(
      this.minDelay * Math.pow(this.factor, this.retryCount - 1),
      this.maxDelay
    );
    const jitterMultiplier = 1 + (Math.random() * 2 - 1) * this.jitter;
    const finalDelay = Math.round(rawDelay * jitterMultiplier);

    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.connect();
    }, finalDelay);
  }

  handleMessage(event) {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!payload || typeof payload !== 'object') return;

    if (payload.type === 'pong') {
      if (this.heartbeatTimeoutTimer) {
        clearTimeout(this.heartbeatTimeoutTimer);
        this.heartbeatTimeoutTimer = null;
      }
      return;
    }

    // Deduplication
    const eventId = payload.event_id || payload.idempotency_key;
    if (eventId) {
      if (this.processedEventIds.has(eventId)) {
        return;
      }
      this.processedEventIds.add(eventId);
      if (this.processedEventIds.size > this.maxProcessedCacheSize) {
        const first = this.processedEventIds.values().next().value;
        this.processedEventIds.delete(first);
      }
    }

    // Out-of-order check
    const entityType = payload.entity_type || (payload.order_id ? 'order' : payload.notification_id ? 'notification' : null);
    const entityId = payload.entity_id || payload.order_id || payload.notification_id;
    const entityVersion = payload.entity_version;

    if (entityType && entityId && entityVersion !== undefined) {
      const entityKey = `${entityType}_${entityId}`;
      const lastVersion = this.entityVersionMap.get(entityKey);
      if (lastVersion !== undefined && entityVersion < lastVersion) {
        return;
      }
      this.entityVersionMap.set(entityKey, entityVersion);
    }

    const eventType = payload.event_type || payload.event || payload.type;
    if (eventType) {
      this.emit(eventType, payload);
    }
    this.emit('*', payload);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ action: 'ping', timestamp: Date.now() });

        this.heartbeatTimeoutTimer = setTimeout(() => {
          if (this.ws) {
            this.ws.close();
          }
        }, this.heartbeatTimeoutMs);
      }
    }, this.heartbeatIntervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.heartbeatTimeoutTimer) clearTimeout(this.heartbeatTimeoutTimer);
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.listeners.delete(eventType);
      }
    };
  }

  on(eventType, callback) {
    return this.subscribe(eventType, callback);
  }

  emit(eventType, data) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.warn(`Admin realtime listener error:`, err);
        }
      });
    }
  }

  onStateChange(callback) {
    this.stateListeners.add(callback);
    callback(this.state);
    return () => this.stateListeners.delete(callback);
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateListeners.forEach(cb => {
      try {
        cb(this.state);
      } catch {}
    });
  }

  registerReconciliation(handler) {
    this.reconcileHandlers.add(handler);
    return () => this.reconcileHandlers.delete(handler);
  }

  async triggerReconciliation() {
    for (const handler of this.reconcileHandlers) {
      try {
        await handler();
      } catch (err) {
        console.warn('Admin reconciliation notice:', err);
      }
    }
  }

  disconnect() {
    this.isExplicitDisconnect = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState(ConnectionState.DISCONNECTED);
  }

  reconnectNow() {
    this.retryCount = 0;
    this.isExplicitDisconnect = false;
    if (this.ws) {
      this.ws.close();
    } else {
      this.connect();
    }
  }
}

const instances = new Map();

export const getRealtimeClient = (appRole = 'ADMIN', endpoint = '/FD/ecosystem/') => {
  const key = `${appRole}_${endpoint}`;
  if (!instances.has(key)) {
    const client = new RealtimeConnectionManager(appRole, endpoint);
    instances.set(key, client);
  }
  return instances.get(key);
};
