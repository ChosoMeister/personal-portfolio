
import { API } from './api';

const AUTH_KEY = 'gemini_portfolio_auth';
const PASS_KEY = 'gemini_portfolio_password';
const INITIAL_PASS = 'password';

// اطمینان از اینکه رمز عبور اولیه در حافظه ست شده است
const getStoredPassword = (): string => {
  const stored = localStorage.getItem(PASS_KEY);
  if (!stored) {
    localStorage.setItem(PASS_KEY, INITIAL_PASS);
    return INITIAL_PASS;
  }
  return stored;
};

export const login = (username: string, pass: string): boolean => {
  const currentPass = getStoredPassword();
  if (username === 'admin' && pass === currentPass) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
};

export const changePassword = (currentPass: string, newPass: string): { success: boolean, message: string } => {
  // حفظ سازگاری: عبور از چک رمز قبلی و اتکا به تابع جدید
  if (newPass.length < 6) {
    return { success: false, message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' };
  }
  localStorage.setItem(PASS_KEY, newPass);
  return { success: true, message: 'رمز عبور با موفقیت تغییر کرد' };
};

export const updatePassword = async (username: string, newPass: string) => {
  if (newPass.length < 6) {
    throw new Error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');
  }
  try {
    await API.updateUserPassword(username, newPass);
    localStorage.setItem(PASS_KEY, newPass);
    return { success: true, message: 'رمز عبور با موفقیت تغییر کرد' };
  } catch (error: any) {
    console.error('Password update failed:', error);
    throw new Error(error?.message || 'خطا در بروزرسانی رمز عبور');
  }
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};
