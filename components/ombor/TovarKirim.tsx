
import React, { useState, useEffect } from 'react';
import { fetchData } from '../../services/api';
import { logic } from '../../services/logic';
import { UNITS } from '../../utils/constants';
import { formatCurrency, toInputDateTime, fromInputToSystemDate } from '../../utils/core';
import { SearchableSelect } from '../SearchableSelect';
import { FilterParams } from '../GlobalFilter';

// Added globalFilter to props to satisfy TypeScript and enable filtering
interface TovarKirimProps {
  globalFilter: FilterParams;
}

export const TovarKirim: React.FC<TovarKirimProps> = ({ globalFilter }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [tovarlar, setTovarlar] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form states
  const [selectedTovar, setSelectedTovar] = useState<any>(null);
  const [kirimBirligi, setKirimBirligi] = useState<string>('dona');
  const [kirimMiqdori, setKirimMiqdori] = useState<number>(0);
  const [koeffitsient, setKoeffitsient] = useState<number>(1);
  const [kirimPrice, setKirimPrice] = useState<number>(0);
  const [sotuvPrice, setSotuvPrice] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(toInputDateTime());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, hData] = await Promise.all([fetchData('tovarlar'), fetchData('tovarKirim')]);
      const filteredTovarlar = Array.isArray(tData) 
        ? tData.filter(t => t['tovar turi']?.toString().toLowerCase() !== 'ovqat')
        : [];
      setTovarlar(filteredTovarlar);
      setHistory(Array.isArray(hData) ? hData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTovar || kirimMiqdori <= 0 || kirimPrice <= 0) {
      alert("Iltimos, barcha maydonlarni to'liq to'ldiring!");
      return;
    }

    setSaveLoading(true);
    const jamiBazaviy = kirimMiqdori * koeffitsient;
    
    const newItem = {
      tovarId: selectedTovar['tovar id'],
      tovar: selectedTovar['tovar'],
      tovarTuri: selectedTovar['tovar turi'],
      kirimMiqdori,
      kirimBirligi,
      bazaviyBirlik: selectedTovar['birlik'],
      koeffitsient,
      jamiBazaviyMiqdor: jamiBazaviy,
      kirimNarx: kirimPrice,
      sotuvNarx: sotuvPrice,
      sana: fromInputToSystemDate(selectedDate),
      totalSum: jamiBazaviy * kirimPrice
    };

    const res = await logic.createTovarKirimBatch([newItem]);
    
    if (res.success) {
      setKirimMiqdori(0);
      setKirimPrice(0);
      setSotuvPrice(0);
      setSelectedTovar(null);
      setActiveTab('history');
      loadData();
    } else {
      alert("Saqlashda xatolik yuz berdi!");
    }
    setSaveLoading(false);
  };

  // Filter history based on global search params
  const isFiltered = globalFilter.search || globalFilter.startDate || globalFilter.endDate;
  const filteredHistory = history.filter(item => {
    const s = globalFilter.search.toLowerCase();
    const itemDate = item['kirim sana']?.split(' ')[0];
    const matchesSearch = !s || (item['tovar'] || "").toLowerCase().includes(s);
    const matchesStartDate = !globalFilter.startDate || (itemDate && itemDate >= globalFilter.startDate);
    const matchesEndDate = !globalFilter.endDate || (itemDate && itemDate <= globalFilter.endDate);
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const displayHistory = isFiltered ? filteredHistory : filteredHistory.slice(0, 50);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex p-1.5 bg-zinc-900 rounded-2xl w-fit border border-zinc-800 shadow-xl">
        <button 
          onClick={() => setActiveTab('form')}
          className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Yangi Kirim
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Kirimlar Tarixi
        </button>
      </div>

      {activeTab === 'form' ? (
        <div className="max-w-5xl glass-card p-12 rounded-[3.5rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl -mr-40 -mt-40"></div>
          
          <div className="space-y-12 relative z-10">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">💎</div>
               <div>
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Tovar <span className="text-indigo-500">Qabuli</span></h3>
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Tayyor mahsulotlarni omborga kirim qilish</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <SearchableSelect 
                  label="Tovar Nomi"
                  placeholder="Tovarni tanlang..."
                  options={tovarlar.map(t => ({ id: t['tovar id'], label: t['tovar'], subLabel: t['tovar turi'] }))}
                  value={selectedTovar?.['tovar id'] || ''}
                  onSelect={(val) => setSelectedTovar(tovarlar.find(it => it['tovar id'] === val))}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Kirim Sanasi</label>
                <input 
                  type="datetime-local" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-xs font-bold text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <SearchableSelect 
                label="Kirim Birligi"
                placeholder="Birlik..."
                options={UNITS.map(u => ({ id: u.id, label: u.label }))}
                value={kirimBirligi}
                onSelect={(val) => setKirimBirligi(val.toString())}
              />

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Miqdor</label>
                <input 
                  type="number" 
                  value={kirimMiqdori || ''}
                  onChange={(e) => setKirimMiqdori(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">1 {kirimBirligi} = ? {selectedTovar?.birlik || '...'}</label>
                <input 
                  type="number" 
                  value={koeffitsient || ''}
                  onChange={(e) => setKoeffitsient(Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Kirim Narxi ({selectedTovar?.birlik || 'dona'})</label>
                <input 
                  type="number" 
                  value={kirimPrice || ''}
                  onChange={(e) => setKirimPrice(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Sotuv Narxi</label>
                <input 
                  type="number" 
                  value={sotuvPrice || ''}
                  onChange={(e) => setSotuvPrice(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-3xl text-sm font-bold text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Umumiy Qiymat</label>
                <div className="w-full px-8 py-5 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center justify-between shadow-inner">
                   <span className="text-2xl font-black text-indigo-400">{formatCurrency(kirimMiqdori * koeffitsient * kirimPrice)}</span>
                   <span className="text-[9px] font-bold text-zinc-700 uppercase">UZS</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saveLoading || !selectedTovar || kirimMiqdori <= 0}
              className="w-full py-10 bg-indigo-600 text-white rounded-[3rem] text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-30"
            >
              {saveLoading ? 'SAQLANMOQDA...' : 'KIRIMNI TASDIQLASH VA SAQLASH'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayHistory.length > 0 ? displayHistory.map((item, idx) => (
            <div key={idx} className="glass-card p-8 rounded-[2.5rem] border border-zinc-800 group hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                 <span className="px-3 py-1 bg-zinc-950 rounded-lg text-[8px] font-black text-zinc-600 uppercase tracking-tighter">#{item['kirim id']?.toString().slice(-6)}</span>
                 <span className="text-[9px] text-zinc-600 font-bold uppercase">{item['kirim sana']?.split(' ')[0]}</span>
               </div>
               <h4 className="text-lg font-black text-zinc-100 mb-1 group-hover:text-indigo-400 transition-colors uppercase italic">{item['tovar']}</h4>
               <div className="flex gap-2 mb-6">
                 <span className="text-[8px] px-2 py-0.5 bg-zinc-800 rounded text-zinc-500 font-bold uppercase">{item['tovar turi']}</span>
               </div>
               <div className="pt-6 border-t border-zinc-800/50 space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-zinc-600 uppercase">Kirim Miqdori</span>
                     <span className="text-xs font-bold text-zinc-300">{item['miqdor']} {item['birlik']}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                     <span className="text-[9px] font-black text-zinc-700 uppercase">Jami Bazaviy</span>
                     <span className="text-[10px] font-bold text-zinc-500">{item['tovar asl birlik miqdor']} {item['tovar asl birlik']}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                     <span className="text-[9px] font-black text-indigo-500/50 uppercase">Kirim Summa</span>
                     <span className="text-sm font-black text-indigo-400">{formatCurrency(item['kirim summa'])}</span>
                  </div>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-52 text-center opacity-10 flex flex-col items-center justify-center gap-6">
              <span className="text-7xl">💎</span>
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Tovar kirimlar tarixi bo'sh</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
