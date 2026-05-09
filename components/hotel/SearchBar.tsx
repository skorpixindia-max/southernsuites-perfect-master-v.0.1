'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HOTELS } from '@/lib/hotels-data';

export default function SearchBar() {
  const router = useRouter();
  const [hotel, setHotel] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  function handleSearch() {
    if (hotel) {
      router.push(`/hotels/${hotel}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut || tomorrow}&guests=${guests}` : ''}`);
    } else {
      document.getElementById('hotels')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className="bg-white border border-gold-border w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-5">
        {/* Property */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Destination</div>
          <select
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans"
          >
            <option value="">All Properties</option>
            {HOTELS.map((h) => (
              <option key={h.id} value={h.slug}>{h.name}</option>
            ))}
          </select>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Tirupati, Hyderabad…</div>
        </div>

        {/* Check-in */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Check-in</div>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans"
          />
          <div className="text-[10px] text-gray-400 mt-1 font-sans">From 12:00 PM</div>
        </div>

        {/* Check-out */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Check-out</div>
          <input
            type="date"
            value={checkOut}
            min={checkIn || tomorrow}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans"
          />
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Until 11:00 AM</div>
        </div>

        {/* Guests */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Guests</div>
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans"
          >
            {[1,2,3,4,5,6].map((n) => (
              <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
            ))}
          </select>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">1 Room</div>
        </div>

        {/* Search button */}
        <div className="flex">
          <button
            onClick={handleSearch}
            className="w-full bg-gold text-brand-black text-xs tracking-widest uppercase font-sans py-4 hover:bg-gold-dark transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
