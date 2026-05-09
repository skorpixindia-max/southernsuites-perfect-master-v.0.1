import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('GET promo codes error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const { error, data } = await supabaseAdmin
      .from('promo_codes')
      .insert([{
        code:           body.code?.toUpperCase().trim(),
        description:    body.description || '',
        discount_type:  body.discount_type,
        discount_value: body.discount_value,
        min_amount:     body.min_amount || 0,
        max_discount:   body.max_discount || null,
        usage_limit:    body.usage_limit || null,
        valid_from:     body.valid_from || new Date().toISOString().split('T')[0],
        valid_until:    body.valid_until || null,
        is_active:      body.is_active ?? true,
      }])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('POST promo codes error:', err);
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  try {
    const { error } = await supabaseAdmin
      .from('promo_codes')
      .update({
        code:           body.code?.toUpperCase().trim(),
        description:    body.description,
        discount_type:  body.discount_type,
        discount_value: body.discount_value,
        min_amount:     body.min_amount,
        max_discount:   body.max_discount || null,
        usage_limit:    body.usage_limit || null,
        valid_from:     body.valid_from,
        valid_until:    body.valid_until || null,
        is_active:      body.is_active,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', body.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT promo codes error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE promo codes error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}