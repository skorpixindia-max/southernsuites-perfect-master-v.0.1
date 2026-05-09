import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .or(`guest_name.ilike.%${q}%,guest_email.ilike.%${q}%,guest_phone.ilike.%${q}%,booking_id.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Guest lookup error:', err);
    return NextResponse.json([], { status: 500 });
  }
}