'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoomType, Hotel } from '@/lib/hotels-data';
import { formatCurrency, calculateTaxes } from '@/lib/utils';
import { Users, BedDouble, Bath, Maximize2, Minus, Plus } from 'lucide-react';

export default function RoomCard({
  room, hotel, checkIn, checkOut, guests, availability,
}: {
  room: RoomType;
  hotel: Hotel;
  checkIn: string;
  checkOut: string;
  guests: string;
  availability?: { total: number; booked: number; available: number };
}) {
  const router = useRouter();
  const [roomCount, setRoomCount] = useState(1);
  const taxes = calculateTaxes(room.price);
  const roomImages: string[] = (room as RoomType & { images?: string[] }).images || [];
  const mainImage = roomImages[0] || null;

  const maxRooms = availability ? availability.available : 10;
  const isSoldOut = availability ? availability.available === 0 : false;
  const isLimitedAvailability = availability && availability.available > 0 && availability.available <= 3;

  function handleBook() {
    if (isSoldOut) return;
    router.push(`/booking/${hotel.slug}?room=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${roomCount}`);
  }

  return (
    <div className={`border bg-white transition-colors duration-200 ${isSoldOut ? 'border-gray-200 opacity-70' : 'border-gold-border hover:border-gold'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Room image */}
        <div className="h-44 md:h-auto relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-brand-rich to-brand-black">
          {mainImage ? (
            <img src={mainImage} alt={room.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="text-gold/20 font-serif text-5xl">{room.name[0]}</div>
              <div className="text-[9px] text-white/20 font-sans">No photo</div>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-serif text-sm bg-red-600 px-3 py-1">Sold Out</span>
            </div>
          )}
          {isLimitedAvailability && !isSoldOut && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] px-2 py-0.5 font-sans">
              Only {availability!.available} left!
            </div>
          )}
          {roomImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 font-sans">
              +{roomImages.length - 1} photos
            </div>
          )}
        </div>

        {/* Room details */}
        <div className="p-5 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
              <h3 className="font-serif text-lg text-brand-rich">{room.name}</h3>
              {room.originalPrice && room.originalPrice > room.price && (
                <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 font-sans">
                  Save {formatCurrency(room.originalPrice - room.price)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500 font-sans">
              <span className="flex items-center gap-1.5"><Maximize2 size={11} className="text-gold" />{room.size}</span>
              <span className="flex items-center gap-1.5"><BedDouble size={11} className="text-gold" />{room.beds}</span>
              <span className="flex items-center gap-1.5"><Bath size={11} className="text-gold" />{room.bathrooms} Bath</span>
              <span className="flex items-center gap-1.5"><Users size={11} className="text-gold" />Max {room.maxGuests} Guests</span>
            </div>

            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-3 h-px bg-gold" />
              <span className="text-[9px] text-gold-dark uppercase tracking-widest font-sans">{room.view}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {room.amenities.slice(0, 6).map((a) => (
                <span key={a} className="text-[9px] text-gold-dark border border-gold-border px-2 py-1 font-sans">{a}</span>
              ))}
              {room.amenities.length > 6 && (
                <span className="text-[9px] text-gray-400 font-sans py-1">+{room.amenities.length - 6} more</span>
              )}
            </div>

            {/* Availability status */}
            {availability && (
              <div className={`text-[10px] font-sans mb-3 flex items-center gap-1.5 ${isSoldOut ? 'text-red-500' : isLimitedAvailability ? 'text-orange-500' : 'text-green-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isSoldOut ? 'bg-red-500' : isLimitedAvailability ? 'bg-orange-500' : 'bg-green-500'}`} />
                {isSoldOut ? 'Hotel is sold out on this date' : isLimitedAvailability ? `Only ${availability.available} room${availability.available > 1 ? 's' : ''} left for these dates` : `${availability.available} rooms available`}
              </div>
            )}

            {!availability && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 font-sans mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Free cancellation till check-in
              </div>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 mt-4 pt-4 border-t border-gold-border">
            <div>
              {room.originalPrice && room.originalPrice > room.price && (
                <div className="text-xs text-gray-400 font-sans line-through">{formatCurrency(room.originalPrice)}</div>
              )}
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-2xl text-brand-rich">{formatCurrency(room.price * roomCount)}</span>
                <span className="text-xs text-gray-400 font-sans">/night</span>
              </div>
              <div className="text-[10px] text-gray-400 font-sans">+{formatCurrency(taxes * roomCount)} taxes · {roomCount} room{roomCount > 1 ? 's' : ''}</div>
            </div>

            <div className="flex items-center gap-3">
              {/* Room count selector */}
              {!isSoldOut && maxRooms > 1 && (
                <div className="flex items-center gap-2 border border-gold-border px-2 py-1">
                  <button onClick={() => setRoomCount(Math.max(1, roomCount - 1))} className="text-gold hover:text-gold-dark">
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-sans text-brand-rich w-4 text-center">{roomCount}</span>
                  <button onClick={() => setRoomCount(Math.min(maxRooms, roomCount + 1))} className="text-gold hover:text-gold-dark">
                    <Plus size={12} />
                  </button>
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={isSoldOut}
                className={`text-xs px-6 py-3 ${isSoldOut ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'btn-black'}`}
              >
                {isSoldOut ? 'Sold Out' : 'Book This Room'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
