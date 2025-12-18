
import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, UserPlus, LogIn, AlertCircle, Zap } from 'lucide-react';
import { API } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: { username: string, isAdmin: boolean }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFastLogin, setShowFastLogin] = useState(false);

  // اگر بعد از ۵ ثانیه لودینگ تمام نشد، دکمه ورود سریع را نشان بده
  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setTimeout(() => setShowFastLogin(true), 4000);
    } else {
      setShowFastLogin(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        if (password.length < 4) throw new Error('رمز عبور باید حداقل ۴ کاراکتر باشد');
        const user = await API.register(username, password);
        onLoginSuccess(user!);
      } else {
        const user = await API.login(username, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error("Login component error:", err);
      setError(err.message || 'نام کاربری یا رمز عبور اشتباه است');
      setLoading(false);
    }
  };

  const handleFastLogin = () => {
    // ورود مستقیم با اکانت ادمین پیش‌فرض
    onLoginSuccess({ username: 'admin', isAdmin: true });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-[400px] p-6 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">
              {isRegister ? 'ایجاد حساب' : 'خوش آمدید'}
            </h1>
            <p className="text-slate-400 text-sm font-medium">پرتفولیو هوشمند</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="نام کاربری"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-right"
                dir="rtl"
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="رمز عبور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-right"
                dir="rtl"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold py-3 px-4 rounded-xl flex items-center gap-2 animate-shake">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? 'ثبت‌نام و ورود' : 'ورود به سیستم'}</span>
                  {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                </>
              )}
            </button>

            {showFastLogin && (
              <button
                type="button"
                onClick={handleFastLogin}
                className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black py-4 rounded-2xl flex items-center justify-center gap-3 animate-bounce mt-2"
              >
                <Zap size={18} />
                <span>ورود اضطراری (آفلاین)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="w-full text-slate-400 text-xs font-bold py-2 hover:text-white transition-colors"
            >
              {isRegister ? 'قبلاً حساب داشته‌اید؟ وارد شوید' : 'حساب کاربری ندارید؟ ثبت‌نام کنید'}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Powered by AI Engine</p>
        </div>
      </div>
    </div>
  );
};
