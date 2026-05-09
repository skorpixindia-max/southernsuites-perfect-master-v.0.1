'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!form.email || !form.password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Welcome, ${data.name}`);
      router.push('/admin/dashboard');
    } else {
      toast.error(data.error || 'Invalid credentials');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mx-auto mb-4">
            <span className="text-gold font-serif text-2xl italic">S</span>
          </div>
          <div className="text-gold font-serif text-lg tracking-widest">Southern Suites</div>
          <div className="text-gold/40 text-[9px] tracking-widest uppercase font-sans mt-1">Admin Portal</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8">
          <div className="text-white/60 text-xs uppercase tracking-widest font-sans mb-6">Sign In to Continue</div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[9px] text-gold/70 uppercase tracking-widest font-sans block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="admin@southernsuites.com"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold transition-colors font-sans placeholder:text-white/20"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="text-[9px] text-gold/70 uppercase tracking-widest font-sans block mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold transition-colors font-sans"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-gold py-3.5 text-xs disabled:opacity-60"
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-white/20 text-xs font-sans hover:text-white/40 transition-colors">
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
}
