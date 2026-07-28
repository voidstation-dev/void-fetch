'use client';

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

type SetValue<T> = T | ((prev: T) => T);

interface UseLocalStorageStateOptions<T> {
  defaultValue: T;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function useLocalStorageState<T>(
  key: string,
  options: UseLocalStorageStateOptions<T>
) {
  const { defaultValue } = options;

  const getSnapshot = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? item : JSON.stringify(defaultValue);
    } catch {
      return JSON.stringify(defaultValue);
    }
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(
    () => JSON.stringify(defaultValue),
    [defaultValue]
  );

  const storeString = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value: T = useMemo(() => {
    try {
      return JSON.parse(storeString);
    } catch {
      return defaultValue;
    }
  }, [storeString, defaultValue]);

  const updateValue = useCallback(
    (next: SetValue<T>) => {
      try {
        const raw = window.localStorage.getItem(key);
        const current: T = raw !== null ? (JSON.parse(raw) as T) : defaultValue;
        const nextValue =
          typeof next === 'function' ? (next as (prev: T) => T)(current) : next;
        window.localStorage.setItem(key, JSON.stringify(nextValue));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // Ignore quota/serialization errors
      }
    },
    [key, defaultValue]
  );

  return [value, updateValue, true] as const;
}
