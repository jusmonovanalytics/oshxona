
import React, { useState } from 'react';
import { fetchData } from '../services/api';

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const xodimlar = await fetchData('xodimlar');
      const user = xodimlar.find((x: any) => 
        (x['telefon nomer']?.toString() === login || x['gmail']?.toLowerCase() === login.toLowerCase()) && 
        x['parol']?.toString() === password
      );

      if (user) {
        onLogin(user);
      } else {
        setError('Login yoki parol noto\'g\'ri!');
      }
    } catch (err) {
      setError('Server bilan ulanishda xatolik!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-[#020617] overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-md p-8 lg:p-12 glass-card rounded-[3rem] border border-white/10 shadow-3xl animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-600 rounded-[1.5rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-[0_0_40px_rgba(249,115,22,0.4)]">O</div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Oshxona <span className="text-orange-500">ERP</span></h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">Tizimga kirish</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Login (Telefon yoki Gmail)</label>
            <input 
              type="text" 
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="998901234567"
              required
              className="w-full px-8 py-5 bg-black/40 border border-white/5 rounded-[1.5rem] text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Parol</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-8 py-5 bg-black/40 border border-white/5 rounded-[1.5rem] text-white focus:border-indigo-500 outline-none transition-all shadow-inner"
            />
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 uppercase text-center animate-bounce">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">
            Xavfsiz ulanish (SSL-256)
          </p>
        </div>
      </div>
    </div>
  );
};
