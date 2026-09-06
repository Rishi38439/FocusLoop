import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

// The legacy endpoint no longer exposes arbitrary user records. Use /api/auth/me.
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  return NextResponse.json({ data: user }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST() {
  return NextResponse.json({ error: 'This endpoint has been retired. Use /api/auth/register or /api/auth/me.' }, { status: 410 });
}
