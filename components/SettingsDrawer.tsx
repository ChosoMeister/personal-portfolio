import React, { useEffect, useState } from 'react';
import { X, UserCircle, Palette, Moon, SunMedium, Laptop2, Lock, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import * as AuthService from '../services/authService';

export type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  theme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onLogout: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  displayName,
  onDisplayNameChange,
  theme,
  onThemeChange,
  onLogout,
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [nameValue, setNameValue] = useState(displayName);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });

  useEffect(() => {
    setNameValue(displayName);
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setStatus({ type: null, msg: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setStatus({ type: 'error', msg: 'تکرار رمز عبور مطابقت ندارد' });
      return;
    }

    const result = AuthService.changePassword(currentPass, newPass);
    if (result.success) {
      setStatus({ type: 'success', msg: result.message });
      setTimeout(() => {
        onClose();
        setStatus({ type: null, msg: '' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      }, 1200);
    } else {
      setStatus({ type: 'error', msg: result.message });
    }
  };

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    onDisplayNameChange(nameValue.trim() || displayName);
    setStatus({ type: 'success', msg: 'نام نمایشی ذخیره شد' });
  };

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-[var(--app-bg)] text-[color:var(--text-primary)] shadow-2xl rounded-l-[24px] sm:rounded-l-[32px] overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="h-full overflow-y-auto no-scrollbar">
          <div className="p-6 border-b border-[color:var(--border-color)] flex items-center justify-between sticky top-0 bg-[var(--app-bg)] z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UserCircle size={22} />
              </div>
              <div>
                <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">تنظیمات حساب</p>
                <h2 className="text-lg font-black">مدیریت پروفایل</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[color:var(--muted-surface)] transition-colors" aria-label="بستن تنظیمات">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            <form onSubmit={handleSaveDisplayName} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Palette size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">نام نمایشی</p>
                  <h3 className="text-base font-black">اطلاعات حساب</h3>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-[color:var(--text-muted)] px-1">نامی که در هدر نمایش داده می‌شود</label>
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="نام نمایشی"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  ذخیره نام
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Palette size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">گزینه‌های تم</p>
                  <h3 className="text-base font-black">تجربه بصری</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'light', label: 'روشن', icon: <SunMedium size={18} /> },
                  { key: 'dark', label: 'تاریک', icon: <Moon size={18} /> },
                  { key: 'system', label: 'سیستم', icon: <Laptop2 size={18} /> },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onThemeChange(option.key as ThemeOption)}
                    className={`flex items-center justify-between gap-3 border rounded-2xl px-4 py-3 text-right transition-all ${
                      theme === option.key
                        ? 'border-blue-500 bg-blue-50/70 text-blue-600 shadow-sm'
                        : 'border-[color:var(--border-color)] bg-[var(--muted-surface)] text-[color:var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-blue-500">
                        {option.icon}
                      </div>
                      <div>
                        <p className="text-sm font-black">{option.label}</p>
                        <p className="text-[10px] font-bold text-[color:var(--text-muted)]">هماهنگی با حالت {option.label}</p>
                      </div>
                    </div>
                    {theme === option.key && <CheckCircle2 size={18} className="text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-[color:var(--text-muted)] uppercase tracking-[0.18em]">تغییر گذرواژه</p>
                  <h3 className="text-base font-black">امنیت حساب</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[color:var(--text-muted)] px-1">گذرواژه فعلی</label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[color:var(--text-muted)] px-1">گذرواژه جدید</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="حداقل ۶ کاراکتر"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[color:var(--text-muted)] px-1">تأیید گذرواژه جدید</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[var(--muted-surface)] px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {status.type && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    status.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="text-xs font-bold">{status.msg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  به‌روزرسانی گذرواژه
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 border border-rose-200 bg-rose-50 text-rose-600 font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  خروج از حساب
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
