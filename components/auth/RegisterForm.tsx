'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OTPVerification } from './OTPVerification';
import { LoginCodeDisplay } from './LoginCodeDisplay';

type SignupStep = 'details' | 'otp' | 'code-display';

export function RegisterForm({ onRegisterSuccess, onBackClick }: { onRegisterSuccess?: () => void; onBackClick?: () => void }) {
  const [step, setStep] = useState<SignupStep>('details');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleDetailsSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, mobileNumber }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setError(data.error as string ?? 'Failed to send OTP');
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
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, mobileNumber, otp, action: 'signup' }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setError(data.error as string ?? 'Registration failed');
        return;
      }

      setLoginCode(data.loginCode as string);
      setStep('code-display');
    } catch {
      setError('Unable to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    const response = await fetch('/api/auth/register-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name, mobileNumber }),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      setError(data.error as string ?? 'Failed to resend OTP');
      return;
    }

    setDevOtp(data.devOtp as string | null);
  };

  const handleContinueToDashboard = () => {
    onRegisterSuccess?.();
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

  if (step === 'code-display') {
    return (
      <LoginCodeDisplay
        loginCode={loginCode}
        onContinue={handleContinueToDashboard}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-black/60 text-white backdrop-blur-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
          <UserPlus className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="text-white/60">Join TrackDaily to start tracking your activities</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleDetailsSubmit}>
          <Input
            aria-label="Name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Your name"
            className="border-white/10 bg-white/5 text-white"
            disabled={isLoading}
          />
          <Input
            aria-label="Mobile number"
            type="tel"
            placeholder="+91 98765 43210"
            required
            value={mobileNumber}
            onChange={(e) => {
              setMobileNumber(e.target.value);
              setError(null);
            }}
            className="border-white/10 bg-white/5 text-white"
            disabled={isLoading}
          />
          {error && (
            <Alert className="border-red-500/30 bg-red-500/10 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isLoading || !name || !mobileNumber}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onBackClick}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
