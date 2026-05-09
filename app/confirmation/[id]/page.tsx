import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ConfirmationClient from '@/components/booking/ConfirmationClient';

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-gold-tint">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ConfirmationClient bookingId={id} />
      </div>
      <Footer />
    </div>
  );
}
