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

    // ✅ Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid type: ${file.type}. Use JPG, PNG or WebP.` }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${hotelSlug}/rooms/${roomId}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Upload to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('hotel-images')
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('ROOM IMAGE UPLOAD ERROR:', JSON.stringify(uploadError));
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from('hotel-images').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;
    console.log('✅ Room image uploaded:', publicUrl);

    // ✅ Get current hotel settings
    const { data: existing } = await supabaseAdmin
      .from('hotel_settings')
      .select('announcement, images')
      .eq('hotel_slug', hotelSlug)
      .single();

    let extra: Record<string, unknown> = {};
    try { extra = JSON.parse(existing?.announcement || '{}'); } catch {}

    const rooms: Record<string, unknown>[] = (extra.rooms as Record<string, unknown>[]) || [];
    const roomIdx = rooms.findIndex((r) => r.id === roomId);

    if (roomIdx !== -1) {
      const currentImages: string[] = (rooms[roomIdx].images as string[]) || [];
      rooms[roomIdx] = { ...rooms[roomIdx], images: [...currentImages, publicUrl] };
    } else {
      // Room not in overrides yet — add it
      rooms.push({ id: roomId, images: [publicUrl] });
    }

    extra.rooms = rooms;

    // ✅ Save back
    const { error: saveError } = await supabaseAdmin
      .from('hotel_settings')
      .upsert({
        hotel_slug: hotelSlug,
        hotel_name: hotelSlug,
        announcement: JSON.stringify(extra),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_slug' });

    if (saveError) {
      console.error('ROOM IMAGE SAVE ERROR:', JSON.stringify(saveError));
      return NextResponse.json({ error: saveError.message, url: publicUrl }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('ROOM IMAGE CRASH:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}