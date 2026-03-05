
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

  const totals = resultsList.reduce((acc, batch) => {
    const normaQty = Number(batch['miqdor']) || 0;
    const faktQty = Number(batch['fakt miqdor'] !== undefined ? batch['fakt miqdor'] : batch['miqdor']) || 0;
    const price = Number(batch['narx']) || 0;
    acc.normaSum += normaQty * price;
    acc.faktSum += faktQty * price;
    return acc;
  }, { normaSum: 0, faktSum: 0 });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Partiyalar Auditi</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Dual-Balance: Norma va Fakt tahlili</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <input 
             type="text" 
             placeholder="Partiya yoki mahsulot..." 
             className="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-bold text-white focus:border-indigo-500 outline-none w-full md:w-64"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           <button onClick={loadData} className="px-5 py-3 bg-zinc-800 rounded-xl text-[9px] font-black uppercase text-white hover:bg-zinc-700 transition-all">Yangilash</button>
        </div>
      </div>

      {!loading && resultsList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jami Fakt Summa</p>
            <h4 className="text-xl font-black text-white italic">{formatCurrency(totals.faktSum)}</h4>
          </div>
          <div className="glass-card p-6 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jami Norma Summa</p>
            <h4 className="text-xl font-black text-zinc-400 italic">{formatCurrency(totals.normaSum)}</h4>
          </div>
          <div className={`glass-card p-6 rounded-3xl border ${totals.faktSum - totals.normaSum < 0 ? 'border-red-500/20' : 'border-emerald-500/20'}`}>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Tafovut Summa</p>
            <h4 className={`text-xl font-black italic ${totals.faktSum - totals.normaSum < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {totals.faktSum - totals.normaSum > 0 ? '+' : ''}{formatCurrency(totals.faktSum - totals.normaSum)}
            </h4>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-40 text-center opacity-30">
          <div className="w-10 h-10 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-[9px] font-bold uppercase tracking-widest">Balanslar tahlil qilinmoqda...</span>
        </div>
      ) : (
        <div className="erp-table-container reveal">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-16">Sana</th>
                <th>Mahsulot</th>
                <th>Fakt (Real)</th>
                <th>Norma (Ideal)</th>
                <th>Tafovut</th>
                <th>Fakt Summa</th>
                <th>Norma Summa</th>
              </tr>
            </thead>
            <tbody>
              {resultsList.length > 0 ? resultsList.map((batch, idx) => {
                const normaQty = Number(batch['miqdor']) || 0;
                const faktQty = Number(batch['fakt miqdor'] !== undefined ? batch['fakt miqdor'] : batch['miqdor']) || 0;
                const price = Number(batch['narx']) || 0;
                const isZero = faktQty <= 0.0001;
                const variance = faktQty - normaQty;

                return (
                  <tr key={idx} className={`group ${isZero ? 'opacity-30' : ''}`}>
                    <td className="text-zinc-500 font-medium text-[10px]">{batch['sana']?.split(' ')[0]}</td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-white uppercase italic">{batch['product']}</span>
                        <span className="text-[8px] font-black text-zinc-700 uppercase">ID: {batch['kirim id']?.toString().slice(-6)}</span>
                      </div>
                    </td>
                    <td className="font-bold text-white tabular-nums">
                      {faktQty.toFixed(3)} <span className="text-[9px] text-zinc-600 uppercase">{batch['birlik']}</span>
                    </td>
                    <td className="text-zinc-500 font-bold tabular-nums">
                      {normaQty.toFixed(3)} <span className="text-[9px] text-zinc-700 uppercase">{batch['birlik']}</span>
                    </td>
                    <td className={`font-bold tabular-nums ${variance < 0 ? 'text-red-500' : (variance > 0 ? 'text-emerald-500' : 'text-zinc-600')}`}>
                      {variance > 0 ? '+' : ''}{variance.toFixed(3)}
                    </td>
                    <td className="font-bold text-white tabular-nums">
                      {formatCurrency(faktQty * price)}
                    </td>
                    <td className="text-zinc-500 font-bold tabular-nums">
                      {formatCurrency(normaQty * price)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center opacity-20 uppercase tracking-[0.5em] text-[10px] font-bold">
                    Aktiv partiyalar mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
