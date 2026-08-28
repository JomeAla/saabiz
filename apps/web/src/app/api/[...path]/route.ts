import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

async function proxy(req: NextRequest, path: string): Promise<NextResponse> {
  // Preserve the query string — the API uses ?host=, ?tenantId=, ?reference= etc.
  const target = `${API_URL}/api/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const authorization = req.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId) headers.set('x-tenant-id', tenantId);
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (forwardedHost) headers.set('x-forwarded-host', forwardedHost);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  const response = await fetch(target, init);
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function handler(req: NextRequest, { params }: { params: { path: string[] } }): Promise<NextResponse> {
  const path = (params.path || []).join('/');
  try {
    return await proxy(req, path);
  } catch (err) {
    console.error('API proxy error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;