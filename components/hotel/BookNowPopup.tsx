'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HOTELS } from '@/lib/hotels-data';
import { X, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';

export default function BookNowPopup({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [step, setStep] = useState<'hotel' | 'dates'>('hotel');
  const [selected, setSelected] = useState({ hotel: '', checkIn: today, checkOut: tomorrow, guests: '2' });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleBook() {
    if (!selected.hotel) return;
    router.push(`/hotels/${selected.hotel}?checkIn=${selected.checkIn}&checkOut=${selected.checkOut}&guests=${selected.guests}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="bg-brand-black px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-gold font-serif text-lg">Book Your Stay</div>
            <div className="text-white/40 text-[10px] font-sans tracking-widest uppercase">9 Properties · Best Rate Guaranteed</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Property Selection */}
          <div>
            <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-2 flex items-center gap-1.5">
              <MapPin size={10} /> Select Property
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto">
              {HOTELS.map(hotel => (
                <button key={hotel.id} onClick={() => setSelected({ ...selected, hotel: hotel.slug })}
                  className={`text-left px-4 py-3 border transition-colors flex items-center justify-between ${selected.hotel === hotel.slug ? 'border-gold bg-gold-tint' : 'border-gold-border hover:border-gold'}`}>
                  <div>
                    <div className={`text-xs font-sans font-medium ${selected.hotel === hotel.slug ? 'text-brand-rich' : 'text-gray-700'}`}>{hotel.name}</div>
                    <div className="text-[10px] text-gray-400 font-sans mt-0.5">{hotel.city}, {hotel.state}</div>
                  </div>
                  {selected.hotel === hotel.slug && <ChevronRight size={13} className="text-gold flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Dates & Guests */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1.5 flex items-center gap-1"><Calendar size={9} /> Check-in</div>
              <input type="date" value={selected.checkIn} min={today}
                onChange={e => setSelected({ ...selected, checkIn: e.target.value })}
                className="w-full border border-gold-border text-xs px-2 py-2 font-sans outline-none focus:border-gold" />
              <div className="text-[9px] text-gray-400 font-sans mt-1">From 12:00 PM</div>
            </div>
            <div>
              <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1.5 flex items-center gap-1"><Calendar size={9} /> Check-out</div>
              <input type="date" value={selected.checkOut} min={selected.checkIn || tomorrow}
                onChange={e => setSelected({ ...selected, checkOut: e.target.value })}
                className="w-full border border-gold-border text-xs px-2 py-2 font-sans outline-none focus:border-gold" />
              <div className="text-[9px] text-gray-400 font-sans mt-1">Until 11:00 AM</div>
            </div>
            <div>
              <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1.5 flex items-center gap-1"><Users size={9} /> Guests</div>
              <select value={selected.guests} onChange={e => setSelected({ ...selected, guests: e.target.value })}
                className="w-full border border-gold-border text-xs px-2 py-2 font-sans outline-none focus:border-gold">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
              </select>
              <div className="text-[9px] text-gray-400 font-sans mt-1">1 Room</div>
            </div>
          </div>

          {/* Book button */}
          <button onClick={handleBook} disabled={!selected.hotel}
            className={`w-full py-4 text-xs tracking-widest uppercase font-sans transition-colors ${selected.hotel ? 'bg-gold text-brand-black hover:bg-gold-dark' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {selected.hotel ? `View Rooms & Book →` : 'Select a Property First'}
          </button>

          <div className="flex justify-center gap-6 text-[10px] text-gray-400 font-sans">
            <span>✓ Free Cancellation</span>
            <span>✓ Best Price Direct</span>
            <span>✓ Instant Confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
