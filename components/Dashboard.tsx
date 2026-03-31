
import React, { useState, useEffect } from 'react';
import { fetchData } from '../services/api';
import { formatCompactNumber } from '../utils/core';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ 
    totalSale: 0, 
    totalExpense: 0, 
    profit: 0, 
    margin: 0 
  });
  const [health, setHealth] = useState<number>(100);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [activeRange, setActiveRange] = useState<'today' | 'month' | 'last30' | 'custom'>('month');

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tKirim, tChiqim] = await Promise.all([
        fetchData('tovarKirim'),
        fetchData('tovarChiqim')
      ]);

      const tKirimArr = Array.isArray(tKirim) ? tKirim : [];
      const tChiqimArr = Array.isArray(tChiqim) ? tChiqim : [];

      const hasIssues = tChiqimArr.slice(-5).some(s => !s['kirim id'] || !s['sotuv id']);
      setHealth(hasIssues ? 85 : 100);

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const isInRange = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start && d <= end;
      };

      const filteredExpenses = tKirimArr.filter(item => isInRange(item['kirim sana']));
      const totalExpense = filteredExpenses.reduce((s, item) => s + (Number(item['kirim summa']) || 0), 0);
      
      const filteredSales = tChiqimArr.filter(item => isInRange(item['sotuv summasi'] ? item['sotuv sana'] : item['sana']));
      const totalSale = filteredSales.reduce((s, item) => s + (Number(item['sotuv summasi']) || 0), 0);

      const profit = totalSale - totalExpense;
      const margin = totalSale > 0 ? (profit / totalSale) * 100 : 0;

      setTotals({ totalSale, totalExpense, profit, margin });
    } catch (e) {
      console.error("Dashboard error:", e);
      setHealth(50);
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (type: 'today' | 'month' | 'last30') => {
    const today = new Date().toISOString().split('T')[0];
    setActiveRange(type);
    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'month') {
      const fDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(fDay);
      setEndDate(today);
    } else if (type === 'last30') {
      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);
      setStartDate(last30.toISOString().split('T')[0]);
      setEndDate(today);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-10 reveal pb-32">
      {/* ELITE FILTER PANEL (COLLAPSIBLE ON MOBILE) */}
      <div className="glass-card p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[4rem] border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] bg-[#0f172a]/40">
        <div className="flex flex-col">
          
          {/* Header & Status & Toggle Button */}
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1.5rem] bg-indigo-600/10 border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
                📅
              </div>
              <div className="flex flex-col">
                <h5 className="text-sm lg:text-lg font-black text-white uppercase tracking-[0.1em] leading-none">Hisobot muddati</h5>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`w-2 h-2 rounded-full ${health >= 90 ? 'bg-orange-600' : 'bg-red-600'} animate-pulse`}></div>
                   <p className="text-[10px] lg:text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Sync: {health}%</p>
                </div>
              </div>
            </div>

            {/* Mobile Toggle Button */}
            <button 
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <span className={`transition-transform duration-500 ${isFilterExpanded ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>
          </div>

          {/* Collapsible Content */}
          <div className={`${isFilterExpanded ? 'max-h-[800px] opacity-100 mt-8' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100 lg:mt-10'} overflow-hidden transition-all duration-700 ease-in-out`}>
            <div className="space-y-8">
              {/* Date Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                {/* Dan Filter */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] lg:text-xs font-black text-slate-500 uppercase tracking-widest shrink-0 w-16">Dan:</span>
                  <div className="relative flex-grow group">
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => {setStartDate(e.target.value); setActiveRange('custom');}}
                      className="w-full bg-black/60 border border-white/5 rounded-[2rem] px-8 py-5 text-sm lg:text-base font-black text-white outline-none cursor-pointer focus:border-indigo-500/50 transition-all text-center"
                    />
                  </div>
                </div>

                {/* Gacha Filter */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] lg:text-xs font-black text-slate-500 uppercase tracking-widest shrink-0 w-16">Gacha:</span>
                  <div className="relative flex-grow group">
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => {setEndDate(e.target.value); setActiveRange('custom');}}
                      className="w-full bg-black/60 border border-white/5 rounded-[2rem] px-8 py-5 text-sm lg:text-base font-black text-white outline-none cursor-pointer focus:border-indigo-500/50 transition-all text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Range Selection Buttons (Matching your image layout) */}
              <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3">
                 <button 
                   onClick={() => setQuickRange('today')} 
                   className={`px-8 py-5 rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                     activeRange === 'today' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-500'
                   }`}
                 >
                   Bugun
                 </button>
                 <button 
                   onClick={() => setQuickRange('month')} 
                   className={`px-8 py-5 rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                     activeRange === 'month' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-500'
                   }`}
                 >
                   Shu oy
                 </button>
                 <button 
                   onClick={() => setQuickRange('last30')} 
                   className={`col-span-2 lg:col-span-1 px-8 py-5 rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                     activeRange === 'last30' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-500'
                   }`}
                 >
                   30 kun
                 </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="h-[30vh] flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="space-y-8 lg:space-y-12">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="glass-card p-8 lg:p-10 rounded-[2.5rem] relative overflow-hidden group border-emerald-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-2xl mb-8 border border-emerald-500/10 shadow-inner">💰</div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jami Sotuv</p>
              <h4 className="text-2xl lg:text-3xl font-black text-white tabular-nums tracking-tighter italic">{formatCompactNumber(totals.totalSale)}</h4>
            </div>

            <div className="glass-card p-8 lg:p-10 rounded-[2.5rem] relative overflow-hidden group border-orange-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-2xl mb-8 border border-orange-500/10 shadow-inner">📉</div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jami Xarajat</p>
              <h4 className="text-2xl lg:text-3xl font-black text-white tabular-nums tracking-tighter italic">{formatCompactNumber(totals.totalExpense)}</h4>
            </div>

            <div className={`glass-card p-8 lg:p-10 rounded-[2.5rem] relative overflow-hidden group border-white/5 ${totals.profit >= 0 ? 'border-indigo-500/10' : 'border-red-500/10'}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 ${totals.profit >= 0 ? 'bg-indigo-500/5' : 'bg-red-500/5'}`}></div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-8 border ${totals.profit >= 0 ? 'bg-indigo-600/10 border-indigo-500/10' : 'bg-red-500/10 border-red-500/10'} shadow-inner text-white`}>
                {totals.profit >= 0 ? '📈' : '📉'}
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Yalpi Foyda</p>
              <h4 className={`text-2xl lg:text-3xl font-black tabular-nums tracking-tighter italic ${totals.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                {totals.profit < 0 ? '-' : ''}{formatCompactNumber(Math.abs(totals.profit))}
              </h4>
            </div>
          </div>

          {/* Big Summary Card */}
          <div className="glass-card p-10 lg:p-16 rounded-[3rem] lg:rounded-[5rem] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[150px] opacity-10 ${totals.profit >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-16">
               <div className="space-y-6 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-6">
                     <h3 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase italic">Foyda <span className={totals.profit >= 0 ? 'text-indigo-500' : 'text-red-500'}>Balansi</span></h3>
                     <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border ${totals.profit >= 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {totals.margin.toFixed(1)}% Rentabellik
                     </div>
                  </div>
                  <p className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-[0.4em] leading-relaxed max-w-lg">
                    Real-time sotuv va xarajat integratsiyasi asosidagi yakuniy balans ko'rsatkichlari.
                  </p>
               </div>

               <div className="flex flex-col items-center lg:items-end gap-2">
                  <span className={`text-6xl lg:text-9xl font-black tabular-nums tracking-tighter italic ${totals.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {totals.profit < 0 ? '-' : ''}{formatCompactNumber(Math.abs(totals.profit))}
                  </span>
                  <span className="text-[10px] lg:text-[12px] font-black text-slate-700 uppercase tracking-[0.6em] mr-[-0.6em]">O'zbek so'mi</span>
               </div>
            </div>

            <div className="mt-16 pt-12 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sotuv</p>
                  <p className="text-xl lg:text-2xl font-black text-white italic tracking-tight">{formatCompactNumber(totals.totalSale)}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Xarajat</p>
                  <p className="text-xl lg:text-2xl font-black text-slate-500 italic tracking-tight">{formatCompactNumber(totals.totalExpense)}</p>
               </div>
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Kuzatuv (Net)</p>
                  <p className={`text-xl lg:text-2xl font-black italic tracking-tight ${totals.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {totals.profit >= 0 ? '+' : ''}{totals.margin.toFixed(2)}%
                  </p>
               </div>
               <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Davr</p>
                  <p className="text-[10px] lg:text-xs font-bold text-slate-500 italic uppercase tracking-tighter">
                    {new Date(startDate).toLocaleDateString('uz-UZ', {day: '2-digit', month: '2-digit'})} • {new Date(endDate).toLocaleDateString('uz-UZ', {day: '2-digit', month: '2-digit'})}
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
