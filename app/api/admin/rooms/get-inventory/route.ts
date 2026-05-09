import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('room_inventory')
      .select('room_id, hotel_slug, total_rooms');

    if (error) throw error;

    const inventory: Record<string, number> = {};
    data?.forEach((r: { room_id: string; total_rooms: number }) => {
      inventory[r.room_id] = r.total_rooms;
    });

    return NextResponse.json({ inventory, raw: data });
  } catch (err) {
    console.error('Get inventory error:', err);
    return NextResponse.json({ inventory: {}, raw: [] });
  }
}