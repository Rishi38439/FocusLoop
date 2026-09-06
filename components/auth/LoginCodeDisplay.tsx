'use client';

import { useState } from 'react';
import { CheckCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginCodeDisplayProps {
  loginCode: string;
  onContinue: () => void;
  isLoading?: boolean;
}

export function LoginCodeDisplay({ loginCode, onContinue, isLoading = false }: LoginCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(loginCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="w-full max-w-md border-white/10 bg-black/60 text-white backdrop-blur-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
          <CheckCircle className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Account Created!</CardTitle>
        <CardDescription className="text-white/60">
          Your TrackDaily account is ready
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-sm text-white/70">Your Login Code</p>
          <div className="mb-4 text-center">
            <p className="font-mono text-4xl font-bold tracking-wider text-green-400">
              {loginCode.split('').join(' ')}
            </p>
          </div>
          <p className="text-xs text-white/60">
            Use this code together with your registered mobile number to sign in.
          </p>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>

          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={onContinue}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Continue to Dashboard'}
          </Button>
        </div>

        <p className="text-center text-xs text-white/50">
          Save this code in a safe place. You'll need it to log in.
        </p>
      </CardContent>
    </Card>
  );
}
