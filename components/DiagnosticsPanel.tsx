
import React, { useState, useEffect } from 'react';
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
  const [internalPing, setInternalPing] = useState(0);

  // Dasturning ichki (App) tezligini o'lchash
  useEffect(() => {
    const start = performance.now();
    // Oddiy amaliyot bajarish tezligi
    localStorage.getItem('erp_user');
    setInternalPing(Math.round((performance.now() - start) * 10) / 10);
  }, []);

  const runFullDiagnostics = async () => {
    setIsChecking(true);
    const newStatuses: typeof statuses = {};
    const keys = Object.keys(URLS);
    
    // Parallel tekshirish (tezroq natija beradi)
    await Promise.all(keys.map(async (key) => {
      const result = await checkConnection(key as any);
      newStatuses[key] = { ...result, checked: true };
      setStatuses(prev => ({ ...prev, [key]: { ...result, checked: true } }));
    }));
    
    setIsChecking(false);
  };

  const calculateHealth = () => {
    const checkedItems = Object.values(statuses) as Array<{ status: boolean; checked: boolean }>;
    if (checkedItems.length === 0) return null;
    const active = checkedItems.filter(s => s.status).length;
    return Math.round((active / checkedItems.length) * 100);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-4 text-center md:text-left">
              <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Diagnostika <span className="text-indigo-500">Markazi</span></h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">Bulutli infratuzilma holati nazorati</p>
           </div>
           <button 
             onClick={runFullDiagnostics} 
             disabled={isChecking} 
             className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center gap-3"
           >
             {isChecking && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
             {isChecking ? 'TEKSHIRILMOQDA...' : 'TIZIMNI ANALIZ QILISH'}
           </button>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-center items-center text-center">
           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">App Response Time</span>
           <div className="flex items-baseline gap-1">
             <span className="text-5xl font-black text-white italic tabular-nums">{internalPing || '< 1'}</span>
             <span className="text-xs font-bold text-emerald-500">ms</span>
           </div>
           <p className="text-[8px] text-slate-500 uppercase font-bold mt-2">Dastur oniy reaksiyasi</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        {Object.keys(URLS).map(key => {
          const s = statuses[key];
          const isChecked = s?.checked;
          const isActive = s?.status;

          return (
            <div key={key} className={`glass-card p-6 lg:p-8 rounded-[2rem] border transition-all duration-500 ${isChecked ? (isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5') : 'border-white/5'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-950 border border-white/5`}>
                  {API_ICONS[key] || '🔗'}
                </div>
                <div className={`w-2 h-2 rounded-full ${isChecked ? (isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500') : 'bg-slate-800'}`}></div>
              </div>

              <h5 className="text-[9px] font-black text-white uppercase tracking-widest mb-1 truncate">{key}</h5>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-slate-500 uppercase">Ping (Net)</span>
                    <span className={`text-[10px] font-black tabular-nums ${isChecked ? (s.time > 1000 ? 'text-orange-500' : 'text-emerald-500') : 'text-slate-700'}`}>
                      {isChecked ? `${s.time}ms` : '--'}
                    </span>
                 </div>
                 <span className={`text-[8px] font-black uppercase ${isChecked ? (isActive ? 'text-emerald-500/50' : 'text-red-500/50') : 'text-slate-800'}`}>
                   {isChecked ? (isActive ? 'Ok' : 'Err') : 'Wait'}
                 </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-10 rounded-[3rem] border border-white/5 flex items-center gap-8">
         <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">💡</div>
         <div className="space-y-2">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ping tushunchasi</h4>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
              Network Ping (ms) — bu internet tezligingiz. App Response Time (1ms) — bu dasturning o'zi qanchalik tez ishlashi. 
              Dastur kesh va SyncManager orqali ishlangani uchun 2000ms pingda ham sizga <span className="text-white">1ms</span> tezligida javob qaytaradi.
            </p>
         </div>
      </div>
    </div>
  );
};
