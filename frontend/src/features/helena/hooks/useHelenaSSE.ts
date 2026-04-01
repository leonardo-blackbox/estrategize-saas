import { useEffect, useRef, useState, useCallback } from 'react';
import type { HelenaReport } from '../../../types/helena.ts';
import { useAuthStore } from '../../../stores/authStore.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
const MAX_REPORTS = 10;
const MAX_RETRIES = 5;
const RECONNECT_DELAY = 3000;

interface UseHelenaSSEResult {
  reports: HelenaReport[];
  connected: boolean;
  unreadCount: number;
  markAllRead: () => void;
}

export function useHelenaSSE(sessionId: string | null): UseHelenaSSEResult {
  const [reports, setReports] = useState<HelenaReport[]>([]);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const sourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const connect = useCallback(() => {
    if (!sessionId || !mountedRef.current) return;

    const token = useAuthStore.getState().session?.access_token;
    if (!token) return;

    const url = `${API_URL}/api/meetings/${sessionId}/helena?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const report = JSON.parse(event.data as string) as HelenaReport;
        retryCountRef.current = 0;
        setConnected(true);
        setReports((prev) => [report, ...prev].slice(0, MAX_REPORTS));
        setUnreadCount((prev) => prev + 1);
      } catch {
        // ignore malformed messages
      }
    };

    source.onerror = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      source.close();
      sourceRef.current = null;

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, RECONNECT_DELAY);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!sessionId) {
      setReports([]);
      setConnected(false);
      setUnreadCount(0);
      return;
    }

    retryCountRef.current = 0;
    connect();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, [sessionId, connect]);

  return { reports, connected, unreadCount, markAllRead };
}
