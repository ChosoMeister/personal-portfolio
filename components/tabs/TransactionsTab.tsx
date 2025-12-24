
import React, { useMemo, memo } from 'react';
import { Settings, Plus, LogOut } from 'lucide-react';
import { Transaction } from '../../types';
import { TransactionFilter, TransactionFilters, filterTransactions } from '../TransactionFilter';
import { EmptyState } from '../EmptyState';
import { getAssetDetail } from '../../types';
import { formatNumber } from '../../utils/formatting';

interface TransactionsTabProps {
    transactions: Transaction[];
    filters: TransactionFilters;
    onFiltersChange: (filters: React.SetStateAction<TransactionFilters>) => void;
    onEditTransaction: (tx: Transaction | null) => void;
    onOpenSettings: () => void;
    onLogout: () => void;
    haptic: (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

const TransactionRow = memo(({ tx, onClick }: { tx: Transaction; onClick: () => void }) => {
    const assetDetail = getAssetDetail(tx.assetSymbol);
    return (
        <div
            onClick={onClick}
            className="bg-[var(--card-bg)] border border-[color:var(--border-color)] text-[color:var(--text-primary)] p-5 rounded-3xl flex justify-between items-center cursor-pointer hover:opacity-90 transition-opacity"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                    {tx.assetSymbol}
                </div>
                <div>
                    <div className="font-black text-sm text-[color:var(--text-primary)]">
                        {assetDetail.name}
                    </div>
                    <div className="text-[10px] font-bold mt-1 text-[color:var(--text-muted)]" dir="ltr">
                        {new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}
                    </div>
                </div>
            </div>
            <div className="text-left font-black text-sm text-[color:var(--text-primary)]" dir="ltr">
                {formatNumber(tx.quantity)}
            </div>
        </div>
    );
});

TransactionRow.displayName = 'TransactionRow';

const TransactionsTabComponent: React.FC<TransactionsTabProps> = ({
    transactions,
    filters,
    onFiltersChange,
    onEditTransaction,
    onOpenSettings,
    onLogout,
    haptic
}) => {
    // Memoize the filtering logic so it only runs when transactions or filters change
    const filteredTxs = useMemo(() => {
        return filterTransactions(
            [...transactions].reverse(),
            filters,
            (symbol) => getAssetDetail(symbol).type
        );
    }, [transactions, filters]);

    return (
        <div className="p-4 pb-24 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-[color:var(--text-primary)]">تاریخچه</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            haptic('medium');
                            onOpenSettings();
                        }}
                        className="p-2.5 rounded-xl border border-[color:var(--border-color)] bg-[color:var(--muted-surface)] text-[color:var(--text-muted)]"
                        aria-label="تنظیمات"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={() => {
                            haptic('success');
                            onEditTransaction(null);
                        }}
                        className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-white/10 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 transition-all"
                        aria-label="افزودن تراکنش جدید"
                    >
                        <Plus size={18} strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => {
                            haptic('error');
                            onLogout();
                        }}
                        className="p-2.5 bg-rose-50 rounded-xl text-rose-500"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Transaction Filters */}
            <div className="mb-4">
                <TransactionFilter filters={filters} onFiltersChange={onFiltersChange} />
            </div>

            {transactions.length === 0 ? (
                <EmptyState
                    type="transactions"
                    title="تراکنشی ثبت نشده"
                    description="با ثبت اولین خرید خود، تاریخچه تراکنش‌ها را اینجا مشاهده کنید."
                    actionLabel="ثبت تراکنش جدید"
                    onAction={() => {
                        onEditTransaction(null);
                    }}
                />
            ) : filteredTxs.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-[color:var(--text-muted)] font-bold">
                        تراکنشی با این فیلترها یافت نشد
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTxs.map((tx) => (
                        <TransactionRow
                            key={tx.id}
                            tx={tx}
                            onClick={() => {
                                haptic('light');
                                onEditTransaction(tx);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const TransactionsTab = memo(TransactionsTabComponent);
