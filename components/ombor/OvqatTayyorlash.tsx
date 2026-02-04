
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { logic } from '../../services/logic';
import { toInputDateTime, fromInputToSystemDate, formatCurrency } from '../../utils/core';

interface RecipeIngredient {
  productId: string;
  productName: string;
  baseQty: number;
  unit: string;
}

export const OvqatTayyorlash: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [productOstatka, setProductOstatka] = useState<any[]>([]);
  const [normas, setNormas] = useState<any[]>([]);
  
  const [selectedTovar, setSelectedTovar] = useState<any>(null);
  const [inputQty, setInputQty] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(toInputDateTime());
  
  const [currentRecipe, setCurrentRecipe] = useState<RecipeIngredient[]>([]);
  const [recipeSecondaryQty, setRecipeSecondaryQty] = useState<number>(1);
  const [recipePrimaryQty, setRecipePrimaryQty] = useState<number>(1);
  const [secondaryUnitLabel, setSecondaryUnitLabel] = useState<string>('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, nData, oData] = await Promise.all([
        fetchData('tovarlar'), 
        fetchData('norma'),
        fetchData('productOstatka')
      ]);
      setTovarlar(Array.isArray(tData) ? tData.filter(t => t['tovar turi']?.toString().toLowerCase() === 'ovqat') : []);
      setNormas(Array.isArray(nData) ? nData : []);
      setProductOstatka(Array.isArray(oData) ? oData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTovar) {
      setCurrentRecipe([]);
      setInputQty(0);
      return;
    }

    const foodNormas = normas.filter(n => n['tovar id'] === selectedTovar['tovar id']);
    if (foodNormas.length > 0) {
      const uniqueIds = Array.from(new Set(foodNormas.map(n => n['norma id'])));
      const latestId = uniqueIds[uniqueIds.length - 1]; 
      const latestRows = foodNormas.filter(n => n['norma id'] === latestId);

      if (latestRows.length > 0) {
        const firstRow = latestRows[0];
        setRecipeSecondaryQty(Number(firstRow['tovar miqdor']) || 1);
        setRecipePrimaryQty(Number(firstRow['asosiy miqdor']) || 1);
        setSecondaryUnitLabel(firstRow['ikkilamchi birlik'] || '');

        const mapped = latestRows.map(row => ({
          productId: row['product id'],
          productName: row['product'],
          baseQty: Number(row['product miqdor']),
          unit: row['product birlik']
        }));
        setCurrentRecipe(mapped);
      }
    } else {
      setCurrentRecipe([]);
      setRecipeSecondaryQty(1);
      setRecipePrimaryQty(1);
      setSecondaryUnitLabel('');
    }
  }, [selectedTovar, normas]);

  const calculatedPrimaryQty = inputQty > 0 
    ? Number(((inputQty / recipeSecondaryQty) * recipePrimaryQty).toFixed(2))
    : 0;

  // Tannarxni hisoblash
  const calculateTotalCost = () => {
    let total = 0;
    currentRecipe.forEach(ing => {
      const actualQty = (ing.baseQty / recipeSecondaryQty) * inputQty;
      const product = productOstatka.find(p => p['productId'] === ing.productId);
      const unitPrice = product && product['quantity'] > 0 
        ? product['totalSum'] / product['quantity'] 
        : 0;
      total += actualQty * unitPrice;
    });
    return total;
  };

  const totalBatchCost = calculateTotalCost();

  const handleConfirmProduction = async () => {
    if (!selectedTovar || inputQty <= 0 || currentRecipe.length === 0) {
      alert("Iltimos, taom va miqdorni to'g'ri kiriting!");
      return;
    }

    setSaveLoading(true);
    const systemDate = fromInputToSystemDate(selectedDate);

    // 1. Mahsulot chiqimlar ro'yxati
    const chiqimItems = currentRecipe.map(ing => {
      const actualIngredientQty = (ing.baseQty / recipeSecondaryQty) * inputQty;
      return {
        productId: ing.productId,
        productName: ing.productName,
        miqdor: Number(actualIngredientQty.toFixed(3)),
        birlik: ing.unit,
        tovarId: selectedTovar['tovar id'],
        ovqatNomi: selectedTovar['tovar'],
        ovqatMiqdori: inputQty,
        ikkilamchiBirlik: secondaryUnitLabel,
        sana: systemDate
      };
    });

    // 2. Tayyor ovqat kirimi ma'lumotlari
    const finishedFoodEntry = {
      tovarId: selectedTovar['tovar id'],
      tovar: selectedTovar['tovar'],
      miqdor: inputQty,
      birlik: secondaryUnitLabel,
      bazaviyBirlik: selectedTovar['birlik'],
      jamiBazaviyMiqdor: calculatedPrimaryQty,
      kirimNarx: totalBatchCost / (calculatedPrimaryQty || 1),
      kirimSumma: totalBatchCost,
      sana: systemDate
    };

    // Fixed: Using logic.processProduction which correctly handles the combined kirim/chiqim operation
    const res = await logic.processProduction(chiqimItems, finishedFoodEntry);

    if (res.success) {
      alert(`Muvaffaqiyatli! ${inputQty} ${secondaryUnitLabel} (${calculatedPrimaryQty} ${selectedTovar['birlik']}) ${selectedTovar['tovar']} tayyorlandi va omborga kirim qilindi.`);
      setInputQty(0);
      setSelectedTovar(null);
      loadData();
    } else {
      alert("Xatolik yuz berdi!");
    }
    setSaveLoading(false);
  };

  if (loading) return <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">Yuklanmoqda...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-white tracking-tighter uppercase">Ovqat Tayyorlash</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.5em] mt-3">Parallel ombor kirim-chiqim boshqaruvi</p>
        </div>
        <div className="flex items-center gap-4 px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
           <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Tizim Tayyor</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-5 space-y-8">
          <div className="glass-card p-10 rounded-[3.5rem] border border-zinc-800 relative shadow-2xl">
            <div className="space-y-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Taomni tanlang</label>
                <select 
                  className="w-full px-8 py-6 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white focus:border-orange-500 outline-none"
                  value={selectedTovar?.['tovar id'] || ''}
                  onChange={(e) => setSelectedTovar(tovarlar.find(t => t['tovar id'] === e.target.value))}
                >
                  <option value="">-- Ro'yxat --</option>
                  {tovarlar.map(t => <option key={t['tovar id']} value={t['tovar id']}>{t['tovar']}</option>)}
                </select>
              </div>

              {selectedTovar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Miqdor ({secondaryUnitLabel || '---'})</label>
                      <input 
                        type="number" 
                        value={inputQty || ''}
                        onChange={(e) => setInputQty(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-8 py-6 bg-zinc-950 border border-zinc-800 rounded-3xl text-2xl font-black text-white focus:border-orange-500 outline-none"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-2">Asosiy ({selectedTovar['birlik']})</label>
                      <div className="w-full px-8 py-6 bg-orange-500/5 border border-orange-500/20 rounded-3xl flex flex-col justify-center items-center">
                         <span className="text-2xl font-black text-orange-400">{calculatedPrimaryQty}</span>
                         <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{selectedTovar['birlik']}</span>
                      </div>
                   </div>
                </div>
              )}

              {inputQty > 0 && (
                <div className="p-8 bg-zinc-950/50 border border-zinc-800 rounded-3xl">
                   <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Umumiy Hisoblangan Tannarx</label>
                   <div className="flex justify-between items-end">
                      <span className="text-xl font-black text-white">{formatCurrency(totalBatchCost)}</span>
                      <span className="text-[10px] font-bold text-zinc-700 uppercase">UZS</span>
                   </div>
                </div>
              )}

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Sana</label>
                 <input 
                   type="datetime-local" 
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-xs font-bold text-white focus:border-orange-500 outline-none"
                 />
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 glass-card rounded-[4rem] border border-zinc-800 overflow-hidden flex flex-col shadow-2xl min-h-[600px]">
          <div className="p-12 border-b border-zinc-800 bg-zinc-900/30">
             <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em]">Sarf bo'ladigan masalliqlar</h5>
          </div>

          <div className="flex-grow overflow-y-auto p-12 space-y-4 custom-scrollbar">
             {selectedTovar && currentRecipe.length > 0 ? (
               <div className="space-y-4">
                  {currentRecipe.map((ing, idx) => {
                    const actualSarf = (ing.baseQty / recipeSecondaryQty) * inputQty;
                    const product = productOstatka.find(p => p['productId'] === ing.productId);
                    const unitPrice = product && product['quantity'] > 0 ? product['totalSum'] / product['quantity'] : 0;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-6 bg-zinc-950/50 border border-zinc-800/50 rounded-3xl group transition-all">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-xl">🌿</div>
                            <div>
                               <span className="text-sm font-black text-white block">{ing.productName}</span>
                               <span className="text-[8px] font-bold text-zinc-600 uppercase">Sarf: {actualSarf.toFixed(3)} {ing.unit}</span>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-xs font-bold text-zinc-400 block">{formatCurrency(actualSarf * unitPrice)}</span>
                            <span className="text-[8px] font-black text-zinc-600 uppercase">Summa</span>
                         </div>
                      </div>
                    );
                  })}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                  <span className="text-9xl mb-8">🍳</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">Ro'yxat bo'sh</p>
               </div>
             )}
          </div>

          {selectedTovar && currentRecipe.length > 0 && (
            <div className="p-12 bg-zinc-950/50 border-t border-zinc-800">
               <button 
                  onClick={handleConfirmProduction}
                  disabled={saveLoading || inputQty <= 0}
                  className="w-full py-10 bg-orange-600 text-white rounded-[3rem] text-[12px] font-black uppercase tracking-[0.6em] shadow-2xl hover:bg-orange-500 active:scale-95 transition-all disabled:opacity-20"
               >
                  {saveLoading ? 'SAQLANMOQDA...' : 'TASDIQLASH VA OMBORGA QO\'SHISH'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
