import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, status, reason } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Missing bookingId or status' }, { status: 400 });
    }

    const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      booking_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = reason || 'Cancelled by admin';
      updateData.cancelled_by = 'admin';
      updateData.payment_status = 'refund_pending';
    }

    if (status === 'completed') {
      updateData.payment_status = 'paid';
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('booking_id', bookingId);

    if (error) throw error;

    // If cancelling, also insert into cancellation_requests
    if (status === 'cancelled') {
      await supabaseAdmin
        .from('cancellation_requests')
        .upsert({
          booking_id: bookingId,
          guest_reason: reason || 'Cancelled by admin',
          status: 'approved',
          admin_notes: 'Cancelled directly from admin panel',
          requested_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          resolved_by: 'admin',
        }, { onConflict: 'booking_id' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Booking status update error:', err);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}