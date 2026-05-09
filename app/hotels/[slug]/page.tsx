import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import HotelGallery from '@/components/hotel/HotelGallery';
import RoomCard from '@/components/hotel/RoomCard';
import HotelSidebar from '@/components/hotel/HotelSidebar';
import { getHotelBySlug, HOTELS, Hotel, RoomType } from '@/lib/hotels-data';
import { MapPin, Phone, Star, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

async function getHotelLiveData(slug: string, checkIn: string, checkOut: string) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [settingsRes, ratesRes, invRes, bookedRes] = await Promise.all([
      supabase.from('hotel_settings').select('*').eq('hotel_slug', slug).single(),
      supabase.from('room_rates').select('*'),
      supabase.from('room_inventory').select('room_id, total_rooms').eq('hotel_slug', slug),
      checkIn && checkOut
  ? supabase.from('room_availability').select('room_id, rooms_booked').eq('hotel_slug', slug).gte('date', checkIn).lt('date', checkOut)
  : Promise.resolve({ data: [] }),
    ]);

    let overrides: Record<string, unknown> = {};
    if (settingsRes.data) {
  let extra: Record<string, unknown> = {};

  try {
    extra = JSON.parse(settingsRes.data.announcement || '{}');
  } catch {}

  overrides = {
    name: settingsRes.data.hotel_name,
    description: settingsRes.data.custom_description,
    images: settingsRes.data.images || [],
    rooms: settingsRes.data.rooms || extra.rooms || [],
    ...extra,
  };
}

    const rates: Record<string, { price: number; original_price: number }> = {};
    ratesRes.data?.forEach((r: { room_id: string; price: number; original_price: number }) => { rates[r.room_id] = r; });

    const bookedCount: Record<string, number> = {};
    (bookedRes as { data: { room_id: string; rooms_booked: number }[] | null }).data?.forEach((b) => {
      bookedCount[b.room_id] = Math.max(bookedCount[b.room_id] || 0, b.rooms_booked || 1);
    });

    const availability: Record<string, { total: number; booked: number; available: number }> = {};
    invRes.data?.forEach((inv: { room_id: string; total_rooms: number }) => {
      const booked = bookedCount[inv.room_id] || 0;
      availability[inv.room_id] = { total: inv.total_rooms, booked, available: Math.max(0, inv.total_rooms - booked) };
    });

    return { overrides, rates, availability };
  } catch { return { overrides: {}, rates: {}, availability: {} }; }
}

function mergeHotelData(hotel: Hotel, overrides: Record<string, unknown>, rates: Record<string, { price: number; original_price: number }>): Hotel {
  const overrideRooms = (overrides.rooms as RoomType[] | undefined) || [];

  // Merge base rooms with override rooms by ID
  const mergedRooms = hotel.rooms.map((baseRoom: RoomType) => {
    const overrideRoom = overrideRooms.find((r: RoomType) => r.id === baseRoom.id);
    const rateData = rates[baseRoom.id];
    return {
      ...baseRoom,
      ...(overrideRoom || {}),
      id: baseRoom.id, // always keep original ID
      images: overrideRoom?.images?.length ? overrideRoom.images : baseRoom.images,
      price: rateData ? rateData.price : (overrideRoom?.price ?? baseRoom.price),
      originalPrice: rateData ? rateData.original_price : (overrideRoom?.originalPrice ?? baseRoom.originalPrice),
    };
  });

  // Also add any NEW rooms created in admin (with generated IDs)
  const newRooms = overrideRooms.filter(
    (r: RoomType) => !hotel.rooms.find((base) => base.id === r.id)
  );

  return {
    ...hotel,
    name: (overrides.name as string) || hotel.name,
    description: (overrides.description as string) || hotel.description,
    longDescription: (overrides.description as string) || hotel.longDescription,
    phone: (overrides.phone as string) || hotel.phone,
    mapsLink: (overrides.maps_link as string) || hotel.mapsLink,
    amenities: (overrides.amenities as string[]) || hotel.amenities,
    highlights: (overrides.highlights as string[]) || hotel.highlights,
    rooms: [...mergedRooms, ...newRooms],
  };
}

