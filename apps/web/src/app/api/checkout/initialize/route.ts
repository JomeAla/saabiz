import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, productId, planId, gateway, currency } = body;

    if (!email || !productId || !planId || !gateway) {
      return NextResponse.json(
        { error: 'Missing required fields: email, productId, planId, gateway' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/checkout/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        productId,
        planId,
        gateway,
        currency: currency || 'usd',
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Checkout initialize error:', error);
    return NextResponse.json({ error: 'Failed to initialize checkout' }, { status: 500 });
  }
}
