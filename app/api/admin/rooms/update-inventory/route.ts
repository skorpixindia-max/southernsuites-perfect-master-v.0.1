import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { roomId, hotelSlug, totalRooms } = await req.json();

  if (!roomId || !hotelSlug || totalRooms === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // Use upsert — insert if not exists, update if exists
    const { error } = await supabaseAdmin
      .from('room_inventory')
      .upsert(
        { room_id: roomId, hotel_slug: hotelSlug, total_rooms: totalRooms, updated_at: new Date().toISOString() },
        { onConflict: 'room_id' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update inventory error:', err);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}