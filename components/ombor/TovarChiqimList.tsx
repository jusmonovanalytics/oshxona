
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { formatCurrency } from '../../utils/core';
import { FilterParams } from '../GlobalFilter';

interface TovarChiqimListProps {
  globalFilter: FilterParams;
}

export const TovarChiqimList: React.FC<TovarChiqimListProps> = ({ globalFilter }) => {
  const [chiqimlar, setChiqimlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchData('tovarChiqim');
      setChiqimlar(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;

  const filteredChiqimlar = chiqimlar.filter(curr => {
    const s = globalFilter.search.toLowerCase();
    const itemDate = curr['sotuv sana']?.split(' ')[0];
    
    const matchesSearch = !s || (curr['tovar'] || "").toLowerCase().includes(s) || (curr['mijoz'] || "").toLowerCase().includes(s);
    const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
    const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const displayChiqimlar = filteredChiqimlar;

  const totalSotuvSum = filteredChiqimlar.reduce((acc, item) => acc + (Number(item['sotuv summasi']) || 0), 0);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-30">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-widest">Sotuvlar yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Tovar Sotuvlari Tarixi</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            {isFiltered ? `${filteredChiqimlar.length} ta natija` : 'Oxirgi sotuvlar tarixi'}
          </p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white transition-all">Yangilash</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-white/5">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jami Sotuv Summasi</p>
          <h4 className="text-xl font-black text-white italic">{formatCurrency(totalSotuvSum)}</h4>
          <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">{filteredChiqimlar.length} ta operatsiya</p>
        </div>
      </div>

      <div className="erp-table-container reveal">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="w-16">Sana</th>
              <th>Tovar</th>
              <th>Mijoz</th>
              <th>Miqdor</th>
              <th>Narx</th>
              <th>Jami</th>
            </tr>
          </thead>
          <tbody>
            {displayChiqimlar.length > 0 ? displayChiqimlar.map((item, idx) => (
              <tr key={idx} className="group">
                <td className="text-zinc-500 font-medium text-[10px]">{item['sotuv sana']?.split(' ')[0]}</td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-bold text-white uppercase italic">{item['tovar']}</span>
                    <span className="text-[8px] font-black text-zinc-700 uppercase">ID: {item['sotuv id']?.toString().slice(-6)}</span>
                  </div>
                </td>
                <td>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{item['mijoz']}</span>
                </td>
                <td className="font-bold text-white tabular-nums">
                  {item['tovar asl birlik qoldiq miqdor']} <span className="text-[9px] text-zinc-600 uppercase">{item['tovar asl birlik']}</span>
                </td>
                <td className="text-zinc-500 font-bold tabular-nums">
                  {formatCurrency(item['sotuv narx'])}
                </td>
                <td className="font-bold text-indigo-400 tabular-nums">
                  {formatCurrency(item['sotuv summasi'])}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-20 text-center opacity-20 uppercase tracking-[0.5em] text-[10px] font-bold">
                  Sotuvlar tarixi bo'sh
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
