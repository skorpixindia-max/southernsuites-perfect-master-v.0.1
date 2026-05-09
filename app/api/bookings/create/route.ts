import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingConfirmationEmail } from '@/lib/email';

function getDatesBetween(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const isDemo = body.razorpayPaymentId === 'DEMO_PAYMENT';
  const invoiceNumber = `SS${Date.now()}`; // ✅ No RPC call

  try {
    // ✅ Only core columns that exist in every setup
    const bookingData: Record<string, unknown> = {
      booking_id:          body.bookingId,
      hotel_id:            body.hotelId,
      hotel_name:          body.hotelName,
      hotel_slug:          body.hotelSlug,
      room_id:             body.roomId,
      room_name:           body.roomName,
      guest_name:          body.guestName,
      guest_email:         body.guestEmail,
      guest_phone:         body.guestPhone,
      check_in:            body.checkIn,
      check_out:           body.checkOut,
      nights:              body.nights,
      guests:              body.guests,
      room_price:          body.roomPrice,
      taxes:               body.taxes,
      total_amount:        body.totalAmount,
      payment_status:      isDemo ? 'pending' : 'paid',
      booking_status:      isDemo ? 'pending' : 'confirmed',
      razorpay_order_id:   body.razorpayOrderId  || null,
      razorpay_payment_id: body.razorpayPaymentId || null,
      razorpay_signature:  body.razorpaySignature || null,
      special_requests:    body.specialRequests  || null,
      rooms_count:         (body.roomsCount as number) || 1,
      discount_amount:     (body.discountAmount as number) || 0,
      promo_code:          (body.promoCode as string) || null,
      invoice_number:      invoiceNumber,
      gst_number:          (body.gstNumber as string) || '37CATPM1818B1ZN',
    };

    console.log('💾 Inserting booking:', body.bookingId);

    const { error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert([bookingData]);

    if (bookingError) {
      console.error('❌ INSERT ERROR:', JSON.stringify(bookingError));
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    console.log('✅ Booking saved:', body.bookingId);

    // Room availability — non fatal
    if (body.checkIn && body.checkOut) {
      const nightDates = getDatesBetween(body.checkIn as string, body.checkOut as string);
      if (nightDates.length > 0) {
        const availRows = nightDates.map((date) => ({
          hotel_slug:   body.hotelSlug,
          room_id:      body.roomId,
          date,
          rooms_booked: (body.roomsCount as number) || 1,
          booking_id:   body.bookingId,
        }));
        await supabaseAdmin.from('room_availability').insert(availRows)
          .then(({ error }) => { if (error) console.error('⚠️ AVAIL ERROR (non-fatal):', error.message); });
      }
    }

    // Email — non fatal
    sendBookingConfirmationEmail({
      bookingId:    body.bookingId   as string,
      invoiceNumber,
      guestName:    body.guestName   as string,
      guestEmail:   body.guestEmail  as string,
      guestPhone:   body.guestPhone  as string,
      hotelName:    body.hotelName   as string,
      hotelPhone:   (body.hotelPhone as string) || '',
      hotelEmail:   (body.hotelEmail as string) || '',
      roomName:     body.roomName    as string,
      checkIn:      body.checkIn     as string,
      checkOut:     body.checkOut    as string,
      nights:       body.nights      as number,
      guests:       body.guests      as number,
      roomPrice:    body.roomPrice   as number,
      taxes:        body.taxes       as number,
      totalAmount:  body.totalAmount as number,
      gstNumber:    (body.gstNumber as string) || '37CATPM1818B1ZN',
    }).catch((e) => console.error('📧 EMAIL ERROR (non-fatal):', e));

    return NextResponse.json({ success: true, bookingId: body.bookingId, invoiceNumber });

  } catch (err) {
    console.error('💥 ROUTE CRASH:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
