'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Hotel, RoomType } from '@/lib/hotels-data';
import { formatCurrency, calculateNights, calculateTaxes, calculateGSTSlab, generateBookingId } from '@/lib/utils';
import { Shield, CheckCircle, Phone, Tag, X, Loader2 } from 'lucide-react';

declare global {
  interface Window { Razorpay: new (options: object) => { open: () => void }; }
}

interface PromoResult {
  code: string;
  description: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
}

export default function BookingForm({ hotel, room, checkIn, checkOut, guests, rooms = '1' }: {
  hotel: Hotel;
  room: RoomType;
  checkIn: string;
  checkOut: string;
  guests: string;
  rooms?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoResult | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    name: '', email: '', phone: '', special: '',
    checkIn: checkIn || today,
    checkOut: checkOut || tomorrow,
    guests: guests || '2',
  });

  const nights = calculateNights(new Date(form.checkIn), new Date(form.checkOut));
  const roomCount = Math.max(1, parseInt(rooms) || 1);
  const subtotal = room.price * Math.max(nights, 0) * roomCount;
  const gstSlab = calculateGSTSlab(room.price);
  const taxes = calculateTaxes(subtotal, room.price);
  const total = Math.max(0, subtotal + taxes - discountAmount);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'checkIn') {
      const nextDay = new Date(value);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      setForm(prev => ({ ...prev, checkIn: value, checkOut: prev.checkOut <= value ? nextDayStr : prev.checkOut }));
      if (appliedPromo) { setAppliedPromo(null); setDiscountAmount(0); }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  const applyPromo = useCallback(async () => {
    if (!promoInput.trim()) return;
    if (subtotal <= 0) { toast.error('Select valid dates first'); return; }
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), subtotal, hotelSlug: hotel.slug }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo(data.promo);
        setDiscountAmount(data.discountAmount);
        toast.success(`Promo applied — ${formatCurrency(data.discountAmount)} off!`);
      } else {
        toast.error(data.error || 'Invalid promo code');
      }
    } catch {
      toast.error('Could not validate promo code');
    } finally {
      setPromoLoading(false);
    }
  }, [promoInput, subtotal, hotel.slug]);

  function removePromo() {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoInput('');
  }

  function validate(): boolean {
    if (!form.name.trim()) { toast.error('Please enter your full name'); return false; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Enter a valid email address'); return false; }
    const cleaned = form.phone.replace(/\D/g, '');
    if (cleaned.length < 10) { toast.error('Enter a valid mobile number'); return false; }
    if (form.checkIn < today) { toast.error('Check-in cannot be in the past'); return false; }
    if (form.checkOut <= form.checkIn) { toast.error('Check-out must be after check-in'); return false; }
    if (nights < 1) { toast.error('Minimum stay is 1 night'); return false; }
    return true;
  }

  async function handleBooking() {
    if (!validate()) return;
    setLoading(true);

    try {
      const avRes = await fetch('/api/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelSlug: hotel.slug, roomId: room.id, checkIn: form.checkIn, checkOut: form.checkOut }),
      });
      const avData = await avRes.json();
      if (!avData.available) {
        toast.error('Sorry, this room is no longer available for the selected dates.');
        setLoading(false);
        return;
      }
    } catch { /* non-fatal */ }

    const bookingId = generateBookingId();
    try {
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, bookingId }),
      });
      const orderData = await orderRes.json();

      if (!orderData.orderId) {
        await confirmBooking(bookingId, 'DEMO_ORDER', 'DEMO_PAYMENT', 'DEMO_SIGNATURE');
        return;
      }

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: total * 100,
        currency: 'INR',
        name: 'Hotel Southern Suites',
        description: `${hotel.shortName} — ${room.name}`,
        image: '/logo.png',
        order_id: orderData.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#C9A84C' },
        notes: { booking_id: bookingId },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await confirmBooking(bookingId, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled'); } },
      });
      rzp.open();
    } catch (err) {
      console.error('handleBooking error:', err);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function confirmBooking(bookingId: string, orderId: string, paymentId: string, signature: string) {
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId, hotelId: hotel.id, hotelName: hotel.name,
          hotelSlug: hotel.slug, hotelPhone: hotel.phone, hotelEmail: hotel.email,
          roomId: room.id, roomName: room.name,
          guestName: form.name, guestEmail: form.email, guestPhone: form.phone,
          checkIn: form.checkIn, checkOut: form.checkOut,
          nights, guests: parseInt(form.guests),
          roomPrice: room.price, roomsCount: roomCount,
          taxes, totalAmount: total,
          discountAmount, promoCode: appliedPromo?.code || null,
          razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature,
          specialRequests: form.special, gstNumber: hotel.gstNumber,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Booking confirmed!');
        router.push('/confirmation/' + (data.bookingId || bookingId));
      } else {
        toast.error(data.error || 'Booking failed. Please contact us directly.');
        setLoading(false);
      }
    } catch {
      toast.error('Network error. Please contact hotel directly.');
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">

        {/* Stay Details */}
        <div className="bg-white border border-gold-border p-6">
          <div className="section-eyebrow mb-5">Stay Details</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Check-in Date</label>
              <input type="date" name="checkIn" value={form.checkIn} min={today} onChange={handleChange} className="input-field" />
              <div className="text-[10px] text-gray-400 mt-1 font-sans">From 12:00 PM</div>
            </div>
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Check-out Date</label>
              <input type="date" name="checkOut" value={form.checkOut} min={form.checkIn || tomorrow} onChange={handleChange} className="input-field" />
              <div className="text-[10px] text-gray-400 mt-1 font-sans">By 11:00 AM</div>
            </div>
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Guests</label>
              <select name="guests" value={form.guests} onChange={handleChange} className="input-field">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
              </select>
              {nights > 0 && <div className="text-[10px] text-gold-dark mt-1 font-sans">{nights} night{nights > 1 ? 's' : ''}</div>}
            </div>
          </div>
        </div>

        {/* Guest Details */}
        <div className="bg-white border border-gold-border p-6">
          <div className="section-eyebrow mb-5">Guest Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="input-field" autoComplete="name" />
            </div>
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className="input-field" autoComplete="email" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Phone Number *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" className="input-field" autoComplete="tel" />
              <div className="text-[10px] text-gray-400 mt-1 font-sans">Confirmation SMS will be sent to this number</div>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Special Requests (Optional)</label>
            <textarea name="special" value={form.special} onChange={handleChange} placeholder="Early check-in, dietary requirements, extra bed, etc." rows={3} className="input-field resize-none" maxLength={500} />
          </div>
        </div>

        {/* Promo Code */}
        <div className="bg-white border border-gold-border p-6">
          <div className="section-eyebrow mb-4">Have a Promo Code?</div>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <Tag size={14} className="text-green-600" />
                <div>
                  <div className="text-xs font-sans font-semibold text-green-700">{appliedPromo.code}</div>
                  <div className="text-[10px] text-green-600 font-sans">{appliedPromo.description} — {formatCurrency(discountAmount)} saved</div>
                </div>
              </div>
              <button onClick={removePromo} className="text-green-600 hover:text-red-500 transition-colors"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                placeholder="Enter promo code"
                className="input-field flex-1 uppercase tracking-widest text-xs"
                maxLength={30}
              />
              <button onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                className="btn-gold px-5 text-xs disabled:opacity-50 flex items-center gap-2">
                {promoLoading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Policies */}
        <div className="bg-white border border-gold-border p-6">
          <div className="section-eyebrow mb-4">Booking Policies</div>
          <div className="space-y-2 text-xs text-gray-600 font-sans leading-6">
            {[
              'Free cancellation till check-in for most room types',
              'Same-day check-in available — rate remains unchanged',
              'Confirmation email sent immediately after payment',
              'No extra platform fees — you save 15–20% booking direct',
              'GST invoice provided — valid for business expense claims',
              'Secure payment via Razorpay — UPI, Cards, Net Banking, Wallets',
            ].map(p => (
              <div key={p} className="flex items-start gap-2">
                <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-gold-border p-5">
          <div className="section-eyebrow mb-4">Booking Summary</div>
          <div className="bg-brand-black p-4 mb-4">
            <div className="text-gold font-serif text-sm mb-1">{hotel.name}</div>
            <div className="text-white/50 text-xs font-sans">{room.name}</div>
            <div className="text-white/30 text-[10px] font-sans mt-1">{room.size} · {room.beds}</div>
          </div>
          <div className="space-y-2.5 text-xs font-sans">
            {[
              ['Check-in', form.checkIn || '—'],
              ['Check-out', form.checkOut || '—'],
              ['Duration', nights > 0 ? `${nights} Night${nights > 1 ? 's' : ''}` : '—'],
              ['Guests', form.guests],
              ['Rooms', `${roomCount} room${roomCount > 1 ? 's' : ''}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="text-brand-rich">{v}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gold-border mt-4 pt-4 space-y-2 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-gray-500">{roomCount} Room{roomCount > 1 ? 's' : ''} × {Math.max(nights, 0)} night{nights !== 1 ? 's' : ''}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {gstSlab.rate > 0 ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">CGST @ {gstSlab.cgst}%</span>
                  <span>{formatCurrency(taxes / 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST @ {gstSlab.sgst}%</span>
                  <span>{formatCurrency(taxes / 2)}</span>
                </div>
              </>
            ) : (
              <div className="text-[9px] text-gray-400 font-sans">No GST applicable for this room rate</div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo ({appliedPromo?.code})</span>
                <span>−{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-serif text-base border-t border-gold-border pt-3 mt-2">
              <span className="text-brand-rich">Total</span>
              <span className="text-brand-rich">{formatCurrency(total)}</span>
            </div>
            {gstSlab.rate === 0 && (
              <div className="text-[9px] text-gray-400 font-sans">No GST for rooms under ₹2,500/night</div>
            )}
          </div>
        </div>

        <button onClick={handleBooking} disabled={loading || nights < 1}
          className="w-full btn-gold py-4 text-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={13} className="animate-spin" /> Processing…</> : nights < 1 ? 'Select Valid Dates' : `Pay ${formatCurrency(total)} Securely`}
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-sans">
          <Shield size={11} />
          <span>Secured by Razorpay · 256-bit SSL</span>
        </div>

        <div className="bg-white border border-gold-border p-4">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Need Help?</div>
          <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 text-xs font-sans text-brand-rich hover:text-gold transition-colors mb-2">
            <Phone size={12} className="text-gold" /> {hotel.phone}
          </a>
          <a href={`https://wa.me/919618138686?text=Hi%20I%20need%20help%20with%20my%20booking%20at%20${encodeURIComponent(hotel.shortName)}`}
            target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-gold hover:text-gold-dark transition-colors">
            WhatsApp Support →
          </a>
        </div>

        <div className="text-[9px] text-gray-400 font-sans text-center leading-5">
          GSTIN: {hotel.gstNumber || '37CATPM1818B1ZN'}<br />SAC Code: 998551
        </div>
      </div>
    </div>
  );
}