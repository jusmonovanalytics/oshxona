
import React, { useState, useEffect, useRef } from 'react';
import { fetchData } from './services/api';
import { authService } from './services/auth';
import { syncManager } from './services/syncManager';
import { Settings } from './components/Settings';
import { Catalog } from './components/Catalog';
import { Dashboard } from './components/Dashboard';
import { OshxonaMain } from './components/oshxona/OshxonaMain';
import { OmborMain } from './components/ombor/OmborMain';
import { formatCompactNumber } from './utils/core';
import { GlobalFilter, FilterParams } from './components/GlobalFilter';
import { Auth } from './components/Auth';

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

type Tab = 'dashboard' | 'catalog' | 'products' | 'tovarlar' | 'oshxona' | 'xodimlar' | 'settings' | 'ombor';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [history, setHistory] = useState<Tab[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isNavigatingRef = useRef(false);

  const [filterParams, setFilterParams] = useState<FilterParams>({ search: '', startDate: '', endDate: '' });

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
    if (confirm("Haqiqatan ham tizimdan chiqmoqchimisiz?")) {
      authService.logout();
    }
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
    setLoading(true);
    try {
      let result: any[] = [];
      const isFiltered = filterParams.search || filterParams.startDate || filterParams.endDate;

      if (activeTab === 'products') {
        const ostatka = await fetchData('productOstatka');
        const oArr = Array.isArray(ostatka) ? ostatka : [];
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
          productStock[pId].quantity += qty;
          productStock[pId].totalSum += (Number(batch['summa']) || 0);
        });
        result = Object.values(productStock).filter(item => Math.abs(item.quantity) > 0.0001);
      } else if (activeTab === 'tovarlar') {
        const ostatka = await fetchData('tovarOstatka');
        const oArr = Array.isArray(ostatka) ? ostatka : [];
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
          tovarStock[tId].quantity += qty;
          tovarStock[tId].totalSum += (Number(batch['qoldiq kirim summa']) || 0);
        });
        result = Object.values(tovarStock).filter(item => Math.abs(item.quantity) > 0.0001);
      } else if (activeTab === 'xodimlar') {
        result = await fetchData('xodimlar');
      }

      if (filterParams.search) {
        const s = filterParams.search.toLowerCase();
        result = result.filter(item => 
          (item.product || item.tovar || item.ism || "").toLowerCase().includes(s)
        );
      }
      setData(isFiltered ? result : result.slice(0, 40));
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const SidebarItem = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => {
    const role = user?.lavozim?.toLowerCase();
    if (role === 'oshpaz' && id !== 'oshxona') return null;
    if (role === 'operator' && (id === 'settings' || id === 'xodimlar')) return null;

    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center transition-all duration-500 relative group overflow-hidden ${
          isSidebarCollapsed ? 'lg:justify-center px-0 py-5 rounded-2xl mb-1' : 'gap-4 px-6 py-4 rounded-2xl mb-1'
        } ${
          activeTab === id ? 'sidebar-active shadow-2xl shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <span className={`text-xl transition-transform duration-500 group-hover:scale-125 ${activeTab === id ? 'scale-110' : ''}`}>{icon}</span>
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.2em] whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500 ${isSidebarCollapsed ? 'lg:hidden' : 'block'}`}>
          {label}
        </span>
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
      <aside className={`fixed inset-y-0 left-0 z-[100] lg:relative lg:translate-x-0 transform transition-transform duration-500 ease-in-out border-r border-white/5 flex flex-col shrink-0 bg-[#020617]/95 backdrop-blur-3xl lg:bg-[#020617]/50 ${
        isMobileMenuOpen ? 'translate-x-0 w-[280px] p-6' : '-translate-x-full lg:translate-x-0 p-6 lg:p-10'
      } ${isSidebarCollapsed ? 'lg:w-24' : 'lg:w-80'}`}>
        
        <div className={`mb-12 lg:mb-16 flex items-center gap-4 group transition-all duration-500 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-[1rem] lg:rounded-[1.25rem] bg-orange-600 flex items-center justify-center text-white text-xl lg:text-2xl font-black shadow-[0_0_30px_rgba(249,115,22,0.4)] shrink-0">O</div>
          <div className={`transition-all duration-500 ${isSidebarCollapsed ? 'lg:hidden' : 'block'}`}>
            <span className="font-black tracking-tighter text-lg lg:text-xl text-white block leading-none uppercase italic">Oshxona</span>
            <span className="text-[8px] lg:text-[9px] font-black text-orange-500 uppercase tracking-[0.4em] mt-2 block opacity-70">ERP Edition</span>
          </div>
        </div>

        <nav className="flex-grow space-y-1 overflow-y-auto pr-1 custom-scrollbar">
          <SidebarItem id="dashboard" label="Dashboard" icon="📊" />
          <SidebarItem id="catalog" label="Katalog" icon="🗂️" />
          <SidebarItem id="ombor" label="Ombor" icon="🏪" />
          <SidebarItem id="oshxona" label="Oshxona" icon="🍳" />
          <SidebarItem id="products" label="Mahsulot" icon="📦" />
          <SidebarItem id="tovarlar" label="Tovarlar" icon="💎" />
          <SidebarItem id="xodimlar" label="Xodimlar" icon="👤" />
          <div className="pt-6 mt-6 border-t border-white/5">
            <SidebarItem id="settings" label="Sozlamalar" icon="⚙️" />
          </div>
        </nav>

        <button 
          onClick={handleLogout}
          className={`mt-6 flex items-center gap-4 px-6 py-5 rounded-2xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 group ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
        >
          <span className="text-xl group-hover:scale-125 transition-transform">🚪</span>
          {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-[0.4em]">Chiqish</span>}
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col overflow-hidden relative z-10 w-full">
        {/* HEADER */}
        <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 shrink-0 bg-[#020617]/40 backdrop-blur-xl">
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-white bg-white/5 rounded-xl border border-white/10"
            >
              ☰
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg lg:text-2xl font-black text-white tracking-tighter uppercase italic">{activeTab}</h2>
              <div className="h-1 w-8 lg:w-12 bg-orange-600 mt-1 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
             {/* SYNC INDICATOR ADDED HERE */}
             <SyncIndicator />

             <div className="hidden md:flex flex-col text-right">
                <span className="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">{user?.lavozim}</span>
                <span className="text-xs lg:text-sm font-bold text-white tabular-nums">{user?.ism} {user?.familiya}</span>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-lg lg:text-xl relative group">
                  👤
                  <div className="absolute inset-0 rounded-full border border-indigo-500/0 group-hover:border-indigo-500/50 transition-all scale-110"></div>
                </div>

                <button 
                  onClick={handleLogout}
                  title="Akkauntdan chiqish"
                  className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-xl lg:rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] active:scale-90"
                >
                  <span className="text-xl lg:text-2xl">🚪</span>
                </button>
             </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-4 lg:p-12 custom-scrollbar">
          {loading && activeTab !== 'dashboard' ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
              <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="max-w-[1700px] mx-auto pb-20">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'catalog' && <Catalog globalFilter={filterParams} />}
              {activeTab === 'oshxona' && <OshxonaMain globalFilter={filterParams} userRole={user?.lavozim} />}
              {activeTab === 'ombor' && <OmborMain globalFilter={filterParams} />}
              {['products', 'tovarlar', 'xodimlar'].includes(activeTab) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8 reveal">
                  {data.map((item, idx) => (
                    <div key={idx} className="glass-card p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] group">
                       <h4 className="text-lg lg:text-xl font-black text-white mb-6 lg:mb-8 truncate uppercase italic">{item.product || item.tovar || `${item.ism} ${item.familiya}`}</h4>
                       <div className="pt-6 border-t border-white/5">
                          <p className="text-xl lg:text-2xl font-black text-white">{(item.quantity || 0).toLocaleString()} <span className="text-[10px] text-slate-500">{item.unit || item.lavozim}</span></p>
                       </div>
                    </div>
                  ))}
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

export default App;
