import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'consultoria.notifications.v1';

type Store = Record<string, boolean>;

function read(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore quota */ }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function useNotificationPreference(consultancyId: string | null | undefined) {
  const key = consultancyId ?? '';
  const [enabled, setEnabled] = useState<boolean>(() => (key ? read()[key] ?? true : true));

  useEffect(() => {
    if (!key) return;
    const sync = () => setEnabled(read()[key] ?? true);
    listeners.add(sync);
    sync();
    return () => { listeners.delete(sync); };
  }, [key]);

  const toggle = useCallback(() => {
    if (!key) return;
    const store = read();
    const next = !(store[key] ?? true);
    store[key] = next;
    write(store);
    setEnabled(next);
    notify();
  }, [key]);

  return { enabled, toggle };
}
