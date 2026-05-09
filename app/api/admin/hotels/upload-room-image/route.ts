import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const hotelSlug = formData.get('hotelSlug') as string;
    const roomId = formData.get('roomId') as string;

    if (!file || !hotelSlug || !roomId) {
      return NextResponse.json({ error: 'Missing fields', file: !!file, hotelSlug, roomId }, { status: 400 });
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
      console.error('ROOM UPLOAD ERROR:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('hotel-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('✅ Room image uploaded:', publicUrl);

    // Step 2: Get current hotel settings
    const { data: existing } = await supabaseAdmin
      .from('hotel_settings')
      .select('announcement, hotel_name')
      .eq('hotel_slug', hotelSlug)
      .single();

    // Step 3: Parse existing announcement
    let extra: Record<string, unknown> = {};
    try { extra = JSON.parse(existing?.announcement || '{}'); } catch { extra = {}; }

    // Step 4: Get or create rooms array
    const rooms: Record<string, unknown>[] = (extra.rooms as Record<string, unknown>[]) || [];

    // Step 5: Find room or CREATE it if not found ← THIS WAS THE BUG
    const roomIdx = rooms.findIndex((r) => r.id === roomId);

    if (roomIdx !== -1) {
      // Room exists — add image to it
      const currentImages: string[] = (rooms[roomIdx].images as string[]) || [];
      rooms[roomIdx] = { ...rooms[roomIdx], images: [...currentImages, publicUrl] };
    } else {
      // ✅ Room not found — CREATE new entry with image
      rooms.push({ id: roomId, images: [publicUrl] });
    }

    extra.rooms = rooms;

    console.log('💾 Saving rooms to announcement:', JSON.stringify(extra));

    // Step 6: Save back
    const { error: saveError } = await supabaseAdmin
      .from('hotel_settings')
      .upsert({
        hotel_slug: hotelSlug,
        hotel_name: existing?.hotel_name || hotelSlug,
        announcement: JSON.stringify(extra),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_slug' });

    if (saveError) {
      console.error('ROOM SAVE ERROR:', saveError);
      return NextResponse.json({ error: saveError.message, url: publicUrl }, { status: 500 });
    }

    console.log('✅ Room image saved to DB for room:', roomId);
    return NextResponse.json({ success: true, url: publicUrl });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('ROOM IMAGE CRASH:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}