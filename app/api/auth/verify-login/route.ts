import { NextRequest, NextResponse } from 'next/server';
import {
  validatePhoneLogin,
  authenticatePhoneUser,
  createAuthenticatedSession,
  setSessionCookie,
  hasTrustedOrigin,
  recordUserLogin,
  getClientAddress,
} from '@/lib/auth';
import { verifyOtpChallenge, verifyLoginRateLimit } from '@/lib/authSecurity';
import { sanitizeNoSql } from '@/lib/authSecurity';

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

    const sanitized = sanitizeNoSql(body);
    const { mobileNumber, loginCode, otp } = sanitized as Record<string, unknown>;

    if (!mobileNumber || !loginCode || !otp) {
      return NextResponse.json({ error: 'Mobile number, login code, and OTP are required' }, { status: 400 });
    }

    // Verify OTP first
    const otpResult = await verifyOtpChallenge(String(mobileNumber), String(otp));
    if (!otpResult.success) {
      return NextResponse.json({ error: otpResult.error ?? 'Invalid OTP' }, { status: 401 });
    }

    // Validate phone login format
    const validation = validatePhoneLogin({ mobileNumber, loginCode });
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const clientIp = getClientAddress(request);
    
    // Check rate limit
    const limit = await verifyLoginRateLimit(validation.mobileNumber, clientIp);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.retryAfterMs ?? 60000) / 1000);
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      );
    }

    // Authenticate with mobile number + login code
    const user = await authenticatePhoneUser(validation.mobileNumber, validation.loginCode);
    if (!user) {
      return NextResponse.json({ error: 'Invalid mobile number or login code' }, { status: 401 });
    }

    // Create session and record login
    const sessionToken = await createAuthenticatedSession(user.id);
    await recordUserLogin(user.id);

    const response = NextResponse.json({ user }, { status: 200 });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error('Phone-based login failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to process login at this time' }, { status: 500 });
  }
}
