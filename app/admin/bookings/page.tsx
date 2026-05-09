'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Download } from 'lucide-react';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [filtered, setFiltered] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then(r => r.json())
      .then(data => { const d = Array.isArray(data) ? data : []; setBookings(d); setFiltered(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = bookings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        (b.guest_name as string).toLowerCase().includes(q) ||
        (b.booking_id as string).toLowerCase().includes(q) ||
        (b.guest_email as string).toLowerCase().includes(q) ||
        (b.guest_phone as string).includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter(b => b.booking_status === statusFilter);
    if (hotelFilter !== 'all') result = result.filter(b => b.hotel_slug === hotelFilter);
    setFiltered(result);
  }, [search, statusFilter, hotelFilter, bookings]);

  const hotels = [...new Set(bookings.map(b => b.hotel_slug as string))];

  function exportCSV() {
    const headers = ['Booking ID','Guest','Email','Phone','Hotel','Room','Check-in','Check-out','Nights','Guests','Total','Status','Payment','Created'];
    const rows = filtered.map(b => [
      b.booking_id, b.guest_name, b.guest_email, b.guest_phone,
      b.hotel_name, b.room_name, b.check_in, b.check_out,
      b.nights, b.guests, b.total_amount, b.booking_status,
      b.payment_status, b.created_at,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-2xl text-brand-rich">All Bookings</h1>
          <p className="text-xs text-gray-500 font-sans mt-1">{filtered.length} bookings found</p>
        </div>
        <button onClick={exportCSV} className="btn-black text-xs py-2.5 px-5 flex items-center gap-2">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gold-border p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by name, ID, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gold-border text-sm font-sans outline-none focus:border-gold"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gold-border px-3 py-2.5 text-sm font-sans outline-none focus:border-gold bg-white">
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)} className="border border-gold-border px-3 py-2.5 text-sm font-sans outline-none focus:border-gold bg-white">
          <option value="all">All Hotels</option>
          {hotels.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gold-border overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400 font-sans">Loading bookings…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400 font-sans">No bookings found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-black text-left">
                {['Booking ID','Guest','Property','Room','Dates','Amount','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] text-gold uppercase tracking-widest font-sans whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-border">
              {filtered.map((b) => (
                <tr key={b.id as string} className="hover:bg-gold-tint transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono text-brand-rich">{b.booking_id as string}</div>
                    <div className="text-[9px] text-gray-400 font-sans mt-0.5">{formatDate(b.created_at as string)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich">{b.guest_name as string}</div>
                    <div className="text-[9px] text-gray-400 font-sans">{b.guest_phone as string}</div>
                    <div className="text-[9px] text-gray-400 font-sans">{b.guest_email as string}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-sans text-brand-rich whitespace-nowrap">{b.hotel_name as string}</td>
                  <td className="px-4 py-3 text-xs font-sans text-gray-600">{b.room_name as string}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich whitespace-nowrap">{formatDate(b.check_in as string)}</div>
                    <div className="text-[10px] text-gray-400 font-sans">→ {formatDate(b.check_out as string)}</div>
                    <div className="text-[9px] text-gold-dark font-sans">{b.nights as number} night{(b.nights as number) > 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-serif text-brand-rich">{formatCurrency(b.total_amount as number)}</div>
                    <span className={`text-[9px] font-sans ${b.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {(b.payment_status as string).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-sans px-2 py-1 ${
                      b.booking_status === 'confirmed' ? 'bg-green-50 text-green-700' :
                      b.booking_status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      b.booking_status === 'cancelled' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {(b.booking_status as string).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/confirmation/${b.booking_id}`} target="_blank" className="text-[10px] text-gold hover:text-gold-dark font-sans">
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
