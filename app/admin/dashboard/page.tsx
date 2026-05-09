'use client';
import { useEffect, useState, useMemo } from 'react';
import { HOTELS } from '@/lib/hotels-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building2, CalendarCheck, IndianRupee, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Booking = Record<string, unknown>;

function StatCard({ label, value, sub, icon: Icon, color, href }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className="bg-white border border-gold-border p-5 hover:border-gold transition-colors h-full">
      <Icon size={18} className={`${color} mb-3`} />
      <div className="font-serif text-2xl text-brand-rich mb-1">{value}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">{label}</div>
      {sub && <div className="text-[10px] text-gray-500 font-sans mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const paid = useMemo(() => bookings.filter(b => b.payment_status === 'paid' || b.booking_status === 'confirmed'), [bookings]);
  const totalRevenue = paid.reduce((s, b) => s + ((b.total_amount as number) || 0), 0);
  const monthlyRevenue = paid
    .filter(b => (b.created_at as string) >= thirtyDaysAgo)
    .reduce((s, b) => s + ((b.total_amount as number) || 0), 0);
  const totalGuests = paid.reduce((s, b) => s + ((b.guests as number) || 0), 0);
  const pendingCount = bookings.filter(b => b.booking_status === 'pending').length;

  const todayCheckIns = bookings.filter(b => b.check_in === today && b.booking_status === 'confirmed');
  const todayCheckOuts = bookings.filter(b => b.check_out === today && b.booking_status === 'confirmed');

  // Hotel-wise booking count
  const hotelStats = HOTELS.map(h => ({
    ...h,
    bookingCount: paid.filter(b => b.hotel_slug === h.slug).length,
    revenue: paid.filter(b => b.hotel_slug === h.slug).reduce((s, b) => s + ((b.total_amount as number) || 0), 0),
  }));

  const stats = [
    { label: 'Total Properties', value: HOTELS.length, icon: Building2, color: 'text-gold', href: '/admin/hotels' },
    { label: 'Total Bookings', value: paid.length, icon: CalendarCheck, color: 'text-green-500', sub: `${pendingCount} pending`, href: '/admin/bookings' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-gold', sub: formatCurrency(monthlyRevenue) + ' this month', href: '/admin/reports' },
    { label: 'Total Guests', value: totalGuests, icon: Users, color: 'text-blue-400', href: '/admin/guests' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-brand-rich">Dashboard</h1>
        <p className="text-xs text-gray-500 font-sans mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}9 Properties · Andhra Pradesh &amp; Telangana
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Today Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gold-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-green-500" />
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">Today's Check-ins</div>
            <span className="ml-auto font-serif text-lg text-brand-rich">{todayCheckIns.length}</span>
          </div>
          {todayCheckIns.length === 0 ? (
            <div className="text-xs text-gray-400 font-sans">No check-ins scheduled for today</div>
          ) : (
            <div className="space-y-2">
              {todayCheckIns.slice(0, 4).map(b => (
                <div key={b.id as string} className="flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="text-brand-rich">{b.guest_name as string}</span>
                    <span className="text-gray-400 ml-1">· {b.hotel_name as string}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{b.room_name as string}</span>
                </div>
              ))}
              {todayCheckIns.length > 4 && (
                <div className="text-[10px] text-gold font-sans">+{todayCheckIns.length - 4} more</div>
              )}
            </div>
          )}
        </div>
        <div className="bg-white border border-gold-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-amber-500" />
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">Today's Check-outs</div>
            <span className="ml-auto font-serif text-lg text-brand-rich">{todayCheckOuts.length}</span>
          </div>
          {todayCheckOuts.length === 0 ? (
            <div className="text-xs text-gray-400 font-sans">No check-outs scheduled for today</div>
          ) : (
            <div className="space-y-2">
              {todayCheckOuts.slice(0, 4).map(b => (
                <div key={b.id as string} className="flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="text-brand-rich">{b.guest_name as string}</span>
                    <span className="text-gray-400 ml-1">· {b.hotel_name as string}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{b.room_name as string}</span>
                </div>
              ))}
              {todayCheckOuts.length > 4 && (
                <div className="text-[10px] text-gold font-sans">+{todayCheckOuts.length - 4} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-gold-border mb-6">
        <div className="px-5 py-4 border-b border-gold-border flex items-center justify-between">
          <div className="font-serif text-sm text-brand-rich">Recent Bookings</div>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-[10px] text-gold font-sans uppercase tracking-widest hover:text-gold-dark">
            View All <ArrowRight size={10} />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400 font-sans">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-sans">No bookings yet</div>
        ) : (
          <div className="divide-y divide-gold-border">
            {bookings.slice(0, 8).map((b, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-sans text-brand-rich font-medium">{b.guest_name as string}</div>
                  <div className="text-[10px] text-gray-400 font-sans">{b.hotel_name as string} · {b.room_name as string}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-gray-400 font-sans whitespace-nowrap">
                    {formatDate(b.check_in as string)} → {formatDate(b.check_out as string)}
                  </div>
                  <div className="font-serif text-sm text-brand-rich">{formatCurrency(b.total_amount as number)}</div>
                  <span className={`text-[9px] px-2 py-1 uppercase tracking-widest font-sans ${
                    b.booking_status === 'confirmed' ? 'bg-green-50 text-green-600' :
                    b.booking_status === 'cancelled' ? 'bg-red-50 text-red-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    {b.booking_status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Properties overview */}
      <div className="bg-white border border-gold-border">
        <div className="px-5 py-4 border-b border-gold-border flex items-center justify-between">
          <div className="font-serif text-sm text-brand-rich">Property Performance</div>
          <Link href="/admin/reports" className="flex items-center gap-1 text-[10px] text-gold font-sans uppercase tracking-widest hover:text-gold-dark">
            Full Report <ArrowRight size={10} />
          </Link>
        </div>
        <div className="divide-y divide-gold-border">
          {hotelStats.sort((a, b) => b.revenue - a.revenue).map(hotel => (
            <div key={hotel.id} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-sans text-brand-rich font-medium">{hotel.name}</div>
                <div className="text-[10px] text-gray-400 font-sans">{hotel.city} · {hotel.rooms.length} room type{hotel.rooms.length > 1 ? 's' : ''}</div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs font-sans text-brand-rich">{hotel.bookingCount} booking{hotel.bookingCount !== 1 ? 's' : ''}</div>
                  <div className="text-[10px] text-gray-400 font-sans">From {formatCurrency(Math.min(...hotel.rooms.map(r => r.price)))}/night</div>
                </div>
                <div className="font-serif text-sm text-brand-rich text-right">{formatCurrency(hotel.revenue)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}