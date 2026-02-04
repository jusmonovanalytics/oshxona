
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { formatCurrency } from '../../utils/core';
import { FilterParams } from '../GlobalFilter';

interface TayyorlanganOvqatlarProps {
  globalFilter: FilterParams;
}

export const TayyorlanganOvqatlar: React.FC<TayyorlanganOvqatlarProps> = ({ globalFilter }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchData('tovarKirim');
    const foodHistory = Array.isArray(data) 
      ? data.filter(item => item['tovar turi']?.toString().toLowerCase() === 'ovqat')
      : [];
    setHistory(foodHistory.sort((a, b) => new Date(b['kirim sana']).getTime() - new Date(a['kirim sana']).getTime()));
    setLoading(false);
  };

  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;

  const filteredHistory = history.filter(item => {
    const s = globalFilter.search.toLowerCase();
    const itemDate = item['kirim sana']?.split(' ')[0];
    
    const matchesSearch = !s || (item['tovar'] || "").toLowerCase().includes(s);
    const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
    const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const displayList = isFiltered ? filteredHistory : filteredHistory.slice(0, 20);

  if (loading) {
    return (
      <div className="py-40 text-center opacity-30">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest">Tarix yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight uppercase italic">Tayyorlangan Ovqatlar</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">
            {isFiltered ? `${displayList.length} ta natija ko'rsatilyapti` : 'Oxirgi 20 ta tayyorlangan ovqatlar'}
          </p>
        </div>
        <button onClick={loadData} className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-400 hover:text-white transition-all">Yangilash</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayList.length > 0 ? displayList.map((item, idx) => (
          <div key={idx} className="glass-card rounded-[3rem] border border-zinc-800 overflow-hidden flex flex-col group hover:border-orange-500/30 transition-all duration-500 shadow-2xl">
             <div className="p-10 bg-zinc-900/40 border-b border-zinc-800">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center text-xl">🍲</div>
                   <span className="text-[9px] font-bold text-zinc-600 uppercase">{item['kirim sana']?.split(' ')[0]}</span>
                </div>
                <h4 className="text-xl font-black text-white mb-2">{item['tovar']}</h4>
                <div className="flex items-center gap-3">
                   <span className="text-sm font-black text-orange-400">{item['miqdor']} {item['birlik']}</span>
                </div>
             </div>
             <div className="p-10 space-y-6">
                <div className="text-xl font-black text-white">{formatCurrency(item['kirim summa'])} <span className="text-[10px] text-zinc-700">UZS</span></div>
             </div>
          </div>
        )) : (
          <div className="col-span-full py-52 text-center opacity-10">
             <span className="text-8xl block mb-6">🥗</span>
             <p className="text-[10px] font-black uppercase tracking-[0.5em]">Tarix bo'sh yoki natija yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
};
