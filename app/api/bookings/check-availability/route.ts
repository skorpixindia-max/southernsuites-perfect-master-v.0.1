import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { roomId, hotelSlug, checkIn, checkOut, roomsRequested = 1 } = await req.json();

    if (!roomId || !hotelSlug || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Step 1: Get total rooms in inventory ──────────────────
    const { data: invData } = await supabaseAdmin
      .from('room_inventory')
      .select('total_rooms')
      .eq('room_id', roomId)
      .eq('hotel_slug', hotelSlug)
      .single();

    const totalRooms = invData?.total_rooms ?? 1;

    // ── Step 2: Get all dates between checkIn and checkOut ────
    const dates: string[] = [];
    const cur = new Date(checkIn);
    const end = new Date(checkOut);
    while (cur < end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    if (dates.length === 0) {
      return NextResponse.json({ available: false, availableRooms: 0, totalRooms });
    }

    // ── Step 3: Get max booked rooms on any single night ──────
    // This finds the worst-case night (highest bookings)
    const { data: bookedData } = await supabaseAdmin
      .from('room_availability')
      .select('date, rooms_booked')
      .eq('room_id', roomId)
      .eq('hotel_slug', hotelSlug)
      .in('date', dates);

    // Sum up rooms_booked per date
    const bookedPerDate: Record<string, number> = {};
    bookedData?.forEach((row: { date: string; rooms_booked: number }) => {
      bookedPerDate[row.date] = (bookedPerDate[row.date] || 0) + row.rooms_booked;
    });

    // Find the most constrained night
    let maxBooked = 0;
    for (const date of dates) {
      const booked = bookedPerDate[date] || 0;
      if (booked > maxBooked) maxBooked = booked;
    }

    const availableRooms = Math.max(0, totalRooms - maxBooked);
    const available = availableRooms >= roomsRequested;

    return NextResponse.json({
      available,
      availableRooms,
      totalRooms,
      maxBooked,
    });

  } catch (err) {
    console.error('Availability check error:', err);
    // Safe fallback — never silently show as available
    return NextResponse.json({ available: false, availableRooms: 0, totalRooms: 0 });
  }
}