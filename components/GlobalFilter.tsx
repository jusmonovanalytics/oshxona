
import React, { useState, useRef, useEffect } from 'react';

export interface FilterParams {
  search: string;
  startDate: string;
  endDate: string;
}

interface GlobalFilterProps {
  onFilter: (params: FilterParams) => void;
  onClear: () => void;
  currentParams: FilterParams;
}

export const GlobalFilter: React.FC<GlobalFilterProps> = ({ onFilter, onClear, currentParams }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localParams, setLocalParams] = useState<FilterParams>(currentParams);
  
  const [position, setPosition] = useState({ 
    x: window.innerWidth - (window.innerWidth < 640 ? 100 : 140), 
    y: window.innerHeight - (window.innerWidth < 640 ? 100 : 140) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = currentParams.search || currentParams.startDate || currentParams.endDate;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    if (buttonRef.current) {
      buttonRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;

    newX = Math.max(10, Math.min(window.innerWidth - 80, newX));
    newY = Math.max(10, Math.min(window.innerHeight - 80, newY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (buttonRef.current) {
      buttonRef.current.releasePointerCapture(e.pointerId);
    }
    const dx = Math.abs(e.clientX - (position.x + dragStartPos.current.x));
    const dy = Math.abs(e.clientY - (position.y + dragStartPos.current.y));
    if (dx < 10 && dy < 10) {
      setIsOpen(true);
    }
  };

  const handleApply = () => {
    onFilter(localParams);
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared = { search: '', startDate: '', endDate: '' };
    setLocalParams(cleared);
    onClear();
    setIsOpen(false);
  };

  return (
    <>
      <button 
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          touchAction: 'none'
        }}
        className={`fixed w-20 lg:w-24 h-20 lg:h-24 rounded-full flex items-center justify-center z-[2000] select-none cursor-grab active:cursor-grabbing group transition-transform duration-300 ${
          isDragging ? 'scale-110 z-[2001]' : 'hover:scale-105'
        }`}
      >
        <div className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-700 ${isDragging ? 'scale-125 opacity-0' : 'scale-100 opacity-100'}`}></div>
        <div className={`absolute inset-2 rounded-full border transition-all duration-500 ${
          isActive ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'border-white/10'
        }`}></div>
        <div className={`absolute inset-4 rounded-full backdrop-blur-3xl border border-white/10 flex flex-col items-center justify-center transition-all duration-500 ${
          isActive ? 'bg-indigo-600/90' : 'bg-[#0f172a]/80'
        }`}>
           <div className="relative mb-1">
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-4 transition-all duration-500 ${isActive ? 'border-white' : 'border-indigo-400'}`}></div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-1.5 rounded-full rotate-45 bg-current ${isActive ? 'text-white' : 'text-indigo-400'}`}></div>
           </div>
           <span className={`text-[7px] lg:text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-white' : 'text-slate-500'}`}>
             Filtr
           </span>
           {isActive && (
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#020617] animate-bounce"></div>
           )}
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 lg:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] lg:rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 lg:p-12 pb-0 flex justify-between items-center">
              <div>
                 <h4 className="text-xl lg:text-2xl font-black text-white uppercase italic tracking-tighter">Aqlli <span className="text-indigo-500">Filtr</span></h4>
                 <div className="h-1 w-6 bg-indigo-500 mt-2 rounded-full"></div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">✕</button>
            </div>
            <div className="p-8 lg:p-12 space-y-8 lg:space-y-10">
              <div className="space-y-6 lg:space-y-8">
                 <div className="space-y-3">
                    <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Qidiruv</label>
                    <input 
                      type="text" 
                      placeholder="Nomi..."
                      value={localParams.search}
                      onChange={(e) => setLocalParams({...localParams, search: e.target.value})}
                      className="w-full px-6 py-4 lg:px-8 lg:py-6 bg-black/40 border border-white/5 rounded-[1.5rem] lg:rounded-[2rem] text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-3">
                       <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Dan</label>
                       <input 
                         type="date" 
                         value={localParams.startDate}
                         onChange={(e) => setLocalParams({...localParams, startDate: e.target.value})}
                         className="w-full px-4 py-4 lg:px-6 lg:py-5 bg-black/40 border border-white/5 rounded-[1.25rem] lg:rounded-[1.5rem] text-[10px] lg:text-xs font-bold text-white outline-none focus:border-indigo-500"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Gacha</label>
                       <input 
                         type="date" 
                         value={localParams.endDate}
                         onChange={(e) => setLocalParams({...localParams, endDate: e.target.value})}
                         className="w-full px-4 py-4 lg:px-6 lg:py-5 bg-black/40 border border-white/5 rounded-[1.25rem] lg:rounded-[1.5rem] text-[10px] lg:text-xs font-bold text-white outline-none focus:border-indigo-500"
                       />
                    </div>
                 </div>
              </div>
              <div className="pt-6 grid grid-cols-2 gap-4">
                 <button onClick={handleClear} className="py-5 bg-white/5 text-slate-500 rounded-[1.5rem] lg:rounded-[2rem] text-[9px] lg:text-[10px] font-black uppercase tracking-widest border border-white/5">Tozalash</button>
                 <button onClick={handleApply} className="py-5 bg-indigo-600 text-white rounded-[1.5rem] lg:rounded-[2rem] text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Tasdiqlash</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
