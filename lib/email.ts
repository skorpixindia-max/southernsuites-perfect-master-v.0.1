import { Resend } from 'resend';
import { formatCurrency, formatDate } from './utils';

const resend = new Resend(process.env.RESEND_API_KEY ?? 'dummy_key');

export async function sendBookingConfirmationEmail(booking: {
  bookingId: string;
  invoiceNumber?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  hotelName: string;
  hotelPhone: string;
  hotelEmail?: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  roomPrice: number;
  taxes: number;
  totalAmount: number;
  gstNumber?: string;
}) {
  const invoiceNumber = booking.invoiceNumber || booking.bookingId;
  const gstNumber = booking.gstNumber || '37CATPM1818B1ZN';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f9f5ed; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e8e0cc; }
  .header { background: #0a0a0a; padding: 32px; text-align: center; }
  .header h1 { color: #c9a84c; font-family: Georgia, serif; font-size: 22px; margin: 0 0 4px; letter-spacing: 0.1em; }
  .header p { color: rgba(255,255,255,0.5); font-size: 11px; margin: 0; letter-spacing: 0.15em; text-transform: uppercase; }
  .badge { background: #c9a84c; color: #0a0a0a; text-align: center; padding: 12px; font-size: 13px; letter-spacing: 0.05em; }
  .body { padding: 32px; }
  .greeting { font-size: 16px; color: #1a1209; margin-bottom: 24px; font-family: Georgia, serif; }
  .booking-id { background: #f9f5ed; border: 1px solid #e8e0cc; padding: 16px; text-align: center; margin-bottom: 16px; }
  .booking-id-label { font-size: 10px; color: #b8963e; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 6px; }
  .booking-id-val { font-size: 24px; color: #1a1209; font-family: Georgia, serif; letter-spacing: 0.1em; }
  .invoice-row { display: flex; justify-content: space-between; background: #f9f5ed; border: 1px solid #e8e0cc; border-top: none; padding: 8px 16px; margin-bottom: 24px; }
  .invoice-item { font-size: 10px; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.1em; }
  .invoice-item span { display: block; color: #1a1209; font-size: 12px; margin-top: 2px; letter-spacing: 0; text-transform: none; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #b8963e; border-bottom: 1px solid #e8e0cc; padding-bottom: 8px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  td { padding: 8px 0; font-size: 13px; border-bottom: 0.5px solid #f0ebe0; }
  td:first-child { color: #6b6b6b; width: 45%; }
  td:last-child { color: #1a1209; text-align: right; }
  .total-row td { font-size: 15px; font-family: Georgia, serif; border-bottom: none; padding-top: 12px; }
  .gst-note { background: #f9f5ed; border: 1px solid #e8e0cc; padding: 12px 16px; font-size: 11px; color: #6b6b6b; margin-bottom: 24px; line-height: 1.6; }
  .gst-note strong { color: #1a1209; }
  .footer { background: #0a0a0a; padding: 24px; text-align: center; }
  .footer p { color: rgba(255,255,255,0.35); font-size: 11px; line-height: 1.7; margin: 0; }
  .footer a { color: #c9a84c; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Southern Suites</h1>
    <p>Hotels &amp; Resorts · Booking Confirmation</p>
  </div>
  <div class="badge">✓ &nbsp; Your booking is confirmed</div>
  <div class="body">
    <p class="greeting">Dear ${booking.guestName},</p>
    <p style="color:#6b6b6b;font-size:13px;line-height:1.7;margin-bottom:24px;">
      Thank you for choosing Hotel Southern Suites. Your reservation has been confirmed and we look forward to welcoming you.
    </p>

    <div class="booking-id">
      <div class="booking-id-label">Booking Reference</div>
      <div class="booking-id-val">${booking.bookingId}</div>
    </div>
    <div class="invoice-row">
      <div class="invoice-item">Invoice No.<span>${invoiceNumber}</span></div>
      <div class="invoice-item">GST Number<span>${gstNumber}</span></div>
      <div class="invoice-item">SAC Code<span>998551</span></div>
    </div>

    <div class="section-title">Stay Details</div>
    <table>
      <tr><td>Property</td><td>${booking.hotelName}</td></tr>
      <tr><td>Room</td><td>${booking.roomName}</td></tr>
      <tr><td>Check-in</td><td>${formatDate(booking.checkIn)} · 12:00 PM</td></tr>
      <tr><td>Check-out</td><td>${formatDate(booking.checkOut)} · 11:00 AM</td></tr>
      <tr><td>Duration</td><td>${booking.nights} Night${booking.nights > 1 ? 's' : ''}</td></tr>
      <tr><td>Guests</td><td>${booking.guests} Guest${booking.guests > 1 ? 's' : ''}</td></tr>
    </table>

    <div class="section-title">GST Tax Invoice</div>
    <table>
      <tr><td>Room Rate (per night)</td><td>${formatCurrency(booking.roomPrice)}</td></tr>
      <tr><td>Subtotal (${booking.nights} night${booking.nights > 1 ? 's' : ''})</td><td>${formatCurrency(booking.roomPrice * booking.nights)}</td></tr>
      <tr><td>CGST @ 6%</td><td>${formatCurrency(booking.taxes / 2)}</td></tr>
      <tr><td>SGST @ 6%</td><td>${formatCurrency(booking.taxes / 2)}</td></tr>
      <tr class="total-row"><td><strong>Total Paid</strong></td><td><strong>${formatCurrency(booking.totalAmount)}</strong></td></tr>
    </table>

    <div class="gst-note">
      <strong>Tax Invoice — Valid for Business Expense Claims</strong><br>
      GSTIN: ${gstNumber} &nbsp;|&nbsp; SAC: 998551 (Accommodation Services)<br>
      Place of Supply: Andhra Pradesh / Telangana &nbsp;|&nbsp; Type: Intra-State (CGST + SGST)
    </div>

    <div class="section-title">Hotel Contact</div>
    <table>
      <tr><td>Property Phone</td><td><a href="tel:${booking.hotelPhone}" style="color:#c9a84c;">${booking.hotelPhone}</a></td></tr>
      <tr><td>WhatsApp Support</td><td>+91 96181 38686</td></tr>
      ${booking.hotelEmail ? `<tr><td>Property Email</td><td>${booking.hotelEmail}</td></tr>` : ''}
    </table>

    <p style="color:#6b6b6b;font-size:12px;line-height:1.7;margin-top:24px;padding-top:16px;border-top:1px solid #e8e0cc;">
      Please present this confirmation (or your Booking ID) at check-in. Check-in time is 12:00 PM and check-out is 11:00 AM. Same-day check-in is available. This is a computer-generated invoice and does not require a physical signature.
    </p>
  </div>
  <div class="footer">
    <p>Hotel Southern Suites · Hotels &amp; Resorts<br>
    9 Properties across Andhra Pradesh &amp; Telangana<br>
    GSTIN: ${gstNumber}<br>
    <a href="https://southernsuites.com">southernsuites.com</a></p>
  </div>
</div>
</body>
</html>`;

  // Hotel staff notification email (plain, quick read)
  const staffHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background: #f9f5ed; margin: 0; padding: 20px; }
  .container { max-width: 500px; margin: 0 auto; background: #fff; border: 1px solid #e8e0cc; padding: 24px; }
  h2 { color: #c9a84c; font-family: Georgia, serif; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 0; font-size: 13px; border-bottom: 0.5px solid #f0ebe0; }
  td:first-child { color: #6b6b6b; width: 40%; }
  td:last-child { color: #1a1209; font-weight: 500; }
</style>
</head>
<body>
<div class="container">
  <h2>🏨 New Booking — ${booking.hotelName}</h2>
  <table>
    <tr><td>Booking ID</td><td>${booking.bookingId}</td></tr>
    <tr><td>Invoice</td><td>${invoiceNumber}</td></tr>
    <tr><td>Guest Name</td><td>${booking.guestName}</td></tr>
    <tr><td>Guest Phone</td><td>${booking.guestPhone ?? '—'}</td></tr>
    <tr><td>Guest Email</td><td>${booking.guestEmail}</td></tr>
    <tr><td>Room</td><td>${booking.roomName}</td></tr>
    <tr><td>Check-in</td><td>${formatDate(booking.checkIn)}</td></tr>
    <tr><td>Check-out</td><td>${formatDate(booking.checkOut)}</td></tr>
    <tr><td>Nights</td><td>${booking.nights}</td></tr>
    <tr><td>Guests</td><td>${booking.guests}</td></tr>
    <tr><td>Total Paid</td><td>${formatCurrency(booking.totalAmount)}</td></tr>
  </table>
</div>
</body>
</html>`;

  const fromAddress = process.env.EMAIL_FROM || 'bookings@southernsuites.com';

  if (!process.env.RESEND_API_KEY) {
    console.warn('No RESEND_API_KEY — skipping email');
    return;
  }

  try {
    // Send guest confirmation
    await resend.emails.send({
      from: fromAddress,
      to: booking.guestEmail,
      subject: `Booking Confirmed ✓ ${booking.bookingId} | ${booking.hotelName}`,
      html,
    });

    // Send staff copy to hotel email if available
    if (booking.hotelEmail) {
      await resend.emails.send({
        from: fromAddress,
        to: booking.hotelEmail,
        subject: `New Booking — ${booking.bookingId} | ${booking.guestName} | ${formatDate(booking.checkIn)}`,
        html: staffHtml,
      }).catch(console.error); // non-fatal if staff email fails
    }

  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}