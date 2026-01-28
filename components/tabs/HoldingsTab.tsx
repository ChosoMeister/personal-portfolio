
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
        <div className="animate-in fade-in duration-300 pb-20">
            <div className="sticky top-0 bg-[color:var(--card-bg)]/80 backdrop-blur-md z-40 px-4 py-4 shadow-sm border-b border-[color:var(--border-color)]">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={filters.searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-[color:var(--muted-surface)] rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none border border-[color:var(--border-color)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)]"
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
                <div>
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
                    className="fixed bottom-24 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-transform active:scale-95"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export const HoldingsTab = memo(HoldingsTabComponent);
