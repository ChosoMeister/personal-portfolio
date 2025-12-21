
import React, { useEffect, useState } from 'react';
import { API } from '../services/api';
import { Users, Trash2, Key, ShieldCheck, X, Clock, BarChart, AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [offline, setOffline] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadUsers = async () => {
    try {
      const { users: list, offline, message } = await API.getAllUsers();
      setUsers(list);
      setOffline(!!offline);
      setStatusMessage(message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleForceRefreshPrices = async () => {
    setRefreshingPrices(true);
    setRefreshResult(null);
    try {
      const result = await API.forceRefreshPrices();
      setRefreshResult({ success: true, message: result.message || 'قیمت‌ها با موفقیت بروزرسانی شدند' });
    } catch (error: any) {
      setRefreshResult({ success: false, message: error?.message || 'بروزرسانی ناموفق بود' });
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleDelete = async (username: string) => {
    if (confirm(`آیا از حذف کاربر ${username} اطمینان دارید؟ تمام داده‌های او پاک خواهد شد.`)) {
      try {
        await API.deleteUser(username);
        loadUsers();
      } catch (error: any) {
        alert(error?.message || 'حذف کاربر انجام نشد');
      }
    }
  };

  const handleChangePass = async (username: string) => {
    const newPass = prompt(`رمز عبور جدید برای ${username} را وارد کنید:`);
    if (newPass) {
      try {
        await API.updateUserPassword(username, newPass);
        alert('رمز عبور تغییر کرد');
      } catch (error: any) {
        alert(error?.message || 'تغییر رمز عبور انجام نشد');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col animate-in slide-in-from-left duration-300">
      <header className="bg-slate-900 border-b border-white/5 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg">پنل مدیریت سیستم</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Portfolio Panel Security</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleForceRefreshPrices}
            disabled={refreshingPrices}
            className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="بروزرسانی فورس قیمت‌ها (بدون محدودیت زمانی)"
          >
            <RefreshCw size={18} className={refreshingPrices ? 'animate-spin' : ''} />
            <span className="text-xs font-bold hidden sm:inline">فورس قیمت‌ها</span>
          </button>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {refreshResult && (
          <div className={`${refreshResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'} border text-[11px] font-bold py-3 px-4 rounded-xl flex items-center gap-3`}>
            {refreshResult.success ? <RefreshCw size={16} /> : <AlertTriangle size={16} />}
            <p>{refreshResult.message}</p>
          </div>
        )}

        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {statusMessage && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] font-bold py-3 px-4 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="shrink-0" />
                <div className="space-y-0.5">
                  <p>{statusMessage}</p>
                  {offline && <p className="text-amber-300/80 text-[10px]">حالت آفلاین فعال است؛ برای همگام‌سازی دوباره با سرور تلاش کنید.</p>}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {users.map(u => (
                <div key={u.username} className="bg-slate-900 border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:border-blue-600/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u.isAdmin ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm">{u.displayName || u.username}</span>
                        {u.isAdmin && <span className="bg-amber-500 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Admin</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">@{u.username}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                          <Clock size={12} />
                          <span>{new Date(u.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                          <BarChart size={12} />
                          <span>{u.txCount} تراکنش</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!u.isAdmin && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleChangePass(u.username)} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white hover:bg-slate-700 transition-all">
                        <Key size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.username)} className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="p-6 bg-slate-900 border-t border-white/5 text-center">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[3px]">Central Database Monitoring Enabled</p>
      </footer>
    </div>
  );
};
