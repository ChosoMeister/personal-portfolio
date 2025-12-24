
import React, { memo } from 'react';
import { PortfolioSummary } from '../../types';
import { AssetRow } from '../AssetRow';
import { EmptyState } from '../EmptyState';
import { TransactionFilters } from '../TransactionFilter';

interface HoldingsTabProps {
    portfolioSummary: PortfolioSummary;
    filters: TransactionFilters;
    onSearchChange: (query: string) => void;
    onAssetClick: (symbol: string) => void;
    onAddTransaction: () => void;
    haptic: (style: 'light') => void;
}

const HoldingsTabComponent: React.FC<HoldingsTabProps> = ({
    portfolioSummary,
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
                            onClick={() => {
                                haptic('light');
                                onAssetClick(asset.symbol);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const HoldingsTab = memo(HoldingsTabComponent);
