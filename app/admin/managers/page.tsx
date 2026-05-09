'use client';
import { useState, useEffect } from 'react';
import { HOTELS } from '@/lib/hotels-data';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminManagers() {
  const [managers, setManagers] = useState<Record<string, unknown>[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', hotel_slug: '', role: 'branch_manager' });

  useEffect(() => {
    fetch('/api/admin/managers').then(r => r.json()).then(d => setManagers(Array.isArray(d) ? d : []));
  }, []);

  async function addManager() {
    if (!form.name || !form.email || !form.password || !form.hotel_slug) { toast.error('Fill all fields'); return; }
    const res = await fetch('/api/admin/managers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Manager account created');
      setAdding(false);
      setForm({ name: '', email: '', password: '', hotel_slug: '', role: 'branch_manager' });
      const data = await fetch('/api/admin/managers').then(r => r.json());
      setManagers(Array.isArray(data) ? data : []);
    } else {
      toast.error('Failed to create manager');
    }
  }

  async function deleteManager(id: string) {
    if (!confirm('Delete this manager account?')) return;
    await fetch(`/api/admin/managers?id=${id}`, { method: 'DELETE' });
    setManagers(managers.filter(m => m.id !== id));
    toast.success('Manager removed');
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-2xl text-brand-rich">Branch Managers</h1>
          <p className="text-xs text-gray-500 font-sans mt-1">Create accounts for branch managers with limited access to their property bookings only.</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-black text-xs py-2.5 px-5 flex items-center gap-2">
          <Plus size={13} /> Add Manager
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-gold p-5 mb-5">
          <div className="text-sm font-serif text-brand-rich mb-4">New Branch Manager</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Full Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field text-sm" placeholder="Manager name" />
            </div>
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field text-sm" placeholder="manager@southernsuites.com" />
            </div>
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field text-sm" placeholder="Set a strong password" />
            </div>
            <div>
              <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Assigned Property</label>
              <select value={form.hotel_slug} onChange={e => setForm({...form, hotel_slug: e.target.value})} className="input-field text-sm">
                <option value="">Select property…</option>
                {HOTELS.map(h => <option key={h.id} value={h.slug}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addManager} className="btn-gold text-xs py-2.5 px-5">Create Account</button>
            <button onClick={() => setAdding(false)} className="btn-outline text-xs py-2.5 px-5">Cancel</button>
          </div>
        </div>
      )}

      {/* Manager list */}
      <div className="bg-white border border-gold-border">
        <div className="px-5 py-4 border-b border-gold-border bg-brand-black">
          <div className="text-[9px] text-gold uppercase tracking-widest font-sans">Active Managers ({managers.length})</div>
        </div>
        {managers.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-400 font-sans">No branch managers yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-gold-border">
            {managers.map((m) => {
              const hotel = HOTELS.find(h => h.slug === m.hotel_slug);
              return (
                <div key={m.id as string} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gold-tint border border-gold-border flex items-center justify-center flex-shrink-0">
                      <UserCheck size={15} className="text-gold-dark" />
                    </div>
                    <div>
                      <div className="text-sm font-sans text-brand-rich">{m.name as string}</div>
                      <div className="text-xs text-gray-400 font-sans">{m.email as string}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-sans text-brand-rich">{hotel?.name || (m.hotel_slug as string)}</div>
                    <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans">{hotel?.badge || 'Branch Manager'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-sans px-2 py-1 ${m.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {m.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button onClick={() => deleteManager(m.id as string)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
