
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { formatCurrency } from '../../utils/core';
import { FilterParams } from '../GlobalFilter';

interface ProductChiqimListProps {
  globalFilter: FilterParams;
}

export const ProductChiqimList: React.FC<ProductChiqimListProps> = ({ globalFilter }) => {
  const [chiqimlar, setChiqimlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchData('productChiqim');
    setChiqimlar(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;

  const filteredChiqimlar = chiqimlar.filter(curr => {
    const s = globalFilter.search.toLowerCase();
    const itemDate = curr['sana']?.split(' ')[0];
    
    const matchesSearch = !s || (curr['ovqat nomi'] || "").toLowerCase().includes(s) || (curr['product'] || "").toLowerCase().includes(s);
    const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
    const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const displayChiqimlar = isFiltered ? filteredChiqimlar : filteredChiqimlar.slice(0, 50);

  const groupedData = displayChiqimlar.reduce((acc: any, curr: any) => {
    const key = `${curr['sana']}_${curr['ovqat nomi']}`;
    if (!acc[key]) {
      acc[key] = {
        ovqatNomi: curr['ovqat nomi'],
        ovqatMiqdori: curr['ovqat miqdori'],
        ikkilamchiBirlik: curr['ikkilamchi birlik'],
        sana: curr['sana'],
        totalCost: 0,
        items: []
      };
    }
    const itemSum = Number(curr['product summa']) || 0;
    acc[key].totalCost += itemSum;
    acc[key].items.push({
      product: curr['product'],
      miqdor: curr['miqdor'],
      birlik: curr['birlik'],
      narx: curr['product narx'],
      summa: itemSum
    });
    return acc;
  }, {});

  const groups = Object.values(groupedData).sort((a: any, b: any) => 
    new Date(b.sana).getTime() - new Date(a.sana).getTime()
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-30">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-widest">Chiqimlar yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight uppercase italic">Chiqimlar Arxivi</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">
            {isFiltered ? `${groups.length} ta yig'ma natija` : 'Oxirgi sarfiyotlar tarixi'}
          </p>
        </div>
        <button onClick={loadData} className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all">Yangilash</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {groups.length > 0 ? groups.map((group: any, idx: number) => (
          <div key={idx} className="glass-card rounded-[3rem] border border-zinc-800 overflow-hidden flex flex-col group hover:border-orange-500/30 transition-all duration-500 shadow-2xl">
            <div className="p-10 bg-zinc-900/40 border-b border-zinc-800">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Ishlab chiqarish</span>
                <span className="text-[9px] font-bold text-zinc-600 uppercase">{group.sana?.split(' ')[0]}</span>
              </div>
              <h4 className="text-2xl font-black text-white mb-2">{group.ovqatNomi}</h4>
              <div className="text-right">
                <span className="text-sm font-black text-white">{formatCurrency(group.totalCost)}</span>
              </div>
            </div>
            <div className="p-10 space-y-4">
               {group.items.map((item: any, i: number) => (
                 <div key={i} className="flex justify-between items-start py-3 border-b border-zinc-800/30 last:border-0">
                    <span className="text-xs font-bold text-zinc-400 block">{item.product}</span>
                    <span className="text-xs font-black text-zinc-200">{formatCurrency(item.summa)}</span>
                 </div>
               ))}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-52 text-center opacity-10">
            <span className="text-8xl block mb-6">📋</span>
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Natija topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
};
