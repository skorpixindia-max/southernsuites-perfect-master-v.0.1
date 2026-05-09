'use client';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, User, Phone, Mail, Calendar, Building2 } from 'lucide-react';

type Booking = {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  hotel_name: string;
  hotel_slug: string;
  room_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_amount: number;
  booking_status: string;
};

export default function AdminGuestLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/admin/guests?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // Group by guest email
  const guestGroups = results.reduce((acc, b) => {
    const email = b.guest_email as string;
    if (!acc[email]) acc[email] = [];
    acc[email].push(b);
    return acc;
  }, {} as Record<string, Booking[]>);

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
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-brand-rich">Guest Lookup</h1>
        <p className="text-xs text-gray-500 font-sans mt-1">Search any guest across all 9 properties by name, email, phone, or booking ID</p>
      </div>

      {/* Search bar */}
      <div className="bg-white border border-gold-border p-6 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Guest name, email, phone number, or Booking ID…"
              className="w-full pl-11 pr-4 py-3 border border-gold-border text-sm font-sans outline-none focus:border-gold"
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="btn-gold px-6 text-xs disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Search by name', 'Search by email', 'Search by phone', 'Search by Booking ID'].map(hint => (
            <span key={hint} className="text-[9px] text-gray-400 font-sans border border-gold-border px-2 py-1">{hint}</span>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="bg-white border border-gold-border p-10 text-center text-sm text-gray-400 font-sans">Searching across all properties…</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white border border-gold-border p-10 text-center">
          <User size={32} className="text-gold/30 mx-auto mb-3" />
          <div className="font-serif text-brand-rich mb-1">No guests found</div>
          <p className="text-xs text-gray-400 font-sans">Try a different name, email, phone, or booking ID</p>
        </div>
      )}

      {!loading && Object.entries(guestGroups).map(([email, guestBookings]) => {
        const first = guestBookings[0];
        const totalSpend = guestBookings.reduce((s, b) => s + ((b.total_amount as number) || 0), 0);
        const hotels = [...new Set(guestBookings.map(b => b.hotel_name as string))];

        return (
          <div key={email} className="bg-white border border-gold-border mb-4">
            {/* Guest header */}
            <div className="bg-brand-black px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold flex items-center justify-center flex-shrink-0">
                  <span className="font-serif text-brand-black text-lg">{(first.guest_name as string)[0]}</span>
                </div>
                <div>
                  <div className="text-white font-serif text-sm">{first.guest_name as string}</div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-sans">
                      <Mail size={10} />{first.guest_email as string}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-sans">
                      <Phone size={10} />{first.guest_phone as string}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-gold font-serif text-sm">{formatCurrency(totalSpend)}</div>
                  <div className="text-white/30 text-[9px] font-sans uppercase tracking-widest">Total Spend</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-serif text-sm">{guestBookings.length}</div>
                  <div className="text-white/30 text-[9px] font-sans uppercase tracking-widest">Booking{guestBookings.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Properties stayed */}
            <div className="px-5 py-2 border-b border-gold-border flex items-center gap-2 flex-wrap">
              <Building2 size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-400 font-sans">Stayed at:</span>
              {hotels.map(h => (
                <span key={h} className="text-[10px] font-sans text-brand-rich bg-gold-tint px-2 py-0.5 border border-gold-border">{h}</span>
              ))}
            </div>

            {/* Booking list */}
            <div className="divide-y divide-gold-border">
              {guestBookings.map(b => (
                <div key={b.id as string} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs font-mono text-brand-rich">{b.booking_id as string}</div>
                      <div className="text-[10px] text-gray-400 font-sans">{b.hotel_name as string} · {b.room_name as string}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-sans">
                      <Calendar size={10} />
                      {formatDate(b.check_in as string)} → {formatDate(b.check_out as string)} ({b.nights as number}N)
                    </div>
                    <div className="font-serif text-sm text-brand-rich">{formatCurrency(b.total_amount as number)}</div>
                    <StatusBadge status={b.booking_status as string} />
                    <a href={`/confirmation/${b.booking_id}`} target="_blank" className="text-[10px] text-gold hover:text-gold-dark font-sans">View →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}