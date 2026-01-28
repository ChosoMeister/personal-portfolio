
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'تأیید',
    cancelLabel = 'انصراف',
    variant = 'danger',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400',
            confirmBtn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25',
        },
        warning: {
            icon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
            confirmBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25',
        },
        info: {
            icon: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--card-bg)] text-[color:var(--text-primary)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[color:var(--border-color)]">
                {/* Header */}
                <div className="p-6 pb-4 flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${styles.icon}`}>
                        <AlertTriangle size={28} />
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-lg mb-2">{title}</h3>

                    {/* Message */}
                    <p className="text-[color:var(--text-muted)] text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-[color:var(--muted-surface)] hover:bg-[color:var(--pill-bg)] text-[color:var(--text-primary)] font-bold py-3.5 rounded-2xl transition-all active:scale-95"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 shadow-xl ${styles.confirmBtn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
