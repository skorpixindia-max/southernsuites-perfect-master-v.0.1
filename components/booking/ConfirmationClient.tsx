'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate, getWhatsAppMessage } from '@/lib/utils';
import { CheckCircle, Download, MessageCircle } from 'lucide-react';

export default function ConfirmationClient({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((data) => { setBooking(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [bookingId]);

  async function downloadInvoice() {
    if (!booking) return;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(201, 168, 76);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'normal');
    doc.text('SOUTHERN SUITES', 105, 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(150, 130, 90);
    doc.text('HOTELS & RESORTS  ·  BOOKING INVOICE', 105, 28, { align: 'center' });

    // Booking ID badge
    doc.setFillColor(201, 168, 76);
    doc.rect(15, 48, 80, 12, 'F');
    doc.setTextColor(10, 10, 10);
    doc.setFontSize(10);
    doc.text(`Booking ID: ${booking.booking_id}`, 55, 56.5, { align: 'center' });

    // Status
    doc.setFillColor(240, 249, 240);
    doc.rect(105, 48, 90, 12, 'F');
    doc.setTextColor(20, 120, 20);
    doc.setFontSize(9);
    doc.text('✓ PAYMENT CONFIRMED', 150, 56.5, { align: 'center' });

    // Guest details
    doc.setTextColor(26, 18, 9);
    doc.setFontSize(11);
    doc.text('Guest Details', 15, 75);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text([
      `Name: ${booking.guest_name}`,
      `Email: ${booking.guest_email}`,
      `Phone: ${booking.guest_phone}`,
    ], 15, 83);

    // Stay details
    doc.setTextColor(26, 18, 9);
    doc.setFontSize(11);
    doc.text('Stay Details', 110, 75);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text([
      `Property: ${booking.hotel_name}`,
      `Room: ${booking.room_name}`,
      `Check-in: ${formatDate(booking.check_in as string)} · 12:00 PM`,
      `Check-out: ${formatDate(booking.check_out as string)} · 11:00 AM`,
      `Duration: ${booking.nights} Night(s)`,
    ], 110, 83);

    // Invoice table
    autoTable(doc, {
      startY: 120,
      head: [['Description', 'Rate', 'Nights', 'Amount']],
      body: [
        [
          booking.room_name as string,
          formatCurrency(booking.room_price as number),
          `${booking.nights} × ${(booking.rooms_count as number) || 1} room`,
          formatCurrency((booking.room_price as number) * (booking.nights as number) * ((booking.rooms_count as number) || 1))
        ],
        ...((booking.discount_amount as number) > 0 ? [[`Promo (${booking.promo_code})`, '', '', `−${formatCurrency(booking.discount_amount as number)}`]] : []),
        ['GST', '', '', formatCurrency(booking.taxes as number)],
        ['', '', 'Total Paid', formatCurrency(booking.total_amount as number)],
      ],
      headStyles: { fillColor: [10, 10, 10], textColor: [201, 168, 76], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 }, 3: { halign: 'right' } },
      styles: { lineColor: [232, 224, 204], lineWidth: 0.3 },
    });

    // Footer
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.setFillColor(10, 10, 10);
    doc.rect(0, finalY, 210, 25, 'F');
    doc.setTextColor(150, 130, 90);
    doc.setFontSize(8);
    doc.text('Hotel Southern Suites · Hotels & Resorts · southernsuites.com', 105, finalY + 10, { align: 'center' });
    doc.text('9 Properties across Andhra Pradesh & Telangana', 105, finalY + 17, { align: 'center' });

    doc.save(`Invoice-${booking.booking_id}.pdf`);
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="font-serif text-brand-rich text-lg">Loading your booking…</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20 bg-white border border-gold-border p-10">
        <div className="font-serif text-brand-rich text-xl mb-2">Booking Not Found</div>
        <p className="text-sm text-gray-500 font-sans">Please check your booking ID or contact us directly.</p>
      </div>
    );
  }

  const waMsg = getWhatsAppMessage({
    bookingId: booking.booking_id as string,
    guestName: booking.guest_name as string,
    hotelName: booking.hotel_name as string,
    roomName: booking.room_name as string,
    checkIn: booking.check_in as string,
    checkOut: booking.check_out as string,
    nights: booking.nights as number,
    totalAmount: booking.total_amount as number,
  });

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-brand-black p-8 text-center">
        <CheckCircle className="text-gold mx-auto mb-4" size={40} />
        <h1 className="font-serif text-2xl text-white mb-2">Booking Confirmed!</h1>
        <p className="text-white/50 text-sm font-sans mb-4">Your reservation is confirmed. A confirmation has been sent to your email.</p>
        <div className="inline-block bg-gold px-6 py-2">
          <div className="text-[9px] text-brand-black/60 uppercase tracking-widest font-sans mb-1">Booking Reference</div>
          <div className="font-serif text-xl text-brand-black">{booking.booking_id as string}</div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-gold-border p-6">
        <div className="section-eyebrow mb-5">Reservation Details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm font-sans">
            <div className="text-[9px] text-gold-dark uppercase tracking-widest mb-3">Stay Information</div>
            {[
              ['Property', booking.hotel_name as string],
              ['Room', booking.room_name as string],
              ['Check-in', `${formatDate(booking.check_in as string)} · 12:00 PM`],
              ['Check-out', `${formatDate(booking.check_out as string)} · 11:00 AM`],
              ['Duration', `${booking.nights} Night(s)`],
              ['Guests', `${booking.guests}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="text-brand-rich font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3 text-sm font-sans">
            <div className="text-[9px] text-gold-dark uppercase tracking-widest mb-3">Payment Summary</div>
            {[
              ['Room Rate/night', formatCurrency(booking.room_price as number)],
              ['Rooms Booked', `${(booking.rooms_count as number) || 1} room(s)`],
              [`Subtotal (${booking.nights} nights × ${(booking.rooms_count as number) || 1} room)`, formatCurrency((booking.room_price as number) * (booking.nights as number) * ((booking.rooms_count as number) || 1))],
              ['GST', formatCurrency(booking.taxes as number)],
              ...((booking.discount_amount as number) > 0 ? [[`Promo (${booking.promo_code})`, `−${formatCurrency(booking.discount_amount as number)}`]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="text-brand-rich">{v}</span>
              </div>
            ))}
            <div className="flex justify-between font-serif text-base border-t border-gold-border pt-3">
              <span>Total Paid</span>
              <span className="text-gold">{formatCurrency(booking.total_amount as number)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={downloadInvoice} className="btn-black flex items-center gap-2 text-xs py-3 px-5">
          <Download size={13} /> Download Invoice (PDF)
        </button>

        <a
          href={`https://wa.me/919618138686?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold flex items-center gap-2 text-xs py-3 px-5"
        >
          <MessageCircle size={13} /> Share on WhatsApp
        </a>

        <a href="/" className="btn-outline flex items-center gap-2 text-xs py-3 px-5">
          Back to Home
        </a>

        <a
          href={`mailto:bookings@southernsuites.com?subject=Cancellation Request — ${booking.booking_id}&body=Booking ID: ${booking.booking_id}%0AName: ${booking.guest_name}%0AProperty: ${booking.hotel_name}%0ACheck-in: ${booking.check_in}%0AReason: `}
          className="text-xs font-sans text-red-400 hover:text-red-600 transition-colors underline py-3"
        >
          Request Cancellation
        </a>
      </div>
    </div>
  );
}