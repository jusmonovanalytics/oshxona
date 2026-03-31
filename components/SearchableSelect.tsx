
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
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
          {label}
        </label>
      )}
      
      {/* Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-xs font-bold text-white flex justify-between items-center cursor-pointer transition-all ${
          isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-white/5 hover:border-white/10'
        }`}
      >
        <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`text-indigo-500 text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>
 
      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-2 z-[110] bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[300px]">
            
            <div className="p-2 border-b border-white/5 bg-white/5">
               <input 
                 autoFocus
                 type="text" 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Qidiruv..."
                 className="w-full px-4 py-2 bg-black/40 border border-white/5 rounded-lg text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all"
               />
            </div>
 
            <div className="flex-grow overflow-y-auto p-1 custom-scrollbar">
               <div className="space-y-0.5">
                  {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      className={`px-4 py-2.5 rounded-lg transition-all cursor-pointer flex justify-between items-center group ${
                        value === opt.id 
                          ? 'bg-indigo-600 text-white' 
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                       <div className="flex flex-col">
                          <span className="text-xs font-bold">{opt.label}</span>
                          {opt.subLabel && <span className={`text-[9px] font-medium ${value === opt.id ? 'text-indigo-200' : 'text-slate-500'}`}>{opt.subLabel}</span>}
                       </div>
                       {value === opt.id && <span className="text-[10px]">✓</span>}
                    </div>
                  )) : (
                    <div className="py-8 text-center opacity-40">
                       <p className="text-[10px] font-bold uppercase tracking-wider">Topilmadi</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
