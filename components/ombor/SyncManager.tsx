
import React, { useState } from 'react';
import { inventoryService } from '../../services/inventory';

export const SyncManager: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState("");
  const [lastSyncStatus, setLastSyncStatus] = useState<null | boolean>(null);

  const handleSync = async () => {
    if (!confirm("Diqqat! Barcha partiyalar qoldiqlari qayta hisoblanadi. Bu bir necha daqiqa vaqt olishi mumkin. Davom etasizmi?")) return;

    setSyncing(true);
    setProgress("Jarayon boshlanmoqda...");

    try {
      // 1. Mahsulotlarni sinxronlash
      const res1 = await inventoryService.syncAllProductBalances((msg) => setProgress(`Mahsulotlar: ${msg}`));
      
      // 2. Tovarlarni sinxronlash
      const res2 = await inventoryService.syncAllTovarBalances((msg) => setProgress(`Tovarlar: ${msg}`));

      if (res1.success && res2.success) {
        setLastSyncStatus(true);
        setProgress("Sinxronizatsiya muvaffaqiyatli yakunlandi!");
      } else {
        setLastSyncStatus(false);
        setProgress("Ba'zi ma'lumotlarda xatolik yuz berdi.");
      }
    } catch (e) {
      setProgress("Kritik xatolik!");
      setLastSyncStatus(false);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="glass-card p-12 rounded-[4rem] border border-zinc-800 relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -mr-40 -mt-40"></div>
         
         <div className="relative z-10 text-center space-y-8">
            <div className="w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-center text-5xl mx-auto shadow-inner">
               {syncing ? <span className="animate-spin block">🔄</span> : '⚖️'}
            </div>
            
            <div>
               <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Ombor <span className="text-emerald-500">Balansini</span> Yangilash</h3>
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-3">FIFO asosida qoldiqlarni qayta hisoblash</p>
            </div>

            <div className="p-8 bg-zinc-950/50 border border-zinc-900 rounded-3xl min-h-[120px] flex flex-col items-center justify-center">
               {progress ? (
                 <div className="space-y-4 w-full">
                    <p className="text-sm font-bold text-zinc-300 italic">{progress}</p>
                    {syncing && <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 animate-pulse w-2/3 mx-auto"></div>
                    </div>}
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Sinxronizatsiya boshlanishini kuting</p>
               )}
            </div>

            <button 
               onClick={handleSync}
               disabled={syncing}
               className={`w-full py-10 rounded-[3rem] text-xs font-black uppercase tracking-[0.5em] transition-all shadow-2xl ${
                 syncing 
                   ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                   : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-emerald-600/20'
               }`}
            >
               {syncing ? 'HISOBLANMOQDA...' : 'HISOBLASHNI BOSHLASH'}
            </button>

            {lastSyncStatus === true && (
               <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in slide-in-from-top-2">
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Hammasi joyida! Balanslar yangilandi.</span>
               </div>
            )}
         </div>
      </div>

      <div className="p-10 bg-indigo-500/5 rounded-[3rem] border border-indigo-500/10">
         <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-4">ℹ️ Bu nima uchun kerak?</h5>
         <p className="text-xs font-bold text-zinc-500 leading-relaxed uppercase tracking-wider opacity-60">
           Tizim tezligini oshirish uchun qoldiqlar har bir operatsiyada hisoblanmaydi. 
           Ushbu tugmani kun yakunida yoki muhim hisobotdan oldin bosish tavsiya etiladi.
         </p>
      </div>
    </div>
  );
};
