import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/bookings/availability?hotelSlug=tirupati&checkIn=2026-04-09&checkOut=2026-04-10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotelSlug = searchParams.get('hotelSlug');
    const checkIn   = searchParams.get('checkIn');
    const checkOut  = searchParams.get('checkOut');

    if (!hotelSlug || !checkIn || !checkOut) {
      return NextResponse.json({});
    }

    // Get all dates in range
    const dates: string[] = [];
    const cur = new Date(checkIn);
    const end = new Date(checkOut);
    while (cur < end) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // Get inventory for all rooms in this hotel
    const { data: inventory } = await supabaseAdmin
      .from('room_inventory')
      .select('room_id, total_rooms')
      .eq('hotel_slug', hotelSlug);

    // Get all booked dates for this hotel in range
    const { data: booked } = await supabaseAdmin
      .from('room_availability')
      .select('room_id, date, rooms_booked')
      .eq('hotel_slug', hotelSlug)
      .in('date', dates);

    // Calculate available rooms per room_id
    const result: Record<string, { total: number; booked: number; available: number }> = {};

    inventory?.forEach((inv: { room_id: string; total_rooms: number }) => {
      // Find max booked on any single night for this room
      const bookedPerDate: Record<string, number> = {};
      booked?.forEach((b: { room_id: string; date: string; rooms_booked: number }) => {
        if (b.room_id === inv.room_id) {
          bookedPerDate[b.date] = (bookedPerDate[b.date] || 0) + b.rooms_booked;
        }
      });

      let maxBooked = 0;
      for (const date of dates) {
        const d = bookedPerDate[date] || 0;
        if (d > maxBooked) maxBooked = d;
      }

      result[inv.room_id] = {
        total: inv.total_rooms,
        booked: maxBooked,
        available: Math.max(0, inv.total_rooms - maxBooked),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Availability GET error:', err);
    return NextResponse.json({});
  }
}