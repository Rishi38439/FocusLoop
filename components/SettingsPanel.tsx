'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Activity } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  LogOut,
  Copy,
  Check,
  User,
  Shield,
  LogIn,
  Download,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { exportActivitiesToJson, importActivitiesFromJson } from '@/lib/activityUtils';
import { OTPVerification } from '@/components/auth/OTPVerification';

interface SettingsPanelProps {
  activities: Activity[];
  onImportActivities: (activities: Activity[]) => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
}

export function SettingsPanel({ activities, onImportActivities, onLogout, onLoginClick }: SettingsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [dataStatus, setDataStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [regenerationStep, setRegenerationStep] = useState<'idle' | 'otp' | 'code'>('idle');
  const [regenerationError, setRegenerationError] = useState<string | null>(null);
  const [regenerationLoading, setRegenerationLoading] = useState(false);
  const [regenerationDevOtp, setRegenerationDevOtp] = useState<string | undefined>();
  const [newLoginCode, setNewLoginCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  const requestLoginCodeRegeneration = async () => {
    if (!user?.phoneNumber) return;
    setRegenerationError(null);
    setRegenerationLoading(true);
    try {
      const response = await fetch('/api/auth/regenerate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ step: 'send-otp', mobileNumber: user.phoneNumber }),
      });
      const result = await response.json() as { error?: string; devOtp?: string };
      if (!response.ok) {
        setRegenerationError(result.error ?? 'Unable to send verification code.');
        return;
      }
      setRegenerationDevOtp(result.devOtp);
      setRegenerationStep('otp');
    } catch {
      setRegenerationError('Unable to reach the server. Please try again.');
    } finally {
      setRegenerationLoading(false);
    }
  };

  const confirmLoginCodeRegeneration = async (otp: string) => {
    setRegenerationError(null);
    setRegenerationLoading(true);
    try {
      const response = await fetch('/api/auth/regenerate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ step: 'confirm-otp', otp }),
      });
      const result = await response.json() as { error?: string; loginCode?: string };
      if (!response.ok || !result.loginCode) {
        setRegenerationError(result.error ?? 'Unable to regenerate login code.');
        return;
      }
      setNewLoginCode(result.loginCode);
      setRegenerationStep('code');
    } catch {
      setRegenerationError('Unable to reach the server. Please try again.');
    } finally {
      setRegenerationLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
    if (onLogout) {
      onLogout();
    }
  };

  const handleExportData = () => {
    try {
      const json = exportActivitiesToJson(activities);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `trakloop-activities-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setDataStatus({ kind: 'success', message: 'Activity data exported successfully.' });
    } catch (error) {
      console.error('Export failed:', error);
      setDataStatus({ kind: 'error', message: 'Export failed. Please try again.' });
    }
  };

  const handleImportClick = () => {
    setDataStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const fileContents = await file.text();
      const importedActivities = importActivitiesFromJson(fileContents);
      onImportActivities(importedActivities);
      setDataStatus({ kind: 'success', message: 'Imported data replaced the current local activity list.' });
    } catch (error) {
      setDataStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Import failed. Please select a valid JSON file.',
      });
    }
  };

  const DataManagementSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Data Management</h3>
      </div>

      <p className="text-sm text-white/60">
        Import replaces the current local activity data after validation. Export creates a human-readable JSON backup.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          onClick={handleImportClick}
          className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl justify-start h-auto py-4"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Data
        </Button>
        <Button
          type="button"
          onClick={handleExportData}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 rounded-xl justify-start h-auto py-4"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {dataStatus && (
        <Alert
          className={
            dataStatus.kind === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }
        >
          <AlertDescription>{dataStatus.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </CardTitle>
          <CardDescription>Manage your session and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Not Logged In</h3>
              <p className="text-white/60 text-sm">
                You need to be logged in to access session settings and manage your data.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-400">
              <LogIn className="h-4 w-4" />
              <AlertDescription>
                Log in to access your session data, manage settings, and sync your activities across devices.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={onLoginClick} disabled={isLoading}>
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? 'Loading...' : 'Login to Your Session'}
              </Button>

              <p className="text-xs text-white/50 text-center">
                Don't have a session? You can create a new one from the login screen.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/80">What you can do when logged in:</h4>
            <ul className="text-xs text-white/60 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                View and copy your session code and ID
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                Manage your session preferences
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                Access database information and backup
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                Securely logout and clear local data
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-white/10">
            <DataManagementSection />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Settings
        </CardTitle>
        <CardDescription>Manage your session and account preferences</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Session Information</h3>
            <Badge variant="outline" className="border-green-500/20 text-green-400 bg-green-500/10">
              Active
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-white/50 mb-1">Account Email</p>
                  <p className="text-lg font-mono font-bold text-white">{user?.email ?? ''}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => user?.email && copyToClipboard(user.email)}
                  className="text-white/50 hover:text-white hover:bg-white/10"
                  disabled={!user?.email}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-white/50" />
                <div>
                  <p className="text-xs text-white/50 mb-1">User Name</p>
                  <p className="text-sm text-white/80">{user?.name ?? 'Athlete'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <CardContent className="p-6">
            <DataManagementSection />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Security</h3>

          {user?.phoneNumber && (
            <div className="space-y-3">
              {regenerationStep === 'idle' && <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-white/70 font-medium">Login Code</p>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  Your login code is used together with your mobile number to sign in securely. You can regenerate it anytime.
                </p>
                <p className="text-xs text-white/50">
                  Phone: {user.phoneNumber}
                </p>
              </div>}

              {regenerationStep === 'idle' && (
                <Button
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={isLoading || regenerationLoading}
                  onClick={() => void requestLoginCodeRegeneration()}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {regenerationLoading ? 'Sending verification code...' : 'Regenerate Login Code'}
                </Button>
              )}

              {regenerationStep === 'otp' && (
                <OTPVerification
                  mobileNumber={user.phoneNumber}
                  onVerified={confirmLoginCodeRegeneration}
                  onResendClick={requestLoginCodeRegeneration}
                  isLoading={regenerationLoading}
                  error={regenerationError}
                  clearError={() => setRegenerationError(null)}
                  devOtp={regenerationDevOtp}
                />
              )}

              {regenerationStep === 'code' && newLoginCode && (
                <div className="space-y-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-sm text-green-200">Your new login code is ready. Save it somewhere secure.</p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-2xl font-bold tracking-[0.3em] text-green-300">{newLoginCode}</code>
                    <Button type="button" variant="ghost" size="icon" onClick={() => void copyToClipboard(newLoginCode)} aria-label="Copy new login code">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setRegenerationStep('idle')}>
                    Done
                  </Button>
                </div>
              )}

              {regenerationError && regenerationStep !== 'otp' && (
                <Alert className="border-red-500/20 bg-red-500/10 text-red-300">
                  <AlertDescription>{regenerationError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-400">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Keep your login code and mobile number private to protect your account.
            </AlertDescription>
          </Alert>

          <Button
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoading ? 'Logging out...' : 'Logout'}
          </Button>

          <p className="text-xs text-white/50 text-center">
            Logging out will clear your session. You can log back in anytime with your mobile number and login code.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
