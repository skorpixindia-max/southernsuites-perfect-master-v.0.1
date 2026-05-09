import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  booking_id: string;
  hotel_id: string;
  hotel_name: string;
  hotel_slug: string;
  room_id: string;
  room_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  room_price: number;
  taxes: number;
  total_amount: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  special_requests?: string;
  created_at: string;
}

export async function createBooking(data: Omit<Booking, 'id' | 'created_at'>) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return booking;
}

export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookingPayment(
  bookingId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string
) {
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'paid',
      booking_status: 'confirmed',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
    })
    .eq('booking_id', bookingId);
  if (error) throw error;
}

export async function getAllBookings() {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBookingsByHotel(hotelSlug: string) {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('hotel_slug', hotelSlug)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
