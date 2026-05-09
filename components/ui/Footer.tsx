import Link from 'next/link';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { HOTELS } from '@/lib/hotels-data';

const CONTACT_NUMBERS = [
  { label: 'Tirupati',     number: '08125393888' },
  { label: 'Nellore',      number: '08612372901' },
  { label: 'Kakinada',     number: '09515614666' },
  { label: 'Vijayawada',   number: '07993986633' },
  { label: 'Hyderabad',    number: '+919618138686' },
  { label: 'Vizag (Resort)', number: '09059228901' },
  { label: 'Vizag (Suites)', number: '08912948901' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div>
            <div className="font-serif text-2xl text-gold mb-2 tracking-wide">Southern Suites</div>
            <div className="text-white/30 text-[10px] uppercase tracking-widest font-sans mb-4">Hotels &amp; Resorts</div>
            <p className="text-white/40 text-xs font-sans leading-6 mb-5">
              9 properties across Andhra Pradesh &amp; Telangana. Where every stay feels distinctly Southern.
            </p>
            <a
              href="https://wa.me/919618138686"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white text-xs font-sans px-4 py-2.5"
            >
              <MessageCircle size={13} /> WhatsApp Us
            </a>
          </div>

          {/* Properties */}
          <div>
            <div className="text-[10px] text-gold/60 uppercase tracking-widest font-sans mb-4">Our Properties</div>
            <div className="space-y-2">
              {HOTELS.map(hotel => (
                <Link key={hotel.slug} href={`/hotels/${hotel.slug}`}
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-gold transition-colors font-sans">
                  <MapPin size={10} className="flex-shrink-0 text-white/20" />
                  {hotel.shortName} — {hotel.city}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-[10px] text-gold/60 uppercase tracking-widest font-sans mb-4">Quick Links</div>
            <div className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/#hotels', label: 'All Properties' },
                { href: '/#about', label: 'About Us' },
                { href: '/#contact', label: 'Contact' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="block text-xs text-white/40 hover:text-gold transition-colors font-sans">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-[10px] text-gold/60 uppercase tracking-widest font-sans mb-3">Policies</div>
              <div className="space-y-2 text-xs text-white/40 font-sans">
                <div>Free Cancellation Available</div>
                <div>Same-day Check-in</div>
                <div>GST Invoice Provided</div>
                <div>Direct Booking — Best Rate</div>
              </div>
            </div>
          </div>

          {/* Contact numbers */}
          <div>
            <div className="text-[10px] text-gold/60 uppercase tracking-widest font-sans mb-4">Property Contacts</div>
            <div className="space-y-2.5">
              {CONTACT_NUMBERS.map(({ label, number }) => (
                <div key={label} className="flex items-start gap-2">
                  <Phone size={10} className="text-white/20 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] text-gold/40 font-sans uppercase tracking-widest">{label}</div>
                    <a href={`tel:${number.replace(/\s/g, '')}`}
                      className="text-xs text-white/50 hover:text-gold transition-colors font-sans">
                      {number}
                    </a>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 mt-3">
                <Mail size={10} className="text-white/20 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[9px] text-gold/40 font-sans uppercase tracking-widest">Central Email</div>
                  <a href="mailto:bookings@southernsuites.com"
                    className="text-xs text-white/50 hover:text-gold transition-colors font-sans">
                    bookings@southernsuites.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-white/25 font-sans">
            © {year} Hotel Southern Suites. All rights reserved. GSTIN: 37CATPM1818B1ZN
          </div>
          <div className="text-[10px] text-white/20 font-sans text-center">
            Secured payments via Razorpay · Direct booking — no platform fees · 9 properties · AP &amp; Telangana
          </div>
        </div>
      </div>
    </footer>
  );
}