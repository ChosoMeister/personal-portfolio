
import React, { memo } from 'react';
import { PortfolioSummary, Transaction } from '../../types';
import { AssetRow } from '../AssetRow';
import { EmptyState } from '../EmptyState';
import { TransactionFilters } from '../TransactionFilter';
import { Plus } from 'lucide-react';

interface HoldingsTabProps {
    portfolioSummary: PortfolioSummary;
    transactions: Transaction[];
    filters: TransactionFilters;
    onSearchChange: (query: string) => void;
    onAssetClick: (symbol: string) => void;
    onAddTransaction: () => void;
    haptic: (style: 'light') => void;
}

const HoldingsTabComponent: React.FC<HoldingsTabProps> = ({
    portfolioSummary,
    transactions,
    filters,
    onSearchChange,
    onAssetClick,
    onAddTransaction,
    haptic
}) => {
    const filteredAssets = portfolioSummary.assets.filter(
        (a) =>
            a.name.includes(filters.searchQuery) ||
            a.symbol.includes(filters.searchQuery.toUpperCase())
    );

    return (
        <div className="p-4 pb-20 animate-in fade-in duration-300">
            {/* Search Input */}
            <div className="sticky top-0 z-40 -mx-4 px-4 py-4 backdrop-blur-md bg-[var(--glass-surface)] border-b border-[var(--glass-border)]">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={filters.searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-[var(--glass-border)]/50 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:bg-[var(--glass-border)] transition-colors"
                />
            </div>
            {filteredAssets.length === 0 ? (
                <EmptyState
                    type="holdings"
                    title="هنوز دارایی‌ای ثبت نشده"
                    description="با افزودن اولین تراکنش، دارایی‌های شما اینجا نمایش داده می‌شود."
                    actionLabel="افزودن تراکنش"
                    onAction={onAddTransaction}
                />
            ) : (
                <div className="pt-4">
                    {filteredAssets.map((asset) => (
                        <AssetRow
                            key={asset.symbol}
                            asset={asset}
                            transactions={transactions.filter(t => t.assetSymbol === asset.symbol)}
                            onClick={() => {
                                haptic('light');
                                onAssetClick(asset.symbol);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Floating Action Button for adding transactions */}
            {filteredAssets.length > 0 && (
                <button
                    onClick={onAddTransaction}
                    className="glass-fab fixed bottom-32 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export const HoldingsTab = memo(HoldingsTabComponent);
