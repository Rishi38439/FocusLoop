'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, Clock, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface OTPVerificationProps {
  mobileNumber: string;
  onVerified: (otp: string) => void;
  onResendClick: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  clearError?: () => void;
  expiresIn?: number; // milliseconds
  devOtp?: string; // For development/testing
}

export function OTPVerification({
  mobileNumber,
  onVerified,
  onResendClick,
  isLoading = false,
  error = null,
  clearError,
  expiresIn = 300000, // 5 minutes default
  devOtp,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!otp.trim()) {
      return;
    }
    onVerified(otp);
  };

  const handleResend = async () => {
    setIsResending(true);
    clearError?.();
    try {
      await onResendClick();
      setOtp('');
      // Start cooldown
      setResendCountdown(60);
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setIsResending(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return phone;
    const lastFour = cleaned.slice(-4);
    return `+${cleaned.slice(0, -4)}XXXX${lastFour}`;
  };

  return (
    <Card className="w-full max-w-md border-white/10 bg-black/60 text-white backdrop-blur-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
          <Clock className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Verify with OTP</CardTitle>
        <CardDescription className="text-white/60">
          Enter the 6-digit code sent to {maskPhoneNumber(mobileNumber)}
          <span className="block text-xs text-white/40">This code expires in {Math.ceil(expiresIn / 60000)} minutes.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Input
              aria-label="One-time password"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
                clearError?.();
              }}
              className="border-white/10 bg-white/5 text-center text-lg font-mono tracking-widest text-white placeholder-white/30"
              disabled={isLoading}
            />
          </div>

          {devOtp && process.env.NODE_ENV !== 'production' && (
            <Alert className="border-yellow-500/30 bg-yellow-500/10 text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-mono font-semibold">{devOtp}</span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-500/30 bg-red-500/10 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-white/70 hover:bg-white/10 hover:text-white"
            onClick={handleResend}
            disabled={isResending || resendCountdown > 0 || isLoading}
          >
            {resendCountdown > 0 ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Resend in {resendCountdown}s
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Resend OTP
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
