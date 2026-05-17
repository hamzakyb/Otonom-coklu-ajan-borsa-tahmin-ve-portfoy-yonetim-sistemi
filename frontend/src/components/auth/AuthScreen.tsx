'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Mail, Lock, Loader2, ArrowRightCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAppStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Lütfen e-posta ve şifre giriniz.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const data = await api.login({ email, password });
        setAuth(data.access_token, data.email);
      } else {
        await api.register({ email, password });
        // Auto login after register
        const data = await api.login({ email, password });
        setAuth(data.access_token, data.email);
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#020617] overflow-hidden selection:bg-indigo-500/30 font-sans antialiased p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay z-0"></div>
      <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] bg-indigo-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none z-0"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-700 items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-indigo-400/30 overflow-hidden mb-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            <Hexagon className="text-white w-10 h-10 relative z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent"></div>
          </motion.div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-400 tracking-tighter mb-2">
            OMNIQUANT
          </h1>
          <p className="text-sm tracking-[0.2em] text-indigo-400 font-bold uppercase">Prime Intelligence</p>
        </div>

        <div className="glass rounded-[2rem] p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <h2 className="text-2xl font-bold text-white mb-6 relative z-10">
            {isLogin ? 'Sisteme Giriş Yap' : 'Yeni Kayıt Oluştur'}
          </h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-sm relative z-10">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">E-posta</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="admin@omniquant.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Şifre</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? <ArrowRightCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? 'Lütfen Bekleyin...' : isLogin ? 'Terminali Aç' : 'Hesap Oluştur'}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10 border-t border-slate-800/80 pt-6">
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="ml-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
              >
                {isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
