import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + process.env.ADMIN_SECRET_KEY).digest('hex');
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // Super admin check (env-based, no DB needed)
  if (
    email === process.env.SUPER_ADMIN_EMAIL &&
    password === process.env.SUPER_ADMIN_PASSWORD
  ) {
    const response = NextResponse.json({ success: true, name: 'Super Admin', role: 'super_admin' });
    response.cookies.set('admin_session', 'super_admin', { httpOnly: true, maxAge: 86400 * 7 });
    return response;
  }

  // Branch manager check from DB
  try {
    const { data } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (data && data.password_hash === hashPassword(password)) {
      const response = NextResponse.json({ success: true, name: data.name, role: data.role });
      response.cookies.set('admin_session', data.id, { httpOnly: true, maxAge: 86400 * 7 });
      return response;
    }
  } catch {
    // No manager found
  }

  return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
}
