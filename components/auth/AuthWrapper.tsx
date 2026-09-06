'use client';

import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import InfrastructureIntro from '@/components/InfrastructureIntro';
import LiveGridPulseNetwork from '@/components/LiveGridPulseNetwork';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useAuth } from '@/hooks/useAuth';

export function AuthWrapper() {
  const [showIntro, setShowIntro] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const tracker = useActivityTracker();

  useEffect(() => {
    if (sessionStorage.getItem('trakloop_intro_seen') || sessionStorage.getItem('trackdaily_intro_seen')) {
      setShowIntro(false);
    }
  }, []);

  if (showIntro) {
    return (
      <InfrastructureIntro
        onComplete={() => {
          sessionStorage.setItem('trakloop_intro_seen', 'true');
          setTimeout(() => {
            setShowIntro(false);
          }, 1500);
        }}
      />
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen relative bg-background text-foreground">
        <LiveGridPulseNetwork />
        <Dashboard
          activities={tracker.activities}
          sessionId={tracker.sessionId}
          sessionCode={tracker.sessionCode}
          onAddActivity={tracker.addActivity}
          onDeleteActivity={tracker.deleteActivity}
          onUpdateActivity={tracker.updateActivity}
          onReplaceActivities={tracker.replaceActivities}
        />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <LiveGridPulseNetwork />
      <div className="relative z-10 w-full max-w-md">
        {showRegistration ? (
          <RegisterForm
            onRegisterSuccess={() => {
              void refreshSession();
              setShowRegistration(false);
            }}
            onBackClick={() => setShowRegistration(false)}
          />
        ) : (
          <LoginForm
            onLoginSuccess={() => void refreshSession()}
            onRegisterClick={() => setShowRegistration(true)}
          />
        )}
      </div>
    </main>
  );
}

