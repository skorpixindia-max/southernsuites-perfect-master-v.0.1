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

    const ext = file.name.split('.').pop();
    const fileName = `${hotelSlug}/rooms/${roomId}-${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('hotel-images')
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 });

    const { data: urlData } = supabaseAdmin.storage.from('hotel-images').getPublicUrl(fileName);

    // Get current hotel settings
    const { data: existing } = await supabaseAdmin
      .from('hotel_settings')
      .select('announcement')
      .eq('hotel_slug', hotelSlug)
      .single();

    let extra: Record<string, unknown> = {};
    try { extra = JSON.parse(existing?.announcement || '{}'); } catch {}

    const rooms: Record<string, unknown>[] = (extra.rooms as Record<string, unknown>[]) || [];
    const roomIdx = rooms.findIndex((r) => r.id === roomId);
    
    if (roomIdx !== -1) {
      const currentImages: string[] = (rooms[roomIdx].images as string[]) || [];
      rooms[roomIdx] = { ...rooms[roomIdx], images: [...currentImages, urlData.publicUrl] };
    }

    extra.rooms = rooms;

    await supabaseAdmin.from('hotel_settings').upsert({
      hotel_slug: hotelSlug,
      announcement: JSON.stringify(extra),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'hotel_slug' });

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
