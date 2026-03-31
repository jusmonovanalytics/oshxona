
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

  const displayChiqimlar = filteredChiqimlar;

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

  const totalChiqimSum = filteredChiqimlar.reduce((acc, item) => acc + (Number(item['product summa']) || 0), 0);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-30">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-widest">Chiqimlar yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Chiqimlar Arxivi</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            {isFiltered ? `${groups.length} ta yig'ma natija` : 'Oxirgi sarfiyotlar tarixi'}
          </p>
        </div>
        <button onClick={loadData} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-white transition-all">Yangilash</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-white/5">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Jami Chiqim Summasi</p>
          <h4 className="text-xl font-black text-white italic">{formatCurrency(totalChiqimSum)}</h4>
          <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">{filteredChiqimlar.length} ta operatsiya</p>
        </div>
      </div>

      <div className="erp-table-container reveal">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="w-16">Sana</th>
              <th>Ishlab chiqarish</th>
              <th>Masalliqlar</th>
              <th>Jami Xarajat</th>
            </tr>
          </thead>
          <tbody>
            {groups.length > 0 ? groups.map((group: any, idx: number) => (
              <tr key={idx} className="group">
                <td className="text-zinc-500 font-medium text-[10px]">{group.sana?.split(' ')[0]}</td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-bold text-white uppercase italic">{group.ovqatNomi}</span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase">{group.ovqatMiqdori} {group.ikkilamchiBirlik}</span>
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] font-bold text-zinc-500 border border-white/5">
                        {item.product}: {item.miqdor} {item.birlik}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="font-bold text-white tabular-nums">
                  {formatCurrency(group.totalCost)} <span className="text-[9px] text-zinc-600">UZS</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="py-20 text-center opacity-20 uppercase tracking-[0.5em] text-[10px] font-bold">
                  Natija topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
