'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Promo = {
  id: string;
  code: string;
  description: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  min_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY: Partial<Promo> = {
  code: '', description: '', discount_type: 'percentage',
  discount_value: 10, min_amount: 0, max_discount: null,
  usage_limit: null, valid_from: new Date().toISOString().split('T')[0],
  valid_until: null, is_active: true,
};

export default function AdminPromoCodes() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Promo>>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/promo-codes');
    const data = await res.json();
    setPromos(Array.isArray(data) ? data : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing({ ...EMPTY }); setShowForm(true); }
  function openEdit(p: Promo) { setEditing({ ...p }); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(EMPTY); }

  async function save() {
    if (!editing.code?.trim()) { toast.error('Code is required'); return; }
    if (!editing.discount_value || editing.discount_value <= 0) { toast.error('Enter a valid discount value'); return; }
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/promo-codes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editing.id ? 'Promo code updated' : 'Promo code created');
        closeForm();
        load();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch { toast.error('Server error'); }
    finally { setSaving(false); }
  }

  async function toggleActive(promo: Promo) {
    await fetch('/api/admin/promo-codes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...promo, is_active: !promo.is_active }),
    });
    load();
  }

  async function deletePromo(id: string) {
    if (!confirm('Delete this promo code? This cannot be undone.')) return;
    await fetch('/api/admin/promo-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    toast.success('Promo code deleted');
    load();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-rich">Promo Codes</h1>
          <p className="text-xs text-gray-500 font-sans mt-1">Create and manage discount codes for guests</p>
        </div>
        <button onClick={openNew} className="btn-gold text-xs py-2.5 px-5 flex items-center gap-2">
          <Plus size={13} /> New Promo Code
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-gold-border p-10 text-center text-sm text-gray-400 font-sans">Loading…</div>
      ) : promos.length === 0 ? (
        <div className="bg-white border border-gold-border p-10 text-center">
          <Tag size={32} className="text-gold/30 mx-auto mb-3" />
          <div className="font-serif text-brand-rich mb-1">No promo codes yet</div>
          <p className="text-xs text-gray-400 font-sans">Create your first discount code to attract guests.</p>
        </div>
      ) : (
        <div className="bg-white border border-gold-border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-black">
                {['Code', 'Discount', 'Min Amount', 'Usage', 'Valid Until', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] text-gold uppercase tracking-widest font-sans whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-border">
              {promos.map(p => (
                <tr key={p.id} className="hover:bg-gold-tint transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-brand-rich font-semibold">{p.code}</div>
                    <div className="text-[10px] text-gray-400 font-sans mt-0.5">{p.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich">
                      {p.discount_type === 'flat' ? formatCurrency(p.discount_value) + ' off' : `${p.discount_value}% off`}
                    </div>
                    {p.max_discount && <div className="text-[10px] text-gray-400 font-sans">Max {formatCurrency(p.max_discount)}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs font-sans text-gray-600">{p.min_amount > 0 ? formatCurrency(p.min_amount) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-sans text-brand-rich">{p.usage_count} used</div>
                    <div className="text-[10px] text-gray-400 font-sans">{p.usage_limit ? `of ${p.usage_limit}` : 'Unlimited'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-sans text-gray-600">{p.valid_until ? formatDate(p.valid_until) : 'No expiry'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} className="flex items-center gap-1.5">
                      {p.is_active
                        ? <><ToggleRight size={16} className="text-green-500" /><span className="text-[10px] text-green-600 font-sans">Active</span></>
                        : <><ToggleLeft size={16} className="text-gray-400" /><span className="text-[10px] text-gray-400 font-sans">Inactive</span></>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-gold hover:text-gold-dark transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deletePromo(p.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gold-border bg-brand-black">
              <div className="font-serif text-sm text-white">{editing.id ? 'Edit' : 'New'} Promo Code</div>
              <button onClick={closeForm} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Code *</label>
                  <input
                    value={editing.code || ''}
                    onChange={e => setEditing(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                    placeholder="e.g. WELCOME10"
                    className="input-field uppercase tracking-widest font-mono"
                    maxLength={30}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Description</label>
                  <input
                    value={editing.description || ''}
                    onChange={e => setEditing(p => ({ ...p, description: e.target.value }))}
                    placeholder="Short description shown to guest"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Discount Type</label>
                  <select
                    value={editing.discount_type || 'percentage'}
                    onChange={e => setEditing(p => ({ ...p, discount_type: e.target.value as 'flat' | 'percentage' }))}
                    className="input-field"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">
                    {editing.discount_type === 'flat' ? 'Amount (₹) *' : 'Percentage (%) *'}
                  </label>
                  <input
                    type="number" min="1"
                    value={editing.discount_value || ''}
                    onChange={e => setEditing(p => ({ ...p, discount_value: parseFloat(e.target.value) }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Min Booking Amount (₹)</label>
                  <input
                    type="number" min="0"
                    value={editing.min_amount || 0}
                    onChange={e => setEditing(p => ({ ...p, min_amount: parseFloat(e.target.value) }))}
                    className="input-field"
                  />
                </div>
                {editing.discount_type === 'percentage' && (
                  <div>
                    <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Max Discount Cap (₹)</label>
                    <input
                      type="number" min="0"
                      value={editing.max_discount || ''}
                      onChange={e => setEditing(p => ({ ...p, max_discount: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="No cap"
                      className="input-field"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Usage Limit</label>
                  <input
                    type="number" min="1"
                    value={editing.usage_limit || ''}
                    onChange={e => setEditing(p => ({ ...p, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="Unlimited"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Valid From</label>
                  <input
                    type="date"
                    value={editing.valid_from || ''}
                    onChange={e => setEditing(p => ({ ...p, valid_from: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">Valid Until</label>
                  <input
                    type="date"
                    value={editing.valid_until || ''}
                    onChange={e => setEditing(p => ({ ...p, valid_until: e.target.value || null }))}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editing.is_active ?? true}
                    onChange={e => setEditing(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-gold"
                  />
                  <label htmlFor="is_active" className="text-xs font-sans text-brand-rich cursor-pointer">
                    Active (guests can use this code)
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-gold flex-1 text-xs py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                  {editing.id ? 'Update Code' : 'Create Code'}
                </button>
                <button onClick={closeForm} className="btn-outline flex-1 text-xs py-3">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}