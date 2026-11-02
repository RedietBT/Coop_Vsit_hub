import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  Sparkles
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Instant interactive Calendar Dropdown Popover.
 * Renders an inline calendar grid immediately on click with 0ms OS delay.
 */
export const CalendarDropdownPopover = ({
  selectedDate,
  onSelectDate,
  isDarkMode = true,
  formatDateHeader,
  isViewingToday,
  isViewingTomorrow,
  isViewingYesterday,
  label = 'Choose Day',
  align = 'right', // 'left' | 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current selectedDate (YYYY-MM-DD)
  const { currentYear, currentMonth, currentDay } = useMemo(() => {
    try {
      const [y, m, d] = (selectedDate || '').split('-').map(Number);
      if (y && m && d) {
        return { currentYear: y, currentMonth: m - 1, currentDay: d };
      }
    } catch {}
    const now = new Date();
    return {
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth(),
      currentDay: now.getDate()
    };
  }, [selectedDate]);

  // View state for browsing different months in the calendar
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonth);

  // Synchronize view month with selectedDate whenever popover opens
  useEffect(() => {
    if (isOpen) {
      setViewYear(currentYear);
      setViewMonth(currentMonth);
    }
  }, [isOpen, currentYear, currentMonth]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Step month forward / backward
  const handleMonthStep = (step) => {
    let nextMonth = viewMonth + step;
    let nextYear = viewYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  };

  // Quick helper to format ISO string (YYYY-MM-DD)
  const toIso = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Today's date components (Africa/Addis_Ababa)
  const todayInfo = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Addis_Ababa',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const [y, m, d] = formatter.format(new Date()).split('-').map(Number);
      return { y, m: m - 1, d, iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
    } catch {
      const now = new Date();
      return {
        y: now.getFullYear(),
        m: now.getMonth(),
        d: now.getDate(),
        iso: now.toISOString().split('T')[0]
      };
    }
  }, []);

  // Compute days matrix for the active viewMonth
  const daysMatrix = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // 1. Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        day: d,
        month: prevM,
        year: prevY,
        isCurrentMonth: false,
        iso: toIso(prevY, prevM, d)
      });
    }

    // 2. Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        iso: toIso(viewYear, viewMonth, d)
      });
    }

    // 3. Trailing days from next month to complete rows (up to multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        day: d,
        month: nextM,
        year: nextY,
        isCurrentMonth: false,
        iso: toIso(nextY, nextM, d)
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Handle click on a date cell
  const handleDateClick = (iso) => {
    onSelectDate(iso);
    setIsOpen(false);
  };

  // Quick jump presets
  const handleJumpDays = (daysOffset) => {
    try {
      const dt = new Date();
      dt.setDate(dt.getDate() + daysOffset);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      onSelectDate(`${yyyy}-${mm}-${dd}`);
      setIsOpen(false);
    } catch {}
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* ─── Trigger Button ─── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer select-none group ${
          isOpen
            ? 'border-[#00adef] ring-2 ring-[#00adef]/20 bg-sky-500/10'
            : isDarkMode
            ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:border-[#00adef]'
            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-[#00adef]'
        }`}
        title="Click to open calendar and choose any day"
        aria-expanded={isOpen}
      >
        <div className={`p-1 rounded-lg transition-colors ${
          isOpen
            ? 'bg-[#00adef] text-white'
            : 'bg-sky-500/10 text-[#00adef] group-hover:bg-[#00adef] group-hover:text-white'
        }`}>
          <CalendarIcon className="w-4 h-4" />
        </div>

        <div className="text-left flex items-center gap-1.5">
          <span className="font-black">
            {formatDateHeader ? formatDateHeader(selectedDate) : selectedDate}
          </span>
          {isViewingToday && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
              Today
            </span>
          )}
          {isViewingTomorrow && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-500 border border-sky-500/20">
              Tomorrow
            </span>
          )}
          {isViewingYesterday && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/20">
              Yesterday
            </span>
          )}
        </div>

        <span className="text-[10px] font-bold text-[#00adef] bg-sky-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 ml-0.5">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{label}</span>
        </span>
      </button>

      {/* ─── Instant Dropdown Popover ─── */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2.5 z-50 w-72 sm:w-80 rounded-2xl border p-4 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${
            isDarkMode
              ? 'bg-slate-900 border-slate-700 text-white shadow-black/80'
              : 'bg-white border-slate-200 text-slate-900 shadow-sky-500/10'
          }`}
          style={{ minWidth: '280px' }}
        >
          {/* Header: Month & Year with Navigation */}
          <div className="flex items-center justify-between pb-3 border-b mb-3 border-slate-700/50">
            <button
              type="button"
              onClick={() => handleMonthStep(-1)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h4 className="text-sm font-black tracking-tight">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => handleMonthStep(1)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name) => (
              <span
                key={name}
                className={`text-[11px] font-bold uppercase tracking-wider py-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysMatrix.map((item) => {
              const isSelected = item.iso === selectedDate;
              const isToday = item.iso === todayInfo.iso;

              return (
                <button
                  key={item.iso}
                  type="button"
                  onClick={() => handleDateClick(item.iso)}
                  className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#00adef] text-white shadow-md shadow-sky-500/30 scale-105 font-black'
                      : isToday
                      ? isDarkMode
                        ? 'border border-emerald-500 text-emerald-400 font-black hover:bg-emerald-500/20'
                        : 'border border-emerald-500 text-emerald-700 font-black bg-emerald-50 hover:bg-emerald-100'
                      : item.isCurrentMonth
                      ? isDarkMode
                        ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
                      : isDarkMode
                      ? 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  title={`${item.iso}${isToday ? ' (Today)' : ''}${isSelected ? ' (Selected)' : ''}`}
                >
                  <span>{item.day}</span>
                  {/* Small Today dot if not selected */}
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Presets Bar */}
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleJumpDays(0)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                isViewingToday
                  ? 'bg-emerald-500 text-white'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleJumpDays(1)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                isViewingTomorrow
                  ? 'bg-[#00adef] text-white'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleJumpDays(-1)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                isViewingYesterday
                  ? 'bg-amber-500 text-white'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleJumpDays(7)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-sky-700'
              }`}
            >
              +7 Days
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDropdownPopover;

