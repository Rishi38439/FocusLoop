import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createAuthenticatedSession, getClientAddress, hasTrustedOrigin, setSessionCookie, validateLoginInput } from '@/lib/auth';
import { verifyAuthRateLimit } from '@/lib/authSecurity';

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateLoginInput(body);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const clientIp = getClientAddress(request);
    const limit = await verifyAuthRateLimit('login', validation.email, clientIp);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.retryAfterMs ?? 60000) / 1000);
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      );
    }

    const user = await authenticateUser(validation.email, validation.password);
    // Generic response deliberately does not disclose whether email exists
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionToken = await createAuthenticatedSession(user.id);
    const response = NextResponse.json({ user }, { status: 200 });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error('Authentication login failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to process sign in at this time' }, { status: 500 });
  }
}
