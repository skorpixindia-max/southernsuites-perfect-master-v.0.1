'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Hotel, RoomType } from '@/lib/hotels-data';
import { formatCurrency, calculateNights, calculateTaxes, generateBookingId } from '@/lib/utils';
import { Shield, CheckCircle, Phone } from 'lucide-react';

declare global {
  interface Window { Razorpay: new (options: object) => { open: () => void }; }
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
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    special: '',
    checkIn: checkIn || today,
    checkOut: checkOut || tomorrow,
    guests: guests || '2',
  });
  const nights = calculateNights(new Date(form.checkIn), new Date(form.checkOut));
  const roomCount = Math.max(1, parseInt(rooms) || 1);
  const subtotal = room.price * Math.max(nights, 0) * roomCount;
  const taxes = calculateTaxes(subtotal);
  const total = subtotal + taxes;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'checkIn') {
      const nextDay = new Date(value);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      setForm((prev) => ({
        ...prev,
        checkIn: value,
        checkOut: prev.checkOut <= value ? nextDayStr : prev.checkOut,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  function validate(): boolean {
    if (!form.name.trim()) { toast.error('Please enter your full name'); return false; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Enter a valid email address'); return false; }
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) { toast.error('Enter a valid 10-digit phone number'); return false; }
    if (form.checkIn < today) { toast.error('Check-in date cannot be in the past'); return false; }
    if (form.checkOut <= form.checkIn) { toast.error('Check-out must be after check-in'); return false; }
    if (nights < 1) { toast.error('Minimum stay is 1 night'); return false; }
    return true;
  }

  async function handleBooking() {
    if (!validate()) return;
    setLoading(true);
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
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: total * 100,
          currency: 'INR',
          name: 'Hotel Southern Suites',
          description: hotel.shortName + ' - ' + room.name,
          order_id: orderData.orderId,
          prefill: { name: form.name, email: form.email, contact: form.phone },
          theme: { color: '#C9A84C' },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) => {
            await confirmBooking(bookingId, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
          },
          modal: {
            ondismiss: () => { setLoading(false); toast.error('Payment cancelled'); },
          },
        });
        rzp.open();
      };
      script.onerror = () => { toast.error('Failed to load payment gateway.'); setLoading(false); };
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
          bookingId,
          hotelId: hotel.id,
          hotelName: hotel.name,
          hotelSlug: hotel.slug,
          hotelPhone: hotel.phone,
          hotelEmail: hotel.email,
          roomId: room.id,
          roomName: room.name,
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          nights,
          guests: parseInt(form.guests),
          roomPrice: room.price,
          roomsCount: roomCount,
          taxes,
          totalAmount: total,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          specialRequests: form.special,
          gstNumber: hotel.gstNumber,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Booking confirmed!');
        router.push('/confirmation/' + (data.bookingId || bookingId));
      } else {
        console.error('Booking API error:', data);
        toast.error(data.error || 'Booking failed. Please contact us directly.');
        setLoading(false);
      }
    } catch (err) {
      console.error('confirmBooking crash:', err);
      toast.error('Network error. Please contact hotel directly.');
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
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
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                ))}
              </select>
              {nights > 0 && (
                <div className="text-[10px] text-gold-dark mt-1 font-sans">{nights} night{nights > 1 ? 's' : ''}</div>
              )}
            </div>
          </div>
        </div>
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
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Special Requests (Optional)</label>
            <textarea name="special" value={form.special} onChange={handleChange} placeholder="Early check-in, dietary requirements, extra bed, etc." rows={3} className="input-field resize-none" />
          </div>
        </div>
        <div className="bg-white border border-gold-border p-6">
          <div className="section-eyebrow mb-4">Booking Policies</div>
          <div className="space-y-2 text-xs text-gray-600 font-sans leading-6">
            {[
              'Free cancellation till check-in for most rooms',
              'Same-day check-in available. Rate remains the same.',
              'Confirmation sent to your email immediately after payment',
              'No extra platform fees — you book direct, you save 15-20%',
              'GST invoice provided — valid for business expense claims',
            ].map((p) => (
              <div key={p} className="flex items-start gap-2">
                <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-gold-border p-5">
          <div className="section-eyebrow mb-4">Booking Summary</div>
          <div className="bg-brand-black p-4 mb-4">
            <div className="text-gold font-serif text-sm mb-1">{hotel.name}</div>
            <div className="text-white/50 text-xs font-sans">{room.name}</div>
            <div className="text-white/30 text-[10px] font-sans mt-1">{room.size} · {room.beds}</div>
          </div>
          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-gray-500">Check-in</span>
              <span className="text-brand-rich">{form.checkIn || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-out</span>
              <span className="text-brand-rich">{form.checkOut || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="text-brand-rich">{nights > 0 ? nights + ' Night' + (nights > 1 ? 's' : '') : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Guests</span>
              <span className="text-brand-rich">{form.guests}</span>
            </div>
          </div>
          <div className="border-t border-gold-border mt-4 pt-4 space-y-2 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-gray-500">Room x {Math.max(nights, 0)} night{nights !== 1 ? 's' : ''}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST (12%)</span>
              <span>{formatCurrency(taxes)}</span>
            </div>
            <div className="flex justify-between font-serif text-base border-t border-gold-border pt-3 mt-2">
              <span className="text-brand-rich">Total</span>
              <span className="text-brand-rich">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleBooking}
          disabled={loading || nights < 1}
          className="w-full btn-gold py-4 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : nights < 1 ? 'Select Valid Dates' : 'Pay ' + formatCurrency(total) + ' Securely'}
        </button>
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-sans">
          <Shield size={11} />
          <span>Secured by Razorpay · 256-bit SSL</span>
        </div>
        <div className="bg-white border border-gold-border p-4">
          <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Need Help?</div>
          <a href={'tel:' + hotel.phone} className="flex items-center gap-2 text-xs font-sans text-brand-rich hover:text-gold transition-colors mb-2">
            <Phone size={12} className="text-gold" />
            {hotel.phone}
          </a>
          <a href={'https://wa.me/919618138686?text=Hi%20I%20need%20help%20with%20booking%20at%20' + encodeURIComponent(hotel.shortName)} target="_blank" rel="noopener noreferrer" className="text-xs font-sans text-gold hover:text-gold-dark transition-colors">
            WhatsApp Us
          </a>
        </div>
        <div className="text-[9px] text-gray-400 font-sans text-center">
          GST No: {hotel.gstNumber}
        </div>
      </div>
    </div>
  );
}