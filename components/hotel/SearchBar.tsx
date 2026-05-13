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
    const co = checkOut && checkOut > checkIn
      ? checkOut
      : checkIn
        ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
        : tomorrow;
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

        {/* Check-in */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Check-in</div>
          <input type="date" value={checkIn} min={today}
            onChange={e => handleCheckIn(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans" />
          <div className="text-[10px] text-gray-400 mt-1 font-sans">From 12:00 PM</div>
        </div>

        {/* Check-out */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Check-out</div>
          <input type="date" value={checkOut}
            min={checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : tomorrow}
            onChange={e => setCheckOut(e.target.value)}
            className="w-full text-sm text-brand-rich bg-transparent outline-none cursor-pointer font-sans" />
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Until 11:00 AM</div>
        </div>

        {/* Guests */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Guests</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setGuests(g => String(Math.max(1, parseInt(g) - 1)))}
              className="text-gold font-sans text-base leading-none">−</button>
            <span className="text-sm text-brand-rich font-sans flex-1 text-center">{guests}</span>
            <button onClick={() => setGuests(g => String(Math.min(6, parseInt(g) + 1)))}
              className="text-gold font-sans text-base leading-none">+</button>
          </div>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Guest{parseInt(guests) > 1 ? 's' : ''}</div>
        </div>

        {/* Rooms */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gold-border text-left">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Rooms</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRooms(r => String(Math.max(1, parseInt(r) - 1)))}
              className="text-gold font-sans text-base leading-none">−</button>
            <span className="text-sm text-brand-rich font-sans flex-1 text-center">{rooms}</span>
            <button onClick={() => setRooms(r => String(Math.min(5, parseInt(r) + 1)))}
              className="text-gold font-sans text-base leading-none">+</button>
          </div>
          <div className="text-[10px] text-gray-400 mt-1 font-sans">Room{parseInt(rooms) > 1 ? 's' : ''}</div>
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