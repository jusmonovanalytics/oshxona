
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { logic } from '../../services/logic';
import { toInputDateTime, fromInputToSystemDate, formatCurrency, generateId } from '../../utils/core';
import { SearchableSelect } from '../SearchableSelect';

interface RecipeIngredient {
  productId: string;
  productName: string;
  baseQty: number;
  unit: string;
}

interface ProductBatch {
  kirimId: string;
  productId: string;
  productName: string;
  price: number;
  remainingQty: number;
  remainingFaktQty: number;
  sana: string;
}

export const OvqatTayyorlash: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [normas, setNormas] = useState<any[]>([]);
  const [productOstatkaData, setProductOstatkaData] = useState<any[]>([]);
  
  const [selectedTovar, setSelectedTovar] = useState<any>(null);
  const [inputQty, setInputQty] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(toInputDateTime());
  
  const [currentRecipe, setCurrentRecipe] = useState<RecipeIngredient[]>([]);
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});
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
      setProductOstatkaData(Array.isArray(oData) ? oData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStandardQty = (baseQty: number) => {
    if (inputQty <= 0) return 0;
    return (baseQty / recipeSecondaryQty) * inputQty;
  };

  const getFIFOAvailableBatches = (productId: string): ProductBatch[] => {
    const latestBatches: Record<string, any> = {};
    productOstatkaData
      .filter(row => row['product id'] === productId)
      .forEach(row => {
        const bId = row['kirim id'];
        if (!bId) return;
        const currentTime = new Date(row['data time'] || row['sana']).getTime();
        const existingTime = latestBatches[bId] ? new Date(latestBatches[bId]['data time'] || latestBatches[bId]['sana']).getTime() : 0;
        if (currentTime >= existingTime) latestBatches[bId] = row;
      });

    return Object.values(latestBatches)
      .map(b => ({
        kirimId: b['kirim id'],
        productId: b['product id'],
        productName: b['product'],
        price: Number(b['narx']) || 0,
        remainingQty: Number(b['miqdor']) || 0,
        remainingFaktQty: Number(b['fakt miqdor'] !== undefined ? b['fakt miqdor'] : b['miqdor']) || 0,
        sana: b['sana']
      }))
      .filter(b => b.remainingFaktQty > 0.0001)
      .sort((a, b) => new Date(a.sana).getTime() - new Date(b.sana).getTime());
  };

  const calculateFIFOConsumption = (productId: string, actualRequiredQty: number, standardRequiredQty: number) => {
    const batches = getFIFOAvailableBatches(productId);
    const consumption: any[] = [];
    
    let remainingToFulfillFakt = actualRequiredQty;
    let remainingToFulfillNorma = standardRequiredQty;

    for (const batch of batches) {
      if (remainingToFulfillFakt <= 0 && remainingToFulfillNorma <= 0) break;
      
      const takeFakt = Math.min(batch.remainingFaktQty, Math.max(0, remainingToFulfillFakt));
      const takeNorma = Math.min(batch.remainingQty, Math.max(0, remainingToFulfillNorma));

      if (takeFakt > 0 || takeNorma > 0) {
        consumption.push({
          sourceKirimId: batch.kirimId,
          takeFakt: takeFakt,
          takeNorma: takeNorma,
          productNarx: batch.price,
          productSumma: takeFakt * batch.price,
          batchRemainingBeforeNorma: batch.remainingQty,
          batchRemainingBeforeFakt: batch.remainingFaktQty
        });
      }

      remainingToFulfillFakt -= takeFakt;
      remainingToFulfillNorma -= takeNorma;
    }

    return {
      items: consumption,
      isPossible: remainingToFulfillFakt <= 0.0001,
      shortage: Math.max(0, remainingToFulfillFakt)
    };
  };

  useEffect(() => {
    if (!selectedTovar || inputQty <= 0) {
      setActualQuantities({});
      if (!selectedTovar) setCurrentRecipe([]);
      return;
    }

    const foodNormas = normas.filter(n => n['tovar id'] === selectedTovar['tovar id']);
    if (foodNormas.length > 0) {
      const latestId = Array.from(new Set(foodNormas.map(n => n['norma id']))).slice(-1)[0];
      const latestRows = foodNormas.filter(n => n['norma id'] === latestId);

      setRecipeSecondaryQty(Number(latestRows[0]['tovar miqdor']) || 1);
      setRecipePrimaryQty(Number(latestRows[0]['asosiy miqdor']) || 1);
      setSecondaryUnitLabel(latestRows[0]['ikkilamchi birlik'] || '');

      const mapped = latestRows.map(row => ({
        productId: row['product id'],
        productName: row['product'],
        baseQty: Number(row['product miqdor']),
        unit: row['product birlik']
      }));
      
      setCurrentRecipe(mapped);

      const initialActuals: Record<string, number> = {};
      mapped.forEach(ing => {
        initialActuals[ing.productId] = Number(((ing.baseQty / (Number(latestRows[0]['tovar miqdor']) || 1)) * inputQty).toFixed(3));
      });
      setActualQuantities(initialActuals);
    }
  }, [selectedTovar, inputQty, normas]);

  const handleActualChange = (productId: string, val: number) => {
    setActualQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const currentTotalPreviewCost = () => {
    let total = 0;
    for (const ing of currentRecipe) {
      const actualNeeded = actualQuantities[ing.productId] || 0;
      const standardNeeded = getStandardQty(ing.baseQty);
      const res = calculateFIFOConsumption(ing.productId, actualNeeded, standardNeeded);
      total += res.items.reduce((s, it) => s + it.productSumma, 0);
    }
    return total;
  };

  const calculatedPrimaryQty = inputQty > 0 
    ? Number(((inputQty / recipeSecondaryQty) * recipePrimaryQty).toFixed(2))
    : 0;

  const handleConfirmProduction = async () => {
    if (!selectedTovar || inputQty <= 0 || currentRecipe.length === 0) {
      alert("Tayyorlanadigan taom va miqdorni kiriting!");
      return;
    }

    setSaveLoading(true);
    const systemDate = fromInputToSystemDate(selectedDate);
    const finalChiqimItems: any[] = [];
    const productOstatkaUpdates: any[] = [];
    let totalRealCost = 0;
    let anyShortage = false;

    for (const ing of currentRecipe) {
      const actualNeeded = actualQuantities[ing.productId] || 0;
      const standardNeeded = getStandardQty(ing.baseQty);
      const fifoRes = calculateFIFOConsumption(ing.productId, actualNeeded, standardNeeded);

      if (!fifoRes.isPossible) {
        alert(`Xatolik! Omboringizda ${ing.productName} yetarli emas. Faktik sarf: ${actualNeeded} ${ing.unit}. Kamchilik: ${fifoRes.shortage.toFixed(3)}`);
        anyShortage = true;
        break;
      }

      fifoRes.items.forEach(item => {
        totalRealCost += item.productSumma;
        finalChiqimItems.push({
          'chiqim id': generateId(),
          'product id': ing.productId,
          'product': ing.productName,
          'miqdor': Number(item.takeNorma.toFixed(4)),
          'fakt miqdor': Number(item.takeFakt.toFixed(4)),
          'birlik': ing.unit,
          'tovar id': selectedTovar['tovar id'],
          'ovqat nomi': selectedTovar['tovar'],
          'ovqat miqdori': inputQty,
          'ikkilamchi birlik': secondaryUnitLabel,
          'sana': systemDate,
          'product narx': item.productNarx,
          'product summa': Number(item.productSumma.toFixed(2)),
          'kirim id': item.sourceKirimId
        });

        productOstatkaUpdates.push({
          'kirim id': item.sourceKirimId,
          'product id': ing.productId,
          'product': ing.productName,
          'miqdor': Number((item.batchRemainingBeforeNorma - item.takeNorma).toFixed(4)),
          'fakt miqdor': Number((item.batchRemainingBeforeFakt - item.takeFakt).toFixed(4)),
          'birlik': ing.unit,
          'narx': item.productNarx,
          'summa': Number(((item.batchRemainingBeforeFakt - item.takeFakt) * item.productNarx).toFixed(2)),
          'sana': systemDate,
          'kirim turi': 'Qoldiq'
        });
      });
    }

    if (anyShortage) {
      setSaveLoading(false);
      return;
    }

    const finishedFoodEntry = {
      'tovar id': selectedTovar['tovar id'],
      'tovar': selectedTovar['tovar'],
      'miqdor': inputQty,
      'birlik': secondaryUnitLabel,
      'tovar turi': 'Ovqat',
      'tovar asl birlik': selectedTovar['birlik'],
      'tovar asl birlik miqdor': calculatedPrimaryQty,
      'kirim narx': Number((totalRealCost / (calculatedPrimaryQty || 1)).toFixed(2)),
      'kirim summa': Number(totalRealCost.toFixed(2)),
      'kirim sana': systemDate
    };

    const res = await logic.processProduction(finalChiqimItems, finishedFoodEntry, productOstatkaUpdates);
    
    if (res.success) {
      alert("Ishlab chiqarish yakunlandi. Taom omborga 'Ovqat' turi bilan kirim qilindi.");
      setInputQty(0);
      setSelectedTovar(null);
      loadData();
    } else {
      alert("Xatolik! Ma'lumotlar saqlanmadi.");
    }
    setSaveLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Ovqat <span className="text-orange-600">Tayyorlash</span></h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.5em] mt-3">Ishlab chiqarilgan taomlar "Ovqat" turi bilan saqlanadi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-5 space-y-8">
          <div className="glass-card p-10 rounded-[4rem] border border-zinc-800 relative shadow-2xl">
            <div className="space-y-10 relative z-10">
              <SearchableSelect 
                label="Tayyorlanadigan Taom"
                placeholder="Taomni tanlang..."
                options={tovarlar.map(t => ({ id: t['tovar id'], label: t['tovar'] }))}
                value={selectedTovar?.['tovar id'] || ''}
                onSelect={(val) => setSelectedTovar(tovarlar.find(t => t['tovar id'] === val))}
              />

              {selectedTovar && (
                <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Porsiya ({secondaryUnitLabel})</label>
                      <input 
                        type="number" 
                        value={inputQty || ''}
                        onChange={(e) => setInputQty(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-10 py-7 bg-zinc-950 border border-zinc-800 rounded-3xl text-3xl font-black text-white focus:border-orange-500 outline-none shadow-inner tabular-nums"
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-2">Baza ({selectedTovar['birlik']})</label>
                      <div className="w-full px-8 py-7 bg-orange-600/5 border border-orange-500/10 rounded-3xl flex flex-col justify-center items-center shadow-inner">
                         <span className="text-3xl font-black text-orange-400 tabular-nums">{calculatedPrimaryQty}</span>
                         <span className="text-[9px] font-black text-zinc-700 uppercase tracking-tighter">{selectedTovar['birlik']}</span>
                      </div>
                   </div>
                </div>
              )}

              {inputQty > 0 && (
                <div className="p-10 bg-zinc-950 border border-zinc-900 rounded-[3rem] border-l-4 border-l-emerald-500 shadow-2xl">
                   <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Tannarx (Faktik masalliq sarfi asosida)</span>
                   <div className="flex justify-between items-end">
                      <span className="text-3xl font-black text-white tabular-nums">{formatCurrency(currentTotalPreviewCost())}</span>
                      <span className="text-[10px] font-bold text-zinc-700 uppercase">UZS</span>
                   </div>
                </div>
              )}

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Tayyorlash Sanasi</label>
                 <input 
                   type="datetime-local" 
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-bold text-white focus:border-orange-500 outline-none"
                 />
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 glass-card rounded-[4rem] border border-zinc-800 overflow-hidden flex flex-col shadow-2xl max-h-[85vh]">
          <div className="p-10 lg:p-12 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center shrink-0">
             <h5 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em]">Masalliqlar va Faktik Sarf</h5>
          </div>

          <div className="flex-grow overflow-y-auto p-6 lg:p-12 space-y-6 custom-scrollbar bg-black/20">
             {selectedTovar && currentRecipe.length > 0 ? (
               <div className="space-y-6">
                  {currentRecipe.map((ing, idx) => {
                    const standardVal = getStandardQty(ing.baseQty);
                    const actualVal = actualQuantities[ing.productId] || 0;
                    const fifoRes = calculateFIFOConsumption(ing.productId, actualVal, standardVal);
                    
                    return (
                      <div key={idx} className="space-y-4 p-6 lg:p-8 bg-zinc-950/60 border border-zinc-900 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all duration-300">
                         <div className="flex justify-between items-start gap-4">
                            <div>
                               <h6 className="text-sm font-black text-white uppercase tracking-tight mb-1">{ing.productName}</h6>
                               <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Norma: {standardVal.toFixed(3)} {ing.unit}</span>
                            </div>
                            <span className={`text-[8px] lg:text-[9px] font-black px-3 py-1.5 rounded-xl border tabular-nums ${fifoRes.isPossible ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                               {fifoRes.isPossible ? 'OMBORDA MAVJUD' : `KAMCHILIK: ${fifoRes.shortage.toFixed(3)}`}
                            </span>
                         </div>
                         
                         <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                               <label className="text-[8px] font-black text-indigo-400/70 uppercase tracking-widest ml-2">Faktik sarfni kiriting</label>
                               {actualVal !== standardVal && (
                                  <button 
                                    onClick={() => handleActualChange(ing.productId, Number(standardVal.toFixed(3)))}
                                    className="text-[8px] font-black text-zinc-600 hover:text-indigo-400 uppercase underline decoration-zinc-800"
                                  >
                                    Normaga qaytarish
                                  </button>
                               )}
                            </div>
                            <div className="relative">
                               <input 
                                 type="number" 
                                 value={actualVal || ''}
                                 onChange={(e) => handleActualChange(ing.productId, Number(e.target.value))}
                                 className="w-full px-6 py-4 bg-black/60 border border-white/5 rounded-2xl text-lg font-black text-white focus:border-indigo-500 outline-none transition-all shadow-inner tabular-nums"
                               />
                               <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-700 uppercase">{ing.unit}</span>
                            </div>
                         </div>
                      </div>
                    );
                  })}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 grayscale">
                  <span className="text-9xl mb-8">🍳</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center px-10">Tahlil qilish uchun taomni va miqdorni tanlang</p>
               </div>
             )}
          </div>

          {selectedTovar && inputQty > 0 && (
            <div className="p-8 lg:p-12 bg-zinc-950 border-t border-zinc-800 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
               <button 
                  onClick={handleConfirmProduction}
                  disabled={saveLoading || inputQty <= 0}
                  className="w-full py-8 lg:py-10 bg-orange-600 text-white rounded-[2.5rem] lg:rounded-[3rem] text-[11px] lg:text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-orange-500 active:scale-[0.98] transition-all shadow-orange-600/20 disabled:opacity-20 flex items-center justify-center gap-4"
               >
                  {saveLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>MA'LUMOTLAR YOZILMOQDA...</span>
                    </>
                  ) : 'TAYYORLASH VA OMBORLARNI SINXRONLASH'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
