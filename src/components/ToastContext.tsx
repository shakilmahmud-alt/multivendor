import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast UI */}
      <div 
        className={`fixed bottom-6 left-6 z-[9999] flex items-center gap-3 px-6 py-4 rounded shadow-2xl transition-all duration-300 transform ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
        } ${toast?.type === 'success' ? 'bg-[#438a5e] text-white' : 'bg-red-600 text-white'}`}
      >
        {toast?.type === 'success' && <Check className="w-6 h-6 stroke-[3]" />}
        <span className="font-medium text-[15px]">{toast?.message}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
