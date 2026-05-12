import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { hotelSlug, name, description, phone, maps_link, gst_number, email, amenities, highlights, rooms, images } = body;

  if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 });

  try {
    const { error } = await supabaseAdmin
      .from('hotel_settings')
      .upsert({
        hotel_slug:         hotelSlug,
        hotel_name:         name,
        custom_description: description,
        phone:              phone,
        gst_number:         gst_number || null,
        email:              email || null,
        amenities:          amenities   ? JSON.stringify(amenities)   : null,
        highlights:         highlights  ? JSON.stringify(highlights)  : null,
        rooms:              rooms       ? JSON.stringify(rooms)       : null,
        // images stays in its own column — NOT inside announcement
        // only update images if explicitly passed
        ...(images !== undefined && { images: JSON.stringify(images) }),
        announcement: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_slug' });

    if (error) {
      console.error('Hotel update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Hotel update server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}