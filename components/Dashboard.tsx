'use client';

import { useState } from 'react';
import { Activity } from '@/types/activity';
import { Layout } from './Layout';
import { Analytics } from './Analytics';
import { ActivityHistory } from './ActivityHistory';
import { ActivityForm } from './ActivityForm';
import { SummaryCards } from './SummaryCards';
import { ChartsPanel } from './ChartsPanel';
import { ActivityTable } from './ActivityTable';
import { ActivityInput } from './ActivityInput';
import { DurationTrend } from './DurationTrend';
import { SettingsPanel } from './SettingsPanel';
import { SessionManager } from './SessionManager';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

type ViewType = 'dashboard' | 'log-activity' | 'analytics' | 'history' | 'settings';

interface DashboardProps {
  activities: Activity[];
  sessionId: string;
  sessionCode: string;
  onAddActivity: (
    name: string,
    duration: number
  ) => void;
  onDeleteActivity: (id: string) => void;
  onUpdateActivity: (id: string, updates: Partial<Activity>) => void;
  onReplaceActivities: (activities: Activity[]) => void;
}

export function Dashboard({
  activities,
  sessionId: _sessionId,
  sessionCode,
  onAddActivity,
  onDeleteActivity,
  onUpdateActivity,
  onReplaceActivities,
}: DashboardProps) {
  const { user } = useAuth();
  // Wrapper function to convert duration-only update to Partial<Activity>
  const handleUpdateActivityDuration = (id: string, duration: number) => {
    onUpdateActivity(id, { duration });
  };

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleQuickAdd = () => {
    setShowActivityForm(true);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <SummaryCards activities={activities} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ActivityInput activities={activities} onAddActivity={onAddActivity} onDeleteActivity={onDeleteActivity} onUpdateActivity={handleUpdateActivityDuration} />
              <DurationTrend activities={activities} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ChartsPanel activities={activities} />
              <ActivityTable activities={activities} onDelete={onDeleteActivity} />
            </div>
          </div>
        );
      
      case 'log-activity':
        return (
          <div className="max-w-2xl mx-auto">
            <ActivityForm
              isOpen={true}
              onClose={() => setCurrentView('dashboard')}
              onSubmit={onAddActivity}
            />
          </div>
        );
      
      case 'analytics':
        return <Analytics activities={activities} onAddActivity={onAddActivity} />;
      
      case 'history':
        return <ActivityHistory activities={activities} onDeleteActivity={onDeleteActivity} />;
      
      case 'settings':
        return (
          <SettingsPanel
            activities={activities}
            onImportActivities={onReplaceActivities}
            onLoginClick={() => setShowLogin(true)}
          />
        );
    }
  };

  const displaySessionCode = user?.email ?? sessionCode;

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view as ViewType)}
        sessionCode={displaySessionCode}
        activities={activities}
        onQuickAdd={handleQuickAdd}
      >
        {renderCurrentView()}
      </Layout>

      {/* Quick Add Activity Modal */}
      <ActivityForm
        isOpen={showActivityForm}
        onClose={() => setShowActivityForm(false)}
        onSubmit={onAddActivity}
      />

      {/* Session Manager Dialog */}
      <SessionManager
        sessionCode={displaySessionCode}
        isOpen={showSessionManager}
        onOpenChange={setShowSessionManager}
      />

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <LoginForm 
              onLoginSuccess={() => {
                setShowLogin(false);
                setCurrentView('dashboard');
              }}
              onRegisterClick={() => {
                setShowLogin(false);
                setShowRegister(true);
              }}
            />
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowLogin(false)}
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <RegisterForm 
              onRegisterSuccess={() => {
                setShowRegister(false);
                setCurrentView('dashboard');
              }}
              onBackClick={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
