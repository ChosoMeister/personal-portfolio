
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import jalaali from 'jalaali-js';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Calendar } from 'lucide-react';

interface JalaliDatePickerProps {
    value: string; // ISO date string (Gregorian)
    onChange: (isoDate: string) => void;
    placeholder?: string;
}

const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Convert English digits to Persian
const toPersianDigits = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// Get days in Jalali month
const getDaysInJalaliMonth = (jy: number, jm: number): number => {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
};

// Get first day of month (Saturday = 0)
const getFirstDayOfMonth = (jy: number, jm: number): number => {
    const { gy, gm, gd } = jalaali.toGregorian(jy, jm, 1);
    const date = new Date(gy, gm - 1, gd);
    return (date.getDay() + 1) % 7;
};

type ViewMode = 'days' | 'months' | 'years';

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'انتخاب تاریخ'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState(1403);
    const [currentMonth, setCurrentMonth] = useState(1);
    const [selectedDate, setSelectedDate] = useState<{ jy: number; jm: number; jd: number } | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('days');
    const [yearRangeStart, setYearRangeStart] = useState(1390);

    // Initialize from value
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
            setSelectedDate({ jy, jm, jd });
            setCurrentYear(jy);
            setCurrentMonth(jm);
            setYearRangeStart(Math.floor(jy / 12) * 12);
        } else {
            const today = new Date();
            const { jy, jm } = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
            setCurrentYear(jy);
            setCurrentMonth(jm);
            setYearRangeStart(Math.floor(jy / 12) * 12);
        }
    }, [value]);

    // Reset view mode when opening
    useEffect(() => {
        if (isOpen) {
            setViewMode('days');
        }
    }, [isOpen]);

    const handleDayClick = (day: number) => {
        const { gy, gm, gd } = jalaali.toGregorian(currentYear, currentMonth, day);
        const isoDate = new Date(gy, gm - 1, gd).toISOString().split('T')[0];
        setSelectedDate({ jy: currentYear, jm: currentMonth, jd: day });
        onChange(isoDate);
        setIsOpen(false);
    };

    const handleMonthClick = (month: number) => {
        setCurrentMonth(month);
        setViewMode('days');
    };

    const handleYearClick = (year: number) => {
        setCurrentYear(year);
        setViewMode('months');
    };

    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
    }

    const displayValue = selectedDate
        ? `${toPersianDigits(selectedDate.jy)}/${toPersianDigits(selectedDate.jm.toString().padStart(2, '0'))}/${toPersianDigits(selectedDate.jd.toString().padStart(2, '0'))}`
        : '';

    // Generate years for year picker (12 years at a time)
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

    const calendarPopup = isOpen && ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="w-full max-w-xs bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[color:var(--border-color)] bg-[color:var(--muted-surface)]">
                    {viewMode === 'days' && (
                        <>
                            <button
                                onClick={goToNextMonth}
                                className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('months')}
                                className="font-black text-[color:var(--text-primary)] hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                                {persianMonths[currentMonth - 1]} {toPersianDigits(currentYear)}
                                <ChevronDown size={14} />
                            </button>
                            <button
                                onClick={goToPrevMonth}
                                className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </>
                    )}
                    {viewMode === 'months' && (
                        <>
                            <button
                                onClick={() => setCurrentYear(currentYear + 1)}
                                className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('years')}
                                className="font-black text-[color:var(--text-primary)] hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                                {toPersianDigits(currentYear)}
                                <ChevronDown size={14} />
                            </button>
                            <button
                                onClick={() => setCurrentYear(currentYear - 1)}
                                className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </>
                    )}
                    {viewMode === 'years' && (
                        <>
                            <button
                                onClick={() => setYearRangeStart(yearRangeStart + 12)}
                                className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <div className="font-black text-[color:var(--text-primary)]">
                                {toPersianDigits(yearRangeStart)} - {toPersianDigits(yearRangeStart + 11)}
                            </div>
                            <button
                                onClick={() => setYearRangeStart(yearRangeStart - 12)}
                                className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Days View */}
                {viewMode === 'days' && (
                    <>
                        <div className="grid grid-cols-7 gap-1 p-3 border-b border-[color:var(--border-color)]">
                            {persianWeekDays.map((day, i) => (
                                <div key={i} className="text-center text-[10px] font-bold text-[color:var(--text-muted)] py-1">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 p-3">
                            {days.map((day, i) => (
                                <div key={i} className="aspect-square">
                                    {day && (
                                        <button
                                            onClick={() => handleDayClick(day)}
                                            className={`w-full h-full rounded-xl text-sm font-bold transition-all flex items-center justify-center
                                                ${selectedDate?.jy === currentYear && selectedDate?.jm === currentMonth && selectedDate?.jd === day
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                    : 'hover:bg-[color:var(--muted-surface)] text-[color:var(--text-primary)]'
                                                }`}
                                        >
                                            {toPersianDigits(day)}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Months View */}
                {viewMode === 'months' && (
                    <div className="grid grid-cols-3 gap-2 p-4">
                        {persianMonths.map((month, i) => (
                            <button
                                key={i}
                                onClick={() => handleMonthClick(i + 1)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all
                                    ${currentMonth === i + 1
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'hover:bg-[color:var(--muted-surface)] text-[color:var(--text-primary)]'
                                    }`}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                )}

                {/* Years View */}
                {viewMode === 'years' && (
                    <div className="grid grid-cols-3 gap-2 p-4">
                        {years.map((year) => (
                            <button
                                key={year}
                                onClick={() => handleYearClick(year)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all
                                    ${currentYear === year
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'hover:bg-[color:var(--muted-surface)] text-[color:var(--text-primary)]'
                                    }`}
                            >
                                {toPersianDigits(year)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="p-3 border-t border-[color:var(--border-color)] flex gap-2">
                    <button
                        onClick={() => {
                            const today = new Date();
                            const { jy, jm, jd } = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
                            setCurrentYear(jy);
                            setCurrentMonth(jm);
                            handleDayClick(jd);
                        }}
                        className="flex-1 py-3 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-colors"
                    >
                        امروز
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-3 text-sm font-bold text-[color:var(--text-muted)] bg-[color:var(--muted-surface)] hover:bg-[color:var(--pill-bg)] rounded-xl transition-colors"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-4 text-sm font-bold cursor-pointer flex items-center justify-between gap-2 hover:border-blue-500/50 transition-all text-[color:var(--text-primary)]"
            >
                <span className={displayValue ? '' : 'text-[color:var(--text-muted)]'}>
                    {displayValue || placeholder}
                </span>
                <Calendar size={18} className="text-[color:var(--text-muted)]" />
            </div>

            {calendarPopup}
        </>
    );
};
