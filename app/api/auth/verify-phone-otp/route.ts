import { NextRequest, NextResponse } from 'next/server';
import { 
  validatePhoneSignUp,
  createPhoneBasedUser,
  createAuthenticatedSession,
  setSessionCookie,
  hasTrustedOrigin,
  recordUserLogin,
} from '@/lib/auth';
import { verifyOtpChallenge } from '@/lib/authSecurity';
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
    const { mobileNumber, otp, name, action } = sanitized as Record<string, unknown>;

    if (!mobileNumber || !otp) {
      return NextResponse.json({ error: 'Mobile number and OTP are required' }, { status: 400 });
    }

    // Verify OTP
    const otpResult = await verifyOtpChallenge(String(mobileNumber), String(otp));
    if (!otpResult.success) {
      return NextResponse.json({ error: otpResult.error ?? 'Invalid OTP' }, { status: 400 });
    }

    // For signup flow, create the user
    if (action === 'signup' && name) {
      const validation = validatePhoneSignUp({ name, mobileNumber });
      if ('error' in validation) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const result = await createPhoneBasedUser(validation.name, validation.mobileNumber);
      if (!result) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists.' },
          { status: 409 }
        );
      }

      const sessionToken = await createAuthenticatedSession(result.user.id);
      await recordUserLogin(result.user.id);
      
      const response = NextResponse.json({ 
        user: result.user,
        loginCode: result.loginCode,
        message: 'Account created successfully',
      }, { status: 201 });
      
      setSessionCookie(response, sessionToken);
      return response;
    }

    // For login flow, just return the verification confirmation
    // The actual login happens in /api/auth/login-phone after code verification
    return NextResponse.json({ 
      success: true,
      message: 'OTP verified successfully',
      mobileNumber,
    });
  } catch (error) {
    console.error('OTP verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to verify OTP at this time' }, { status: 500 });
  }
}
