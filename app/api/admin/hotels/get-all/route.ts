import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function safeParse(val: unknown): unknown {
  if (!val) return null;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('hotel_settings')
      .select('hotel_slug, hotel_name, custom_description, phone, maps_link, amenities, highlights, rooms, images, is_active, announcement');

    if (error) {
      console.error('get-all error:', error);
      return NextResponse.json({});
    }

    const result: Record<string, object> = {};
    data?.forEach((row) => {
      // Parse jsonb fields (Supabase returns them as objects already if jsonb, strings if text)
      const amenities  = safeParse(row.amenities);
      const highlights = safeParse(row.highlights);
      const rooms      = safeParse(row.rooms);
      const images     = safeParse(row.images);

      result[row.hotel_slug] = {
        name:        row.hotel_name,
        description: row.custom_description,
        phone:       row.phone,
        maps_link:   row.maps_link,
        amenities:   Array.isArray(amenities)  ? amenities  : [],
        highlights:  Array.isArray(highlights) ? highlights : [],
        rooms:       Array.isArray(rooms)      ? rooms      : [],
        images:      Array.isArray(images)     ? images     : [],
        is_active:   row.is_active,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('get-all server error:', err);
    return NextResponse.json({});
  }
}