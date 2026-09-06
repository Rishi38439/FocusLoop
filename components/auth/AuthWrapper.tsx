'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import InfrastructureIntro from '@/components/InfrastructureIntro';

const AuthenticatedDashboard = dynamic(
  () => import('@/components/AuthenticatedDashboard'),
  { loading: () => <div className="min-h-screen bg-background" /> },
);

export function AuthWrapper() {
  const [showIntro, setShowIntro] = useState(true);

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

  return <AuthenticatedDashboard />;
}

