
import React, { useState, useMemo, useEffect } from 'react';

interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onSelect: (val: string | number) => void;
  placeholder: string;
  label?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onSelect, 
  placeholder, 
  label,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = useMemo(() => 
    options.find(o => o.id === value), 
    [options, value]
  );

  const filteredOptions = useMemo(() => 
    options.filter(o => 
      o.label.toLowerCase().includes(search.toLowerCase()) || 
      (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase()))
    ), 
    [options, search]
  );

  // Body scrollni muzlatish (modal ochiqligida)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onSelect(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3 mb-2 block">
          {label}
        </label>
      )}
      
      {/* Trigger Input-like Button */}
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-sm font-bold text-white flex justify-between items-center cursor-pointer hover:border-indigo-500/40 transition-all shadow-inner group"
      >
        <span className={selectedOption ? 'text-white italic' : 'text-slate-600'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2">
           {selectedOption && <span className="text-[10px] text-indigo-400 font-black uppercase opacity-50">{selectedOption.subLabel}</span>}
           <span className="text-indigo-500 text-[10px] group-hover:scale-110 transition-transform">▼</span>
        </div>
      </div>

      {/* Modern Compact Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col max-h-[85vh]">
            
            {/* Modal Header & Search */}
            <div className="p-6 border-b border-white/5 bg-white/5 space-y-4">
              <div className="flex justify-between items-center px-2">
                 <h4 className="text-sm font-black text-white uppercase tracking-widest italic">
                    {label || 'Tanlash'}
                 </h4>
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/20 transition-all"
                 >✕</button>
              </div>

              <div className="relative group">
                 <input 
                   autoFocus
                   type="text" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Tezkor qidiruv..."
                   className="w-full px-12 py-4 bg-black/60 border border-white/10 rounded-2xl text-md font-bold text-white outline-none focus:border-indigo-500 shadow-xl transition-all placeholder:text-slate-700"
                 />
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg opacity-20 group-focus-within:opacity-50 transition-opacity">🔍</span>
              </div>
            </div>

            {/* Compact Options List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
               <div className="space-y-1.5">
                  {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      className={`px-6 py-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group ${
                        value === opt.id 
                          ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                       <div className="flex flex-col">
                          <span className="text-sm font-black uppercase italic tracking-tight group-hover:translate-x-1 transition-transform">{opt.label}</span>
                          {opt.subLabel && <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${value === opt.id ? 'text-indigo-200' : 'text-slate-600'}`}>{opt.subLabel}</span>}
                       </div>
                       {value === opt.id && <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] text-indigo-600 font-black">✓</div>}
                    </div>
                  )) : (
                    <div className="py-16 text-center opacity-20">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em]">Natija topilmadi</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-3 bg-black/40 border-t border-white/5 flex justify-between items-center shrink-0">
               <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic">Smart Selection</span>
               <span className="text-[8px] font-black text-indigo-500/40 uppercase tracking-widest">{filteredOptions.length} ta mavjud</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
