
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { logic } from '../../services/logic';
import { formatCurrency, toInputDateTime, fromInputToSystemDate } from '../../utils/core';
import { SearchableSelect } from '../SearchableSelect';
import { FilterParams } from '../GlobalFilter';

// Added globalFilter to props to satisfy TypeScript and enable filtering
interface ProductKirimProps {
  globalFilter: FilterParams;
}

export const ProductKirim: React.FC<ProductKirimProps> = ({ globalFilter }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(toInputDateTime());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pData, hData] = await Promise.all([fetchData('products'), fetchData('productKirim')]);
    setProducts(Array.isArray(pData) ? pData : []);
    setHistory(Array.isArray(hData) ? hData : []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedProduct || qty <= 0 || price <= 0) { 
      alert("Iltimos barcha maydonlarni to'ldiring (mahsulot, miqdor va narx)!"); 
      return; 
    }
    setLoading(true);
    const res = await logic.createProductKirim(
      selectedProduct['product id'], 
      selectedProduct['product'], 
      qty, 
      selectedProduct['birlik'], 
      price, 
      fromInputToSystemDate(selectedDate)
    );
    if (res.success) { 
      setQty(0);
      setPrice(0);
      setSelectedProduct(null);
      setActiveTab('history'); 
      loadData(); 
    }
    setLoading(false);
  };

  // Filter history based on global search params
  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;
  const filteredHistory = history.filter(item => {
    const s = globalFilter.search.toLowerCase();
    const itemDate = item['sana']?.split(' ')[0];
    const matchesSearch = !s || (item['product'] || "").toLowerCase().includes(s);
    const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
    const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const displayHistory = isFiltered ? filteredHistory : filteredHistory.slice(0, 50);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex p-1.5 bg-zinc-900 rounded-2xl w-fit border border-zinc-800">
        <button 
          onClick={() => setActiveTab('form')}
          className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'form' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Yangi Kirim
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Kirim Tarixi
        </button>
      </div>

      {activeTab === 'form' ? (
        <div className="max-w-4xl glass-card p-12 rounded-[3.5rem] border border-zinc-800 shadow-2xl space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
            <SearchableSelect 
              label="Mahsulot"
              placeholder="Mahsulotni tanlang..."
              options={products.map(p => ({ id: p['product id'], label: p['product'], subLabel: p['birlik'] }))}
              value={selectedProduct?.['product id'] || ''}
              onSelect={(val) => setSelectedProduct(products.find(it => it['product id'] === val))}
            />

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Sana</label>
              <input 
                type="datetime-local" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-6 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">
                Miqdor {selectedProduct ? `(${selectedProduct['birlik']})` : ''}
              </label>
              <input 
                type="number" 
                value={qty || ''}
                placeholder="0.00"
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full px-6 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Birlik Narxi (UZS)</label>
              <input 
                type="number" 
                value={price || ''}
                placeholder="Narxni kiriting"
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-6 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Jami Hisoblangan Summa</label>
              <div className="w-full px-8 py-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl text-2xl font-black text-blue-400 flex justify-between items-center shadow-inner">
                <span>{formatCurrency(qty * price)}</span>
                <span className="text-[11px] uppercase tracking-[0.3em] opacity-40">O'zbek so'mi</span>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handleSave}
            className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.5em] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95 relative z-10"
          >
            {loading ? 'Bazaga Saqlanmoqda...' : 'Kirimni Tasdiqlash'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayHistory.length > 0 ? displayHistory.map((item, idx) => (
            <div key={idx} className="glass-card p-8 rounded-[2.5rem] border border-zinc-800 group hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                 <span className="px-3 py-1 bg-zinc-950 rounded-lg text-[8px] font-black text-zinc-600 uppercase tracking-tighter">#{item['kirim id']?.toString().slice(-6)}</span>
                 <span className="text-[9px] text-zinc-600 font-bold uppercase">{item['sana']?.split(' ')[0]}</span>
               </div>
               <h4 className="text-lg font-black text-zinc-100 mb-1 group-hover:text-blue-400 transition-colors">{item['product']}</h4>
               <p className="text-[9px] text-zinc-500 font-bold uppercase mb-6">{item['sana']?.split(' ')[1]}</p>
               <div className="pt-6 border-t border-zinc-800/50 space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-zinc-600 uppercase">Miqdor</span>
                     <span className="text-xs font-bold text-zinc-300">{item['miqdor']} {item['birlik']}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-blue-500/50 uppercase">Jami Summa</span>
                     <span className="text-sm font-black text-blue-400">{formatCurrency(item['summa'])}</span>
                  </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-52 text-center opacity-10 flex flex-col items-center justify-center gap-6">
              <span className="text-7xl">📦</span>
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Kirimlar tarixi bo'sh</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
