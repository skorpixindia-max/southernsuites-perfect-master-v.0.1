import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { hotelSlug, roomId, checkIn, checkOut } = await req.json();

  if (!hotelSlug || !roomId || !checkIn || !checkOut) {
    return NextResponse.json({ available: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get total inventory for this room
    const { data: invData, error: invError } = await supabaseAdmin
      .from('room_inventory')
      .select('total_rooms')
      .eq('room_id', roomId)
      .eq('hotel_slug', hotelSlug)
      .single();

    if (invError || !invData) {
      // No inventory record = treat as 1 room available (fallback)
      return NextResponse.json({ available: true, totalRooms: 1, bookedRooms: 0 });
    }

    const totalRooms = invData.total_rooms;

    // Get all booked dates overlapping with requested range
    // room_availability has one row per date per booking
    const { data: bookedData, error: bookedError } = await supabaseAdmin
      .from('room_availability')
      .select('date, rooms_booked')
      .eq('room_id', roomId)
      .eq('hotel_slug', hotelSlug)
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (bookedError) throw bookedError;

    // Find the max rooms booked on any single date in the range
    // (worst case day = determines availability)
    let maxBookedOnAnyDay = 0;
    const dateMap: Record<string, number> = {};

    (bookedData || []).forEach((row) => {
      dateMap[row.date] = (dateMap[row.date] || 0) + (row.rooms_booked || 1);
      if (dateMap[row.date] > maxBookedOnAnyDay) {
        maxBookedOnAnyDay = dateMap[row.date];
      }
    });

    const available = maxBookedOnAnyDay < totalRooms;
    const remainingRooms = Math.max(0, totalRooms - maxBookedOnAnyDay);

    return NextResponse.json({
      available,
      totalRooms,
      bookedRooms: maxBookedOnAnyDay,
      remainingRooms,
    });
  } catch (err) {
    console.error('Check availability error:', err);
    return NextResponse.json({ available: true, totalRooms: 1, bookedRooms: 0 });
  }
}