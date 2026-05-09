import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || !subtotal) {
      return NextResponse.json({ valid: false, error: 'Missing code or subtotal' }, { status: 400 });
    }

    // Fetch promo from DB
    const { data: promo, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' });
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This promo code has expired' });
    }

    // Check max uses
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: 'This promo code has reached its usage limit' });
    }

    // Check minimum amount
    if (promo.min_amount && subtotal < promo.min_amount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum booking amount of ₹${promo.min_amount} required for this code`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * promo.discount_value) / 100);
    } else {
      discountAmount = Math.min(promo.discount_value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      promo: {
        code: promo.code,
        description: promo.description || `${promo.discount_value}${promo.discount_type === 'percentage' ? '%' : '₹'} off`,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('PROMO VALIDATE ERROR:', message);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}