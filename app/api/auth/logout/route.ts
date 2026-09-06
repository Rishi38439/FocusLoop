import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, hasTrustedOrigin, revokeAuthenticatedSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  try {
    await revokeAuthenticatedSession(request);
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Authentication logout failed', error);
    return NextResponse.json({ error: 'Unable to sign out' }, { status: 500 });
  }
}
