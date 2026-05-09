'use client';
import { useState, useEffect, useCallback } from 'react';
import { Hotel } from '@/lib/hotels-data';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

function parseImages(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((v) => typeof v === 'string');
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val);
      return Array.isArray(p) ? p.filter((v: unknown) => typeof v === 'string') : [];
    } catch { return []; }
  }
  return [];
}

export default function HotelGallery({ hotel, liveImages }: { hotel: Hotel; liveImages?: unknown }) {
  const live = parseImages(liveImages);
  const base = parseImages(hotel.images);
  const images = live.length > 0 ? live : base.length > 0 ? base : [];
  const hasImages = images.length > 0;

  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (fading || images.length <= 1) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 400);
  }, [fading, images.length]);

  const prev = () => goTo((current - 1 + images.length) % images.length);
  const next = useCallback(() => goTo((current + 1) % images.length), [current, images.length, goTo]);

  // Auto-slide every 4s
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [next, images.length]);

  return (
    <>
      {/* Main gallery */}
      <div className="relative w-full h-[300px] md:h-[500px] overflow-hidden bg-brand-black select-none">
        {hasImages ? (
          <>
            {/* Slides */}
            {images.map((img, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === current ? (fading ? 0 : 1) : 0, zIndex: i === current ? 1 : 0 }}
              >
                <img
                  src={img}
                  alt={`${hotel.name} photo ${i + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightbox(i)}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
              </div>
            ))}

            {/* Arrows */}
            {images.length > 1 && (
              <>
                <button onClick={prev} aria-label="Previous"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2.5 transition-all">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={next} aria-label="Next"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white p-2.5 transition-all">
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-gold' : 'w-1.5 bg-white/40 hover:bg-white/70'}`} />
                ))}
              </div>
            )}

            {/* Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 right-4 z-10 bg-black/50 text-white/70 text-[10px] font-sans px-2 py-1">
                {current + 1} / {images.length}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-rich to-brand-black">
            <ImageIcon size={40} className="text-gold/20" />
            <div className="text-[10px] text-white/20 font-sans uppercase tracking-widest">Photos coming soon</div>
          </div>
        )}

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 py-4">
          <span className="text-[9px] bg-gold text-brand-black px-2 py-1 font-sans uppercase tracking-widest">{hotel.badge}</span>
          <h1 className="font-serif text-xl md:text-3xl text-white mt-2 mb-1">{hotel.name}</h1>
          <div className="text-white/50 text-xs font-sans">{hotel.city}, {hotel.state}</div>
        </div>
      </div>

      {/* Thumbnail strip — only if 3+ images */}
      {images.length >= 3 && (
        <div className="flex gap-1 overflow-x-auto bg-brand-black px-4 pb-2 scrollbar-hide">
          {images.map((img, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`flex-shrink-0 w-16 h-12 overflow-hidden border-b-2 transition-all ${i === current ? 'border-gold opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && hasImages && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white z-10">
            <X size={28} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}
            className="absolute left-4 text-white/60 hover:text-white z-10">
            <ChevronLeft size={36} />
          </button>
          <img src={images[lightbox]} alt=""
            className="max-w-4xl max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}
            className="absolute right-4 text-white/60 hover:text-white z-10">
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-4 text-white/40 text-xs font-sans">
            {lightbox + 1} / {images.length} · {hotel.name}
          </div>
        </div>
      )}
    </>
  );
}