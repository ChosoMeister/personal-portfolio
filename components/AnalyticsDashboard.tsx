import React, { useState, useMemo, memo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Transaction, PortfolioSummary, AssetSummary } from '../types';
import { formatToman, formatPercent, formatNumber } from '../utils/formatting';

interface AnalyticsDashboardProps {
    transactions: Transaction[];
    portfolioSummary: PortfolioSummary;
    prices: any;
}

type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'ALL';

const timeRanges: { key: TimeRange; label: string }[] = [
    { key: '1W', label: '۱ هفته' },
    { key: '1M', label: '۱ ماه' },
    { key: '3M', label: '۳ ماه' },
    { key: '1Y', label: '۱ سال' },
    { key: 'ALL', label: 'همه' },
];

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

const AnalyticsDashboardComponent: React.FC<AnalyticsDashboardProps> = ({
    transactions,
    portfolioSummary,
    prices
}) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');
    const [sortColumn, setSortColumn] = useState<'date' | 'asset' | 'quantity'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Filter transactions by time range
    const filteredTransactions = useMemo(() => {
        if (!transactions.length) return [];

        const now = Date.now();
        const ranges: Record<TimeRange, number> = {
            '1W': 7 * 24 * 60 * 60 * 1000,
            '1M': 30 * 24 * 60 * 60 * 1000,
            '3M': 90 * 24 * 60 * 60 * 1000,
            '1Y': 365 * 24 * 60 * 60 * 1000,
            'ALL': Infinity
        };

        const cutoff = now - ranges[timeRange];
        return transactions.filter(tx => new Date(tx.buyDateTime).getTime() >= cutoff);
    }, [transactions, timeRange]);

    // Generate portfolio value chart data (simulated historical data)
    const chartData = useMemo(() => {
        if (!portfolioSummary.totalValueToman) return [];

        const points = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 12 : timeRange === '1Y' ? 12 : 24;
        const data = [];
        const baseValue = portfolioSummary.totalCostBasisToman || portfolioSummary.totalValueToman;
        const currentValue = portfolioSummary.totalValueToman;

        for (let i = points; i >= 0; i--) {
            const progress = (points - i) / points;
            const noise = (Math.random() - 0.5) * 0.1;
            const value = baseValue + (currentValue - baseValue) * progress * (1 + noise);

            const date = new Date();
            if (timeRange === '1W') date.setDate(date.getDate() - i);
            else if (timeRange === '1M') date.setDate(date.getDate() - i);
            else date.setMonth(date.getMonth() - i);

            data.push({
                date: date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
                value: Math.round(value),
            });
        }
        return data;
    }, [portfolioSummary, timeRange]);

    // Best and worst performing assets
    const { bestAsset, worstAsset, avgDailyProfit } = useMemo(() => {
        const assets = portfolioSummary.assets || [];
        if (!assets.length) {
            return { bestAsset: null, worstAsset: null, avgDailyProfit: 0 };
        }

        const sorted = [...assets].sort((a, b) => b.pnlPercent - a.pnlPercent);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        // Calculate average daily profit (rough estimate)
        const totalDays = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : 365;
        const avgDaily = portfolioSummary.totalPnlToman / totalDays;

        return { bestAsset: best, worstAsset: worst, avgDailyProfit: avgDaily };
    }, [portfolioSummary, timeRange]);

    // Tree map data for asset distribution
    const treeMapData = useMemo(() => {
        return portfolioSummary.assets.map((asset, idx) => ({
            name: asset.name,
            size: asset.currentValueToman,
            color: COLORS[idx % COLORS.length],
            percent: asset.allocationPercent
        }));
    }, [portfolioSummary.assets]);

    // Sort transactions for table
    const sortedRecentTransactions = useMemo(() => {
        const sorted = [...filteredTransactions].sort((a, b) => {
            if (sortColumn === 'date') {
                return sortDirection === 'desc'
                    ? new Date(b.buyDateTime).getTime() - new Date(a.buyDateTime).getTime()
                    : new Date(a.buyDateTime).getTime() - new Date(b.buyDateTime).getTime();
            }
            if (sortColumn === 'asset') {
                return sortDirection === 'desc'
                    ? b.assetSymbol.localeCompare(a.assetSymbol)
                    : a.assetSymbol.localeCompare(b.assetSymbol);
            }
            return sortDirection === 'desc'
                ? b.quantity - a.quantity
                : a.quantity - b.quantity;
        });
        return sorted.slice(0, 10);
    }, [filteredTransactions, sortColumn, sortDirection]);

    const handleSort = (column: typeof sortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const isProfit = portfolioSummary.totalPnlToman >= 0;

    return (
        <div className="space-y-6 pb-32">
            {/* Time Range Filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {timeRanges.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTimeRange(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${timeRange === key
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-[var(--muted-surface)] text-[var(--text-muted)] hover:bg-[var(--pill-bg)]'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Portfolio Value Chart */}
            <div className="glass-strong rounded-3xl p-5">
                <h3 className="text-sm font-black text-[var(--text-muted)] mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    تغییرات ارزش پرتفوی
                </h3>
                {chartData.length > 0 ? (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                    interval="preserveStartEnd"
                                    tickMargin={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                    width={45}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)'
                                    }}
                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                                    itemStyle={{ color: 'var(--text-muted)' }}
                                    formatter={(value: number) => [formatToman(value) + ' ت', 'ارزش']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isProfit ? "#10b981" : "#ef4444"}
                                    strokeWidth={2}
                                    dot={false}
                                    fill="url(#colorValue)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm">
                        داده‌ای برای نمایش وجود ندارد
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Best Asset */}
                <div className="glass-strong rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <ArrowUpRight size={16} className="text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)]">بهترین دارایی</span>
                    </div>
                    {bestAsset ? (
                        <>
                            <p className="text-lg font-black text-[var(--text-primary)]">{bestAsset.name}</p>
                            <p className="text-sm font-bold text-emerald-500">
                                {formatPercent(bestAsset.pnlPercent)}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-[var(--text-muted)]">بدون داده</p>
                    )}
                </div>

                {/* Worst Asset */}
                <div className="glass-strong rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <ArrowDownRight size={16} className="text-rose-500" />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)]">بدترین دارایی</span>
                    </div>
                    {worstAsset ? (
                        <>
                            <p className="text-lg font-black text-[var(--text-primary)]">{worstAsset.name}</p>
                            <p className="text-sm font-bold text-rose-500">
                                {formatPercent(worstAsset.pnlPercent)}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-[var(--text-muted)]">بدون داده</p>
                    )}
                </div>

                {/* Avg Daily Profit */}
                <div className="glass-strong rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Clock size={16} className="text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)]">میانگین سود روزانه</span>
                    </div>
                    <p className={`text-lg font-black ${avgDailyProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatToman(Math.abs(avgDailyProfit))}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">تومان</p>
                </div>
            </div>

            {/* Asset Distribution */}
            <div className="glass-strong rounded-3xl p-5">
                <h3 className="text-sm font-black text-[var(--text-muted)] mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-500" />
                    توزیع دارایی‌ها
                </h3>
                {portfolioSummary.assets.length > 0 ? (
                    <div className="flex items-center">
                        <div className="w-1/2 h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={portfolioSummary.assets.slice(0, 8)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="allocationPercent"
                                        stroke="none"
                                        animationBegin={0}
                                        animationDuration={1000}
                                        animationEasing="ease-out"
                                    >
                                        {portfolioSummary.assets.slice(0, 8).map((_, idx) => (
                                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: 'var(--text-primary)'
                                        }}
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value.toFixed(1)}%`,
                                            props.payload.name
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-2 pr-4">
                            {portfolioSummary.assets.slice(0, 6).map((asset, index) => (
                                <div key={index} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-[var(--text-primary)] font-bold truncate max-w-[100px]">{asset.name}</span>
                                    </div>
                                    <span className="font-black text-[var(--text-muted)]" dir="ltr">{Math.round(asset.allocationPercent)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-[var(--text-muted)] text-sm">
                        دارایی‌ای ثبت نشده است
                    </div>
                )}
            </div>

            {/* Recent Transactions Table */}
            <div className="glass-strong rounded-3xl p-5 overflow-hidden">
                <h3 className="text-sm font-black text-[var(--text-muted)] mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-amber-500" />
                    تراکنش‌های اخیر
                </h3>
                {sortedRecentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border-color)]">
                                    <th
                                        className="text-right py-3 px-2 font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                                        onClick={() => handleSort('date')}
                                    >
                                        تاریخ {sortColumn === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="text-right py-3 px-2 font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                                        onClick={() => handleSort('asset')}
                                    >
                                        دارایی {sortColumn === 'asset' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="text-right py-3 px-2 font-bold text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                                        onClick={() => handleSort('quantity')}
                                    >
                                        مقدار {sortColumn === 'quantity' && (sortDirection === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="text-right py-3 px-2 font-bold text-[var(--text-muted)]">
                                        قیمت واحد
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecentTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-[var(--border-color)]/50 hover:bg-[var(--muted-surface)]/50">
                                        <td className="py-3 px-2 text-xs">
                                            {new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}
                                        </td>
                                        <td className="py-3 px-2 font-bold">{tx.assetSymbol}</td>
                                        <td className="py-3 px-2">{formatNumber(tx.quantity)}</td>
                                        <td className="py-3 px-2">
                                            {formatToman(tx.buyPricePerUnit)}
                                            <span className="text-[10px] text-[var(--text-muted)] mr-1">
                                                {tx.buyCurrency === 'USD' ? '$' : 'ت'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-[var(--text-muted)] text-sm">
                        تراکنشی در این بازه زمانی وجود ندارد
                    </div>
                )}
            </div>
        </div>
    );
};

export const AnalyticsDashboard = memo(AnalyticsDashboardComponent);
