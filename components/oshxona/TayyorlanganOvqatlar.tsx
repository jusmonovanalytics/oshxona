
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

  const displayList = filteredHistory;

  if (loading) {
    return (
      <div className="py-40 text-center opacity-30">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest">Tarix yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Tayyorlangan Ovqatlar</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            {isFiltered ? `${displayList.length} ta natija ko'rsatilyapti` : 'Oxirgi 20 ta tayyorlangan ovqatlar'}
          </p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-bold text-zinc-400 hover:text-white transition-all">Yangilash</button>
      </div>

      <div className="erp-table-container reveal">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="w-16">Sana</th>
              <th>Taom Nomi</th>
              <th>Miqdor</th>
              <th>Summa</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length > 0 ? displayList.map((item, idx) => (
              <tr key={idx} className="group">
                <td className="text-zinc-500 font-medium text-[10px]">{item['kirim sana']?.split(' ')[0]}</td>
                <td className="font-bold text-white uppercase italic">{item['tovar']}</td>
                <td className="font-bold text-orange-400">
                  {item['miqdor']} <span className="text-[9px] text-zinc-600 uppercase">{item['birlik']}</span>
                </td>
                <td className="font-bold text-white tabular-nums">
                  {formatCurrency(item['kirim summa'])} <span className="text-[9px] text-zinc-600">UZS</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="py-20 text-center opacity-20 uppercase tracking-[0.5em] text-[10px] font-bold">
                  Tarix bo'sh yoki natija yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
