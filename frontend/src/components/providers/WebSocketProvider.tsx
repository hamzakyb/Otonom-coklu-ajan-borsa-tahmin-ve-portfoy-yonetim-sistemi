'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useRef<WebSocket | null>(null);
  const setWsConnected = useAppStore((state) => state.setWsConnected);
  const setLivePrices = useAppStore((state) => state.setLivePrices);
  const userEmail = useAppStore((state) => state.userEmail);
  const token = useAppStore((state) => state.token);

  useEffect(() => {
    if (!token) return; // Wait until authenticated

    // Generate a unique client ID based on email or random string
    const clientId = userEmail ? userEmail.replace('@', '_').replace('.', '_') : `guest_${Math.floor(Math.random() * 100000)}`;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/market/${clientId}?token=${token}`;

    const connect = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket Market Stream Connected");
        setWsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'PRICE_UPDATE') {
            // Merge incoming diffs into our state
            setLivePrices(message.data);
          }
        } catch (e) {
          console.error("WS Parse Error: ", e);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting in 3s...");
        setWsConnected(false);
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error: ", error);
        ws.current?.close();
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect on unmount
        ws.current.close();
      }
    };
  }, [setWsConnected, setLivePrices, userEmail]);

  return <>{children}</>;
}
