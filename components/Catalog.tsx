
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
  const currentList = filteredList;

  return (
    <div className="relative min-h-[600px] space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Katalog <span className="text-indigo-500">Arvixi</span></h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Barcha ro'yxatga olingan resurslar</p>
        </div>
        
        <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-white/5 w-fit shadow-xl backdrop-blur-3xl">
          <button 
            onClick={() => setActiveTab('product')} 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'product' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Mahsulotlar ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('tovar')} 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'tovar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Tayyor Tovarlar ({tovarlar.length})
          </button>
        </div>
      </div>

      {listLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-30">
           <div className="w-10 h-10 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
           <span className="text-[9px] font-bold uppercase tracking-[0.4em] animate-pulse">Yuklanmoqda...</span>
        </div>
      ) : (
        <div className="erp-table-container reveal">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-16">#</th>
                <th>Nomi</th>
                <th>Birlik</th>
                {activeTab === 'tovar' && <th>Turi</th>}
              </tr>
            </thead>
            <tbody>
              {currentList.length > 0 ? currentList.map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="text-slate-600 font-bold">#{idx + 1}</td>
                  <td className="font-bold text-white group-hover:text-indigo-400 transition-colors uppercase">
                    {item['product'] || item['tovar']}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 bg-slate-900 rounded text-[9px] font-bold text-slate-400 uppercase border border-white/5">
                      {item['birlik']}
                    </span>
                  </td>
                  {activeTab === 'tovar' && (
                    <td>
                      <span className="text-[10px] font-medium text-slate-500 italic">{item['tovar turi']}</span>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={activeTab === 'tovar' ? 4 : 3} className="py-20 text-center opacity-20 uppercase tracking-[0.5em] text-[10px] font-bold">
                    Natija yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100] group"
      >
        <span className="group-hover:rotate-90 transition-transform duration-500">+</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-lg glass-card rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">Yangi <span className="text-indigo-500">{activeTab === 'product' ? 'Mahsulot' : 'Tovar'}</span></h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Bazaga yangi pozitsiya qo'shish</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Resurs Nomi</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nomini kiriting..." className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"/>
                </div>
                <SearchableSelect label="O'lchov Birligi" placeholder="Birlikni tanlang..." options={UNITS.map(u => ({ id: u.id, label: u.label }))} value={unit} onSelect={(val) => setUnit(val.toString())}/>
                {activeTab === 'tovar' && (
                  <SearchableSelect label="Tovar Turi" placeholder="Turi tanlang..." options={TOVAR_TYPES.map(t => ({ id: t.label, label: t.label }))} value={tType} onSelect={(val) => setTType(val.toString())}/>
                )}
                <div className="pt-4">
                  <button disabled={loading} className="w-full py-6 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50">
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
