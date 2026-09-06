import { NextRequest, NextResponse } from 'next/server';
import { validatePhoneLogin, getClientAddress, hasTrustedOrigin } from '@/lib/auth';
import { createAndDeliverOtpChallenge, verifyLoginRateLimit } from '@/lib/authSecurity';

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

    const validation = validatePhoneLogin(body);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const clientIp = getClientAddress(request);
    
    // Check rate limit for login attempts
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

    // Send OTP to the mobile number for verification
    const otpResult = await createAndDeliverOtpChallenge(validation.mobileNumber, clientIp);
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error ?? 'Failed to send OTP' },
        { status: 429 }
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      message: 'OTP sent to your mobile number',
      mobileNumber: validation.mobileNumber,
      expiresIn: '5 minutes',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otpResult.otp;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Phone login initiation failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to process login at this time' }, { status: 500 });
  }
}
