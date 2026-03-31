
import React, { useState } from 'react';
import { QabulDashboard } from './QabulDashboard';
import { ProductKirim } from './ProductKirim';
import { TovarKirim } from './TovarKirim';
import { ProductChiqimList } from './ProductChiqimList';
import { PartiyaBalans } from './PartiyaBalans';
import { SotuvManager } from './SotuvManager';
import { SyncManager } from './SyncManager';
import { TovarChiqimList } from './TovarChiqimList';
import { TovarBalans } from './TovarBalans';
import { FilterParams } from '../GlobalFilter';

type OmborView = 'main' | 'qabul' | 'product-kirim' | 'tovar-kirim' | 'chiqim' | 'tovar-chiqim' | 'inventar' | 'tovar-inventar' | 'sotuv' | 'sync';

interface OmborMainProps {
  globalFilter: FilterParams;
}

export const OmborMain: React.FC<OmborMainProps> = ({ globalFilter }) => {
  const [currentView, setCurrentView] = useState<OmborView>('main');

  const renderBreadcrumbs = () => {
    const paths = [
      { id: 'main', label: 'Ombor' },
      { id: 'qabul', label: 'Qabul' },
      { id: 'chiqim', label: 'Chiqim (P)' },
      { id: 'tovar-chiqim', label: 'Chiqim (T)' },
      { id: 'inventar', label: 'Audit (P)' },
      { id: 'tovar-inventar', label: 'Audit (T)' },
      { id: 'product-kirim', label: 'P-Kirim' },
      { id: 'tovar-kirim', label: 'T-Kirim' },
      { id: 'sotuv', label: 'Sotuv' },
      { id: 'sync', label: 'Sync' }
    ];

    let currentPaths: any[] = [];
    if (currentView === 'main') currentPaths = [paths[0]];
    else if (currentView === 'qabul') currentPaths = [paths[0], paths[1]];
    else if (currentView === 'chiqim') currentPaths = [paths[0], paths[2]];
    else if (currentView === 'tovar-chiqim') currentPaths = [paths[0], paths[3]];
    else if (currentView === 'inventar') currentPaths = [paths[0], paths[4]];
    else if (currentView === 'tovar-inventar') currentPaths = [paths[0], paths[5]];
    else if (currentView === 'sotuv') currentPaths = [paths[0], paths[8]];
    else if (currentView === 'sync') currentPaths = [paths[0], paths[9]];
    else if (currentView === 'product-kirim') currentPaths = [paths[0], paths[1], paths[6]];
    else if (currentView === 'tovar-kirim') currentPaths = [paths[0], paths[1], paths[7]];

    return (
      <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-6 lg:mb-12">
        {currentPaths.map((p, idx) => (
          <React.Fragment key={p.id}>
            <button 
              onClick={() => setCurrentView(p.id as OmborView)}
              className={`text-[8px] lg:text-[9px] font-bold uppercase tracking-widest transition-all ${idx === currentPaths.length - 1 ? 'text-indigo-500' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              {p.label}
            </button>
            {idx < currentPaths.length - 1 && <span className="text-zinc-800 text-[8px]">/</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const NavCard = ({ icon, title, desc, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className="bg-zinc-900 p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-zinc-800 hover:border-zinc-700 transition-all duration-500 text-left group relative overflow-hidden shadow-xl"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 ${colorClass} opacity-5 rounded-full -mr-12 -mt-12 lg:-mr-16 lg:-mt-16 group-hover:scale-125 transition-transform`}></div>
      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl lg:text-3xl mb-6 lg:mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <h4 className="text-lg lg:text-xl font-bold text-white mb-2">{title}</h4>
      <p className="text-[8px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">{desc}</p>
    </button>
  );

  return (
    <div className="animate-in fade-in duration-700">
      {renderBreadcrumbs()}

      {currentView === 'main' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
          <NavCard 
            icon="📥" 
            title="Qabul" 
            desc="Kirim operatsiyalari" 
            onClick={() => setCurrentView('qabul')}
            colorClass="bg-blue-600"
          />
          <NavCard 
            icon="💰" 
            title="Sotuv" 
            desc="Savdo va kassa" 
            onClick={() => setCurrentView('sotuv')}
            colorClass="bg-indigo-600"
          />
          <NavCard 
            icon="⚖️" 
            title="Sinxron" 
            desc="Balanslarni qayta hisoblash" 
            onClick={() => setCurrentView('sync')}
            colorClass="bg-emerald-600"
          />
          <NavCard 
            icon="📤" 
            title="Chiqimlar" 
            desc="Sarfiyot va tarix" 
            onClick={() => setCurrentView('chiqim')}
            colorClass="bg-orange-600"
          />
          <NavCard 
            icon="📈" 
            title="Audit" 
            desc="Partiyalar tahlili" 
            onClick={() => setCurrentView('inventar')}
            colorClass="bg-zinc-600"
          />
        </div>
      )}

      {currentView === 'chiqim' && (
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl w-fit border border-zinc-800">
            <button onClick={() => setCurrentView('chiqim')} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Mahsulotlar</button>
            <button onClick={() => setCurrentView('tovar-chiqim')} className="px-4 py-2 text-zinc-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Tavarlar</button>
          </div>
          <ProductChiqimList globalFilter={globalFilter} />
        </div>
      )}

      {currentView === 'tovar-chiqim' && (
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl w-fit border border-zinc-800">
            <button onClick={() => setCurrentView('chiqim')} className="px-4 py-2 text-zinc-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Mahsulotlar</button>
            <button onClick={() => setCurrentView('tovar-chiqim')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Tavarlar</button>
          </div>
          <TovarChiqimList globalFilter={globalFilter} />
        </div>
      )}

      {currentView === 'inventar' && (
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl w-fit border border-zinc-800">
            <button onClick={() => setCurrentView('inventar')} className="px-4 py-2 bg-zinc-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Mahsulotlar</button>
            <button onClick={() => setCurrentView('tovar-inventar')} className="px-4 py-2 text-zinc-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Tavarlar</button>
          </div>
          <PartiyaBalans globalFilter={globalFilter} />
        </div>
      )}

      {currentView === 'tovar-inventar' && (
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl w-fit border border-zinc-800">
            <button onClick={() => setCurrentView('inventar')} className="px-4 py-2 text-zinc-500 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Mahsulotlar</button>
            <button onClick={() => setCurrentView('tovar-inventar')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">Tavarlar</button>
          </div>
          <TovarBalans globalFilter={globalFilter} />
        </div>
      )}

      {currentView === 'qabul' && (
        <QabulDashboard 
          onSelectProductKirim={() => setCurrentView('product-kirim')} 
          onSelectTovarKirim={() => setCurrentView('tovar-kirim')} 
        />
      )}

      {currentView === 'product-kirim' && <ProductKirim globalFilter={globalFilter} />}
      {currentView === 'tovar-kirim' && <TovarKirim globalFilter={globalFilter} />}
      {currentView === 'sotuv' && <SotuvManager globalFilter={globalFilter} />}
      {currentView === 'sync' && <SyncManager />}
    </div>
  );
};
