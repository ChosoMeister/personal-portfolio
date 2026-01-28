
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, PriceData, PortfolioSummary, AssetSummary, getAssetDetail } from '../types';
import { API } from '../services/api';
import * as PriceService from '../services/priceService';

export interface SessionUser {
    username: string;
    isAdmin: boolean;
    displayName?: string;
}

interface UsePortfolioOptions {
    user: SessionUser | null;
    onPriceUpdateSuccess?: (message: string) => void;
    onPriceUpdateSkipped?: (message: string) => void;
    onPriceUpdateError?: (message: string) => void;
}

interface UsePortfolioReturn {
    transactions: Transaction[];
    prices: PriceData | null;
    loading: boolean;
    isPriceUpdating: boolean;
    portfolioSummary: PortfolioSummary;
    sources: { title: string; uri: string }[];
    refreshPrices: () => Promise<void>;
    saveTransaction: (t: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
}

const FALLBACK_SOURCES = [
    { title: 'قیمت ارز آلان‌چند', uri: 'https://alanchand.com/currencies-price' },
    { title: 'قیمت رمزارز آلان‌چند', uri: 'https://alanchand.com/crypto-price' },
];

/**
 * Hook for managing portfolio data, transactions, and prices
 */
export const usePortfolio = ({
    user,
    onPriceUpdateSuccess,
    onPriceUpdateSkipped,
    onPriceUpdateError,
}: UsePortfolioOptions): UsePortfolioReturn => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [prices, setPrices] = useState<PriceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPriceUpdating, setIsPriceUpdating] = useState(false);
    const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

    // Load initial data
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const [txs, p] = await Promise.all([
                    API.getTransactions(user.username),
                    PriceService.fetchPrices(),
                ]);
                setTransactions(txs);
                setPrices(p);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Refresh prices
    const refreshPrices = useCallback(async () => {
        setIsPriceUpdating(true);
        try {
            const result = await PriceService.fetchLivePrices();
            setPrices(result.data);
            setSources(result.sources.length ? result.sources : FALLBACK_SOURCES);

            if (result.skipped) {
                const nextTime = result.nextAllowedAt
                    ? new Date(result.nextAllowedAt).toLocaleTimeString('fa-IR')
                    : '';
                onPriceUpdateSkipped?.(
                    result.message || (nextTime ? `بروزرسانی بعد از ${nextTime}` : 'بروزرسانی کمتر از یک ساعت مجاز نیست')
                );
            } else {
                onPriceUpdateSuccess?.('قیمت‌ها با موفقیت بروزرسانی شد');
            }
        } catch (error) {
            console.error('Price update failed:', error);
            onPriceUpdateError?.('خطا در بروزرسانی قیمت‌ها');
        } finally {
            setIsPriceUpdating(false);
        }
    }, [onPriceUpdateSuccess, onPriceUpdateSkipped, onPriceUpdateError]);

    // Save transaction
    const saveTransaction = useCallback(async (t: Transaction) => {
        if (!user) return;
        const txToSave = t.id ? t : { ...t, id: Math.random().toString(36).substr(2, 9) };
        await API.saveTransaction(user.username, txToSave);
        const updated = await API.getTransactions(user.username);
        setTransactions(updated);
    }, [user]);

    // Delete transaction
    const deleteTransaction = useCallback(async (id: string) => {
        if (!user) return;
        await API.deleteTransaction(user.username, id);
        const updated = await API.getTransactions(user.username);
        setTransactions(updated);
    }, [user]);

    // Calculate portfolio summary
    const portfolioSummary: PortfolioSummary = useMemo(() => {
        if (!prices || transactions.length === 0) {
            return {
                totalValueToman: 0,
                totalCostBasisToman: 0,
                totalPnlToman: 0,
                totalPnlPercent: 0,
                assets: [],
            };
        }

        const currentPriceMap: Record<string, number> = {
            GOLD18: prices.gold18ToToman,
        };

        Object.entries(prices.fiatPricesToman || {}).forEach(([symbol, tomanPrice]) => {
            currentPriceMap[symbol] = tomanPrice;
        });

        Object.entries(prices.cryptoPricesToman || {}).forEach(([symbol, tomanPrice]) => {
            currentPriceMap[symbol] = tomanPrice;
        });

        Object.entries(prices.goldPricesToman || {}).forEach(([symbol, tomanPrice]) => {
            currentPriceMap[symbol] = tomanPrice;
        });

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
                    currentValueToman: 0,
                    costBasisToman: 0,
                    pnlToman: 0,
                    pnlPercent: 0,
                    allocationPercent: 0,
                };
            }
            const asset = assetsMap[assetSymbol];
            asset.totalQuantity += quantity;
            const txCostToman = buyCurrency === 'TOMAN'
                ? (quantity * buyPricePerUnit) + feesToman
                : (quantity * buyPricePerUnit * prices.usdToToman) + feesToman;
            asset.costBasisToman += txCostToman;
        });

        let runningTotalValue = 0;
        let runningTotalCost = 0;

        const assets = Object.values(assetsMap).map(asset => {
            asset.currentValueToman = asset.totalQuantity * asset.currentPriceToman;
            asset.pnlToman = asset.currentValueToman - asset.costBasisToman;
            asset.pnlPercent = asset.costBasisToman > 0
                ? (asset.pnlToman / asset.costBasisToman) * 100
                : 0;
            runningTotalValue += asset.currentValueToman;
            runningTotalCost += asset.costBasisToman;
            return asset;
        });

        assets.forEach(a => {
            a.allocationPercent = runningTotalValue > 0
                ? (a.currentValueToman / runningTotalValue) * 100
                : 0;
        });

        return {
            totalValueToman: runningTotalValue,
            totalCostBasisToman: runningTotalCost,
            totalPnlToman: runningTotalValue - runningTotalCost,
            totalPnlPercent: runningTotalCost > 0
                ? ((runningTotalValue - runningTotalCost) / runningTotalCost) * 100
                : 0,
            assets: assets.sort((a, b) => b.currentValueToman - a.currentValueToman),
        };
    }, [transactions, prices]);

    return {
        transactions,
        prices,
        loading,
        isPriceUpdating,
        portfolioSummary,
        sources,
        refreshPrices,
        saveTransaction,
        deleteTransaction,
    };
};

export default usePortfolio;
