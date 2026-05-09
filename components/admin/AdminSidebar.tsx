'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Hotel, BedDouble, CalendarCheck, Users, Settings, LogOut, ExternalLink } from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/hotels', icon: Hotel, label: 'Manage Hotels' },
  { href: '/admin/rooms', icon: BedDouble, label: 'Rooms & Rates' },
  { href: '/admin/bookings', icon: CalendarCheck, label: 'All Bookings' },
  { href: '/admin/managers', icon: Users, label: 'Branch Managers' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <aside className="w-56 bg-brand-black min-h-screen flex flex-col sticky top-0">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center flex-shrink-0">
            <span className="text-gold font-serif text-base italic">S</span>
          </div>
          <div>
            <div className="text-white font-serif text-xs tracking-wide">Southern Suites</div>
            <div className="text-gold/40 text-[8px] tracking-widest uppercase font-sans">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-sans rounded transition-colors ${
                active
                  ? 'bg-gold text-brand-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-0.5">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-xs font-sans text-white/30 hover:text-white transition-colors rounded"
        >
          <ExternalLink size={14} />
          View Website
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-sans text-white/30 hover:text-red-400 transition-colors rounded"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
