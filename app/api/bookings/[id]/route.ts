import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { bookingId, status, cancellationReason } = await req.json();

  if (!bookingId || !status) {
    return NextResponse.json({ error: 'bookingId and status required' }, { status: 400 });
  }

  const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const updateData: Record<string, unknown> = {
      booking_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = cancellationReason || 'Admin cancelled';
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('booking_id', bookingId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Status update error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}