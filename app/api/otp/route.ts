import { NextRequest, NextResponse } from 'next/server';
import { createAndDeliverOtpChallenge, normalizeLoginMobileNumber, validateMobileNumber } from '@/lib/authSecurity';

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';

  try {
    const { action, mobileNumber, mobileNo, otp } = await request.json();
    const normalizedMobileNumber = normalizeLoginMobileNumber(mobileNumber ?? mobileNo ?? '');

    if (!normalizedMobileNumber || !validateMobileNumber(normalizedMobileNumber)) {
      return NextResponse.json(
        { success: false, error: 'A valid mobile number is required' },
        { status: 400 },
      );
    }

    switch (action) {
      case 'send': {
        const challenge = await createAndDeliverOtpChallenge(normalizedMobileNumber, ipAddress);

        if (!challenge.success) {
          return NextResponse.json(
            { success: false, error: challenge.error, retryAfterMs: challenge.retryAfterMs },
            { status: 429 },
          );
        }

        const payload: Record<string, unknown> = {
          success: true,
          message: 'OTP sent successfully',
          mobileNumber: normalizedMobileNumber,
        };

        // Expose the OTP only outside production so it can be tested locally.
        if (process.env.NODE_ENV !== 'production') {
          payload.devOtp = challenge.otp;
        }

        return NextResponse.json(payload);
      }

      case 'verify': {
        const { verifyOtpChallenge } = await import('@/lib/authSecurity');
        const result = await verifyOtpChallenge(normalizedMobileNumber, String(otp ?? ''));

        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 },
          );
        }

        return NextResponse.json({
          success: true,
          verified: true,
          verificationToken: result.verificationToken,
          message: 'OTP verified successfully',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
