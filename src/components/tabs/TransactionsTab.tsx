
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
            className="glass-panel mb-3 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--glass-border)] text-[var(--accent-primary)] flex items-center justify-center font-black text-[10px] border border-[var(--glass-border)]">
                    {tx.assetSymbol}
                </div>
                <div>
                    <div className="font-black text-sm text-[var(--text-primary)]">
                        {assetDetail.name}
                    </div>
                    <div className="text-[10px] font-bold mt-1 text-[var(--text-secondary)]" dir="ltr">
                        {new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}
                    </div>
                </div>
            </div>
            <div className="text-left font-black text-sm text-[var(--text-primary)]" dir="ltr">
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
        <div className="p-4 pb-20 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-[color:var(--text-primary)]">تاریخچه</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            haptic('medium');
                            onOpenSettings();
                        }}
                        className="p-2.5 rounded-xl bg-[var(--glass-border)]/10 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-border)]/20 transition-all active:scale-95"
                        aria-label="تنظیمات"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={() => {
                            haptic('success');
                            onEditTransaction(null);
                        }}
                        className="glass-fab p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
                        aria-label="افزودن تراکنش جدید"
                    >
                        <Plus size={20} className="text-[var(--accent-primary)]" strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => {
                            haptic('error');
                            onLogout();
                        }}
                        className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-all active:scale-95"
                    >
                        <LogOut size={20} />
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
