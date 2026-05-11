'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Hotel, BedDouble, CalendarCheck, Users,
  Settings, LogOut, ExternalLink, BarChart3, Tag, XCircle, Search,
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard',       group: 'overview' },
  { href: '/admin/bookings',      icon: CalendarCheck,   label: 'All Bookings',    group: 'operations' },
  { href: '/admin/cancellations', icon: XCircle,         label: 'Cancellations',   group: 'operations' },
  { href: '/admin/guest-lookup',  icon: Search,          label: 'Guest Lookup',    group: 'operations' },
  { href: '/admin/hotels',        icon: Hotel,           label: 'Manage Hotels',   group: 'property' },
  { href: '/admin/rooms',         icon: BedDouble,       label: 'Rooms & Rates',   group: 'property' },
  { href: '/admin/reports',       icon: BarChart3,       label: 'Reports',         group: 'insights' },
  { href: '/admin/promo-codes',   icon: Tag,             label: 'Promo Codes',     group: 'insights' },
  { href: '/admin/managers',      icon: Users,           label: 'Branch Managers', group: 'system' },
  { href: '/admin/settings',      icon: Settings,        label: 'Settings',        group: 'system' },
];

const GROUP_LABELS: Record<string, string> = {
  overview:    'Overview',
  operations:  'Operations',
  property:    'Property',
  insights:    'Insights',
  system:      'System',
};

const GROUPS = ['overview', 'operations', 'property', 'insights', 'system'];

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <aside className="w-58 bg-brand-black min-h-screen flex flex-col sticky top-0 shrink-0" style={{ width: '224px' }}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-serif text-base italic">S</span>
          </div>
          <div>
            <div className="text-white font-serif text-xs tracking-wide leading-tight">Southern Suites</div>
            <div className="text-gold/40 text-[8px] tracking-widest uppercase font-sans">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {GROUPS.map(group => {
          const items = NAV.filter(n => n.group === group);
          return (
            <div key={group}>
              <div className="text-[8px] text-white/20 uppercase tracking-widest font-sans px-3 mb-1.5">
                {GROUP_LABELS[group]}
              </div>
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label }) => {
                  const active = path === href || path.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 text-xs font-sans rounded transition-colors ${
                        active
                          ? 'bg-gold text-brand-black font-medium'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <a
          href="/" target="_blank" rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-xs font-sans text-white/30 hover:text-white transition-colors rounded"
        >
          <ExternalLink size={13} /> View Website
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-sans text-white/30 hover:text-red-400 transition-colors rounded"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}