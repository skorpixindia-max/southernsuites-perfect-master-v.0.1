'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  label?: string;
  minDate?: string;
}

type SelectionState = 'checkin' | 'checkout' | 'done';

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', weekday: 'short' })
    .replace(',', '');
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function DateRangePicker({
  checkIn, checkOut, onCheckInChange, onCheckOutChange, minDate,
}: DateRangePickerProps) {
  const today     = minDate || new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);

  const [open, setOpen]           = useState(false);
  const [selecting, setSelecting] = useState<SelectionState>('checkin');
  const [hovered, setHovered]     = useState<string | null>(null);

  const initMonth = checkIn
    ? new Date(checkIn).getMonth()
    : todayDate.getMonth();
  const initYear = checkIn
    ? new Date(checkIn).getFullYear()
    : todayDate.getFullYear();

  const [viewMonth, setViewMonth] = useState(initMonth);
  const [viewYear,  setViewYear]  = useState(initYear);

  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(dateStr: string) {
    if (dateStr < today) return;

    if (selecting === 'checkin' || selecting === 'done') {
      onCheckInChange(dateStr);
      onCheckOutChange('');
      setSelecting('checkout');
    } else {
      // checkout selection
      if (dateStr <= checkIn) {
        // If they click before checkIn, reset
        onCheckInChange(dateStr);
        onCheckOutChange('');
        setSelecting('checkout');
      } else {
        onCheckOutChange(dateStr);
        setSelecting('done');
        setTimeout(() => setOpen(false), 300);
      }
    }
  }

  function isInRange(dateStr: string): boolean {
    const end = selecting === 'checkout' && hovered ? hovered : checkOut;
    if (!checkIn || !end) return false;
    return dateStr > checkIn && dateStr < end;
  }

  function isStart(dateStr: string)  { return dateStr === checkIn; }
  function isEnd(dateStr: string)    {
    const end = selecting === 'checkout' && hovered ? hovered : checkOut;
    return dateStr === end;
  }
  function isPast(dateStr: string)   { return dateStr < today; }

  function handleOpen() {
    setOpen(true);
    setSelecting(checkIn ? 'checkout' : 'checkin');
  }

  function clear() {
    onCheckInChange('');
    onCheckOutChange('');
    setSelecting('checkin');
  }

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <div
        onClick={handleOpen}
        className="grid grid-cols-2 border border-gold-border bg-white cursor-pointer hover:border-gold transition-colors"
      >
        {/* Check-in */}
        <div className={`p-3 border-r border-gold-border ${selecting === 'checkin' && open ? 'bg-gold-tint' : ''}`}>
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans flex items-center gap-1 mb-1">
            <Calendar size={9} /> Check-in
          </div>
          <div className={`text-sm font-sans ${checkIn ? 'text-brand-rich' : 'text-gray-300'}`}>
            {checkIn ? formatDisplay(checkIn) : 'Select date'}
          </div>
          <div className="text-[9px] text-gray-400 font-sans mt-0.5">From 12:00 PM</div>
        </div>
        {/* Check-out */}
        <div className={`p-3 ${selecting === 'checkout' && open ? 'bg-gold-tint' : ''}`}>
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans flex items-center gap-1 mb-1">
            <Calendar size={9} /> Check-out
          </div>
          <div className={`text-sm font-sans ${checkOut ? 'text-brand-rich' : 'text-gray-300'}`}>
            {checkOut ? formatDisplay(checkOut) : 'Select date'}
          </div>
          <div className="text-[9px] text-gray-400 font-sans mt-0.5">Until 11:00 AM</div>
        </div>
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gold-border shadow-2xl mt-1 w-full min-w-[320px]">
          {/* Header */}
          <div className="bg-brand-black px-4 py-3 flex items-center justify-between">
            <div className="text-gold font-serif text-sm">
              {selecting === 'checkin' ? 'Select Check-in Date' : 'Select Check-out Date'}
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </div>

          {/* Selected summary */}
          {(checkIn || checkOut) && (
            <div className="flex items-center justify-between px-4 py-2 bg-gold-tint border-b border-gold-border">
              <div className="flex items-center gap-4 text-xs font-sans">
                <span className={`${checkIn ? 'text-brand-rich font-medium' : 'text-gray-400'}`}>
                  {checkIn ? formatDisplay(checkIn) : '—'}
                </span>
                <span className="text-gold">→</span>
                <span className={`${checkOut ? 'text-brand-rich font-medium' : 'text-gray-400'}`}>
                  {checkOut ? formatDisplay(checkOut) : '—'}
                </span>
              </div>
              <button onClick={clear} className="text-[9px] text-red-400 hover:text-red-600 font-sans uppercase tracking-wide">
                Clear
              </button>
            </div>
          )}

          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold-border">
            <button onClick={prevMonth} className="text-gold hover:text-gold-dark p-1">
              <ChevronLeft size={16} />
            </button>
            <span className="font-serif text-brand-rich text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="text-gold hover:text-gold-dark p-1">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] text-gold-dark uppercase tracking-widest font-sans py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const past    = isPast(dateStr);
              const start   = isStart(dateStr);
              const end     = isEnd(dateStr);
              const inRange = isInRange(dateStr);
              const isToday = dateStr === today;

              let cellClass = 'relative flex items-center justify-center h-8 text-xs font-sans cursor-pointer transition-colors ';

              if (past) {
                cellClass += 'text-gray-300 cursor-not-allowed ';
              } else if (start || end) {
                cellClass += 'bg-gold text-brand-black font-medium z-10 ';
              } else if (inRange) {
                cellClass += 'bg-gold-tint text-brand-rich ';
              } else if (isToday) {
                cellClass += 'text-gold font-medium border border-gold ';
              } else {
                cellClass += 'text-brand-rich hover:bg-gold-tint hover:text-gold ';
              }

              return (
                <div
                  key={day}
                  className={cellClass}
                  onClick={() => !past && handleDayClick(dateStr)}
                  onMouseEnter={() => selecting === 'checkout' && !past && setHovered(dateStr)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-gold-border bg-gold-tint">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gold" />
              <span className="text-[9px] text-gray-500 font-sans">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gold-tint border border-gold-border" />
              <span className="text-[9px] text-gray-500 font-sans">In Range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-100" />
              <span className="text-[9px] text-gray-500 font-sans">Unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}