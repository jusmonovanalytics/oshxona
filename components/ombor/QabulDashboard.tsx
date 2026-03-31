
import React from 'react';

interface QabulDashboardProps {
  onSelectProductKirim: () => void;
  onSelectTovarKirim: () => void;
}

export const QabulDashboard: React.FC<QabulDashboardProps> = ({ onSelectProductKirim, onSelectTovarKirim }) => {
  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Kirim */}
        <button 
          onClick={onSelectProductKirim}
          className="glass-card flex items-center gap-8 p-10 rounded-[3rem] hover:border-blue-500/50 hover:bg-slate-900/80 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-20 h-20 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-all">📦</div>
          <div className="text-left relative z-10">
            <h5 className="text-xl font-black text-white">Product Kirim</h5>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 group-hover:text-blue-400 transition-colors">Xom-ashyo va masalliqlar</p>
          </div>
        </button>

        {/* Tovar Kirim */}
        <button 
          onClick={onSelectTovarKirim}
          className="glass-card flex items-center gap-8 p-10 rounded-[3rem] hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="w-20 h-20 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">💎</div>
          <div className="text-left relative z-10">
            <h5 className="text-xl font-black text-white">Tovar Kirim</h5>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 group-hover:text-indigo-400 transition-colors">Tayyor mahsulotlar (Ovqatmas)</p>
          </div>
        </button>
      </div>

      <div className="p-10 bg-indigo-500/5 rounded-[3.5rem] border border-indigo-500/10 flex items-center gap-8 max-w-4xl group hover:border-indigo-500/30 transition-all duration-500">
         <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-3xl border border-slate-800 shadow-inner group-hover:rotate-12 transition-transform">
           <span className="text-indigo-400">ℹ️</span>
         </div>
         <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
           Qabul bo'limida qilingan barcha amallar real vaqt rejimida Google Sheets bazasiga yoziladi va <span className="text-indigo-400">"Monitoring"</span> bo'limidagi qoldiqlarga darhol ta'sir qiladi.
         </p>
      </div>
    </div>
  );
};
