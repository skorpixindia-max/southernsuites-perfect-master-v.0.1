import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center">
          <div className="font-serif text-8xl text-gold/20 mb-4">404</div>
          <h1 className="font-serif text-2xl text-white mb-3">Page Not Found</h1>
          <p className="text-white/40 text-sm font-sans mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <Link href="/" className="btn-gold text-xs px-8 py-3">Return Home</Link>
        </div>
      </div>
    </div>
  );
}
