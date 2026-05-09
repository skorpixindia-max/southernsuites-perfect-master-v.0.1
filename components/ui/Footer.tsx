import Link from 'next/link';
import { HOTELS } from '@/lib/hotels-data';

const BRANCH_PHONES = [
  { city: 'Tirupati',       phone: '08125393888',  tel: '08125393888' },
  { city: 'Nellore',        phone: '08612372901',  tel: '08612372901' },
  { city: 'Kakinada',       phone: '09515614666',  tel: '09515614666' },
  { city: 'Vijayawada',     phone: '07993986633',  tel: '07993986633' },
  { city: 'Hyderabad',      phone: '+91 9618138686', tel: '919618138686' },
  { city: 'Vizag (Resort)', phone: '09059228901',  tel: '09059228901' },
  { city: 'Vizag (Central)',phone: '08912948901',  tel: '08912948901' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-rich text-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="text-gold font-serif text-lg tracking-widest mb-1">Southern Suites</div>
            <div className="text-gold/40 text-[9px] tracking-widest uppercase font-sans mb-4">
              Hotels &amp; Resorts · Est. 2021
            </div>
            <p className="text-xs leading-7 font-sans">
              9 properties across Andhra Pradesh and Telangana. From pilgrimage cities to resort
              destinations — trusted hospitality, one stay at a time.
            </p>
          </div>

          {/* Properties */}
          <div>
            <h4 className="text-[9px] text-gold tracking-widest uppercase font-sans mb-4">Our Properties</h4>
            <ul className="space-y-2">
              {HOTELS.map((h) => (
                <li key={h.id}>
                  <Link href={`/hotels/${h.slug}`} className="text-xs font-sans hover:text-gold transition-colors">
                    {h.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links — removed /#offers and /admin/login */}
          <div>
            <h4 className="text-[9px] text-gold tracking-widest uppercase font-sans mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs font-sans">
              <li><Link href="/" className="hover:text-gold transition-colors">Book a Room</Link></li>
              <li><Link href="/#why-book" className="hover:text-gold transition-colors">Why Book Direct</Link></li>
              <li><Link href="/#hotels" className="hover:text-gold transition-colors">Our Properties</Link></li>
              <li>
                <a href="https://wa.me/919618138686" target="_blank" rel="noopener noreferrer"
                  className="hover:text-gold transition-colors">
                  WhatsApp Support
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-gold transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact — all numbers now tappable */}
          <div>
            <h4 className="text-[9px] text-gold tracking-widest uppercase font-sans mb-4">Contact</h4>
            <ul className="space-y-2 text-xs font-sans">
              {BRANCH_PHONES.map(b => (
                <li key={b.city} className="flex items-center gap-2">
                  <span className="text-white/30 text-[9px] w-20 flex-shrink-0">{b.city}</span>
                  <a href={`tel:${b.tel}`} className="hover:text-gold transition-colors">
                    {b.phone}
                  </a>
                </li>
              ))}
              <li className="pt-1">
                <a href="https://wa.me/919618138686" target="_blank" rel="noopener noreferrer"
                  className="text-gold/70 hover:text-gold transition-colors">
                  WhatsApp Us →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-[10px] font-sans tracking-wide">
            © {year} Hotel Southern Suites. All rights reserved.
          </span>
          <div className="w-8 h-px bg-gold/30" />
          <span className="text-[10px] font-sans tracking-wide">Made with care in India</span>
        </div>
      </div>
    </footer>
  );
}