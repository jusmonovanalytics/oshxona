
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { formatCurrency } from '../../utils/core';
import { FilterParams } from '../GlobalFilter';

interface PartiyaBalansProps {
  globalFilter: FilterParams;
}

export const PartiyaBalans: React.FC<PartiyaBalansProps> = ({ globalFilter }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const ostatkaHistory = await fetchData('productOstatka');
      setData(Array.isArray(ostatkaHistory) ? ostatkaHistory : []);
    } catch (e) {
      console.error("Load balances error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getLatestResults = () => {
    const latest: Record<string, any> = {};
    
    data.forEach(row => {
      const bId = row['kirim id'];
      if (!bId) return;
      
      const currentTime = new Date(row['data time'] || row['sana']).getTime();
      const existingTime = latest[bId] ? new Date(latest[bId]['data time'] || latest[bId]['sana']).getTime() : 0;
      
      if (currentTime >= existingTime) {
        latest[bId] = row;
      }
    });

    const s = (searchTerm || globalFilter.search).toLowerCase();

    return Object.values(latest)
      .filter(b => {
        const itemDate = b['sana']?.split(' ')[0];
        const matchesSearch = !s || b['product']?.toLowerCase().includes(s);
        const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
        const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
        return matchesSearch && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => {
        const timeA = new Date(a['data time'] || a['sana']).getTime();
        const timeB = new Date(b['data time'] || b['sana']).getTime();
        return timeB - timeA;
      });
  };

  const resultsList = getLatestResults();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight uppercase">Partiyalar Auditi</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">Dual-Balance: Norma vs Fakt tahlili</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <input 
             type="text" 
             placeholder="Partiya yoki mahsulot..." 
             className="px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-bold text-white focus:border-indigo-500 outline-none w-full md:w-80"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           <button onClick={loadData} className="px-6 py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-zinc-700 transition-all">Yangilash</button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 text-center opacity-30">
          <div className="w-10 h-10 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Balanslar tahlil qilinmoqda...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {resultsList.length > 0 ? resultsList.map((batch, idx) => {
            const normaQty = Number(batch['miqdor']) || 0;
            const faktQty = Number(batch['fakt miqdor'] !== undefined ? batch['fakt miqdor'] : batch['miqdor']) || 0;
            const isZero = faktQty <= 0.0001;
            const variance = faktQty - normaQty;

            return (
              <div key={idx} className={`glass-card p-10 rounded-[3rem] border border-zinc-800 relative overflow-hidden group hover:border-indigo-500/30 transition-all ${isZero ? 'opacity-30' : ''}`}>
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter mb-1">Batch: {batch['kirim id']?.toString().slice(-8)}</span>
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Aktiv Partiya</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[8px] font-bold text-zinc-600 uppercase block">{batch['sana']?.split(' ')[0]}</span>
                    </div>
                 </div>

                 <h4 className="text-2xl font-black text-white mb-8 truncate uppercase italic tracking-tighter">{batch['product']}</h4>

                 <div className="space-y-4 mb-8">
                    <div className="p-5 bg-zinc-950/50 rounded-2xl border border-zinc-900 flex justify-between items-center">
                       <span className="text-[9px] font-black text-zinc-600 uppercase">Fakt (Real)</span>
                       <span className="text-xl font-black text-white">{faktQty.toFixed(3)} <span className="text-[10px] text-zinc-700">{batch['birlik']}</span></span>
                    </div>
                    <div className="p-5 bg-zinc-950/20 rounded-2xl border border-zinc-900/50 flex justify-between items-center">
                       <span className="text-[9px] font-black text-zinc-700 uppercase">Norma (Ideal)</span>
                       <span className="text-lg font-black text-zinc-400">{normaQty.toFixed(3)} <span className="text-[10px] text-zinc-800">{batch['birlik']}</span></span>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-zinc-900 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Tafovut (Waste)</span>
                      <span className={`text-sm font-black ${variance < 0 ? 'text-red-500' : (variance > 0 ? 'text-emerald-500' : 'text-zinc-500')}`}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(3)} {batch['birlik']}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-zinc-600 uppercase block mb-1">Real Qiymat</span>
                      <span className="text-sm font-black text-indigo-400">{formatCurrency(faktQty * Number(batch['narx']))}</span>
                    </div>
                 </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-52 text-center opacity-10 uppercase tracking-[0.5em] font-black text-xs">Aktiv partiyalar mavjud emas</div>
          )}
        </div>
      )}
    </div>
  );
};
