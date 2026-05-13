'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HOTELS } from '@/lib/hotels-data';
import DateRangePicker from '@/components/hotel/dateragepicker';

export default function SearchBar() {
  const router = useRouter();
  const [hotel, setHotel] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  function handleCheckIn(val: string) {
    setCheckIn(val);
    if (checkOut && checkOut <= val) {
      const next = new Date(val);
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split('T')[0]);
    }
  }

  function handleSearch() {
    const co = checkOut && checkOut > checkIn ? checkOut : (checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : tomorrow);
    if (hotel) {
      router.push(`/hotels/${hotel}?checkIn=${checkIn || today}&checkOut=${co}&guests=${guests}&rooms=${rooms}`);
    } else {
      document.getElementById('hotels')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className="bg-white border border-gold-border w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-6">
        {/* Destination */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Destination</div>
          <select value={hotel} onChange={e => setHotel(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans">
            <option value="">All Properties</option>
            {HOTELS.map(h => <option key={h.id} value={h.slug}>{h.name}</option>)}
          </select>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Tirupati, Hyderabad…</div>
        </div>

        {/* Date Range Picker */}
        <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-gold-border">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onCheckInChange={handleCheckIn}
            onCheckOutChange={setCheckOut}
            minDate={today}
          />
        </div>

        {/* Guests */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Guests</div>
          <select value={guests} onChange={e => setGuests(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
          </select>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Select guests</div>
        </div>

        {/* Rooms */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Rooms</div>
          <select value={rooms} onChange={e => setRooms(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>)}
          </select>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Select rooms</div>
        </div>

        {/* Search */}
        <div className="flex">
          <button onClick={handleSearch}
            className="w-full bg-gold text-brand-black text-xs tracking-widest uppercase font-sans py-4 hover:bg-gold-dark transition-colors">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}