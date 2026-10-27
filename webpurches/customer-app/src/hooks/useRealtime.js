import { useState, useEffect, useCallback } from 'react';
import { getRealtimeClient, ConnectionState } from '../utils/realtime.js';

export const useRealtime = (appRole = 'CUSTOMER', endpoint = '/FD/ecosystem/') => {
  const client = getRealtimeClient(appRole, endpoint);
  const [connectionState, setConnectionState] = useState(client.state);
  const [retryCount, setRetryCount] = useState(client.retryCount);

  useEffect(() => {
    // Start connection
    client.connect();

    const unsubscribe = client.onStateChange((state) => {
      setConnectionState(state);
      setRetryCount(client.retryCount);
    });

    return () => {
      unsubscribe();
    };
  }, [client]);

  const reconnect = useCallback(() => {
    client.reconnectNow();
  }, [client]);

  const disconnect = useCallback(() => {
    client.disconnect();
  }, [client]);

  const subscribe = useCallback((eventType, callback) => {
    return client.subscribe(eventType, callback);
  }, [client]);

  const registerReconciliation = useCallback((handler) => {
    return client.registerReconciliation(handler);
  }, [client]);

  return {
    client,
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    isFailed: connectionState === ConnectionState.FAILED,
    isDisconnected: connectionState === ConnectionState.DISCONNECTED,
    retryCount,
    reconnect,
    disconnect,
    subscribe,
    registerReconciliation
  };
};
