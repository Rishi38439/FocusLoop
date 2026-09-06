'use client';

import { Dashboard } from '@/components/Dashboard';
import LiveGridPulseNetwork from '@/components/LiveGridPulseNetwork';
import { useActivityTracker } from '@/hooks/useActivityTracker';

export default function AuthenticatedDashboard() {
  const tracker = useActivityTracker();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
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
