import React, { useState, useMemo, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';
import { useTransactions } from '../hooks/useTransactions';
import { usePrices } from '../hooks/usePrices';
import { useHaptics } from '../hooks/useHaptics';
import { Transaction, PortfolioSummary, AssetSummary, getAssetDetail } from '../types';
import { Layout } from '../components/Layout';
import { BottomNav } from '../components/BottomNav';
import { OverviewTab } from '../components/tabs/OverviewTab';
import { HoldingsTab } from '../components/tabs/HoldingsTab';
import { TransactionsTab } from '../components/tabs/TransactionsTab';
import { TransactionModal } from '../components/TransactionModal';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { AdminPanel } from '../components/AdminPanel';
import { useToast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
    const { user, logout, updateDisplayName } = useAuth();
    const { transactions, saveTransaction, deleteTransaction } = useTransactions(user?.username);
    const { data: prices, refetch: refreshPrices, isFetching: isPriceUpdating } = usePrices();
    const { haptic } = useHaptics();
    const { addToast } = useToast();

    const [tab, setTab] = useState('overview'); // This could be managed by Router params later
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

    // Theme state is local (or context if we made one). Using existing logic assuming Layout handles it via props?
    // App.tsx passed `resolvedTheme`. We might need a ThemeContext too or keep it simple.
    // For now, let's keep theme logic locally or extract to ThemeContext. 
    // Given user asked for "Visual Overhaul", checks ThemeContext. 
    // I'll skip ThemeContext for this exact step to keep size manageable but ideally Layout should handle it.
    // I'll assume Layout matches App.tsx usage.

    // Need to verify Layout usage in App.tsx: 
    // <Layout theme={resolvedTheme}>...
    // So I need theme state here or in a context.
    // I will create a simple useTheme hook inline or re-use App.tsx logic.

    // ... (Theme logic copy-paste from App.tsx or Simplified)
    // Let's use a simplified approach: just pass 'dark' if system is dark?
    // Or better, let's create a ThemeContext in next step if needed. 
    // For now I will assume `resolvedTheme` is 'dark' (or dynamic). I'll add the hook logic.

    const [theme, setTheme] = useState<'light' | 'dark' | 'system' | 'amoled' | 'sunset' | 'ocean' | 'forest'>(() => (localStorage.getItem('theme') as any) || 'system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'amoled' | 'sunset' | 'ocean' | 'forest'>('light');

    React.useEffect(() => {
        const applyTheme = () => {
            let activeTheme = theme;
            if (theme === 'system') {
                activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            setResolvedTheme(activeTheme as any);

            // Apply to body
            document.body.setAttribute('data-theme', activeTheme);

            // Handle dark mode classes for Tailwind
            const isDark = ['dark', 'amoled', 'sunset', 'ocean', 'forest'].includes(activeTheme);
            if (isDark) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        };
        applyTheme();
    }, [theme]);


    // Portfolio Summary Calculation (Memoized)
    const portfolioSummary: PortfolioSummary = useMemo(() => {
        if (!prices || !transactions || transactions.length === 0) return {
            totalValueToman: 0, totalCostBasisToman: 0, totalPnlToman: 0, totalPnlPercent: 0, assets: []
        };

        const currentPriceMap: Record<string, number> = {
            GOLD18: prices.gold18ToToman,
            ...prices.fiatPricesToman,
            ...prices.cryptoPricesToman,
            ...prices.goldPricesToman,
        };

        const assetsMap: Record<string, AssetSummary> = {};

        // Cast transactions to Transaction[]
        (transactions as Transaction[]).forEach(tx => {
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
            let txCostToman = buyCurrency === 'TOMAN' ? (quantity * buyPricePerUnit) + feesToman : (quantity * buyPricePerUnit * prices.usdToToman) + feesToman;
            asset.costBasisToman += txCostToman;
        });

        let runningTotalValue = 0;
        let runningTotalCost = 0;

        const assets = Object.values(assetsMap).map(asset => {
            // Calculate USD Price
            if (prices.usdToToman > 0 && asset.currentPriceToman > 0) {
                if (asset.type === 'CRYPTO' || asset.type === 'GOLD' || asset.type === 'FIAT') {
                    asset.currentPriceUsd = asset.currentPriceToman / prices.usdToToman;
                }
            }
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

    const handleSaveTx = async (tx: Transaction) => {
        await saveTransaction(tx);
        setIsTxModalOpen(false);
        addToast('تراکنش ذخیره شد', 'success');
    };

    const handleDeleteTx = async (id: string) => {
        await deleteTransaction(id);
        addToast('تراکنش حذف شد', 'info');
    };

    // Sources fallback
    const sources = [
        { title: 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
        { title: 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
    ];

    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    const handleManualRefresh = async () => {
        try {
            setIsManualRefreshing(true);
            await API.refreshLivePrices();
            await refreshPrices();
            addToast('قیمت‌ها بروزرسانی شد', 'success');
        } catch (error) {
            console.error(error);
            addToast('بروزرسانی قیمت‌ها ناموفق بود', 'error');
        } finally {
            setIsManualRefreshing(false);
        }
    };

    return (
        <Layout theme={resolvedTheme}>
            {tab === 'overview' && (
                <OverviewTab
                    displayName={user?.displayName || user?.username || ''}
                    username={user?.username || ''}
                    userIsAdmin={!!user?.isAdmin}
                    loading={!prices}
                    isPriceUpdating={isPriceUpdating || isManualRefreshing}
                    portfolioSummary={portfolioSummary}
                    prices={prices || { usdToToman: 0, eurToToman: 0, gold18ToToman: 0, fiatPricesToman: {}, cryptoPricesToman: {}, goldPricesToman: {}, fetchedAt: 0 }}
                    sources={sources}
                    resolvedTheme={resolvedTheme}
                    onRefresh={handleManualRefresh}
                    onOpenSettings={() => setIsSettingsDrawerOpen(true)}
                    onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
                    haptic={haptic}
                />
            )}
            {tab === 'holdings' && (
                <HoldingsTab
                    portfolioSummary={portfolioSummary}
                    transactions={transactions}
                    filters={{ assetType: 'ALL', dateRange: 'all', searchQuery: '' }}
                    onSearchChange={() => { }}
                    onAssetClick={() => haptic('light')}
                    onAddTransaction={() => { setEditingTransaction(null); setIsTxModalOpen(true); }}
                    haptic={haptic}
                />
            )}
            {tab === 'transactions' && (
                <TransactionsTab
                    transactions={transactions}
                    filters={{ assetType: 'ALL', dateRange: 'all', searchQuery: '' }}
                    onFiltersChange={() => { }}
                    onEditTransaction={(tx) => { setEditingTransaction(tx); setIsTxModalOpen(true); }}
                    onOpenSettings={() => setIsSettingsDrawerOpen(true)}
                    onLogout={logout}
                    haptic={haptic}
                />
            )}

            <BottomNav currentTab={tab} onTabChange={setTab} />

            <TransactionModal
                isOpen={isTxModalOpen}
                initialData={editingTransaction}
                onClose={() => setIsTxModalOpen(false)}
                onSave={handleSaveTx}
                onDelete={handleDeleteTx}
            />

            <SettingsDrawer
                isOpen={isSettingsDrawerOpen}
                onClose={() => setIsSettingsDrawerOpen(false)}
                displayName={user?.displayName || ''}
                username={user?.username || ''}
                onDisplayNameChange={updateDisplayName}
                theme={theme}
                onThemeChange={setTheme}
                onLogout={logout}
            />
            {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}

        </Layout>
    );
};
