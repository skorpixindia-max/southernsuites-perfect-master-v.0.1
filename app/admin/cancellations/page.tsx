'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { XCircle, AlertTriangle, CheckCircle, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

type Booking = Record<string, unknown>;

export default function AdminCancellations() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  async function load() {
    const res = await fetch('/api/admin/bookings');
    const data = await res.json();
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const cancelled = bookings.filter(b => b.booking_status === 'cancelled');
  const active = bookings.filter(b =>
    (b.booking_status === 'confirmed' || b.booking_status === 'pending') &&
    b.payment_status === 'paid'
  );

  const filtered = (search
    ? active.filter(b =>
        (b.guest_name as string).toLowerCase().includes(search.toLowerCase()) ||
        (b.booking_id as string).toLowerCase().includes(search.toLowerCase())
      )
    : active
  );

  async function cancelBooking(bookingId: string, reason: string) {
    setActionLoading(bookingId);
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: 'cancelled', cancellationReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Booking cancelled successfully');
        setCancelModal(null);
        setCancelReason('');
        load();
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch { toast.error('Server error'); }
    finally { setActionLoading(null); }
  }

  async function updateStatus(bookingId: string, status: string) {
    setActionLoading(bookingId);
    try {
      const res = await fetch('/api/admin/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Booking marked as ${status}`);
        load();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch { toast.error('Server error'); }
    finally { setActionLoading(null); }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    const styles: Record<string, string> = {
      confirmed: 'bg-green-50 text-green-700',
      pending: 'bg-amber-50 text-amber-700',
      cancelled: 'bg-red-50 text-red-700',
      completed: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`text-[9px] font-sans px-2 py-1 uppercase tracking-wide ${styles[s] || 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-brand-rich">Cancellations</h1>
        <p className="text-xs text-gray-500 font-sans mt-1">Manage booking cancellations and status updates</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gold-border p-5">
          <AlertTriangle size={18} className="text-amber-500 mb-3" />
          <div className="font-serif text-2xl text-brand-rich">{active.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">Active Paid Bookings</div>
        </div>
        <div className="bg-white border border-gold-border p-5">
          <XCircle size={18} className="text-red-400 mb-3" />
          <div className="font-serif text-2xl text-brand-rich">{cancelled.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">Cancelled Bookings</div>
        </div>
        <div className="bg-white border border-gold-border p-5">
          <CheckCircle size={18} className="text-green-500 mb-3" />
          <div className="font-serif text-2xl text-brand-rich">
            {bookings.filter(b => b.booking_status === 'completed').length}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">Completed Stays</div>
        </div>
      </div>

      {/* Active bookings — can cancel or complete */}
      <div className="bg-white border border-gold-border mb-6">
        <div className="px-5 py-4 border-b border-gold-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-serif text-sm text-brand-rich">Active Bookings</div>
            <div className="text-[10px] text-gray-400 font-sans mt-0.5">Cancel or mark as completed</div>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search guest or booking ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gold-border text-xs font-sans outline-none focus:border-gold w-56"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400 font-sans">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400 font-sans">No active paid bookings</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gold-tint">
                  {['Booking', 'Guest', 'Property', 'Dates', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] text-gold-dark uppercase tracking-widest font-sans whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-border">
                {filtered.map(b => (
                  <tr key={b.id as string} className="hover:bg-gold-tint/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-brand-rich">{b.booking_id as string}</div>
                      <div className="text-[9px] text-gray-400 font-sans">{formatDate(b.created_at as string)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-sans text-brand-rich">{b.guest_name as string}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{b.guest_phone as string}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-sans text-brand-rich">{b.hotel_name as string}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-sans text-brand-rich">{formatDate(b.check_in as string)}</div>
                      <div className="text-[10px] text-gray-400">→ {formatDate(b.check_out as string)}</div>
                      <div className="text-[9px] text-gold-dark font-sans">{b.nights as number}N</div>
                    </td>
                    <td className="px-4 py-3 font-serif text-sm text-brand-rich">{formatCurrency(b.total_amount as number)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.booking_status as string} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => updateStatus(b.booking_id as string, 'completed')}
                          disabled={actionLoading === b.booking_id}
                          className="text-[9px] font-sans px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === b.booking_id ? <Loader2 size={9} className="animate-spin" /> : <CheckCircle size={9} />}
                          Mark Completed
                        </button>
                        <button
                          onClick={() => { setCancelModal(b); setCancelReason(''); }}
                          disabled={actionLoading === b.booking_id}
                          className="text-[9px] font-sans px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle size={9} /> Cancel Booking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancelled bookings history */}
      {cancelled.length > 0 && (
        <div className="bg-white border border-gold-border">
          <div className="px-5 py-4 border-b border-gold-border">
            <div className="font-serif text-sm text-brand-rich">Cancellation History</div>
          </div>
          <div className="divide-y divide-gold-border">
            {cancelled.slice(0, 20).map(b => (
              <div key={b.id as string} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-mono text-brand-rich">{b.booking_id as string}</div>
                  <div className="text-[10px] text-gray-400 font-sans">{b.guest_name as string} · {b.hotel_name as string}</div>
                  {typeof b.cancellation_reason === 'string' && b.cancellation_reason && (
  <div className="text-[10px] text-red-500 font-sans mt-0.5">
    Reason: {b.cancellation_reason}
  </div>
)}
                </div>
                <div className="text-right">
                  <div className="font-serif text-sm text-brand-rich line-through opacity-50">{formatCurrency(b.total_amount as number)}</div>
                  <StatusBadge status="cancelled" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md">
            <div className="bg-red-600 px-6 py-4">
              <div className="text-white font-serif text-sm">Cancel Booking</div>
              <div className="text-white/70 text-xs font-sans mt-0.5">{cancelModal.booking_id as string}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 text-xs text-red-700 font-sans">
                <strong>Warning:</strong> This will cancel the booking for <strong>{cancelModal.guest_name as string}</strong> at {cancelModal.hotel_name as string} ({formatDate(cancelModal.check_in as string)} → {formatDate(cancelModal.check_out as string)}). Razorpay refunds must be processed manually via the Razorpay Dashboard.
              </div>
              <div>
                <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Cancellation Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Guest requested cancellation, No show, Overbooking..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => cancelBooking(cancelModal.booking_id as string, cancelReason)}
                  disabled={!cancelReason.trim() || actionLoading === cancelModal.booking_id}
                  className="flex-1 bg-red-600 text-white text-xs py-3 font-sans disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Confirm Cancellation
                </button>
                <button onClick={() => setCancelModal(null)} className="flex-1 btn-outline text-xs py-3">
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}