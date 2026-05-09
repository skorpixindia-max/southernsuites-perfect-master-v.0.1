import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { hotelSlug, imageUrl } = await req.json();
    if (!hotelSlug || !imageUrl) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('hotel_settings')
      .select('images')
      .eq('hotel_slug', hotelSlug)
      .single();

    let currentImages: string[] = [];
    if (Array.isArray(existing?.images)) {
      currentImages = existing.images;
    } else if (typeof existing?.images === 'string') {
      try { currentImages = JSON.parse(existing.images); } catch { currentImages = []; }
    }

    const newImages = currentImages.filter((img: string) => img !== imageUrl);

    await supabaseAdmin
      .from('hotel_settings')
      .update({ images: newImages, updated_at: new Date().toISOString() })
      .eq('hotel_slug', hotelSlug);

    // Also delete from storage
    try {
      const urlParts = imageUrl.split('/hotel-images/');
      if (urlParts[1]) {
        await supabaseAdmin.storage.from('hotel-images').remove([urlParts[1]]);
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, images: newImages });
  } catch (err) {
    console.error('Delete image error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}