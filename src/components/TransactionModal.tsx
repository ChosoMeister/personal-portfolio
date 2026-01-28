
import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { ASSET_DETAILS, AssetSymbol, Currency, Transaction, getAssetDetail } from '../types';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/formatting';
import { JalaliDatePicker } from './JalaliDatePicker';
import { ConfirmDialog } from './ConfirmDialog';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
}

// Format number with thousand separators
const formatQuantityInput = (value: string): string => {
  // Remove non-numeric except decimal
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};

// Parse formatted number back to number
const parseQuantityInput = (value: string): number => {
  return parseFloat(value.replace(/,/g, '')) || 0;
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const [assetSymbol, setAssetSymbol] = useState<AssetSymbol>('USD');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('TOMAN');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const mutedText = 'text-[color:var(--text-muted)]';

  useEffect(() => {
    if (initialData) {
      setAssetSymbol(initialData.assetSymbol);
      setQuantity(formatQuantityInput(initialData.quantity.toString()));
      setPrice(formatCurrencyInput(initialData.buyPricePerUnit.toString()));
      setDate(new Date(initialData.buyDateTime).toISOString().split('T')[0]);
      setCurrency(initialData.buyCurrency);
    } else {
      // Default for new
      setAssetSymbol('USD');
      setQuantity('');
      setPrice('');
      setDate(new Date().toISOString().split('T')[0]);
      setCurrency('TOMAN');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!quantity || !price) return;

    onSave({
      id: initialData?.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetSymbol,
      quantity: parseQuantityInput(quantity),
      buyPricePerUnit: parseCurrencyInput(price),
      buyDateTime: new Date(date).toISOString(),
      buyCurrency: currency,
      feesToman: initialData?.feesToman || 0,
    });
    onClose();
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
      onDelete(initialData.id);
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const assetOptions = Object.entries(ASSET_DETAILS).map(([key, val]) => ({
    symbol: key as AssetSymbol,
    ...val
  }));

  const isCrypto = getAssetDetail(assetSymbol).type === 'CRYPTO';

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 border border-[color:var(--border-color)]">
          <div className="px-6 py-5 border-b border-[color:var(--border-color)] flex justify-between items-center bg-[color:var(--muted-surface)]">
            <h3 className="font-black text-[color:var(--text-primary)]">
              {initialData ? 'ویرایش تراکنش' : 'افزودن تراکنش خرید'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] text-[color:var(--text-muted)] transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Asset Selection */}
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>انتخاب دارایی</label>
              <select
                value={assetSymbol}
                onChange={(e) => {
                  const newSymbol = e.target.value as AssetSymbol;
                  setAssetSymbol(newSymbol);
                  if (getAssetDetail(newSymbol).type === 'CRYPTO') setCurrency('USD');
                  else setCurrency('TOMAN');
                }}
                className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-[color:var(--text-primary)]"
              >
                {assetOptions.map(opt => (
                  <option key={opt.symbol} value={opt.symbol}>
                    {opt.name} ({opt.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>مقدار</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(formatQuantityInput(e.target.value))}
                  placeholder="۰"
                  className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left text-[color:var(--text-primary)]"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${mutedText}`}>تاریخ</label>
                <JalaliDatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="انتخاب تاریخ"
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className={`text-[10px] font-black uppercase tracking-widest ${mutedText}`}>قیمت واحد</label>
                {isCrypto && (
                  <div className="flex gap-2 text-[10px] font-black">
                    <button
                      onClick={() => setCurrency('USD')}
                      className={`${currency === 'USD' ? 'text-blue-600' : mutedText}`}
                    >USD</button>
                    <span className={`${mutedText}`}>|</span>
                    <button
                      onClick={() => setCurrency('TOMAN')}
                      className={`${currency === 'TOMAN' ? 'text-blue-600' : mutedText}`}
                    >TOMAN</button>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                  placeholder={currency === 'USD' ? 'Price in USD' : 'قیمت به تومان'}
                  className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all text-left pl-12 text-[color:var(--text-primary)]"
                  dir="ltr"
                />
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black ${mutedText} pointer-events-none`}>
                  {currency === 'USD' ? '$' : 'T'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0 flex flex-col gap-3">
            <button
              onClick={handleSave}
              disabled={!quantity || !price}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
            >
              <Check size={18} strokeWidth={3} />
              <span>{initialData ? 'بروزرسانی تغییرات' : 'ثبت تراکنش'}</span>
            </button>

            {initialData && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={18} />
                <span>حذف تراکنش</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="حذف تراکنش"
        message="آیا از حذف این تراکنش اطمینان دارید؟ این عمل غیرقابل بازگشت است."
        confirmLabel="حذف"
        cancelLabel="انصراف"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
