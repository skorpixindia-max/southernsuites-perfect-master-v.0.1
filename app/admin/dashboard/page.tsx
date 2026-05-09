'use client';
import { useEffect, useState } from 'react';
import { HOTELS } from '@/lib/hotels-data';
import { formatCurrency } from '@/lib/utils';
import { Building2, CalendarCheck, IndianRupee, Users } from 'lucide-react';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then(r => r.json())
      .then(data => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => sum + ((b.total_amount as number) || 0), 0);
  const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed').length;
  const totalGuests = bookings.reduce((sum, b) => sum + ((b.guests as number) || 0), 0);

  const stats = [
    { label: 'Total Properties', value: HOTELS.length, icon: Building2, color: 'text-gold' },
    { label: 'Total Bookings', value: bookings.length, icon: CalendarCheck, color: 'text-green-500' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-gold' },
    { label: 'Total Guests', value: totalGuests, icon: Users, color: 'text-blue-400' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-brand-rich">Dashboard</h1>
        <p className="text-xs text-gray-500 font-sans mt-1">Welcome back. Here is your overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white border border-gold-border p-5">
            <stat.icon size={18} className={`${stat.color} mb-3`} />
            <div className="font-serif text-2xl text-brand-rich mb-1">{stat.value}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white border border-gold-border">
        <div className="px-5 py-4 border-b border-gold-border flex items-center justify-between">
          <div className="font-serif text-sm text-brand-rich">Recent Bookings</div>
          <a href="/admin/bookings" className="text-[10px] text-gold font-sans uppercase tracking-widest hover:text-gold-dark">View All →</a>
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400 font-sans">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-sans">No bookings yet.</div>
        ) : (
          <div className="divide-y divide-gold-border">
            {bookings.slice(0, 8).map((b, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-sans text-brand-rich font-medium">{b.guest_name as string}</div>
                  <div className="text-[10px] text-gray-400 font-sans">{b.hotel_name as string} · {b.room_name as string}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] text-gray-400 font-sans">{b.check_in as string} → {b.check_out as string}</div>
                  <div className="font-serif text-sm text-brand-rich">{formatCurrency(b.total_amount as number)}</div>
                  <span className={`text-[9px] px-2 py-1 uppercase tracking-widest font-sans ${b.booking_status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {b.booking_status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Properties */}
      <div className="mt-6 bg-white border border-gold-border">
        <div className="px-5 py-4 border-b border-gold-border">
          <div className="font-serif text-sm text-brand-rich">All Properties</div>
        </div>
        <div className="divide-y divide-gold-border">
          {HOTELS.map(hotel => (
            <div key={hotel.id} className="px-5 py-3 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-sans text-brand-rich font-medium">{hotel.name}</div>
                <div className="text-[10px] text-gray-400 font-sans">{hotel.address}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[10px] text-gray-400 font-sans">{hotel.rooms.length} room type{hotel.rooms.length > 1 ? 's' : ''}</div>
                <div className="text-xs font-sans text-brand-rich">From {formatCurrency(Math.min(...hotel.rooms.map(r => r.price)))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
