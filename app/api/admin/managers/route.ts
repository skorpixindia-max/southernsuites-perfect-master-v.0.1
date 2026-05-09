import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + (process.env.ADMIN_SECRET_KEY || 'secret')).digest('hex');
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('admins').select('id,name,email,role,hotel_slug,hotel_name,is_active,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, hotel_slug, role } = body;
  const hotel = (await import('@/lib/hotels-data')).HOTELS.find(h => h.slug === hotel_slug);

  try {
    const { error } = await supabaseAdmin.from('admins').insert([{
      name, email,
      password_hash: hashPassword(password),
      role: role || 'branch_manager',
      hotel_slug,
      hotel_name: hotel?.name || hotel_slug,
      is_active: true,
    }]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create manager' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  try {
    const { error } = await supabaseAdmin.from('admins').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
