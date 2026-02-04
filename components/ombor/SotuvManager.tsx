
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { logic } from '../../services/logic';
import { formatCurrency, toInputDateTime, fromInputToSystemDate, formatDateTime } from '../../utils/core';
import { SearchableSelect } from '../SearchableSelect';
import { FilterParams } from '../GlobalFilter';

interface SotuvManagerProps {
  globalFilter?: FilterParams;
}

export const SotuvManager: React.FC<SotuvManagerProps> = ({ globalFilter }) => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [tovarOstatkaData, setTovarOstatkaData] = useState<any[]>([]);
  
  const [selectedTovar, setSelectedTovar] = useState<any>(null);
  const [aslSotuvMiqdori, setAslSotuvMiqdori] = useState<number>(0); 
  const [customSotuvNarx, setCustomSotuvNarx] = useState<number>(0);
  const [mijoz, setMijoz] = useState<string>('Umumiy Mijoz');
  const [sotuvSana, setSotuvSana] = useState<string>(toInputDateTime());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, oData] = await Promise.all([
        fetchData('tovarlar'),
        fetchData('tovarOstatka')
      ]);
      setTovarlar(Array.isArray(tData) ? tData : []);
      setTovarOstatkaData(Array.isArray(oData) ? oData : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getAvailableTovarBatches = (tovarId: string) => {
    if (!tovarId) return [];
    
    const latestBatches: Record<string, any> = {};
    tovarOstatkaData
      .filter(row => row['tovar id'] === tovarId)
      .forEach(row => {
        const bId = row['kirim id'];
        if (!bId) return;
        const currentTime = new Date(row['data time'] || row['sana']).getTime();
        const existingTime = latestBatches[bId] ? new Date(latestBatches[bId]['data time'] || latestBatches[bId]['sana']).getTime() : 0;
        if (currentTime >= existingTime) latestBatches[bId] = row;
      });

    return Object.values(latestBatches)
      .map(b => ({
        ...b,
        remainingAsl: Number(b['tovar asl birlik qoldiq miqdor']) || 0,
        miqdor: Number(b['qoldiq miqdor']) || 0
      }))
      .filter(b => b.remainingAsl > 0.0001)
      .sort((a, b) => new Date(a['sana']).getTime() - new Date(b['sana']).getTime());
  };

  useEffect(() => {
    if (selectedTovar) {
      const batches = getAvailableTovarBatches(selectedTovar['tovar id']);
      if (batches.length > 0) {
        setCustomSotuvNarx(Number(batches[batches.length - 1]['sotuv narx']) || 0);
      } else {
        setCustomSotuvNarx(0);
      }
    }
  }, [selectedTovar]);

  const handleSale = async () => {
    if (!selectedTovar || aslSotuvMiqdori <= 0) { alert("Iltimos, miqdorni kiriting!"); return; }

    const batches = getAvailableTovarBatches(selectedTovar['tovar id']);
    const totalAvailableAsl = batches.reduce((s, b) => s + b.remainingAsl, 0);

    if (aslSotuvMiqdori > totalAvailableAsl) {
      alert(`Omborda yetarli tovar yo'q! Mavjud: ${totalAvailableAsl.toFixed(2)} ${selectedTovar['tovar asl birlik'] || 'porsiya'}`);
      return;
    }

    setSaveLoading(true);
    const saleItems: any[] = [];
    const ostatkaUpdates: any[] = [];
    let remainingToSellAsl = aslSotuvMiqdori;
    const systemSana = fromInputToSystemDate(sotuvSana);
    const currentDT = formatDateTime();

    for (const batch of batches) {
      if (remainingToSellAsl <= 0) break;
      const takeAsl = Math.min(batch.remainingAsl, remainingToSellAsl);
      
      const currentSec = Number(batch['qoldiq miqdor']) || 0;
      const currentAsl = Number(batch['tovar asl birlik qoldiq miqdor']) || 1;
      const takeSec = (takeAsl / currentAsl) * currentSec;

      saleItems.push({
        'tovar id': selectedTovar['tovar id'],
        'tovar': selectedTovar['tovar'],
        'tovar turi': selectedTovar['tovar turi'],
        'miqdor': Number(takeSec.toFixed(4)),
        'birlik': batch['birlik'],
        'tovar asl birlik': batch['tovar asl birlik'],
        'tovar asl birlik qoldiq miqdor': Number(takeAsl.toFixed(4)),
        'kirim narx': Number(batch['kirim narx']),
        'sotuv narx': customSotuvNarx,
        'sotuv summasi': Number((takeAsl * customSotuvNarx).toFixed(2)),
        'sotuv sana': systemSana,
        'mijoz': mijoz,
        'kirim id': batch['kirim id']
      });

      const newAslBalance = currentAsl - takeAsl;
      const newSecBalance = currentSec - takeSec;

      ostatkaUpdates.push({
        'kirim id': batch['kirim id'],
        'tovar id': selectedTovar['tovar id'],
        'tovar': selectedTovar['tovar'],
        'tovar turi': selectedTovar['tovar turi'],
        'qoldiq miqdor': Number(newSecBalance.toFixed(4)),
        'birlik': batch['birlik'],
        'tovar asl birlik': batch['tovar asl birlik'],
        'tovar asl birlik qoldiq miqdor': Number(newAslBalance.toFixed(4)),
        'kirim narx': Number(batch['kirim narx']),
        'qoldiq kirim summa': Number((newAslBalance * Number(batch['kirim narx'])).toFixed(2)),
        'sotuv narx': customSotuvNarx,
        'sana': systemSana,
        'data time': currentDT,
        'kirim turi': 'Qoldiq'
      });

      remainingToSellAsl -= takeAsl;
    }

    const res = await logic.processSale(saleItems, ostatkaUpdates);
    if (res.success) {
      alert("Sotuv muvaffaqiyatli amalga oshirildi!");
      setAslSotuvMiqdori(0);
      loadData();
    } else {
      alert("Xatolik yuz berdi!");
    }
    setSaveLoading(false);
  };

  const batches = selectedTovar ? getAvailableTovarBatches(selectedTovar['tovar id']) : [];
  const currentAvailableAsl = batches.reduce((s, b) => s + b.remainingAsl, 0);
  const currentAvailableSec = batches.reduce((s, b) => s + b.miqdor, 0);
  const remainingAfterSale = Math.max(0, currentAvailableAsl - (aslSotuvMiqdori || 0));

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Sotuv <span className="text-indigo-500">Departamenti</span></h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-3">Ombordagi mavjud tayyor mahsulotlar savdosi</p>
        </div>
        {loading && (
          <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 animate-pulse text-[9px] font-black uppercase tracking-widest text-indigo-400">
             Yangilanmoqda...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
           <div className="glass-card p-10 lg:p-12 rounded-[3.5rem] lg:rounded-[4rem] border border-white/5 space-y-10 relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="space-y-10 relative z-10">
                 <SearchableSelect 
                    label="Mahsulot Tanlash"
                    placeholder="Sotiladigan tovarni qidiring..."
                    options={tovarlar.map(t => ({ 
                      id: t['tovar id'], 
                      label: `${t['tovar']} (${t['tovar asl birlik'] || 'porsiya'})`,
                      subLabel: t['tovar turi'] 
                    }))}
                    value={selectedTovar?.['tovar id'] || ''}
                    onSelect={(val) => setSelectedTovar(tovarlar.find(t => t['tovar id'] === val))}
                 />

                 {selectedTovar && (
                   <div className="space-y-6 animate-in zoom-in-95 duration-500">
                     <div className="p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[3rem] shadow-inner relative overflow-hidden">
                       <label className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] block mb-8 text-center">Joriy Ombor Qoldig'i</label>
                       
                       <div className="flex flex-col items-center justify-center gap-4">
                          <div className="flex items-center gap-6">
                             <span className="text-4xl lg:text-7xl font-black text-white tabular-nums tracking-tighter italic">
                               {currentAvailableAsl.toLocaleString('uz-UZ', { maximumFractionDigits: 1 })}
                             </span>
                             <span className="text-sm lg:text-lg font-black text-indigo-400 uppercase tracking-widest">{selectedTovar['tovar asl birlik'] || 'porsiya'}</span>
                          </div>
                          
                          <div className="px-6 py-2 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ekvivalent:</span>
                             <span className="text-sm font-bold text-slate-300 tabular-nums">
                               {currentAvailableSec.toLocaleString('uz-UZ', { maximumFractionDigits: 2 })}
                             </span>
                             <span className="text-[10px] font-black text-slate-600 uppercase">{selectedTovar['birlik'] || 'kg'}</span>
                          </div>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Sotuv Miqdori</label>
                       <div className="relative group">
                          <input 
                            type="number" 
                            value={aslSotuvMiqdori || ''}
                            onChange={(e) => setAslSotuvMiqdori(Number(e.target.value))}
                            placeholder="0"
                            className="w-full px-10 py-7 bg-black/60 border border-white/5 rounded-[2.5rem] text-3xl font-black text-white focus:border-indigo-500 outline-none transition-all shadow-inner tabular-nums"
                          />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase">{selectedTovar?.['tovar asl birlik'] || 'porsiya'}</span>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Sotuv Narxi</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            value={customSotuvNarx || ''}
                            onChange={(e) => setCustomSotuvNarx(Number(e.target.value))}
                            placeholder="0"
                            className="w-full px-10 py-7 bg-black/60 border border-white/5 rounded-[2.5rem] text-2xl font-black text-emerald-400 focus:border-indigo-500 outline-none transition-all shadow-inner tabular-nums"
                          />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-700 uppercase">UZS</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Mijoz Nomi</label>
                       <input 
                         type="text" 
                         value={mijoz}
                         onChange={(e) => setMijoz(e.target.value)}
                         className="w-full px-8 py-5 bg-black/40 border border-white/5 rounded-[2rem] text-sm font-bold text-white focus:border-indigo-500 outline-none"
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Sotuv Sanasi</label>
                       <input 
                         type="datetime-local" 
                         value={sotuvSana}
                         onChange={(e) => setSotuvSana(e.target.value)}
                         className="w-full px-8 py-5 bg-black/40 border border-white/5 rounded-[2rem] text-xs font-bold text-white focus:border-indigo-500 outline-none"
                       />
                    </div>
                 </div>

                 <div className="pt-8 border-t border-white/5">
                    <div className="p-10 bg-indigo-600/5 rounded-[3.5rem] border border-indigo-500/10 flex flex-col sm:flex-row justify-between items-center mb-10 shadow-inner group">
                       <div className="text-center sm:text-left mb-4 sm:mb-0">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">Yakuniy Sotuv Summasi</span>
                          <span className="text-4xl lg:text-5xl font-black text-indigo-400 tracking-tight tabular-nums italic">
                             {formatCurrency(aslSotuvMiqdori * customSotuvNarx)}
                          </span>
                       </div>
                       <div className="w-16 h-16 bg-indigo-600/10 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">💰</div>
                    </div>
                    
                    <button 
                      onClick={handleSale}
                      disabled={saveLoading || !selectedTovar || aslSotuvMiqdori <= 0 || remainingAfterSale < 0}
                      className="w-full py-10 bg-indigo-600 text-white rounded-[3.5rem] text-[13px] font-black uppercase tracking-[0.6em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale"
                    >
                      {saveLoading ? 'SOTUV AMALGA OSHIRILMOQDA...' : 'SOTUVNI TASDIQLASH'}
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-10">
           <div className="glass-card rounded-[4rem] border border-white/5 flex flex-col shadow-2xl overflow-hidden p-10 flex-grow max-h-[800px]">
              <div className="flex items-center justify-between mb-8 px-2">
                 <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Partiya Audit (FIFO)</h5>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              
              <div className="space-y-6 overflow-y-auto custom-scrollbar pr-4">
                 {selectedTovar && aslSotuvMiqdori > 0 ? (
                   (() => {
                     let remAsl = aslSotuvMiqdori;
                     return batches.map((b, i) => {
                       if (remAsl <= 0) return null;
                       const takeAsl = Math.min(b.remainingAsl, remAsl);
                       remAsl -= takeAsl;
                       return (
                         <div key={i} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] group hover:bg-white/5 transition-all animate-in slide-in-from-right-4 duration-500">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <span className="text-[9px] font-black text-slate-700 uppercase block mb-1">Partiya: #{b['kirim id']?.slice(-6)}</span>
                                 <span className="text-lg font-black text-white italic tabular-nums">{takeAsl.toFixed(2)} {selectedTovar['tovar asl birlik']}</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-[10px] font-black text-indigo-400 block tabular-nums">{formatCurrency(takeAsl * customSotuvNarx)}</span>
                                 <span className="text-[8px] font-black text-slate-800 uppercase">Sotuv</span>
                              </div>
                           </div>
                           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500/30" style={{ width: `${(takeAsl/b.remainingAsl)*100}%` }}></div>
                           </div>
                         </div>
                       );
                     });
                   })()
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center py-32 grayscale opacity-10">
                      <span className="text-8xl mb-8">📊</span>
                      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-center px-10">Tahlil qilish uchun miqdorni kiriting</p>
                   </div>
                 )}
              </div>
           </div>

           {selectedTovar && (
             <div className="glass-card p-8 rounded-[3rem] border border-orange-500/10 bg-orange-500/5">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-orange-600/10 border border-orange-600/20 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                   <div>
                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1">Sotuvdan keyingi qoldiq</span>
                      <span className="text-lg font-black text-white tabular-nums">
                         {remainingAfterSale.toFixed(1)} {selectedTovar['tovar asl birlik']} qoladi
                      </span>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
