import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isCalendar = searchParams.get('calendar') === 'true';
    const roomId = searchParams.get('roomId');
    const hotelSlug = searchParams.get('hotelSlug');

    // Always fetch inventory
    const { data: invData, error: invError } = await supabaseAdmin
      .from('room_inventory')
      .select('room_id, hotel_slug, total_rooms');

    if (invError) throw invError;

    const inventory: Record<string, number> = {};
    invData?.forEach((r: { room_id: string; total_rooms: number }) => {
      inventory[r.room_id] = r.total_rooms;
    });

    // If calendar mode — fetch booked dates for specific room
    if (isCalendar && roomId && hotelSlug) {
      const { data: availData } = await supabaseAdmin
        .from('room_availability')
        .select('date, rooms_booked')
        .eq('room_id', roomId)
        .eq('hotel_slug', hotelSlug)
        .gte('date', new Date().toISOString().split('T')[0]);

      const bookedDates: Record<string, number> = {};
      availData?.forEach((r: { date: string; rooms_booked: number }) => {
        bookedDates[r.date] = (bookedDates[r.date] || 0) + (r.rooms_booked || 1);
      });

      return NextResponse.json({ inventory, bookedDates });
    }

    return NextResponse.json({ inventory, raw: invData });
  } catch (err) {
    console.error('Get inventory error:', err);
    return NextResponse.json({ inventory: {}, bookedDates: {}, raw: [] });
  }
}