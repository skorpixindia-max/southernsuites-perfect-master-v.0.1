import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, price, originalPrice } = body;

  try {
    await supabaseAdmin.from('room_rates').upsert({
      room_id: roomId,
      price,
      original_price: originalPrice,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'room_id' });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
