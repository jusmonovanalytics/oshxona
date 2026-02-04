
import React, { useState } from 'react';
import { NormaManager } from './NormaManager';
import { OvqatTayyorlash } from './OvqatTayyorlash';
import { TayyorlanganOvqatlar } from './TayyorlanganOvqatlar';
import { FilterParams } from '../GlobalFilter';

type OshxonaView = 'hub' | 'retseptlar' | 'tayyorlash' | 'tarix';

interface OshxonaMainProps {
  globalFilter: FilterParams;
  userRole?: string;
}

export const OshxonaMain: React.FC<OshxonaMainProps> = ({ globalFilter, userRole }) => {
  const [currentView, setCurrentView] = useState<OshxonaView>('hub');
  const role = userRole?.toLowerCase();

  const NavCard = ({ icon, title, desc, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className="bg-zinc-900/50 p-6 lg:p-10 rounded-[2rem] lg:rounded-[3.5rem] border border-zinc-800 hover:border-orange-500/30 hover:bg-zinc-900 transition-all duration-500 text-left group relative overflow-hidden shadow-xl"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 ${colorClass} opacity-5 rounded-full -mr-12 -mt-12 lg:-mr-16 lg:-mt-16 group-hover:scale-125 transition-transform`}></div>
      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl lg:text-3xl mb-6 lg:mb-8 group-hover:bg-orange-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <h4 className="text-lg lg:text-xl font-bold text-white mb-2">{title}</h4>
      <p className="text-[8px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">{desc}</p>
    </button>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {currentView !== 'hub' && (
        <button 
          onClick={() => setCurrentView('hub')}
          className="flex items-center gap-2 text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all mb-4"
        >
          ← Bosh sahifa
        </button>
      )}

      {currentView === 'hub' && (
        <div className="space-y-6 lg:space-y-10">
          <div>
            <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase">Oshxona</h2>
            <p className="text-[8px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 lg:mt-3">Ishlab chiqarish nazorati</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            <NavCard 
              icon="🧪" 
              title="Retseptlar" 
              desc="Taom tarkibi va normalar" 
              onClick={() => setCurrentView('retseptlar')}
              colorClass="bg-indigo-600"
            />
            <NavCard 
              icon="🍳" 
              title="Tayyorlash" 
              desc="Ishlab chiqarish va tannarx" 
              onClick={() => setCurrentView('tayyorlash')}
              colorClass="bg-orange-600"
            />
            <NavCard 
              icon="🍲" 
              title="Tarix" 
              desc="Tayyorlangan ovqatlar arxivi" 
              onClick={() => setCurrentView('tarix')}
              colorClass="bg-emerald-600"
            />
          </div>
        </div>
      )}

      {currentView === 'retseptlar' && <NormaManager globalFilter={globalFilter} userRole={userRole} />}
      {currentView === 'tayyorlash' && <OvqatTayyorlash />}
      {currentView === 'tarix' && <TayyorlanganOvqatlar globalFilter={globalFilter} />}
    </div>
  );
};
