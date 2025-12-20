
import React, { useState } from 'react';
import { X, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import * as AuthService from '../services/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, username = 'admin' }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setStatus({ type: 'error', msg: 'تکرار رمز عبور مطابقت ندارد' });
      return;
    }

    try {
      setSavingPassword(true);
      await AuthService.updatePassword(username, newPass);
      setStatus({ type: 'success', msg: 'رمز عبور با موفقیت بروزرسانی شد' });
      setTimeout(() => {
        onClose();
        setStatus({ type: null, msg: '' });
        setNewPass('');
        setConfirmPass('');
      }, 1500);
    } catch (error: any) {
      setStatus({ type: 'error', msg: error?.message || 'خطا در بروزرسانی رمز عبور' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-black text-gray-900">تنظیمات امنیتی</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">رمز عبور جدید</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" 
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="حداقل ۶ کاراکتر"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">تکرار رمز عبور جدید</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" 
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {status.type && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-xs font-bold">{status.msg}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={savingPassword}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingPassword ? 'در حال ذخیره...' : 'به‌روزرسانی رمز عبور'}
          </button>
        </form>
      </div>
    </div>
  );
};
