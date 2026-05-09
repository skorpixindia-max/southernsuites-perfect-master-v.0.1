import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import SearchBar from '@/components/hotel/SearchBar';
import { HOTELS } from '@/lib/hotels-data';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

async function getLiveData(): Promise<{
  rates: Record<string, number>;
  names: Record<string, string>;
  images: Record<string, string[]>;
}> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const [ratesRes, settingsRes] = await Promise.all([
      supabase.from('room_rates').select('room_id, price'),
      supabase.from('hotel_settings').select('hotel_slug, hotel_name, images'),
    ]);

    const rates: Record<string, number> = {};
    ratesRes.data?.forEach((r: { room_id: string; price: number }) => {
      rates[r.room_id] = r.price;
    });

    const names: Record<string, string> = {};
    const images: Record<string, string[]> = {};
    settingsRes.data?.forEach((r: { hotel_slug: string; hotel_name: string; images: string[] }) => {
      if (r.hotel_name) names[r.hotel_slug] = r.hotel_name;
      if (r.images && r.images.length > 0) images[r.hotel_slug] = r.images;
    });

    return { rates, names, images };
  } catch {
    return { rates: {}, names: {}, images: {} };
  }
}

export default async function HomePage() {
  const { rates, names, images } = await getLiveData();

  function getStartingPrice(hotelRooms: { id: string; price: number }[]) {
    return Math.min(...hotelRooms.map(r => rates[r.id] ?? r.price));
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-brand-black min-h-[480px] flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          poster="/images/hero-poster.jpg"
        >
          <source src="/images/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black/80" />
        <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px w-12 bg-gold/40" />
            <span className="text-gold text-[10px] tracking-widest uppercase font-sans">
              9 Properties · Andhra Pradesh &amp; Telangana
            </span>
            <div className="h-px w-12 bg-gold/40" />
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-white font-normal leading-tight mb-3">
            Where Every Stay Feels<br />
            <em className="text-gold not-italic">Distinctly Southern</em>
          </h1>
          <p className="text-white/50 text-sm mb-10 font-sans tracking-wide">
            From pilgrim towns to resort escapes — trusted hospitality across 7 cities
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gold">
        <div className="max-w-7xl mx-auto grid grid-cols-4 divide-x divide-black/10">
          {[
            { n: '9', l: 'Properties' },
            { n: '7', l: 'Cities' },
            { n: '4.1★', l: 'Guest Rating' },
            { n: '983+', l: 'Guest Reviews' },
          ].map((s) => (
            <div key={s.l} className="text-center py-4 px-4">
              <div className="font-serif text-2xl text-brand-black">{s.n}</div>
              <div className="text-[9px] text-black/50 tracking-widest uppercase font-sans mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* City strip */}
      <section className="bg-gold-tint border-b border-gold-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-gold-border">
            {[
              { city: 'Tirupati', count: '1 property' },
              { city: 'Nellore', count: '1 property' },
              { city: 'Kakinada', count: '3 properties' },
              { city: 'Vijayawada', count: '1 property' },
              { city: 'Hyderabad', count: '1 property' },
              { city: 'Visakhapatnam', count: '2 properties' },
            ].map((c) => (
              <div key={c.city} className="text-center py-3 px-2">
                <div className="font-serif text-xs text-brand-rich">{c.city}</div>
                <div className="text-[9px] text-gold-dark tracking-wide uppercase font-sans mt-1">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hotel cards */}
      <section id="hotels" className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="section-eyebrow">Our Collection</div>
            <div className="section-title">9 Properties, One Standard of Excellence</div>
          </div>
          <span className="text-xs text-gold-dark border-b border-gold-dark pb-px font-sans cursor-pointer hidden md:block">
            View all properties →
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gold-border">
          {HOTELS.map((hotel) => {
            const uploadedImages = images[hotel.slug];
            const heroImage = uploadedImages?.[0] || null;

            return (
              <div key={hotel.id} className="bg-white group">
                {/* Image area */}
                <div className="h-44 relative overflow-hidden bg-gradient-to-br from-brand-rich to-brand-black">
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={names[hotel.slug] || hotel.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : null}
                  {/* Overlay so badges always readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-end p-3">
                    <span className="text-[9px] text-white/70 font-sans tracking-widest uppercase">{hotel.city}</span>
                    <span className="ml-auto text-[9px] bg-gold text-brand-black px-2 py-1 font-sans tracking-wider uppercase">
                      {hotel.badge}
                    </span>
                  </div>
                  {hotel.featured && <div className="absolute top-3 left-3 w-1 h-8 bg-gold" />}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 className="font-serif text-[15px] text-brand-rich mb-1">
                    {names[hotel.slug] || hotel.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-sans mb-4">{hotel.city}, {hotel.state}</p>
                  <div className="h-px bg-gold-border mb-4" />
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hotel.highlights.slice(0, 3).map((h) => (
                      <span
                        key={h}
                        className="text-[9px] text-gold-dark border border-gold-border px-2 py-1 font-sans uppercase tracking-wide"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wide font-sans">From</div>
                      <span className="font-serif text-xl text-brand-rich">
                        {formatCurrency(getStartingPrice(hotel.rooms))}
                      </span>
                      <span className="text-xs text-gray-400 font-sans">/night</span>
                    </div>
                    <Link href={`/hotels/${hotel.slug}`} className="btn-black text-[10px] px-4 py-2.5">
                      View &amp; Book
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why book direct */}
      <section id="why-book" className="bg-brand-black py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-gold text-[9px] tracking-widest uppercase font-sans mb-2">Why Book Direct</div>
            <div className="font-serif text-white text-2xl">Skip the OTAs. Get More, Pay Less.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/5">
            {[
              { n: '01', title: 'Instant Confirmation', desc: 'Booking confirmed immediately. Invoice on email and WhatsApp within seconds.' },
              { n: '02', title: 'Best Price Guaranteed', desc: 'No OTA commission. No platform fees. You always pay the lowest rate here.' },
              { n: '03', title: 'Free Cancellation', desc: 'Most properties offer free cancellation till check-in. Full flexibility.' },
              { n: '04', title: 'Direct Support', desc: 'Call or WhatsApp any branch. Real people. Real answers. Always.' },
            ].map((w) => (
              <div key={w.n} className="bg-brand-black p-8">
                <div className="font-serif text-3xl text-gold italic mb-3">{w.n}</div>
                <div className="text-white text-sm font-serif mb-2">{w.title}</div>
                <div className="text-white/40 text-xs font-sans leading-6">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
