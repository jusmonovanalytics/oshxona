
import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from './services/api';
import { authService } from './services/auth';
import { syncManager } from './services/syncManager';
import { Settings } from './components/Settings';
import { Catalog } from './components/Catalog';
import { Dashboard } from './components/Dashboard';
import { OshxonaMain } from './components/oshxona/OshxonaMain';
import { BozorlikRejasi } from './components/oshxona/BozorlikRejasi';
import { OmborMain } from './components/ombor/OmborMain';
import { formatCompactNumber } from './utils/core';
import { GlobalFilter, FilterParams } from './components/GlobalFilter';
import { Auth } from './components/Auth';
import { useNotification } from './components/Notification';

const SyncIndicator = () => {
  const [state, setState] = useState({ status: 'idle', count: 0 });

  useEffect(() => {
    return syncManager.subscribe((status, count) => {
      setState({ status, count });
    });
  }, []);

  if (state.count === 0 && state.status === 'idle') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
        <span className="text-xs">✅</span>
        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Baza Sinxron</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
      state.status === 'error' 
        ? 'bg-red-500/10 border-red-500/20 text-red-500' 
        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
    }`}>
      <span className={`text-xs ${state.status === 'syncing' ? 'animate-spin' : ''}`}>
        {state.status === 'error' ? '⚠️' : '🔄'}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest">
        {state.status === 'error' ? 'Xatolik / Retrying' : `Syncing ${state.count}`}
      </span>
    </div>
  );
};

type Tab = 'dashboard' | 'catalog' | 'products' | 'tovarlar' | 'oshxona' | 'xodimlar' | 'settings' | 'ombor' | 'bozorlik';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ kirim: 0, chiqim: 0, ostatka: 0 });
  const [loading, setLoading] = useState(false);
  
  const [history, setHistory] = useState<Tab[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isNavigatingRef = useRef(false);

  const [filterParams, setFilterParams] = useState<FilterParams>({ search: '', startDate: '', endDate: '' });
  const { confirmAction } = useNotification();

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      if (savedUser.lavozim?.toLowerCase() === 'oshpaz') {
        setActiveTab('oshxona');
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    authService.setUser(userData);
    if (userData.lavozim?.toLowerCase() === 'oshpaz') {
      setActiveTab('oshxona');
    }
  };

  const handleLogout = () => {
    confirmAction("Haqiqatan ham tizimdan chiqmoqchimisiz?", () => {
      authService.logout();
    });
  };

  useEffect(() => {
    if (user && activeTab !== 'dashboard') {
      loadTabData();
    }
    setIsMobileMenuOpen(false);

    if (!isNavigatingRef.current) {
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== activeTab) {
        newHistory.push(activeTab);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
    isNavigatingRef.current = false;
  }, [activeTab, filterParams, user]);

  const loadTabData = async () => {
    // Kesh borligida loadingni yoqmaymiz (UX uchun yaxshi)
    const hasCache = localStorage.getItem(`cache_${activeTab === 'products' ? 'productOstatka' : activeTab === 'tovarlar' ? 'tovarOstatka' : activeTab}`);
    if (!hasCache) setLoading(true);

    try {
      let result: any[] = [];
      let currentTotals = { kirim: 0, chiqim: 0, ostatka: 0 };
      const isFiltered = filterParams.search || filterParams.startDate || filterParams.endDate;

      if (activeTab === 'products') {
        const [kirim, chiqim, ostatka] = await Promise.all([
          fetchData('productKirim'),
          fetchData('productChiqim'),
          fetchData('productOstatka')
        ]);

        const kArr = Array.isArray(kirim) ? kirim : [];
        const cArr = Array.isArray(chiqim) ? chiqim : [];
        const oArr = Array.isArray(ostatka) ? ostatka : [];

        // Apply filters to Kirim/Chiqim for totals
        const filteredKirim = kArr.filter(item => {
          const itemDate = item['sana']?.split(' ')[0];
          const matchesSearch = !filterParams.search || (item['product'] || "").toLowerCase().includes(filterParams.search.toLowerCase());
          const matchesStartDate = !filterParams.startDate || (itemDate && itemDate >= filterParams.startDate);
          const matchesEndDate = !filterParams.endDate || (itemDate && itemDate <= filterParams.endDate);
          return matchesSearch && matchesStartDate && matchesEndDate;
        });

        const filteredChiqim = cArr.filter(item => {
          const itemDate = item['sana']?.split(' ')[0];
          const matchesSearch = !filterParams.search || (item['product'] || "").toLowerCase().includes(filterParams.search.toLowerCase());
          const matchesStartDate = !filterParams.startDate || (itemDate && itemDate >= filterParams.startDate);
          const matchesEndDate = !filterParams.endDate || (itemDate && itemDate <= filterParams.endDate);
          return matchesSearch && matchesStartDate && matchesEndDate;
        });

        // Calculate Kirim Total
        currentTotals.kirim = filteredKirim.reduce((acc, item) => acc + (Number(item['summa']) || 0), 0);
        
        // Calculate Chiqim Total
        currentTotals.chiqim = filteredChiqim.reduce((acc, item) => acc + (Number(item['product summa']) || 0), 0);

        const latestBatches: Record<string, any> = {};
        oArr.forEach(row => {
          const bId = row['kirim id'];
          if (!bId) return;
          const currentTime = new Date(row['data time'] || row['sana']).getTime();
          const existingTime = latestBatches[bId] ? new Date(latestBatches[bId]['data time'] || latestBatches[bId]['sana']).getTime() : 0;
          if (currentTime >= existingTime) latestBatches[bId] = row;
        });

        const productStock: Record<string, any> = {};
        Object.values(latestBatches).forEach(batch => {
          const pId = batch['product id'];
          if (!productStock[pId]) {
            productStock[pId] = { product: batch['product'], quantity: 0, unit: batch['birlik'], totalSum: 0 };
          }
          const qty = Number(batch['miqdor']) || 0;
          const sum = Number(batch['summa']) || 0;
          productStock[pId].quantity += qty;
          productStock[pId].totalSum += sum;
        });
        result = Object.values(productStock).filter(item => Math.abs(item.quantity) > 0.0001);
        
        // Ostatka total should be based on the filtered result
        if (filterParams.search) {
          const s = filterParams.search.toLowerCase();
          result = result.filter(item => (item.product || "").toLowerCase().includes(s));
        }
        currentTotals.ostatka = result.reduce((acc, item) => acc + item.totalSum, 0);

      } else if (activeTab === 'tovarlar') {
        const [kirim, chiqim, ostatka] = await Promise.all([
          fetchData('tovarKirim'),
          fetchData('tovarChiqim'),
          fetchData('tovarOstatka')
        ]);

        const kArr = Array.isArray(kirim) ? kirim : [];
        const cArr = Array.isArray(chiqim) ? chiqim : [];
        const oArr = Array.isArray(ostatka) ? ostatka : [];

        // Apply filters to Kirim/Chiqim for totals
        const filteredKirim = kArr.filter(item => {
          const itemDate = item['kirim sana']?.split(' ')[0];
          const matchesSearch = !filterParams.search || (item['tovar'] || "").toLowerCase().includes(filterParams.search.toLowerCase());
          const matchesStartDate = !filterParams.startDate || (itemDate && itemDate >= filterParams.startDate);
          const matchesEndDate = !filterParams.endDate || (itemDate && itemDate <= filterParams.endDate);
          return matchesSearch && matchesStartDate && matchesEndDate;
        });

        const filteredChiqim = cArr.filter(item => {
          const itemDate = item['sotuv sana']?.split(' ')[0];
          const matchesSearch = !filterParams.search || (item['tovar'] || "").toLowerCase().includes(filterParams.search.toLowerCase());
          const matchesStartDate = !filterParams.startDate || (itemDate && itemDate >= filterParams.startDate);
          const matchesEndDate = !filterParams.endDate || (itemDate && itemDate <= filterParams.endDate);
          return matchesSearch && matchesStartDate && matchesEndDate;
        });

        // Calculate Kirim Total
        currentTotals.kirim = filteredKirim.reduce((acc, item) => acc + (Number(item['kirim summa']) || 0), 0);
        
        // Calculate Chiqim Total
        currentTotals.chiqim = filteredChiqim.reduce((acc, item) => acc + (Number(item['sotuv summasi']) || 0), 0);

        const latestBatches: Record<string, any> = {};
        oArr.forEach(row => {
          const bId = row['kirim id'];
          if (!bId) return;
          const currentTime = new Date(row['data time'] || row['sana']).getTime();
          const existingTime = latestBatches[bId] ? new Date(latestBatches[bId]['data time'] || latestBatches[bId]['sana']).getTime() : 0;
          if (currentTime >= existingTime) latestBatches[bId] = row;
        });

        const tovarStock: Record<string, any> = {};
        Object.values(latestBatches).forEach(batch => {
          const tId = batch['tovar id'];
          if (!tovarStock[tId]) {
            tovarStock[tId] = { product: batch['tovar'], quantity: 0, unit: batch['birlik'], totalSum: 0 };
          }
          const qty = Number(batch['qoldiq miqdor']) || 0;
          const sum = Number(batch['qoldiq kirim summa']) || 0;
          tovarStock[tId].quantity += qty;
          tovarStock[tId].totalSum += sum;
        });
        result = Object.values(tovarStock).filter(item => Math.abs(item.quantity) > 0.0001);

        // Ostatka total should be based on the filtered result
        if (filterParams.search) {
          const s = filterParams.search.toLowerCase();
          result = result.filter(item => (item.product || "").toLowerCase().includes(s));
        }
        currentTotals.ostatka = result.reduce((acc, item) => acc + item.totalSum, 0);
      } else if (activeTab === 'xodimlar') {
        result = await fetchData('xodimlar');
      }

      setTotals(currentTotals);

      if (filterParams.search) {
        const s = filterParams.search.toLowerCase();
        result = result.filter(item => 
          (item.product || item.tovar || item.ism || "").toLowerCase().includes(s)
        );
      }
      setData(result);
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const SidebarItem = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => {
    const role = user?.lavozim?.toLowerCase();
    if (role === 'oshpaz' && !['oshxona', 'bozorlik'].includes(id)) return null;
    if (role === 'operator' && (id === 'settings' || id === 'xodimlar')) return null;

    return (
      <button
        onClick={() => {
          setActiveTab(id);
          if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center transition-all duration-300 relative group ${
          isSidebarCollapsed ? 'lg:justify-center px-0 py-4 rounded-xl mb-1' : 'gap-3 px-4 py-3 rounded-xl mb-1'
        } ${
          activeTab === id ? 'sidebar-active shadow-lg shadow-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <span className={`text-lg transition-transform duration-300 group-hover:scale-110 ${activeTab === id ? 'scale-105' : ''}`}>{icon}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-opacity duration-300 ${isSidebarCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
          {label}
        </span>
        {isSidebarCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[200] whitespace-nowrap border border-white/10 shadow-xl">
            {label}
          </div>
        )}
      </button>
    );
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] text-slate-200 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-[100] lg:relative lg:translate-x-0 transform transition-all duration-300 ease-in-out border-r border-white/5 flex flex-col shrink-0 bg-[#020617] ${
        isMobileMenuOpen ? 'translate-x-0 w-[260px] p-4' : '-translate-x-full lg:translate-x-0 p-4'
      } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        
        <div className={`mb-8 flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/20 shrink-0">O</div>
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
            <span className="font-black tracking-tight text-base text-white block leading-none uppercase italic">Oshxona</span>
            <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1 block opacity-70">ERP System</span>
          </div>
        </div>

        <nav className="flex-grow space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          <SidebarItem id="dashboard" label="Dashboard" icon="📊" />
          <SidebarItem id="catalog" label="Katalog" icon="🗂️" />
          <SidebarItem id="ombor" label="Ombor" icon="🏪" />
          <SidebarItem id="oshxona" label="Oshxona" icon="🍳" />
          <SidebarItem id="products" label="Mahsulotlar" icon="📦" />
          <SidebarItem id="tovarlar" label="Tovarlar" icon="💎" />
          <SidebarItem id="xodimlar" label="Xodimlar" icon="👤" />
          <div className="pt-4 mt-4 border-t border-white/5">
            <SidebarItem id="bozorlik" label="Bozorlik Rejasi" icon="🛒" />
            <SidebarItem id="settings" label="Sozlamalar" icon="⚙️" />
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`hidden lg:flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <span className="text-lg">{isSidebarCollapsed ? '➡️' : '⬅️'}</span>
            {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Yopish</span>}
          </button>
          
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
          >
            <span className="text-lg">🚪</span>
            {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col overflow-hidden relative z-10 w-full">
        {/* HEADER */}
        <header className="h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 shrink-0 bg-[#020617]/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-white bg-white/5 rounded-lg border border-white/10"
            >
              ☰
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm lg:text-lg font-black text-white tracking-tight uppercase italic">{activeTab}</h2>
              <div className="h-0.5 w-6 lg:w-8 bg-indigo-600 mt-0.5 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
             <SyncIndicator />

             <div className="hidden sm:flex flex-col text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{user?.lavozim}</span>
                <span className="text-xs font-bold text-white tabular-nums">{user?.ism} {user?.familiya}</span>
             </div>
             
             <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-base">
                  👤
                </div>
             </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
              <div className="w-10 h-10 border-2 border-t-indigo-600 border-white/10 rounded-full animate-spin"></div>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">Yuklanmoqda...</span>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto pb-10">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'bozorlik' && <BozorlikRejasi />}
              {activeTab === 'catalog' && <Catalog globalFilter={filterParams} />}
              {activeTab === 'oshxona' && <OshxonaMain globalFilter={filterParams} userRole={user?.lavozim} />}
              {activeTab === 'ombor' && <OmborMain globalFilter={filterParams} />}
              {['products', 'tovarlar', 'xodimlar'].includes(activeTab) && (
                <div className="space-y-8">
                  {activeTab !== 'xodimlar' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-blue-500/5">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Jami Kirim</p>
                        <h4 className="text-xl font-black text-white italic">{totals.kirim.toLocaleString()} <span className="text-[10px] text-slate-500 not-italic">so'm</span></h4>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-orange-500/5">
                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Jami Chiqim</p>
                        <h4 className="text-xl font-black text-white italic">{totals.chiqim.toLocaleString()} <span className="text-[10px] text-slate-500 not-italic">so'm</span></h4>
                      </div>
                      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-emerald-500/5">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Jami Qoldiq (Ostatka)</p>
                        <h4 className="text-xl font-black text-white italic">{totals.ostatka.toLocaleString()} <span className="text-[10px] text-slate-500 not-italic">so'm</span></h4>
                      </div>
                    </div>
                  )}

                  <div className="erp-table-container reveal">
                    <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Nomi</th>
                        <th>{activeTab === 'xodimlar' ? 'Lavozimi' : 'Miqdori'}</th>
                        <th>{activeTab === 'xodimlar' ? 'Telefon' : 'Birlik'}</th>
                        {activeTab !== 'xodimlar' && <th>Summa</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-bold">{item.product || item.tovar || `${item.ism} ${item.familiya}`}</td>
                          <td>
                            {activeTab === 'xodimlar' ? item.lavozim : (
                              <span className="font-bold text-indigo-400">{(item.quantity || 0).toLocaleString()}</span>
                            )}
                          </td>
                          <td>{activeTab === 'xodimlar' ? (item.tel || '-') : item.unit}</td>
                          {activeTab !== 'xodimlar' && (
                            <td className="tabular-nums font-bold text-emerald-500">
                              {(item.totalSum || 0).toLocaleString()} <span className="text-[9px] text-slate-500">so'm</span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length === 0 && (
                    <div className="py-20 text-center opacity-20 uppercase tracking-[0.5em] text-[10px] font-bold">Ma'lumot yo'q</div>
                  )}
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </main>

      <GlobalFilter 
        currentParams={filterParams}
        onFilter={(params) => setFilterParams(params)}
        onClear={() => setFilterParams({ search: '', startDate: '', endDate: '' })}
      />
    </div>
  );
};

// Fixed: Added missing default export
export default App;
