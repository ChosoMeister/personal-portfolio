import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock the API module
vi.mock('../../../services/api', () => ({
    API: {
        getTransactions: vi.fn().mockResolvedValue([]),
    }
}));

// Mock the price service
vi.mock('../../../services/priceService', () => ({
    fetchPrices: vi.fn().mockResolvedValue({
        usdToToman: 50000,
        eurToToman: 55000,
        gold18ToToman: 4500000,
        fiatPricesToman: { USD: 50000, EUR: 55000 },
        cryptoPricesToman: { BTC: 2500000000, ETH: 150000000 },
        goldPricesToman: { GOLD18: 4500000 },
        fetchedAt: Date.now()
    }),
    fetchLivePrices: vi.fn().mockResolvedValue({
        data: { usdToToman: 50000 },
        sources: [],
        skipped: false
    })
}));

// Import after mocks
import { usePortfolio } from '../../../hooks/usePortfolio';

describe('usePortfolio Hook', () => {
    const mockUser = {
        username: 'testuser',
        isAdmin: false,
        displayName: 'Test User'
    };

    it('should return initial loading state', () => {
        const { result } = renderHook(() => usePortfolio({ user: mockUser }));

        expect(result.current.loading).toBe(true);
        expect(result.current.transactions).toEqual([]);
    });

    it('should return empty portfolio when no user', () => {
        const { result } = renderHook(() => usePortfolio({ user: null }));

        expect(result.current.loading).toBe(false);
        expect(result.current.portfolioSummary.totalValueToman).toBe(0);
        expect(result.current.portfolioSummary.assets).toEqual([]);
    });

    it('should calculate empty portfolio summary correctly', async () => {
        const { result } = renderHook(() => usePortfolio({ user: mockUser }));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.portfolioSummary.totalValueToman).toBe(0);
        expect(result.current.portfolioSummary.totalCostBasisToman).toBe(0);
        expect(result.current.portfolioSummary.totalPnlToman).toBe(0);
        expect(result.current.portfolioSummary.totalPnlPercent).toBe(0);
    });

    it('should provide refresh function', async () => {
        const { result } = renderHook(() => usePortfolio({ user: mockUser }));

        expect(typeof result.current.refreshPrices).toBe('function');
    });

    it('should provide transaction functions', async () => {
        const { result } = renderHook(() => usePortfolio({ user: mockUser }));

        expect(typeof result.current.saveTransaction).toBe('function');
        expect(typeof result.current.deleteTransaction).toBe('function');
    });
});

describe('Portfolio Summary Calculation', () => {
    it('should correctly calculate portfolio with mocked transactions', () => {
        // Test the portfolio calculation logic
        const transactions = [
            {
                id: '1',
                assetSymbol: 'BTC',
                quantity: 0.5,
                buyDateTime: '2024-01-01',
                buyPricePerUnit: 40000,
                buyCurrency: 'USD',
                feesToman: 100000
            }
        ];

        const prices = {
            usdToToman: 50000,
            fiatPricesToman: {},
            cryptoPricesToman: { BTC: 2500000000 }, // 50,000 USD * 50,000 = 2.5B Toman
            goldPricesToman: {}
        };

        // Mock calculation (mimicking usePortfolio logic)
        const currentPriceMap: Record<string, number> = {};
        Object.entries(prices.cryptoPricesToman).forEach(([symbol, price]) => {
            currentPriceMap[symbol] = price;
        });

        let totalValue = 0;
        let totalCost = 0;

        transactions.forEach(tx => {
            const currentPrice = currentPriceMap[tx.assetSymbol] || 0;
            const currentValue = tx.quantity * currentPrice;
            const costToman = tx.buyCurrency === 'USD'
                ? (tx.quantity * tx.buyPricePerUnit * prices.usdToToman) + tx.feesToman
                : (tx.quantity * tx.buyPricePerUnit) + tx.feesToman;

            totalValue += currentValue;
            totalCost += costToman;
        });

        expect(totalValue).toBe(1250000000); // 0.5 * 2.5B
        expect(totalCost).toBe(1000100000); // 0.5 * 40000 * 50000 + 100000
    });
});
