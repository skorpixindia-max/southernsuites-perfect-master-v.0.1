'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import DateRangePicker from '@/components/hotel/dateragepicker';

export default function HotelSidebar({ hotel, checkIn, checkOut, guests, rooms }: {
  hotel: { name: string; phone: string; mapsLink: string; rooms: { price: number }[] };
  checkIn: string;
  checkOut: string;
  guests: string;
  rooms?: string;
}) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [ci, setCi] = useState(checkIn || today);
  const [co, setCo] = useState(checkOut || tomorrow);
  const [g, setG] = useState(guests || '2');
  const [r, setR] = useState(rooms || '1');

  function getMinCheckout(ciVal: string) {
    const d = new Date(ciVal);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function handleChange(newCi: string, newCo: string, newG: string, newR: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('checkIn', newCi);
    url.searchParams.set('checkOut', newCo);
    url.searchParams.set('guests', newG);
    url.searchParams.set('rooms', newR);
    router.push(url.pathname + url.search);
  }

  function handleCheckIn(val: string) {
    setCi(val);
    const minCo = getMinCheckout(val);
    const newCo = co <= val ? minCo : co;
    setCo(newCo);
    handleChange(val, newCo, g, r);
  }

  return (
    <div className="sticky top-20">
      <div className="border border-gold-border bg-gold-tint p-6">
        <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Starting From</div>
        <div className="font-serif text-3xl text-brand-rich mb-1">
          {formatCurrency(Math.min(...hotel.rooms.map(rm => rm.price)))}
        </div>
        <div className="text-xs text-gray-400 font-sans mb-5">per night + taxes</div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1">Check-in</label>
            <input type="date" value={ci} min={today} className="input-field text-sm"
              onChange={e => handleCheckIn(e.target.value)} />
            <div className="text-[10px] text-gray-400 mt-1 font-sans">From 12:00 PM</div>
          </div>
          <div>
            <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1">Check-out</label>
            <input type="date" value={co} min={getMinCheckout(ci)} className="input-field text-sm"
              onChange={e => { setCo(e.target.value); handleChange(ci, e.target.value, g, r); }} />
            <div className="text-[10px] text-gray-400 mt-1 font-sans">Until 11:00 AM</div>
          </div>
          <div>
            <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1">Guests</label>
            <select value={g} className="input-field text-sm"
              onChange={e => { setG(e.target.value); handleChange(ci, co, e.target.value, r); }}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1">Rooms</label>
            <select value={r} className="input-field text-sm"
              onChange={e => { setR(e.target.value); handleChange(ci, co, g, e.target.value); }}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>

        <a href="#rooms" className="btn-black w-full block text-center text-xs py-3.5 mb-3">Check Availability</a>
        <a href={`https://wa.me/919618138686?text=Hello%2C%20I%20want%20to%20book%20at%20${encodeURIComponent(hotel.name)}`}
          target="_blank" rel="noopener noreferrer"
          className="btn-outline w-full block text-center text-xs py-3">WhatsApp Us</a>

        <div className="mt-5 pt-5 border-t border-gold-border space-y-2">
          {['Free Cancellation (most rooms)', 'Instant Confirmation', 'Best Price — Book Direct', 'Direct Contact'].map(p => (
            <div key={p} className="flex items-center gap-2 text-xs font-sans text-gray-600">
              <div className="w-3 h-px bg-gold flex-shrink-0" />{p}
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gold-border bg-white p-4 mt-3">
        <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Direct Contact</div>
        <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 text-sm font-sans text-brand-rich hover:text-gold transition-colors mb-2">
          <Phone size={13} className="text-gold" />{hotel.phone}
        </a>
        <a href={hotel.mapsLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-sans text-gray-500 hover:text-gold transition-colors">
          <MapPin size={13} className="text-gold" />View on Map
        </a>
      </div>
    </div>
  );
}