import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { amount, bookingId } = await req.json();

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Demo mode — return null orderId, frontend handles gracefully
    return NextResponse.json({ orderId: null, keyId: null, demo: true });
  }

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'INR',
        receipt: bookingId,
        notes: { bookingId },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      throw new Error(order.error?.description || 'Razorpay error');
    }

    return NextResponse.json({ orderId: order.id, keyId });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json({ orderId: null, keyId: null, demo: true });
  }
}
