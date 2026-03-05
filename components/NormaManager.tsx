
import React, { useState, useEffect } from 'react';
import { fetchData } from '../services/api';
import { logic } from '../services/logic';
import { UNITS } from '../utils/constants';
import { generateId, formatDateTime } from '../utils/core';

interface Ingredient {
  productId: string;
  productName: string;
  qty: number;
  unit: string;
}

export const NormaManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [normas, setNormas] = useState<any[]>([]);
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTovar, setSelectedTovar] = useState<any>(null);
  const [secondaryUnit, setSecondaryUnit] = useState('kg');
  const [secondaryQty, setSecondaryQty] = useState(1);
  const [primaryOutputQty, setPrimaryOutputQty] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => { loadBaseData(); }, []);

  const loadBaseData = async () => {
    setLoading(true);
    const [nData, tData, pData] = await Promise.all([fetchData('norma'), fetchData('tovarlar'), fetchData('products')]);
    setNormas(Array.isArray(nData) ? nData : []);
    setTovarlar(Array.isArray(tData) ? tData : []);
    setProducts(Array.isArray(pData) ? pData : []);
    setLoading(false);
  };

  const addIngredient = () => setIngredients([...ingredients, { productId: '', productName: '', qty: 0, unit: '' }]);
  const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!selectedTovar || ingredients.length === 0) { alert("Xatolik! Tovar va masalliqlar tanlanishi shart."); return; }
    
    setLoading(true);
    // FIX: Generate a single ID for the entire recipe
    const sharedNormaId = generateId();
    const currentDateTime = formatDateTime();

    const rows = ingredients.map(ing => ({
      'product id': ing.productId, 
      'product': ing.productName, 
      'product miqdor': ing.qty, 
      'product birlik': ing.unit,
      'tovar id': selectedTovar['tovar id'], 
      'tovar': selectedTovar['tovar'], 
      'tovar miqdor': secondaryQty,
      'tovar birlik': selectedTovar['birlik'], 
      'norma rasxod sana': currentDateTime, 
      'rasxod turi': 'Retsept',
      'norma id': sharedNormaId, // Use the shared ID for all rows
      'ikkilamchi birlik': secondaryUnit, 
      'asosiy miqdor': primaryOutputQty
    }));

    const res = await logic.createNorma(rows);
    if (res.success) { 
      setView('list'); 
      loadBaseData(); 
      // Reset form
      setIngredients([]);
      setSelectedTovar(null);
    }
    setLoading(false);
  };

  if (view === 'add') {
    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-10">
           <button onClick={() => setView('list')} className="px-6 py-3 bg-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
             ← Ro'yxatga Qaytish
           </button>
           <div className="text-right">
             <h3 className="text-2xl font-black text-white">Yangi Retsept Yozish</h3>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Norma va Konversiya Boshqaruvi</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Form Section */}
           <div className="lg:col-span-4 space-y-8">
              <div className="glass-card p-10 rounded-[3rem] space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">1</span>
                       Tayyor Tovar
                    </label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      onChange={(e) => setSelectedTovar(tovarlar.find(t => t['tovar id'] === e.target.value))}
                    >
                      <option value="">Taomni tanlang...</option>
                      {tovarlar.filter(t => t['tovar turi']?.toString().toLowerCase() === 'ovqat').map(t => (
                        <option key={t['tovar id']} value={t['tovar id']}>{t['tovar']}</option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-4 pt-10 border-t border-slate-800/50">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">2</span>
                       Retsept Miqyosi
                    </label>
                    <div className="flex gap-3">
                       <input type="number" value={secondaryQty} onChange={(e) => setSecondaryQty(Number(e.target.value))} className="w-24 px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500" />
                       <select value={secondaryUnit} onChange={(e) => setSecondaryUnit(e.target.value)} className="flex-grow px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white outline-none appearance-none cursor-pointer">
                          {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="bg-indigo-600/10 border border-indigo-500/20 p-10 rounded-[3rem]">
                 <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-6">4. Konversiya natijasi</label>
                 <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-white">{secondaryQty} {secondaryUnit}</div>
                    <span className="text-indigo-500 font-thin">=</span>
                    <input type="number" value={primaryOutputQty} onChange={(e) => setPrimaryOutputQty(Number(e.target.value))} className="w-20 bg-slate-950 border border-slate-800 py-2 rounded-xl text-center font-black text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedTovar ? selectedTovar['birlik'] : 'Birlik'}</span>
                 </div>
              </div>
           </div>

           {/* Ingredient List */}
           <div className="lg:col-span-8 glass-card p-12 rounded-[3.5rem] flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-12">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">3</span>
                    Masalliqlar Sarfi (Ingredientlar)
                 </label>
                 <button onClick={addIngredient} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                    + Qo'shish
                 </button>
              </div>

              <div className="flex-grow space-y-4">
                 {ingredients.map((ing, idx) => (
                   <div key={idx} className="flex gap-4 items-center group animate-in slide-in-from-top-2 duration-300">
                      <select 
                        className="flex-grow px-6 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-sm font-bold text-slate-300 outline-none focus:border-indigo-500 appearance-none"
                        onChange={(e) => {
                          const p = products.find(it => it['product id'] === e.target.value);
                          const ni = [...ingredients];
                          if(p) ni[idx] = { ...ni[idx], productId: p['product id'], productName: p['product'], unit: p['birlik'] };
                          setIngredients(ni);
                        }}
                      >
                         <option value="">Masalliqni tanlang...</option>
                         {products.map(p => <option key={p['product id']} value={p['product id']}>{p['product']} ({p['birlik']})</option>)}
                      </select>
                      <input type="number" placeholder="0.00" className="w-32 px-6 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500" onChange={(e) => {
                         const ni = [...ingredients];
                         ni[idx].qty = Number(e.target.value);
                         setIngredients(ni);
                      }} />
                      <button onClick={() => removeIngredient(idx)} className="w-14 h-14 rounded-2xl bg-slate-800/30 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">✕</button>
                   </div>
                 ))}
                 {ingredients.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-10">
                       <span className="text-7xl mb-6">🥘</span>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em]">Hozircha masalliqlar yo'q</p>
                    </div>
                 )}
              </div>

              <div className="pt-12 border-t border-slate-800/50">
                 <button onClick={handleSave} disabled={loading} className="w-full py-8 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">
                   {loading ? 'Bazaga Saqlanmoqda...' : 'Retseptni Tasdiqlash va Saqlash'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">Retseptlar Arxivi</h3>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Ishlab chiqarish normalari boshqaruvi</p>
        </div>
        <button onClick={() => setView('add')} className="w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">
          +
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {normas.length > 0 ? Array.from(new Set(normas.map(n => n['norma id']))).map((nId, idx) => {
          const items = normas.filter(n => n['norma id'] === nId);
          if (items.length === 0) return null;
          const f = items[0];
          return (
            <div key={idx} className="glass-card p-10 rounded-[3rem] group hover:border-indigo-500/50 transition-all">
               <div className="flex justify-between mb-8">
                  <span className="px-3 py-1 bg-slate-800 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-tighter">#{nId}</span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{f['norma rasxod sana']?.split(' ')[0]}</span>
               </div>
               <h4 className="text-xl font-black text-white mb-6 group-hover:text-indigo-400 transition-colors">{f['tovar']}</h4>
               <div className="flex items-center gap-3 mb-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <span className="text-[10px] font-black text-slate-400 uppercase">{f['tovar miqdor']} {f['ikkilamchi birlik']}</span>
                  <span className="text-indigo-500 opacity-30">→</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase">{f['asosiy miqdor']} {f['tovar birlik']}</span>
               </div>
               <div className="space-y-3 pt-6 border-t border-slate-800/30">
                  {items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold">
                       <span className="text-slate-500">{it['product']}</span>
                       <span className="text-slate-200">{it['product miqdor']} {it['product birlik']}</span>
                    </div>
                  ))}
               </div>
            </div>
          );
        }) : (
           <div className="col-span-full py-52 text-center opacity-10 uppercase tracking-[0.5em] font-black text-xs">Arxiv Bo'sh</div>
        )}
      </div>
    </div>
  );
};
