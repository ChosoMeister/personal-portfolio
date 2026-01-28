
import React, { useEffect, useState, memo } from 'react';
import { AssetSummary, Transaction, getAssetDetail } from '../types';
import { formatToman, formatPercent, formatNumber, getAssetFallbackIcon, getAssetIconUrl } from '../utils/formatting';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

interface AssetRowProps {
  asset: AssetSummary;
  transactions?: Transaction[];
  onClick: () => void;
}

const AssetRowComponent: React.FC<AssetRowProps> = ({ asset, transactions = [], onClick }) => {
  const isProfit = asset.pnlToman >= 0;
  const [iconUrl, setIconUrl] = useState(getAssetIconUrl(asset.symbol));
  const [isExpanded, setIsExpanded] = useState(false);
  const mutedText = 'text-[color:var(--text-muted)]';

  useEffect(() => {
    setIconUrl(getAssetIconUrl(asset.symbol));
  }, [asset.symbol]);

  const handleRowClick = (e: React.MouseEvent) => {
    // If we have transactions, toggle expand on main click, unless valid click handler is needed for something else
    // But currently onClick prop does nothing in HoldingsTab except haptic.
    // Let's toggle expand.
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    onClick();
  };

  return (
    <div className="border-b border-[color:var(--border-color)]">
      <div
        onClick={handleRowClick}
        className="stagger-item hover-lift spring-smooth bg-[var(--card-bg)] text-[color:var(--text-primary)] p-5 flex items-center justify-between active:bg-[color:var(--muted-surface)] cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[color:var(--muted-surface)] p-1.5 border border-[color:var(--border-color)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <img
              src={iconUrl}
              alt={asset.symbol}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={() => setIconUrl(getAssetFallbackIcon(asset.symbol))}
            />
          </div>
          <div>
            <div className="font-black text-[color:var(--text-primary)] text-sm flex items-center gap-1.5">
              {getAssetDetail(asset.symbol).name}
              <span className="text-[10px] bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] px-1.5 py-0.5 rounded-md font-bold">{asset.symbol}</span>
            </div>
            <div className={`text-[11px] ${mutedText} mt-1 font-bold flex items-center gap-1`} dir="ltr">
              <span>{formatNumber(asset.totalQuantity, 3)}</span>
              <span className="opacity-60">{asset.type === 'GOLD' ? 'گرم' : asset.symbol}</span>
            </div>
            {/* نمایش قیمت لحظه‌ای واحد */}
            <div className="text-[10px] text-blue-600 mt-1 font-black flex flex-col gap-0.5 items-start">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
                <span>قیمت واحد:</span>
                <span dir="ltr">{formatToman(asset.currentPriceToman)} ت</span>
              </div>
              {asset.currentPriceUsd && (
                <div className="flex items-center gap-1 pl-2 opacity-80" dir="ltr">
                  <span>${formatNumber(asset.currentPriceUsd, 2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-left flex flex-col items-end">
          <div className="font-black text-[color:var(--text-primary)] text-sm">{formatToman(asset.currentValueToman)} ت</div>
          <div className={`text-[10px] flex items-center gap-1 mt-1.5 font-black px-2 py-1 rounded-lg ${isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`} dir="ltr">
            {isProfit ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{formatPercent(asset.pnlPercent)}</span>
          </div>
          <div className={`text-[9px] ${mutedText} mt-1 font-bold flex items-center gap-1`} dir="ltr">
            <span className="opacity-70">سود/ضرر:</span> {formatToman(asset.pnlToman)} ت
            {isExpanded ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
          </div>
        </div>
      </div>

      {/* Transaction History (Lots) */}
      {isExpanded && transactions.length > 0 && (
        <div className="bg-[color:var(--muted-surface)]/50 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="text-[10px] font-bold text-[color:var(--text-muted)] flex justify-between px-2">
            <span>تاریخ خرید</span>
            <span>سود/زیان این خرید (Lot)</span>
          </div>
          {transactions.map(tx => {
            const currentVal = tx.quantity * asset.currentPriceToman;
            // Cost is in Toman. If bought in USD, convert using TODAY's rate? 
            // NO, cost basis is historical. 
            // But App.tsx calculated costBasisToman for each transaction already.
            // Wait, App.tsx calculated it but aggregated it.
            // I need to recalculate here or use what I have.
            // tx has `buyPricePerUnit` and `buyCurrency`.
            // If I don't have historical USD rate, I can only use `feesToman`.
            // Actually `buyPricePerUnit` is the price AT TIME OF PURCHASE.
            // If currency is USD, `buyPricePerUnit` is in USD.
            // Cost Basis in Toman = (Quantity * PriceUSD * RateAtTime) + Fees.
            // BUT we don't store RateAtTime in Transaction!
            // App.tsx uses CURRENT USD rate for cost basis if it wasn't stored.
            // "This relies on current USD price for USD purchases." comment in App.tsx.
            // That's a flaw in App.tsx, but I should be consistent.
            // Or I can just calculate P&L based on Unit Price change if it's USD?
            // Let's stick to Toman P&L consistent with the total P&L.

            // Re-implement App.tsx logic here (simplified):
            // We need the USD rate to convert buyPrice if it was USD.
            // I don't have `prices` prop here.
            // However, I can deduce the cost basis per unit from `asset.costBasisToman / asset.totalQuantity` ON AVERAGE.
            // But user wants PER PURCHASE.
            // If I don't have the USD rate, I can't convert USD purchase to Toman correctly.
            // Assumption: asset.currentPriceUsd is available.
            // approx rate = asset.currentPriceToman / asset.currentPriceUsd
            const computedUsdRate = (asset.currentPriceUsd && asset.currentPriceUsd > 0)
              ? asset.currentPriceToman / asset.currentPriceUsd
              : 0;

            let costToman = 0;
            if (tx.buyCurrency === 'TOMAN') {
              costToman = (tx.quantity * tx.buyPricePerUnit) + (tx.feesToman || 0);
            } else {
              // Use computed rate or fallback
              const rate = computedUsdRate > 0 ? computedUsdRate : 60000; // fallback if data missing
              costToman = (tx.quantity * tx.buyPricePerUnit * rate) + (tx.feesToman || 0);
            }

            const pnl = currentVal - costToman;
            const pnlPct = costToman > 0 ? (pnl / costToman) * 100 : 0;
            const isTxProfit = pnl >= 0;

            return (
              <div key={tx.id} className="bg-[color:var(--card-bg)] rounded-xl p-3 flex justify-between items-center text-xs border border-[color:var(--border-color)]">
                <div>
                  <div className="font-bold text-[color:var(--text-primary)]">
                    {new Date(tx.buyDateTime).toLocaleDateString('fa-IR')}
                  </div>
                  <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                    {formatNumber(tx.quantity)} @ {formatNumber(tx.buyPricePerUnit)} {tx.buyCurrency}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black ${isTxProfit ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">
                    {formatToman(pnl)} ت
                  </div>
                  <div className={`text-[10px] ${isTxProfit ? 'text-emerald-400' : 'text-rose-400'}`} dir="ltr">
                    {formatPercent(pnlPct)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when props haven't changed
export const AssetRow = memo(AssetRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.asset.symbol === nextProps.asset.symbol &&
    prevProps.asset.currentValueToman === nextProps.asset.currentValueToman &&
    prevProps.asset.pnlToman === nextProps.asset.pnlToman &&
    prevProps.asset.totalQuantity === nextProps.asset.totalQuantity
  );
});
