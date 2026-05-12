import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Booking fetch error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
