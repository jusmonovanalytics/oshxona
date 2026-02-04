
import React, { useState, useEffect } from 'react';
import { logic } from '../services/logic';
import { fetchData } from '../services/api';
import { UNITS, TOVAR_TYPES } from '../utils/constants';
import { SearchableSelect } from './SearchableSelect';
import { FilterParams } from './GlobalFilter';

interface CatalogProps {
  globalFilter: FilterParams;
}

export const Catalog: React.FC<CatalogProps> = ({ globalFilter }) => {
  const [activeTab, setActiveTab] = useState<'product' | 'tovar'>('product');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [tovarlar, setTovarlar] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(UNITS[0].id);
  const [tType, setTType] = useState(TOVAR_TYPES[0].label);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setListLoading(true);
    const [pData, tData] = await Promise.all([fetchData('products'), fetchData('tovarlar')]);
    setProducts(Array.isArray(pData) ? pData : []);
    setTovarlar(Array.isArray(tData) ? tData : []);
    setListLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    const res = activeTab === 'product' 
      ? await logic.createProduct(name, unit.toString()) 
      : await logic.createTovar(name, unit.toString(), tType);
      
    if (res.success) {
      setName('');
      setIsModalOpen(false);
      loadLists();
    }
    setLoading(false);
  };

  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;
  const rawList = activeTab === 'product' ? products : tovarlar;
  
  // Apply Filter
  const filteredList = rawList.filter(item => {
    const s = globalFilter.search.toLowerCase();
    const matchesSearch = !s || (item.product || item.tovar || "").toLowerCase().includes(s);
    return matchesSearch;
  });

  // Smart Limit
  const currentList = isFiltered ? filteredList : filteredList.slice(0, 20);

  return (
    <div className="relative min-h-[600px] space-y-12 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight uppercase italic">Katalog <span className="text-indigo-500">Arvixi</span></h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Barcha ro'yxatga olingan resurslar</p>
        </div>
        
        <div className="flex p-1.5 bg-slate-950/80 rounded-[2rem] border border-white/5 w-fit shadow-2xl backdrop-blur-3xl">
          <button 
            onClick={() => setActiveTab('product')} 
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'product' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mahsulotlar ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('tovar')} 
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'tovar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Tayyor Tovarlar ({tovarlar.length})
          </button>
        </div>
      </div>

      {listLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-30">
           <div className="w-12 h-12 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
           <span className="text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Yuklanmoqda...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {currentList.length > 0 ? currentList.map((item, idx) => (
            <div key={idx} className="glass-card p-8 rounded-[2.5rem] group hover:border-indigo-500/40">
               <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                    {activeTab === 'product' ? '📦' : '💎'}
                  </div>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">#{idx + 1}</span>
               </div>
               
               <h5 className="text-xl font-black text-white mb-2 truncate group-hover:text-indigo-400 transition-colors uppercase italic">
                 {item['product'] || item['tovar']}
               </h5>
               
               <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                  <div className="px-3 py-1 bg-slate-950/80 rounded-xl border border-white/5 shadow-inner">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item['birlik']}</span>
                  </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-52 text-center opacity-10">
               <span className="text-8xl block mb-8">📂</span>
               <p className="text-[12px] font-black uppercase tracking-[1em]">Natija yo'q</p>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-12 right-12 w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center text-4xl shadow-[0_0_60px_rgba(79,70,229,0.4)] hover:scale-110 active:scale-95 transition-all z-[100] group"
      >
        <span className="group-hover:rotate-90 transition-transform duration-700">+</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl glass-card rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-16 space-y-12">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Yangi <span className="text-indigo-500">{activeTab === 'product' ? 'Mahsulot' : 'Tovar'}</span></h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">Bazaga yangi pozitsiya qo'shish</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4">Resurs Nomi</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nomini kiriting..." className="w-full px-10 py-6 bg-slate-950 border border-white/5 rounded-[2rem] text-sm font-black text-white outline-none focus:border-indigo-500 transition-all shadow-inner"/>
                </div>
                <SearchableSelect label="O'lchov Birligi" placeholder="Birlikni tanlang..." options={UNITS.map(u => ({ id: u.id, label: u.label }))} value={unit} onSelect={(val) => setUnit(val.toString())}/>
                {activeTab === 'tovar' && (
                  <SearchableSelect label="Tovar Turi" placeholder="Turi tanlang..." options={TOVAR_TYPES.map(t => ({ id: t.label, label: t.label }))} value={tType} onSelect={(val) => setTType(val.toString())}/>
                )}
                <div className="pt-8">
                  <button disabled={loading} className="w-full py-10 bg-indigo-600 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.6em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50">
                    {loading ? 'Yozilmoqda...' : 'RO\'YXATGA QO\'SHISH'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
