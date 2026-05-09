'use client';
import { useEffect, useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HOTELS } from '@/lib/hotels-data';
import { BarChart3, TrendingUp, IndianRupee, CalendarCheck, Download, Users } from 'lucide-react';

type Booking = Record<string, unknown>;

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white border border-gold-border p-5">
      <Icon size={18} className={`${color} mb-3`} />
      <div className="font-serif text-2xl text-brand-rich mb-1">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 font-sans mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminReports() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7' | '30' | '90' | 'all'>('30');

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (range === 'all') return bookings;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(range));
    return bookings.filter(b => new Date(b.created_at as string) >= cutoff);
  }, [bookings, range]);

  const confirmed = filtered.filter(b => b.booking_status === 'confirmed' || b.payment_status === 'paid');
  const totalRevenue = confirmed.reduce((s, b) => s + ((b.total_amount as number) || 0), 0);
  const totalGuests  = confirmed.reduce((s, b) => s + ((b.guests as number) || 0), 0);
  const totalNights  = confirmed.reduce((s, b) => s + ((b.nights as number) || 0), 0);
  const avgBooking   = confirmed.length ? Math.round(totalRevenue / confirmed.length) : 0;

  // Hotel-wise breakdown
  const hotelStats = HOTELS.map(hotel => {
    const hb = confirmed.filter(b => b.hotel_slug === hotel.slug);
    const rev = hb.reduce((s, b) => s + ((b.total_amount as number) || 0), 0);
    return { name: hotel.shortName, slug: hotel.slug, bookings: hb.length, revenue: rev, nights: hb.reduce((s, b) => s + ((b.nights as number) || 0), 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = hotelStats[0]?.revenue || 1;

  // Monthly breakdown (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; bookings: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { revenue: 0, bookings: 0 };
    }
    confirmed.forEach(b => {
      const d = new Date(b.created_at as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) { months[key].revenue += (b.total_amount as number) || 0; months[key].bookings++; }
    });
    return Object.entries(months).map(([month, data]) => ({
      label: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      ...data,
    }));
  }, [confirmed]);

  const maxMonthlyRev = Math.max(...monthlyData.map(m => m.revenue), 1);

  function exportCSV() {
    const rows = [
      ['Property', 'Bookings', 'Revenue', 'Nights'],
      ...hotelStats.map(h => [h.name, h.bookings, h.revenue, h.nights]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) return <div className="p-8 text-center text-sm text-gray-400 font-sans">Loading reports…</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-rich">Revenue Reports</h1>
          <p className="text-xs text-gray-500 font-sans mt-1">Business performance across all 9 properties</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-gold-border overflow-hidden">
            {(['7', '30', '90', 'all'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-2 text-[10px] font-sans uppercase tracking-widest transition-colors ${range === r ? 'bg-brand-black text-gold' : 'bg-white text-gray-400 hover:text-brand-rich'}`}>
                {r === 'all' ? 'All Time' : `${r}D`}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-black text-xs py-2 px-4 flex items-center gap-2">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={IndianRupee} color="text-gold" sub={`${confirmed.length} paid bookings`} />
        <StatCard label="Avg Booking Value" value={formatCurrency(avgBooking)} icon={TrendingUp} color="text-green-500" />
        <StatCard label="Total Guest Nights" value={totalNights.toString()} icon={CalendarCheck} color="text-blue-400" sub={`${confirmed.length} bookings`} />
        <StatCard label="Total Guests" value={totalGuests.toString()} icon={Users} color="text-purple-400" />
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white border border-gold-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={16} className="text-gold" />
          <span className="font-serif text-sm text-brand-rich">Monthly Revenue</span>
          <span className="text-[10px] text-gray-400 font-sans ml-2">Last 6 months</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map(m => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[9px] text-gray-400 font-sans">{formatCurrency(m.revenue)}</div>
              <div
                className="w-full bg-gold/20 hover:bg-gold/40 transition-colors relative group cursor-pointer"
                style={{ height: `${Math.max((m.revenue / maxMonthlyRev) * 120, 4)}px` }}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-brand-black text-gold text-[9px] px-2 py-1 font-sans opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {m.bookings} booking{m.bookings !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-[9px] text-gray-500 font-sans">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hotel-wise breakdown */}
      <div className="bg-white border border-gold-border">
        <div className="px-5 py-4 border-b border-gold-border">
          <div className="font-serif text-sm text-brand-rich">Property Performance</div>
          <div className="text-[10px] text-gray-400 font-sans mt-0.5">Ranked by revenue · {range === 'all' ? 'All time' : `Last ${range} days`}</div>
        </div>
        <div className="divide-y divide-gold-border">
          {hotelStats.map((h, i) => (
            <div key={h.slug} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center text-[9px] font-sans text-gold border border-gold-border">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-sans text-brand-rich font-medium">{h.name}</div>
                    <div className="text-[10px] text-gray-400 font-sans">{h.bookings} booking{h.bookings !== 1 ? 's' : ''} · {h.nights} night{h.nights !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-sm text-brand-rich">{formatCurrency(h.revenue)}</div>
                  <div className="text-[10px] text-gray-400 font-sans">{h.bookings > 0 ? formatCurrency(Math.round(h.revenue / h.bookings)) + ' avg' : 'No bookings'}</div>
                </div>
              </div>
              <div className="w-full bg-gold-tint h-1.5">
                <div className="bg-gold h-full transition-all" style={{ width: `${(h.revenue / maxRevenue) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}