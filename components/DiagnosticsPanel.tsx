
import React, { useState } from 'react';
import { URLS, checkConnection } from '../services/api';

const API_ICONS: Record<string, string> = {
  products: '📦',
  productKirim: '📥',
  productChiqim: '📤',
  productOstatka: '⚖️',
  tovarlar: '💎',
  tovarKirim: '🚚',
  tovarChiqim: '💰',
  tovarOstatka: '📊',
  norma: '🧪',
  xodimlar: '👥'
};

export const DiagnosticsPanel: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<string, { status: boolean; time: number; checked: boolean }>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const runFullDiagnostics = async () => {
    setIsChecking(true);
    const newStatuses: typeof statuses = {};
    
    // API nuqtalarini birma-bir tekshirish
    const keys = Object.keys(URLS);
    for (const key of keys) {
      const result = await checkConnection(key as any);
      newStatuses[key] = { ...result, checked: true };
      setStatuses({ ...newStatuses });
    }
    
    setLastChecked(new Date().toLocaleTimeString());
    setIsChecking(false);
  };

  const calculateHealth = () => {
    // FIX: Add type assertion to Object.values to avoid 'unknown' type error for property 'status'
    const checkedItems = Object.values(statuses) as Array<{ status: boolean; time: number; checked: boolean }>;
    if (checkedItems.length === 0) return null;
    const active = checkedItems.filter(s => s.status).length;
    return Math.round((active / checkedItems.length) * 100);
  };

  const healthScore = calculateHealth();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header section with summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/20 p-10 rounded-[3rem] border border-slate-800/50">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Diagnostika <span className="text-indigo-500">Markazi</span></h3>
             {healthScore !== null && (
               <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${healthScore === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                 Holat: {healthScore}%
               </div>
             )}
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Google Sheets API va Cloud Functions integratsiya holati</p>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          {lastChecked && (
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Oxirgi tekshiruv: {lastChecked}</span>
          )}
          <button 
            onClick={runFullDiagnostics} 
            disabled={isChecking} 
            className="group relative px-12 py-5 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10">{isChecking ? 'TEKSHIRILMOQDA...' : 'TIZIMNI TO\'LIQ TEKSHIRISH'}</span>
            {isChecking && (
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            )}
          </button>
        </div>
      </div>

      {/* API Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Object.keys(URLS).map(key => {
          const s = statuses[key];
          const isActive = s?.status;
          const isChecked = s?.checked;

          return (
            <div 
              key={key} 
              className={`glass-card p-8 rounded-[2.5rem] border transition-all duration-500 relative group overflow-hidden ${
                isChecked 
                  ? (isActive ? 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]' : 'border-red-500/20 bg-red-500/5') 
                  : 'border-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="absolute -bottom-4 -right-4 text-6xl opacity-[0.03] group-hover:opacity-[0.07] transition-opacity grayscale pointer-events-none">
                {API_ICONS[key] || '🔗'}
              </div>

              <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border ${
                    isChecked 
                      ? (isActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20')
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    {API_ICONS[key] || '🔗'}
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    isChecked 
                      ? (isActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]')
                      : 'bg-slate-800'
                  }`}></div>
                </div>

                <div className="space-y-1">
                  <h5 className="text-[11px] font-black text-white uppercase tracking-wider">{key}</h5>
                  <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest opacity-30 italic">Cloud Endpoint Active</p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/30 flex justify-between items-end">
                   <div>
                      <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">Status</span>
                      <span className={`text-[10px] font-black uppercase ${isChecked ? (isActive ? 'text-emerald-500' : 'text-red-500') : 'text-slate-700'}`}>
                        {isChecked ? (isActive ? 'Online' : 'Error') : 'Pending'}
                      </span>
                   </div>
                   {isChecked && (
                     <div className="text-right">
                        <span className="text-[10px] font-black text-indigo-400 block">{s.time}ms</span>
                        <span className="text-[8px] font-bold text-slate-700 uppercase">Ping</span>
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-10 bg-indigo-600/5 rounded-[3.5rem] border border-indigo-500/10 flex flex-col md:flex-row items-center gap-10">
         <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-3xl">🛡️</div>
         <div className="space-y-3">
            <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Infratuzilma Xavfsizligi</h4>
            <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider opacity-60">
              Barcha ulanishlar 256-bitli SSL shifrlash orqali himoyalangan. Google Apps Script serverlari ma'lumotlarning ishonchli saqlanishini va 99.9% uptime (ishlash vaqti)ni ta'minlaydi.
            </p>
         </div>
      </div>
    </div>
  );
};
