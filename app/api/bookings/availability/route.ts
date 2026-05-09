import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelSlug = searchParams.get('hotelSlug');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  if (!hotelSlug) return NextResponse.json({ availability: [] });

  try {
    let query = supabaseAdmin
      .from('room_availability')
      .select('room_id, date, rooms_booked')
      .eq('hotel_slug', hotelSlug);

    if (roomId) query = query.eq('room_id', roomId);

    // If date range provided, filter to just those dates
    if (checkIn && checkOut) {
      query = query.gte('date', checkIn).lt('date', checkOut);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ availability: data || [] });
  } catch (err) {
    console.error('Availability fetch error:', err);
    return NextResponse.json({ availability: [] });
  }
}