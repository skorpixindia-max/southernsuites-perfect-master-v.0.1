import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BookingForm from '@/components/booking/BookingForm';
import { getHotelBySlug } from '@/lib/hotels-data';

export default async function BookingPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ room?: string; checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const hotel = getHotelBySlug(slug);
  if (!hotel) notFound();

  const room = hotel.rooms.find((r) => r.id === sp.room) || hotel.rooms[0];
  const checkIn = sp.checkIn || '';
  const checkOut = sp.checkOut || '';
  const guests = sp.guests || '2';

  return (
    <div className="min-h-screen bg-gold-tint">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-0 mb-10 max-w-sm">
          {['Select Room', 'Your Details', 'Payment'].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-7 h-7 text-xs font-sans ${i === 1 ? 'bg-gold text-brand-black' : i < 1 ? 'bg-brand-black text-gold' : 'bg-white border border-gold-border text-gray-400'}`}>
                {i + 1}
              </div>
              <div className={`text-[9px] uppercase tracking-widest font-sans ml-2 mr-4 ${i === 1 ? 'text-gold-dark' : 'text-gray-400'}`}>{step}</div>
              {i < 2 && <div className="w-6 h-px bg-gold-border mr-4" />}
            </div>
          ))}
        </div>
        <BookingForm hotel={hotel} room={room} checkIn={checkIn} checkOut={checkOut} guests={guests} />
      </div>
      <Footer />
    </div>
  );
}
