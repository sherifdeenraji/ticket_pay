'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastMessage[]) => void;

const toastStore = {
  toasts: [] as ToastMessage[],
  listeners: new Set<Listener>(),
};

function emit() {
  for (const listener of toastStore.listeners) {
    listener([...toastStore.toasts]);
  }
}

export function addToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = Math.random().toString(36).slice(2, 10);
  toastStore.toasts = [...toastStore.toasts, { id, message, type }];
  emit();

  if (duration > 0) {
    window.setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id: string) {
  toastStore.toasts = toastStore.toasts.filter((toast) => toast.id !== id);
  emit();
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(toastStore.toasts);

  useEffect(() => {
    const listener: Listener = (nextToasts) => setToasts(nextToasts);
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
  };
}

export function ToastPortal() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 w-[92vw] max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-900'
              : toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : toast.type === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-sky-200 bg-sky-50 text-sky-900'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="mt-0.5" size={18} />}
          {toast.type === 'error' && <AlertCircle className="mt-0.5" size={18} />}
          {toast.type === 'warning' && <AlertCircle className="mt-0.5" size={18} />}
          {toast.type === 'info' && <Info className="mt-0.5" size={18} />}

          <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss toast"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
