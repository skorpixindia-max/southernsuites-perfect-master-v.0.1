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
    const gold: [number,number,number] = [201,168,76];
    const black: [number,number,number] = [10,10,10];
    const white: [number,number,number] = [255,255,255];
    const lightGold: [number,number,number] = [248,243,229];

    // Header
    doc.setFillColor(...black);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 0, 4, 45, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SOUTHERN SUITES', 15, 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 155, 100);
    doc.text('HOTELS & RESORTS  ·  9 PROPERTIES ACROSS AP & TELANGANA', 15, 28);
    doc.setTextColor(...gold);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 195, 15, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 155, 100);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 195, 22, { align: 'right' });
    doc.text(`GSTIN: ${booking.gst_number || '37CATPM1818B1ZN'}`, 195, 29, { align: 'right' });
    doc.text('SAC Code: 998551', 195, 36, { align: 'right' });

    // Booking ID + Status strip
    doc.setFillColor(...gold);
    doc.rect(0, 45, 105, 14, 'F');
    doc.setTextColor(...black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Booking ID: ${booking.booking_id}`, 8, 54);
    doc.setFillColor(34, 139, 34);
    doc.rect(105, 45, 105, 14, 'F');
    doc.setTextColor(...white);
    doc.text('✓  PAYMENT CONFIRMED', 157, 54, { align: 'center' });

    // Guest + Stay details
    doc.setFillColor(...lightGold);
    doc.rect(0, 59, 210, 55, 'F');
    doc.setTextColor(...black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GUEST DETAILS', 10, 68);
    doc.setDrawColor(...gold);
    doc.line(10, 70, 95, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Name:    ${booking.guest_name}`, 10, 77);
    doc.text(`Email:    ${booking.guest_email}`, 10, 84);
    doc.text(`Phone:  ${booking.guest_phone}`, 10, 91);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...black);
    doc.text('STAY DETAILS', 112, 68);
    doc.line(112, 70, 200, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Property:   ${booking.hotel_name}`, 112, 77);
    doc.text(`Room:       ${booking.room_name}`, 112, 84);
    doc.text(`Check-in:  ${formatDate(booking.check_in as string)} at 12:00 PM`, 112, 91);
    doc.text(`Check-out: ${formatDate(booking.check_out as string)} at 11:00 AM`, 112, 98);
    doc.text(`Duration:   ${booking.nights} Night(s)  ·  ${booking.guests} Guest(s)`, 112, 105);

    // Table
    const roomsCount = (booking.rooms_count as number) || 1;
    const subtotal = (booking.room_price as number) * (booking.nights as number) * roomsCount;
    const discountAmt = (booking.discount_amount as number) || 0;
    const tableBody: string[][] = [
      [
        `${booking.room_name}\n${roomsCount} room(s) × ${booking.nights} night(s)`,
        formatCurrency(booking.room_price as number),
        `${roomsCount} × ${booking.nights}`,
        formatCurrency(subtotal),
      ],
    ];
    if (discountAmt > 0) {
      tableBody.push([`Promo Code: ${booking.promo_code}`, '', '', `−${formatCurrency(discountAmt)}`]);
    }
    tableBody.push(['GST (as applicable)', '', '', formatCurrency(booking.taxes as number)]);
    tableBody.push(['', '', 'TOTAL PAID', formatCurrency(booking.total_amount as number)]);

    autoTable(doc, {
      startY: 120,
      head: [['Description', 'Rate/Night', 'Qty', 'Amount']],
      body: tableBody,
      headStyles: { fillColor: black, textColor: gold, fontSize: 9, fontStyle: 'bold', cellPadding: 5 },
      bodyStyles: { fontSize: 8.5, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      styles: { lineColor: [232, 224, 204], lineWidth: 0.3, overflow: 'linebreak' },
      alternateRowStyles: { fillColor: lightGold },
      didParseCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fillColor = black;
          data.cell.styles.textColor = gold;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
        }
      },
    });

    // Terms
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Terms: Free cancellation available on most room types till check-in. Refunds processed within 5-7 business days.', 10, finalY);
    doc.text('This is a computer-generated invoice and does not require a signature.', 10, finalY + 5);

    // Footer
    const pageH = doc.internal.pageSize.height;
    doc.setFillColor(...black);
    doc.rect(0, pageH - 22, 210, 22, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, pageH - 22, 4, 22, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Hotel Southern Suites · Hotels & Resorts', 15, pageH - 13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 155, 100);
    doc.setFontSize(7.5);
    doc.text('southernsuites.com  ·  bookings@southernsuites.com  ·  +91 96181 38686', 15, pageH - 7);
    doc.setTextColor(...gold);
    doc.text('Thank you for choosing Southern Suites!', 195, pageH - 10, { align: 'right' });

    doc.save(`SouthernSuites-Invoice-${booking.booking_id}.pdf`);
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