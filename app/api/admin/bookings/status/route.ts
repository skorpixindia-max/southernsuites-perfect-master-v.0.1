import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, status, cancellationReason, reason } = await req.json();
    const resolvedReason = cancellationReason || reason || 'Cancelled by admin';

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing bookingId or status' }, { status: 400 });
    }

    const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Build only columns that exist in your schema
    const updateData: Record<string, unknown> = {
      booking_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = 'admin';
      updateData.cancellation_reason = resolvedReason;
      updateData.payment_status = 'refund_pending';
    }

    if (status === 'completed') {
      updateData.payment_status = 'paid';
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('booking_id', bookingId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log to cancellation_requests if cancelling
    if (status === 'cancelled') {
      const { error: cancelError } = await supabaseAdmin
        .from('cancellation_requests')
        .upsert({
          booking_id: bookingId,
          guest_reason: resolvedReason,
          status: 'approved',
          admin_notes: 'Cancelled directly from admin panel',
          requested_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin',
        }, { onConflict: 'booking_id' });

      if (cancelError) {
        // Non-fatal — booking is already cancelled, just log it
        console.warn('cancellation_requests insert warning:', cancelError.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Booking status update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}