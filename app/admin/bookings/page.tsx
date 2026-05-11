'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Booking = Record<string, unknown>;

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  async function load() {
    fetch('/api/admin/bookings')
      .then(r => r.json())
      .then(data => { const d = Array.isArray(data) ? data : []; setBookings(d); setFiltered(d); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = bookings;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        (b.guest_name as string || '').toLowerCase().includes(q) ||
        (b.booking_id as string || '').toLowerCase().includes(q) ||
        (b.guest_email as string || '').toLowerCase().includes(q) ||
        (b.guest_phone as string || '').includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter(b => b.booking_status === statusFilter);
    if (hotelFilter !== 'all') result = result.filter(b => b.hotel_slug === hotelFilter);
    setFiltered(result);
    setPage(1);
  }, [search, statusFilter, hotelFilter, bookings]);

  const hotels = [...new Set(bookings.map(b => b.hotel_slug as string))];
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  async function updateStatus(bookingId: string, status: string) {
    setActionLoading(bookingId + status);
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Marked as ${status}`);
        load();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch { toast.error('Error'); }
    finally { setActionLoading(null); }
  }

  function exportCSV() {
    const headers = ['Booking ID', 'Invoice', 'Guest', 'Email', 'Phone', 'Hotel', 'Room', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Room Price', 'Taxes', 'Discount', 'Promo', 'Total', 'Booking Status', 'Payment Status', 'Created'];
    const rows = filtered.map(b => [
      b.booking_id, b.invoice_number, b.guest_name, b.guest_email, b.guest_phone,
      b.hotel_name, b.room_name, b.check_in, b.check_out,
      b.nights, b.guests, b.room_price, b.taxes, b.discount_amount, b.promo_code,
      b.total_amount, b.booking_status, b.payment_status, b.created_at,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-50 text-green-700',
      pending: 'bg-amber-50 text-amber-700',
      cancelled: 'bg-red-50 text-red-700',
      completed: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`text-[9px] font-sans px-2 py-1 uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-rich">All Bookings</h1>
          <p className="text-xs text-gray-500 font-sans mt-1">
            {filtered.length} of {bookings.length} bookings
            {filtered.length > PER_PAGE && ` · Page ${page} of ${totalPages}`}
          </p>
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
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gold-border px-3 py-2.5 text-sm font-sans outline-none focus:border-gold bg-white">
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)}
          className="border border-gold-border px-3 py-2.5 text-sm font-sans outline-none focus:border-gold bg-white">
          <option value="all">All Hotels</option>
          {hotels.map(h => (
  <option key={h} value={h}>
    {(bookings.find(b => b.hotel_slug === h)?.hotel_name as string) || h}
  </option>
))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gold-border overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400 font-sans">Loading bookings…</div>
        ) : paginated.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400 font-sans">No bookings found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-black text-left">
                {['Booking', 'Guest', 'Property', 'Dates', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] text-gold uppercase tracking-widest font-sans whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-border">
              {paginated.map(b => (
                <tr key={b.id as string} className="hover:bg-gold-tint transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono text-brand-rich">{b.booking_id as string}</div>
                    {typeof b.invoice_number === 'string' && (
  <div className="text-[9px] text-gray-400 font-sans">
    {b.invoice_number}
  </div>
)}
                    <div className="text-[9px] text-gray-400 font-sans">{formatDate(b.created_at as string)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich">{b.guest_name as string}</div>
                    <div className="text-[10px] text-gray-400 font-sans">{b.guest_phone as string}</div>
                    <div className="text-[9px] text-gray-400 font-sans truncate max-w-[140px]">{b.guest_email as string}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich whitespace-nowrap">{b.hotel_name as string}</div>
                    <div className="text-[10px] text-gray-400 font-sans">{b.room_name as string}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich whitespace-nowrap">{formatDate(b.check_in as string)}</div>
                    <div className="text-[10px] text-gray-400 font-sans">→ {formatDate(b.check_out as string)}</div>
                    <div className="text-[9px] text-gold-dark font-sans">{b.nights as number}N · {b.guests as number}G</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-serif text-sm text-brand-rich">{formatCurrency(b.total_amount as number)}</div>
                    {(b.discount_amount as number) > 0 && (
                      <div className="text-[9px] text-green-600 font-sans">−{formatCurrency(b.discount_amount as number)} {b.promo_code ? `(${b.promo_code})` : ''}</div>
                    )}
                    <span className={`text-[9px] font-sans ${b.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {(b.payment_status as string || '').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.booking_status as string} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <a href={`/confirmation/${b.booking_id}`} target="_blank"
                        className="text-[9px] text-gold hover:text-gold-dark font-sans whitespace-nowrap">
                        View →
                      </a>
                      {b.booking_status !== 'confirmed' && b.booking_status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(b.booking_id as string, 'confirmed')}
                          disabled={actionLoading === (b.booking_id as string) + 'confirmed'}
                          className="text-[9px] font-sans text-green-700 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === (b.booking_id as string) + 'confirmed'
                            ? <Loader2 size={9} className="animate-spin" />
                            : <CheckCircle size={9} />}
                          Confirm
                        </button>
                      )}
                      {b.booking_status !== 'cancelled' && b.booking_status !== 'completed' && (
                        <button
                          onClick={() => updateStatus(b.booking_id as string, 'cancelled')}
                          disabled={actionLoading === (b.booking_id as string) + 'cancelled'}
                          className="text-[9px] font-sans text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === (b.booking_id as string) + 'cancelled'
                            ? <Loader2 size={9} className="animate-spin" />
                            : <XCircle size={9} />}
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs font-sans border border-gold-border disabled:opacity-40 hover:bg-gold-tint transition-colors">
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const n = totalPages <= 7 ? i + 1 : Math.max(1, Math.min(page - 3, totalPages - 6)) + i;
            return (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 text-xs font-sans border transition-colors ${page === n ? 'bg-brand-black text-gold border-brand-black' : 'border-gold-border hover:bg-gold-tint'}`}>
                {n}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-sans border border-gold-border disabled:opacity-40 hover:bg-gold-tint transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}