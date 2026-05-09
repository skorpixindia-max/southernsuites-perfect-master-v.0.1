import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateBookingId(): string {
  const prefix = 'SS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diff = differenceInDays(checkOut, checkIn);
  return diff > 0 ? diff : 0;
}

export function calculateGSTSlab(price: number) {
  if (price > 7500) {
    return {
      rate: 18,
      cgst: 9,
      sgst: 9,
    };
  }

  return {
    rate: 12,
    cgst: 6,
    sgst: 6,
  };
}

export function calculateTaxes(subtotal: number, roomPrice: number): number {
  const gst = calculateGSTSlab(roomPrice);
  return subtotal * (gst.rate / 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return format(d, 'dd MMM yyyy');
}

export function formatDateShort(date: string | Date): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return format(d, 'dd MMM');
}

export function getWhatsAppMessage(booking: {
  bookingId: string;
  guestName: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
}): string {
  return encodeURIComponent(
    `*Booking Confirmed!* 🎉\n\n` +
    `*Booking ID:* ${booking.bookingId}\n` +
    `*Guest:* ${booking.guestName}\n` +
    `*Hotel:* ${booking.hotelName}\n` +
    `*Room:* ${booking.roomName}\n` +
    `*Check-in:* ${formatDate(booking.checkIn)} at 12:00 PM\n` +
    `*Check-out:* ${formatDate(booking.checkOut)} at 11:00 AM\n` +
    `*Nights:* ${booking.nights}\n` +
    `*Total Paid:* ${formatCurrency(booking.totalAmount)}\n\n` +
    `Thank you for choosing Hotel Southern Suites! 🏨`
  );
}

export function getRazorpayOptions(params: {
  orderId: string;
  amount: number;
  bookingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hotelName: string;
  keyId: string;
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onError: (error: unknown) => void;
}) {
  return {
    key: params.keyId,
    amount: params.amount * 100,
    currency: 'INR',
    name: 'Hotel Southern Suites',
    description: `Booking ${params.bookingId} – ${params.hotelName}`,
    image: '/logo.png',
    order_id: params.orderId,
    handler: params.onSuccess,
    prefill: {
      name: params.guestName,
      email: params.guestEmail,
      contact: params.guestPhone,
    },
    notes: { booking_id: params.bookingId },
    theme: { color: '#C9A84C' },
    modal: { ondismiss: params.onError },
  };
}
