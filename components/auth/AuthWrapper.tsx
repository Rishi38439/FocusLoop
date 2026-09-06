'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import InfrastructureIntro from '@/components/InfrastructureIntro';
import LiveGridPulseNetwork from '@/components/LiveGridPulseNetwork';
import { useAuth } from '@/hooks/useAuth';

const AuthenticatedDashboard = dynamic(
  () => import('@/components/AuthenticatedDashboard'),
  { loading: () => <div className="min-h-screen bg-background" /> },
);
const LoginForm = dynamic(() => import('@/components/auth/LoginForm').then((module) => module.LoginForm));
const RegisterForm = dynamic(() => import('@/components/auth/RegisterForm').then((module) => module.RegisterForm));

export function AuthWrapper() {
  const [showIntro, setShowIntro] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const { isAuthenticated, isLoading, refreshSession } = useAuth();

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
    return <AuthenticatedDashboard />;
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

