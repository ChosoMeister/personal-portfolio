
import React, { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioSummary } from '../types';
import { formatToman, formatPercent } from '../utils/formatting';

interface AllocationChartProps {
    summary: PortfolioSummary;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

const AllocationChartComponent: React.FC<AllocationChartProps> = ({ summary }) => {
    if (!summary || summary.assets.length === 0) return null;

    const data = summary.assets
        .filter(a => a.allocationPercent > 1) // Only show significant assets
        .map(a => ({
            name: a.name,
            value: a.currentValueToman,
            percent: a.allocationPercent,
            symbol: a.symbol
        }));

    // Group small assets into "Other"
    const smallAssets = summary.assets.filter(a => a.allocationPercent <= 1);
    if (smallAssets.length > 0) {
        const otherValue = smallAssets.reduce((sum, a) => sum + a.currentValueToman, 0);
        const otherPercent = smallAssets.reduce((sum, a) => sum + a.allocationPercent, 0);
        data.push({
            name: 'سایر موارد',
            value: otherValue,
            percent: otherPercent,
            symbol: 'OTH'
        });
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-xl text-right">
                    <p className="font-bold text-white text-xs mb-1">{d.name}</p>
                    <div className="flex items-center gap-2 justify-end" dir="ltr">
                        <span className="text-[10px] text-emerald-400 font-bold">{formatPercent(d.percent)}</span>
                        <span className="text-[10px] text-slate-400">|</span>
                        <span className="text-[10px] text-slate-300 font-bold">{formatToman(d.value)} ت</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-[32px] p-5 mb-4 shadow-sm">
            <h3 className="text-sm font-black text-[color:var(--text-primary)] mb-4">توزیع دارایی‌ها</h3>
            <div className="flex items-center">
                <div className="w-1/2 h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 pl-2 space-y-2">
                    {data.slice(0, 4).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-md shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[color:var(--text-muted)] font-bold truncate max-w-[80px]">{entry.name}</span>
                            </div>
                            <span className="font-black text-[color:var(--text-primary)]" dir="ltr">{Math.round(entry.percent)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Memoize to prevent unnecessary re-renders when chart data hasn't changed
export const AllocationChart = memo(AllocationChartComponent, (prevProps, nextProps) => {
    if (prevProps.summary.assets.length !== nextProps.summary.assets.length) return false;
    return prevProps.summary.assets.every((asset, i) =>
        asset.allocationPercent === nextProps.summary.assets[i]?.allocationPercent &&
        asset.currentValueToman === nextProps.summary.assets[i]?.currentValueToman
    );
});
