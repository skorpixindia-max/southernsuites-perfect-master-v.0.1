'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Eye, EyeOff, RefreshCw } from 'lucide-react';

const DEFAULTS = {
  razorpay_key_id: '',
  razorpay_key_secret: '',
  whatsapp_number: '919618138686',
  email_from: 'bookings@southernsuites.com',
  hero_video: 'hero-video.mp4',
  tagline: 'Where Every Stay Feels Distinctly Southern',
  founded_year: '2021',
};

export default function AdminSettings() {
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULTS);

  // ── Load saved settings from DB on mount ──────────────────
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function saveSettings() {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) toast.success('Settings saved successfully');
    else toast.error('Failed to save settings');
    setSaving(false);
  }

  async function resetSettings() {
    if (!confirm('Reset all settings to default? This cannot be undone.')) return;
    setSettings(DEFAULTS);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULTS),
    });
    if (res.ok) toast.success('Settings reset to defaults');
    else toast.error('Reset failed');
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gold-border mb-5">
      <div className="px-5 py-4 border-b border-gold-border bg-gold-tint">
        <div className="text-xs font-sans text-brand-rich font-medium tracking-wide">{title}</div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  type SettingsKey = keyof typeof DEFAULTS;

  const Field = ({ label, name, type = 'text', placeholder, hint }: {
    label: string; name: SettingsKey; type?: string; placeholder?: string; hint?: string;
  }) => (
    <div>
      <label className="text-[9px] text-gold-dark uppercase tracking-widest font-sans block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={name === 'razorpay_key_secret' && !showKey ? 'password' : type}
          value={settings[name]}
          onChange={e => handleChange(name, e.target.value)}
          placeholder={placeholder}
          className="input-field text-sm pr-10"
        />
        {name === 'razorpay_key_secret' && (
          <button type="button" onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {hint && <div className="text-[10px] text-gray-400 font-sans mt-1">{hint}</div>}
    </div>
  );

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-sm text-gray-400 font-sans">
      <RefreshCw size={14} className="animate-spin" /> Loading saved settings…
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-2xl text-brand-rich">Settings</h1>
          <p className="text-xs text-gray-500 font-sans mt-1">
            Configure payment gateway, notifications, and site content.
          </p>
        </div>
        <button onClick={saveSettings} disabled={saving}
          className="btn-gold text-xs py-2.5 px-5 flex items-center gap-2">
          <Save size={13} /> {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      <Section title="Razorpay Payment Gateway">
        <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-sans text-amber-800 mb-2">
          <strong>Test Mode Active</strong> — Add your live Razorpay keys to start accepting real payments.
        </div>
        <Field label="Razorpay Key ID" name="razorpay_key_id"
          placeholder="rzp_live_xxxxxxxxxxxxxxxxxx"
          hint="Starts with rzp_test_ (test) or rzp_live_ (production)" />
        <Field label="Razorpay Key Secret" name="razorpay_key_secret"
          placeholder="Your secret key"
          hint="Never share this key publicly" />
      </Section>

      <Section title="WhatsApp Notifications">
        <Field label="WhatsApp Business Number" name="whatsapp_number"
          placeholder="919618138686"
          hint="Include country code (91 for India). No +, spaces, or dashes." />
      </Section>

      <Section title="Email Notifications">
        <Field label="From Email Address" name="email_from"
          placeholder="bookings@southernsuites.com"
          hint="Booking confirmations sent from this address via Resend" />
      </Section>

      <Section title="Website Content">
        <Field label="Hero Video Filename" name="hero_video"
          placeholder="hero-video.mp4"
          hint="Upload this file to /public/images/ folder" />
        <Field label="Homepage Tagline" name="tagline"
          placeholder="Where Every Stay Feels Distinctly Southern" />
        <Field label="Founded Year" name="founded_year"
          placeholder="2021"
          hint="Shown in footer and invoices" />
      </Section>

      <div className="bg-white border border-red-200 p-5">
        <div className="text-xs font-sans text-red-600 font-medium mb-2">Danger Zone</div>
        <div className="text-xs font-sans text-gray-500 mb-4">
          This will reset all settings to factory defaults. Cannot be undone.
        </div>
        <button onClick={resetSettings}
          className="border border-red-300 text-red-600 text-[10px] font-sans px-4 py-2 hover:bg-red-50 transition-colors">
          Reset All Settings to Default
        </button>
      </div>
    </div>
  );
}