
import React, { useState, useEffect } from 'react';
import { fetchData } from '../services/api';
import { logic } from '../services/logic';
import { formatCurrency, formatDateTime } from '../utils/core';

export const InventoryManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'qabul' | 'history'>('history');
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [pData, hData] = await Promise.all([fetchData('products'), fetchData('productKirim')]);
    setProducts(Array.isArray(pData) ? pData : []);
    setHistory(Array.isArray(hData) ? hData : []);
    setLoading(false);
  };

  const handleKirimSave = async () => {
    if (!selectedProduct || qty <= 0 || price <= 0) { alert("Xatolik!"); return; }
    setLoading(true);
    const res = await logic.createProductKirim(selectedProduct['product id'], selectedProduct['product'], qty, selectedProduct['birlik'], price, formatDateTime());
    if (res.success) { setQty(0); setPrice(0); setSelectedProduct(null); setActiveSubTab('history'); loadData(); }
    setLoading(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex gap-2 p-1.5 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
        >
          Kirim Tarixi
        </button>
        <button 
          onClick={() => setActiveSubTab('qabul')}
          className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'qabul' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
        >
          Yangi Qabul
        </button>
      </div>

      {activeSubTab === 'qabul' ? (
        <div className="max-w-4xl glass-card p-12 rounded-[3.5rem] space-y-12 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tight mb-10 flex items-center gap-4">
              <span className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">📥</span>
              Product Kirim Bo'limi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Mahsulot Tanlash</label>
                <select 
                  className="w-full px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  onChange={(e) => setSelectedProduct(products.find(it => it['product id'] === e.target.value))}
                >
                  <option value="">Ro'yxatdan tanlang...</option>
                  {products.map(p => <option key={p['product id']} value={p['product id']}>{p['product']} ({p['birlik']})</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Miqdor {selectedProduct ? `(${selectedProduct['birlik']})` : ''}</label>
                <input 
                  type="number" 
                  value={qty || ''}
                  onChange={(e) => setQty(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Narx</label>
                <input 
                  type="number" 
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="Narxni kiriting"
                  className="w-full px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Jami Summa</label>
                <div className="w-full px-8 py-5 bg-slate-950 border border-slate-800 rounded-[2rem] text-lg font-black text-indigo-400 flex items-center justify-between">
                   <span>{formatCurrency(qty * price)}</span>
                   <span className="text-[10px] uppercase opacity-30 tracking-tighter">UZS</span>
                </div>
              </div>
            </div>

            <div className="pt-12">
              <button 
                disabled={loading}
                onClick={handleKirimSave}
                className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading ? 'Bazaga yozilmoqda...' : 'Kirimni Tasdiqlash va Saqlash'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {history.length > 0 ? history.map((item, idx) => (
            <div key={idx} className="glass-card p-8 rounded-[2.5rem] hover:border-slate-700 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-slate-950 rounded-lg text-[8px] font-black text-slate-600 uppercase tracking-tighter">#{item['kirim id']?.toString().slice(-6)}</span>
                  <span className="text-[9px] text-slate-700 font-bold uppercase">{item['sana']?.split(' ')[0]}</span>
                </div>
                <h4 className="text-lg font-black text-white mb-6 group-hover:text-indigo-400 transition-colors">{item['product']}</h4>
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 uppercase">Miqdor</span>
                    <span className="text-slate-300">{item['miqdor']} {item['birlik']}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase">Summa</span>
                    <span className="text-sm font-black text-indigo-400">{formatCurrency(item['summa'])}</span>
                  </div>
                </div>
            </div>
          )) : (
            <div className="col-span-full py-52 text-center opacity-10 flex flex-col items-center justify-center gap-6">
              <span className="text-7xl">📦</span>
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Kirimlar mavjud emas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
