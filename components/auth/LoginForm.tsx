'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OTPVerification } from './OTPVerification';

export function LoginForm({ onLoginSuccess, onRegisterClick }: { onLoginSuccess?: () => void; onRegisterClick?: () => void }) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleCredentialsSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ mobileNumber, loginCode }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setError(data.error as string ?? 'Failed to initiate login');
        return;
      }

      setDevOtp(data.devOtp as string | null);
      setStep('otp');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = async (otp: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ mobileNumber, loginCode, otp }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setError(data.error as string ?? 'Login failed');
        return;
      }

      onLoginSuccess?.();
    } catch {
      setError('Unable to complete login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    const response = await fetch('/api/auth/login-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ mobileNumber, loginCode }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      setError(data.error as string ?? 'Failed to resend OTP');
      return;
    }

    setDevOtp(data.devOtp as string | null);
  };

  if (step === 'otp') {
    return (
      <OTPVerification
        mobileNumber={mobileNumber}
        onVerified={handleOtpVerified}
        onResendClick={handleResendOtp}
        isLoading={isLoading}
        error={error}
        clearError={() => setError(null)}
        devOtp={devOtp || undefined}
      />
    );
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-black/60 text-white backdrop-blur-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-white/60">Sign in to your TrackDaily account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
          <Input
            aria-label="Mobile number"
            type="tel"
            placeholder="+91 98765 43210"
            value={mobileNumber}
            onChange={(e) => {
              setMobileNumber(e.target.value);
              setError(null);
            }}
            className="border-white/10 bg-white/5 text-white"
            disabled={isLoading}
          />
          <Input
            aria-label="Login code"
            type="text"
            placeholder="ABC123"
            maxLength={6}
            value={loginCode}
            onChange={(e) => {
              setLoginCode(e.target.value.toUpperCase());
              setError(null);
            }}
            className="border-white/10 bg-white/5 text-white font-mono tracking-wider"
            disabled={isLoading}
          />
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !mobileNumber || !loginCode}
          >
            {isLoading ? 'Signing in…' : <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onRegisterClick}
            disabled={isLoading}
          >
            Create an account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

