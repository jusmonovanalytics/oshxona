
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { logic } from '../../services/logic';
import { UNITS } from '../../utils/constants';
import { generateId, formatDateTime } from '../../utils/core';
import { SearchableSelect } from '../SearchableSelect';
import { FilterParams } from '../GlobalFilter';

interface Ingredient {
  productId: string;
  productName: string;
  qty: number;
  unit: string;
}

interface NormaManagerProps {
  globalFilter: FilterParams;
  userRole?: string;
}

export const NormaManager: React.FC<NormaManagerProps> = ({ globalFilter, userRole }) => {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [normas, setNormas] = useState<any[]>([]);
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const role = userRole?.toLowerCase();
  const canAdd = role !== 'oshpaz';

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
      'norma id': sharedNormaId,
      'ikkilamchi birlik': secondaryUnit, 
      'asosiy miqdor': primaryOutputQty
    }));

    const res = await logic.createNorma(rows);
    if (res.success) { 
      setView('list'); 
      loadBaseData(); 
      setIngredients([]);
      setSelectedTovar(null);
    }
    setLoading(false);
  };

  if (view === 'add' && canAdd) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-10">
           <button onClick={() => setView('list')} className="px-6 py-3 bg-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
             ← Orqaga
           </button>
           <div className="text-right">
             <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Yangi <span className="text-orange-500">Retsept</span></h3>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Me'yorlarni shakllantirish</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-8">
              <div className="glass-card p-10 rounded-[3rem] space-y-10">
                 <SearchableSelect 
                   label="Asosiy Tovar"
                   placeholder="Taomni tanlang..."
                   options={tovarlar.filter(t => t['tovar turi']?.toString().toLowerCase() === 'ovqat').map(t => ({ id: t['tovar id'], label: t['tovar'] }))}
                   value={selectedTovar?.['tovar id'] || ''}
                   onSelect={(val) => setSelectedTovar(tovarlar.find(t => t['tovar id'] === val))}
                 />

                 <div className="space-y-4 pt-10 border-t border-zinc-800/50">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Retsept Nisbati</label>
                    <div className="flex gap-3">
                       <input type="number" value={secondaryQty} onChange={(e) => setSecondaryQty(Number(e.target.value))} className="w-24 px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-orange-500" />
                       <SearchableSelect 
                         className="flex-grow"
                         placeholder="Birlik..."
                         options={UNITS.map(u => ({ id: u.id, label: u.label }))}
                         value={secondaryUnit}
                         onSelect={(val) => setSecondaryUnit(val.toString())}
                       />
                    </div>
                 </div>
              </div>

              <div className="bg-orange-600/10 border border-orange-500/20 p-10 rounded-[3rem]">
                 <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-6">Porsiyaga aylantirish</label>
                 <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-white">{secondaryQty} {secondaryUnit}</div>
                    <span className="text-orange-500 font-thin">=</span>
                    <input type="number" value={primaryOutputQty} onChange={(e) => setPrimaryOutputQty(Number(e.target.value))} className="w-20 bg-zinc-950 border border-zinc-800 py-4 rounded-2xl text-center font-black text-orange-400 outline-none focus:border-orange-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{selectedTovar ? selectedTovar['birlik'] : 'Birlik'}</span>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8 glass-card p-12 rounded-[3.5rem] flex flex-col min-h-[600px]">
              <div className="flex justify-between items-center mb-12">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Masalliqlar Sarfi</label>
                 <button onClick={addIngredient} className="px-6 py-3 bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">
                    + Qo'shish
                 </button>
              </div>

              <div className="flex-grow space-y-6 overflow-y-auto max-h-[550px] pr-4 custom-scrollbar">
                 {ingredients.map((ing, idx) => (
                   <div key={idx} className="flex gap-4 items-end group animate-in slide-in-from-top-2 duration-300">
                      <SearchableSelect 
                        className="flex-grow"
                        placeholder="Masalliq..."
                        options={products.map(p => ({ id: p['product id'], label: `${p['product']} (${p['birlik']})` }))}
                        value={ing.productId}
                        onSelect={(val) => {
                          const p = products.find(it => it['product id'] === val);
                          const ni = [...ingredients];
                          if(p) ni[idx] = { ...ni[idx], productId: p['product id'], productName: p['product'], unit: p['birlik'] };
                          setIngredients(ni);
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-32 px-6 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-white outline-none focus:border-orange-500" 
                        onChange={(e) => {
                           const ni = [...ingredients];
                           ni[idx].qty = Number(e.target.value);
                           setIngredients(ni);
                        }} 
                      />
                      <button onClick={() => removeIngredient(idx)} className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-all mb-0.5">✕</button>
                   </div>
                 ))}
                 {ingredients.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-24 opacity-10">
                       <span className="text-8xl mb-8">🥘</span>
                       <p className="text-xs font-black uppercase tracking-[0.5em]">Hozircha masalliqlar yo'q</p>
                    </div>
                 )}
              </div>

              <div className="pt-12 border-t border-zinc-800">
                 <button onClick={handleSave} disabled={loading} className="w-full py-8 bg-orange-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-orange-500 active:scale-95 transition-all">
                   {loading ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;
  const filteredNormas = normas.filter(n => {
    const s = globalFilter.search.toLowerCase();
    const itemDate = n['norma rasxod sana']?.split(' ')[0];
    const matchesSearch = !s || (n['tovar'] || "").toLowerCase().includes(s) || (n['product'] || "").toLowerCase().includes(s);
    const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
    const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const normaIds = Array.from(new Set(filteredNormas.map(n => n['norma id'])));
  const displayIds = isFiltered ? normaIds : normaIds.slice(0, 20);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Retseptlar <span className="text-orange-500">Arvixi</span></h3>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-2">Ishlab chiqarish normalari boshqaruvi</p>
        </div>
        {canAdd && (
          <button onClick={() => setView('add')} className="w-20 h-20 bg-orange-600 text-white rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
            +
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayIds.length > 0 ? displayIds.map((nId, idx) => {
          const items = filteredNormas.filter(n => n['norma id'] === nId);
          if (items.length === 0) return null;
          const f = items[0];
          return (
            <div key={idx} className="glass-card p-10 rounded-[3rem] group hover:border-orange-500/50 transition-all">
               <div className="flex justify-between mb-8">
                  <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[8px] font-black text-zinc-500 uppercase tracking-tighter">#{nId}</span>
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{f['norma rasxod sana']?.split(' ')[0]}</span>
               </div>
               <h4 className="text-xl font-black text-white mb-6 group-hover:text-orange-400 transition-colors uppercase italic">{f['tovar']}</h4>
               <div className="flex items-center gap-3 mb-8 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                  <span className="text-[10px] font-black text-zinc-400 uppercase">{f['tovar miqdor']} {f['ikkilamchi birlik']}</span>
                  <span className="text-orange-500 opacity-30">→</span>
                  <span className="text-[10px] font-black text-orange-400 uppercase">{f['asosiy miqdor']} {f['tovar birlik']}</span>
               </div>
               <div className="space-y-3 pt-6 border-t border-zinc-800/30">
                  {items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold">
                       <span className="text-zinc-500">{it['product']}</span>
                       <span className="text-zinc-200">{it['product miqdor']} {it['product birlik']}</span>
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
