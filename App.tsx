import React, { useEffect, useState, useMemo, Suspense, lazy, useCallback } from 'react';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './components/LoginPage';
import { Transaction, PriceData, PortfolioSummary, AssetSummary, getAssetDetail } from './types';
import { API } from './services/api';
import * as PriceService from './services/priceService';
import * as AuthService from './services/authService';
import { useToast } from './components/Toast';
import { TransactionFilters } from './components/TransactionFilter';
import { useHaptics } from './hooks/useHaptics';

// Imported Tabs
import { OverviewTab } from './components/tabs/OverviewTab';
import { HoldingsTab } from './components/tabs/HoldingsTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';

// Lazy Load Heavy Components
const TransactionModal = lazy(() => import('./components/TransactionModal').then(module => ({ default: module.TransactionModal })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const SettingsDrawer = lazy(() => import('./components/SettingsDrawer').then(module => ({ default: module.SettingsDrawer })));

export default function App() {
  type SessionUser = { username: string; isAdmin: boolean; displayName?: string };
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [tab, setTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<{ title: string, uri: string }[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [txFilters, setTxFilters] = useState<TransactionFilters>({
    assetType: 'ALL',
    dateRange: 'all',
    searchQuery: '',
  });

  const { haptic } = useHaptics();
  const { addToast } = useToast();

  const [displayName, setDisplayName] = useState('');

  type ThemeOption = 'light' | 'dark' | 'system' | 'amoled' | 'sunset' | 'ocean' | 'forest';
  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme') as ThemeOption | null;
    return stored || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'amoled' | 'sunset' | 'ocean' | 'forest'>('light');

  const fallbackSources = useMemo(() => [
    { title: 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
    { title: 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
  ], []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setSessionChecked(true);
      return;
    }
    try {
      const stored = localStorage.getItem(AuthService.SESSION_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.username && typeof parsed.isAdmin === 'boolean') {
          setUser(parsed);
        } else {
          localStorage.removeItem(AuthService.SESSION_USER_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore session', error);
      localStorage.removeItem(AuthService.SESSION_USER_KEY);
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const allThemeClasses = ['dark', 'amoled', 'sunset', 'ocean', 'forest'];

    const applyTheme = () => {
      let nextTheme: typeof resolvedTheme;
      if (theme === 'system') {
        nextTheme = mediaQuery.matches ? 'dark' : 'light';
      } else if (theme === 'light') {
        nextTheme = 'light';
      } else {
        nextTheme = theme;
      }
      setResolvedTheme(nextTheme);

      // Remove all theme classes first
      allThemeClasses.forEach(cls => document.body.classList.remove(cls));

      // Add appropriate class for non-light themes
      if (nextTheme !== 'light') {
        document.body.classList.add(nextTheme);
      }

      localStorage.setItem('theme', theme);
    };

    applyTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setDisplayName('');
      return;
    }

    const storedName = localStorage.getItem(`displayName:${user.username}`);
    if (storedName) {
      setDisplayName(storedName);
    } else if (user.displayName) {
      setDisplayName(user.displayName);
      localStorage.setItem(`displayName:${user.username}`, user.displayName);
    } else {
      setDisplayName(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [txs, p] = await Promise.all([
            API.getTransactions(user.username),
            PriceService.fetchPrices()
          ]);
          setTransactions(txs);
          setPrices(p);
        } catch (error) {
          console.error("Failed to load data", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  const handlePriceUpdate = useCallback(async () => {
    setIsPriceUpdating(true);
    try {
      const result = await PriceService.fetchLivePrices();
      setPrices(result.data);
      const nextSources = result.sources.length ? result.sources : fallbackSources;
      setSources(nextSources);
      if (result.skipped) {
        const nextTime = result.nextAllowedAt ? new Date(result.nextAllowedAt).toLocaleTimeString('fa-IR') : '';
        addToast(result.message || (nextTime ? `بروزرسانی بعد از ${nextTime}` : 'بروزرسانی کمتر از یک ساعت مجاز نیست'), 'info');
      } else {
        addToast('قیمت‌ها با موفقیت بروزرسانی شد', 'success');
      }
    } catch (error) {
      console.error('Price update failed:', error);
      addToast('خطا در بروزرسانی قیمت‌ها', 'error');
    } finally {
      setIsPriceUpdating(false);
    }
  }, [fallbackSources, addToast]);

  const handleDisplayNameChange = useCallback((name: string) => {
    setDisplayName(name);
    if (user) {
      localStorage.setItem(`displayName:${user.username}`, name);
    }
  }, [user]);

  const handleSaveTransaction = useCallback(async (t: Transaction) => {
    if (!user) return;
    const txToSave = t.id ? t : { ...t, id: Math.random().toString(36).substr(2, 9) };
    await API.saveTransaction(user.username, txToSave as Transaction);
    const updated = await API.getTransactions(user.username);
    setTransactions(updated);
  }, [user]);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    await API.deleteTransaction(user.username, id);
    const updated = await API.getTransactions(user.username);
    setTransactions(updated);
  }, [user]);

  // Optimized Portfolio Summary Calculation
  const portfolioSummary: PortfolioSummary = useMemo(() => {
    if (!prices || transactions.length === 0) return {
      totalValueToman: 0, totalCostBasisToman: 0, totalPnlToman: 0, totalPnlPercent: 0, assets: []
    };

    const currentPriceMap: Record<string, number> = {
      GOLD18: prices.gold18ToToman,
      ...prices.fiatPricesToman,
      ...prices.cryptoPricesToman,
      ...prices.goldPricesToman,
    };

    const assetsMap: Record<string, AssetSummary> = {};

    transactions.forEach(tx => {
      const { assetSymbol, quantity, buyPricePerUnit, buyCurrency, feesToman } = tx;
      if (!assetsMap[assetSymbol]) {
        const details = getAssetDetail(assetSymbol);
        assetsMap[assetSymbol] = {
          symbol: assetSymbol,
          name: details.name,
          type: details.type,
          totalQuantity: 0,
          currentPriceToman: currentPriceMap[assetSymbol] || 0,
          currentValueToman: 0, costBasisToman: 0, pnlToman: 0, pnlPercent: 0, allocationPercent: 0,
        };
      }
      const asset = assetsMap[assetSymbol];
      asset.totalQuantity += quantity;

      // Calculate cost basis - Note: This relies on current USD price for USD purchases.
      // If historical accuracy is required, store historical exchange rate in transaction.
      let txCostToman = buyCurrency === 'TOMAN' ? (quantity * buyPricePerUnit) + feesToman : (quantity * buyPricePerUnit * prices.usdToToman) + feesToman;
      asset.costBasisToman += txCostToman;
    });

    let runningTotalValue = 0;
    let runningTotalCost = 0;

    const assets = Object.values(assetsMap).map(asset => {
      asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
      asset.pnlToman = asset.currentValueToman - asset.costBasisToman;
      asset.pnlPercent = asset.costBasisToman > 0 ? (asset.pnlToman / asset.costBasisToman) * 100 : 0;
      runningTotalValue += asset.currentValueToman;
      runningTotalCost += asset.costBasisToman;
      return asset;
    });

    assets.forEach(a => { a.allocationPercent = runningTotalValue > 0 ? (a.currentValueToman / runningTotalValue) * 100 : 0; });
    return {
      totalValueToman: runningTotalValue,
      totalCostBasisToman: runningTotalCost,
      totalPnlToman: runningTotalValue - runningTotalCost,
      totalPnlPercent: runningTotalCost > 0 ? ((runningTotalValue - runningTotalCost) / runningTotalCost) * 100 : 0,
      assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman)
    };
  }, [transactions, prices]);

  if (!sessionChecked) return null;
  if (!user) return <LoginPage onLoginSuccess={setUser} />;

  const handleLogout = () => {
    AuthService.logout();
    localStorage.removeItem(AuthService.SESSION_USER_KEY);
    setUser(null);
    setIsSettingsDrawerOpen(false);
    setIsAdminPanelOpen(false);
  };

  return (
    <Layout theme={resolvedTheme}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        {tab === 'overview' && (
          <OverviewTab
            displayName={displayName}
            username={user.username}
            userIsAdmin={user.isAdmin}
            loading={loading}
            isPriceUpdating={isPriceUpdating}
            portfolioSummary={portfolioSummary}
            prices={prices}
            sources={sources}
            resolvedTheme={resolvedTheme}
            onRefresh={handlePriceUpdate}
            onOpenSettings={() => setIsSettingsDrawerOpen(true)}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            haptic={haptic}
          />
        )}

        {tab === 'holdings' && (
          <HoldingsTab
            portfolioSummary={portfolioSummary}
            filters={txFilters}
            onSearchChange={(query) => setTxFilters(f => ({ ...f, searchQuery: query }))}
            onAssetClick={(symbol) => {
              haptic('light');
              setTab('transactions');
              setTxFilters(f => ({ ...f, searchQuery: symbol }));
            }}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsTxModalOpen(true);
            }}
            haptic={haptic}
          />
        )}

        {tab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            filters={txFilters}
            onFiltersChange={setTxFilters}
            onEditTransaction={setEditingTransaction}
            onOpenSettings={() => setIsSettingsDrawerOpen(true)}
            onLogout={handleLogout}
            haptic={haptic}
          />
        )}

        <BottomNav currentTab={tab} onTabChange={setTab} />

        <TransactionModal
          isOpen={isTxModalOpen}
          initialData={editingTransaction}
          onClose={() => setIsTxModalOpen(false)}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
        />
        <SettingsDrawer
          isOpen={isSettingsDrawerOpen}
          onClose={() => setIsSettingsDrawerOpen(false)}
          displayName={displayName || user.username}
          username={user.username}
          onDisplayNameChange={handleDisplayNameChange}
          theme={theme}
          onThemeChange={setTheme}
          onLogout={handleLogout}
        />
        {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      </Suspense>
    </Layout>
  );
}
