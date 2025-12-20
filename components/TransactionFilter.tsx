
import React, { useState, memo } from 'react';
import { Filter, X, ChevronDown, Calendar } from 'lucide-react';
import { AssetType } from '../types';

export interface TransactionFilters {
    assetType: AssetType | 'ALL';
    dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
    searchQuery: string;
}

interface TransactionFilterProps {
    filters: TransactionFilters;
    onFiltersChange: (filters: TransactionFilters) => void;
}

const assetTypeOptions: { value: AssetType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'همه' },
    { value: 'CRYPTO', label: 'رمزارز' },
    { value: 'FIAT', label: 'ارز' },
    { value: 'GOLD', label: 'طلا' },
];

const dateRangeOptions: { value: TransactionFilters['dateRange']; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'week', label: 'هفته اخیر' },
    { value: 'month', label: 'ماه اخیر' },
    { value: 'quarter', label: '۳ ماه اخیر' },
    { value: 'year', label: 'سال اخیر' },
];

const TransactionFilterComponent: React.FC<TransactionFilterProps> = ({ filters, onFiltersChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters = filters.assetType !== 'ALL' || filters.dateRange !== 'all';

    const clearFilters = () => {
        onFiltersChange({
            assetType: 'ALL',
            dateRange: 'all',
            searchQuery: filters.searchQuery,
        });
    };

    return (
        <div className="space-y-3">
            {/* Search & Toggle */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={filters.searchQuery}
                    onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                    className="flex-1 bg-[color:var(--muted-surface)] rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none border border-[color:var(--border-color)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)]"
                />
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-3 rounded-2xl border transition-all ${hasActiveFilters
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-[color:var(--muted-surface)] border-[color:var(--border-color)] text-[color:var(--text-muted)]'
                        }`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filter Panel */}
            {isExpanded && (
                <div className="bg-[color:var(--muted-surface)] rounded-2xl p-4 border border-[color:var(--border-color)] space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Asset Type Filter */}
                    <div>
                        <label className="text-[10px] font-black text-[color:var(--text-muted)] uppercase tracking-wider mb-2 block">
                            نوع دارایی
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {assetTypeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => onFiltersChange({ ...filters, assetType: option.value })}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filters.assetType === option.value
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-[color:var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)] hover:border-blue-500/50'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="text-[10px] font-black text-[color:var(--text-muted)] uppercase tracking-wider mb-2 block flex items-center gap-1">
                            <Calendar size={12} />
                            بازه زمانی
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {dateRangeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => onFiltersChange({ ...filters, dateRange: option.value })}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filters.dateRange === option.value
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-[color:var(--card-bg)] text-[color:var(--text-muted)] border border-[color:var(--border-color)] hover:border-blue-500/50'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={14} />
                            پاک کردن فیلترها
                        </button>
                    )}
                </div>
            )}

            {/* Active Filters Display (when collapsed) */}
            {!isExpanded && hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.assetType !== 'ALL' && (
                        <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                            {assetTypeOptions.find(o => o.value === filters.assetType)?.label}
                            <button onClick={() => onFiltersChange({ ...filters, assetType: 'ALL' })}>
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.dateRange !== 'all' && (
                        <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                            {dateRangeOptions.find(o => o.value === filters.dateRange)?.label}
                            <button onClick={() => onFiltersChange({ ...filters, dateRange: 'all' })}>
                                <X size={12} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export const TransactionFilter = memo(TransactionFilterComponent);

// Helper function to filter transactions
export const filterTransactions = <T extends { assetSymbol: string; buyDateTime: string }>(
    transactions: T[],
    filters: TransactionFilters,
    getAssetType: (symbol: string) => string
): T[] => {
    return transactions.filter((tx) => {
        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            if (!tx.assetSymbol.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Asset type filter
        if (filters.assetType !== 'ALL') {
            const type = getAssetType(tx.assetSymbol);
            if (type !== filters.assetType) {
                return false;
            }
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const txDate = new Date(tx.buyDateTime);
            const now = new Date();
            let startDate: Date;

            switch (filters.dateRange) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'quarter':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    return true;
            }

            if (txDate < startDate) {
                return false;
            }
        }

        return true;
    });
};
