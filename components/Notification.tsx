
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  confirmAction: (message: string, onConfirm: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const confirmAction = useCallback((message: string, onConfirm: () => void) => {
    setConfirmModal({ message, onConfirm });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, confirmAction }}>
      {children}
      
      {/* Notifications Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right-full duration-500 ${
              n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              n.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
              'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <span className="text-lg">
              {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest">{n.message}</p>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 shadow-3xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center text-4xl mb-8 mx-auto border border-indigo-500/20">
              ❓
            </div>
            <h3 className="text-xl font-black text-white text-center uppercase italic tracking-tight mb-4">Tasdiqlash</h3>
            <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed mb-10">
              {confirmModal.message}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 py-5 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
