import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const hotelSlug = formData.get('hotelSlug') as string;
    const roomId = formData.get('roomId') as string;

    if (!file || !hotelSlug || !roomId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${hotelSlug}/rooms/${roomId}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Upload to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('hotel-images')
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('UPLOAD ERROR:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('hotel-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('✅ Uploaded:', publicUrl);

    // Step 2: Get current rooms from DB
    const { data: existing } = await supabaseAdmin
      .from('hotel_settings')
      .select('rooms, hotel_name')
      .eq('hotel_slug', hotelSlug)
      .single();

    // Step 3: Parse rooms from jsonb column directly
    let rooms: Record<string, unknown>[] = [];
    if (existing?.rooms) {
      if (Array.isArray(existing.rooms)) {
        rooms = existing.rooms;
      } else if (typeof existing.rooms === 'string') {
        try { rooms = JSON.parse(existing.rooms); } catch { rooms = []; }
      }
    }

    // Step 4: Find room or create it
    const roomIdx = rooms.findIndex((r) => r.id === roomId);
    if (roomIdx !== -1) {
      const currentImages: string[] = (rooms[roomIdx].images as string[]) || [];
      rooms[roomIdx] = { ...rooms[roomIdx], images: [...currentImages, publicUrl] };
    } else {
      rooms.push({ id: roomId, images: [publicUrl] });
    }

    console.log('💾 Saving to rooms column:', JSON.stringify(rooms));

    // Step 5: Save to ROOMS column (not announcement!)
    const { error: saveError } = await supabaseAdmin
      .from('hotel_settings')
      .upsert({
        hotel_slug: hotelSlug,
        hotel_name: existing?.hotel_name || hotelSlug,
        rooms: rooms,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_slug' });

    if (saveError) {
      console.error('SAVE ERROR:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    console.log('✅ Saved to rooms column for:', roomId);
    return NextResponse.json({ success: true, url: publicUrl });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('CRASH:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}