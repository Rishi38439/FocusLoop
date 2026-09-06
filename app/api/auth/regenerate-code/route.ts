import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuthenticatedUser,
  regenerateUserLoginCode,
  hasTrustedOrigin,
  getClientAddress,
} from '@/lib/auth';
import { createAndDeliverOtpChallenge, sanitizeNoSql } from '@/lib/authSecurity';

/**
 * POST /api/auth/regenerate-code
 * Step 1: Request regeneration with phone number
 * Returns: OTP sent message
 */
async function sendOtpForRegeneration(request: NextRequest): Promise<NextResponse> {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const sanitized = sanitizeNoSql(body);
    const { mobileNumber } = sanitized as Record<string, unknown>;

    if (!mobileNumber) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const clientIp = getClientAddress(request);
    const otpResult = await createAndDeliverOtpChallenge(String(mobileNumber), clientIp);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error ?? 'Failed to send OTP' },
        { status: 429 }
      );
    }

    const response: Record<string, unknown> = {
      success: true,
      message: 'OTP sent for code regeneration',
      mobileNumber,
    };

    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otpResult.otp;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('OTP send for code regeneration failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to send OTP at this time' }, { status: 500 });
  }
}

/**
 * POST /api/auth/regenerate-code
 * Step 2: Verify OTP and regenerate code
 * Returns: New login code
 */
async function confirmRegenerationWithOtp(request: NextRequest, user: any): Promise<NextResponse> {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const sanitized = sanitizeNoSql(body);
    const { otp } = sanitized as Record<string, unknown>;

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    // Import here to avoid circular dependencies
    const { verifyOtpChallenge } = await import('@/lib/authSecurity');

    // Verify OTP
    const otpResult = await verifyOtpChallenge(user.phoneNumber || '', String(otp));
    if (!otpResult.success) {
      return NextResponse.json({ error: otpResult.error ?? 'Invalid OTP' }, { status: 401 });
    }

    // Generate new login code
    const newLoginCode = await regenerateUserLoginCode(user.id);
    if (!newLoginCode) {
      return NextResponse.json({ error: 'Failed to regenerate login code' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login code regenerated successfully',
      loginCode: newLoginCode,
    });
  } catch (error) {
    console.error('Code regeneration failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to regenerate code at this time' }, { status: 500 });
  }
}

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
    const { step } = sanitized as Record<string, unknown>;

    // Step 1: Send OTP (doesn't require authentication for flexibility)
    if (step === 'send-otp') {
      return sendOtpForRegeneration(request);
    }

    // Step 2: Verify OTP and regenerate (requires authentication)
    if (step === 'confirm-otp') {
      const userOrResponse = await requireAuthenticatedUser(request);
      if (userOrResponse instanceof NextResponse) {
        return userOrResponse;
      }

      return confirmRegenerationWithOtp(request, userOrResponse);
    }

    return NextResponse.json({ error: 'Invalid step parameter' }, { status: 400 });
  } catch (error) {
    console.error('Code regeneration endpoint error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Unable to process request at this time' }, { status: 500 });
  }
}
