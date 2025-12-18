
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
  const storedPass = getStoredPassword();
  if (currentPass !== storedPass) {
    return { success: false, message: 'رمز عبور فعلی اشتباه است' };
  }
  if (newPass.length < 6) {
    return { success: false, message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' };
  }
  localStorage.setItem(PASS_KEY, newPass);
  return { success: true, message: 'رمز عبور با موفقیت تغییر کرد' };
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};
