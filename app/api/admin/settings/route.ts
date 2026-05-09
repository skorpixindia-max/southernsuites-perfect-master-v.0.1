import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data } = await supabaseAdmin.from('site_settings').select('*');
    const settings: Record<string, string> = {};
    (data || []).forEach((row: { key: string; value: string }) => { settings[row.key] = row.value; });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    for (const [key, value] of Object.entries(body)) {
      await supabaseAdmin.from('site_settings').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
