import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSession, createUser, getClientAddress, hasTrustedOrigin, setSessionCookie, validateRegistration } from '@/lib/auth';
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

    const registration = validateRegistration(body);
    if ('error' in registration) {
      return NextResponse.json({ error: registration.error }, { status: 400 });
    }

    const clientIp = getClientAddress(request);
    const limit = await verifyAuthRateLimit('register', registration.email, clientIp);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.retryAfterMs ?? 60000) / 1000);
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      );
    }

    const user = await createUser(registration.name, registration.email, registration.password);
    if (!user) {
      // Return a conflict status without revealing specific account state
      return NextResponse.json(
        { error: 'An account with this email already exists or registration could not be completed.' },
        { status: 409 }
      );
    }

    const sessionToken = await createAuthenticatedSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error('Authentication registration failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to process registration at this time' }, { status: 500 });
  }
}