export async function generateStaticParams() {
  return HOTELS.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hotel = getHotelBySlug(slug);
  if (!hotel) return {};
  return { title: hotel.name, description: hotel.longDescription };
}

export default async function HotelPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const hotelBase = getHotelBySlug(slug);
  if (!hotelBase) notFound();

  const checkIn = sp.checkIn || '';
  const checkOut = sp.checkOut || '';
  const guests = sp.guests || '2';

  const { overrides, rates, availability } = await getHotelLiveData(slug, checkIn, checkOut);
  const hotel = mergeHotelData(hotelBase!, overrides, rates);
  let liveImages: string[] = [];
  const rawImages = overrides.images as string[] | string | undefined;
  if (Array.isArray(rawImages)) {
  liveImages = rawImages;
   } else if (typeof rawImages === 'string') {
  try { liveImages = JSON.parse(rawImages); } catch { liveImages = []; }
}

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="bg-gold-tint border-b border-gold-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs font-sans text-gray-400">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/#hotels" className="hover:text-gold transition-colors">Hotels</Link>
          <ChevronRight size={12} />
          <span className="text-brand-rich">{hotel.name}</span>
        </div>
      </div>
      <HotelGallery hotel={hotel} liveImages={liveImages} />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <span className="text-[9px] bg-gold text-brand-black px-3 py-1 uppercase tracking-widest font-sans">{hotel.badge}</span>
                  <h1 className="font-serif text-3xl text-brand-rich mt-3 mb-2">{hotel.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-sans">
                    <MapPin size={13} className="text-gold" /><span>{hotel.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-brand-black px-4 py-2">
                  <Star size={14} className="text-gold fill-gold" />
                  <span className="text-gold font-serif text-lg">{hotel.rating}</span>
                  <span className="text-white/40 text-xs font-sans">({hotel.reviews} reviews)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-gold-border">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-sans"><Clock size={13} className="text-gold" />Check-in: {hotel.checkIn}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-sans"><Clock size={13} className="text-gold" />Check-out: {hotel.checkOut}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                  <Phone size={13} className="text-gold" />
                  <a href={`tel:${hotel.phone}`} className="hover:text-gold transition-colors">{hotel.phone}</a>
                </div>
              </div>
            </div>
            <div>
              <div className="section-eyebrow">About This Property</div>
              <p className="text-sm text-gray-600 font-sans leading-7">{hotel.longDescription}</p>
            </div>
            <div>
              <div className="section-eyebrow">Property Highlights</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {hotel.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs font-sans text-brand-rich border border-gold-border px-3 py-2">
                    <div className="w-1 h-1 bg-gold rounded-full flex-shrink-0" />{h}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-eyebrow">Amenities</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {hotel.amenities.map((a) => (
                  <span key={a} className="text-[10px] font-sans text-gold-dark border border-gold-border px-3 py-1.5 uppercase tracking-wide">{a}</span>
                ))}
              </div>
            </div>
            <div id="rooms">
              <div className="section-eyebrow">Available Rooms</div>
              <div className="text-[10px] font-sans text-gray-400 mb-5">
                {checkIn && checkOut ? `Availability for ${checkIn} → ${checkOut}` : 'Select dates above to check live availability.'}
              </div>
              <div className="space-y-4">
                {hotel.rooms.map((room) => (
                  <RoomCard key={room.id} room={room} hotel={hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} availability={availability[room.id]} />
                ))}
              </div>
            </div>
            <div>
              <div className="section-eyebrow">Location</div>
              <div className="border border-gold-border overflow-hidden mt-3">
  <iframe
    src={`https://maps.google.com/maps?q=${encodeURIComponent(hotel.name + ', ' + hotel.city + ', ' + hotel.state)}&z=16&output=embed`}
    width="100%"
    height="300"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  />
</div>
              <a href={hotel.mapsLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-xs text-gold font-sans hover:text-gold-dark transition-colors">
                <MapPin size={12} />Open in Google Maps →
              </a>
            </div>
          </div>
          <div className="lg:col-span-1">
            <HotelSidebar hotel={hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
