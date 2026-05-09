'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone } from 'lucide-react';
import BookNowPopup from '@/components/hotel/BookNowPopup';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav className="bg-brand-black border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-gold flex items-center justify-center">
                <span className="text-gold font-serif text-xl italic">S</span>
              </div>
              <div>
                <div className="text-white font-serif text-sm tracking-widest">Southern Suites</div>
                <div className="text-gold/50 text-[9px] tracking-widest uppercase font-sans">Hotels &amp; Resorts · 9 Properties</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/#hotels" className="text-white/60 text-xs tracking-widest uppercase hover:text-gold transition-colors font-sans">Our Hotels</Link>
              <Link href="/#why-book" className="text-white/60 text-xs tracking-widest uppercase hover:text-gold transition-colors font-sans">Why Direct</Link>
              <Link href="/#contact" className="text-white/60 text-xs tracking-widest uppercase hover:text-gold transition-colors font-sans">Contact</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a href="tel:08125393888" className="flex items-center gap-2 text-gold/70 text-xs hover:text-gold transition-colors font-sans">
                <Phone size={13} /><span>08125393888</span>
              </a>
              <button onClick={() => setShowBooking(true)} className="btn-gold text-xs px-5 py-2.5">
                Book Now
              </button>
            </div>

            <button className="md:hidden text-white/60 hover:text-gold" onClick={() => setOpen(!open)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden bg-brand-black border-t border-white/10">
            <div className="px-4 py-4 space-y-4">
              <Link href="/#hotels" className="block text-white/60 text-xs tracking-widest uppercase font-sans py-2" onClick={() => setOpen(false)}>Our Hotels</Link>
              <Link href="/#why-book" className="block text-white/60 text-xs tracking-widest uppercase font-sans py-2" onClick={() => setOpen(false)}>Why Direct</Link>
              <Link href="/#contact" className="block text-white/60 text-xs tracking-widest uppercase font-sans py-2" onClick={() => setOpen(false)}>Contact</Link>
              <button onClick={() => { setShowBooking(true); setOpen(false); }} className="block w-full btn-gold text-center text-xs py-3">Book Now</button>
            </div>
          </div>
        )}
      </nav>

      {showBooking && <BookNowPopup onClose={() => setShowBooking(false)} />}
    </>
  );
}
