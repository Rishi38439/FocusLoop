import { useCallback, useEffect, useState } from 'react';
import { Activity } from '@/types/activity';
import { generateActivityId } from '@/lib/activityUtils';
import { useAuth } from '@/hooks/useAuth';

export const useActivityTracker = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const storageKey = user ? `activities:${user.id}` : null;

  useEffect(() => {
    setIsLoaded(false);
    if (!storageKey) {
      setActivities([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      setActivities(stored ? JSON.parse(stored) : []);
    } catch {
      setActivities([]);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey && isLoaded) localStorage.setItem(storageKey, JSON.stringify(activities));
  }, [activities, isLoaded, storageKey]);

  const addActivity = useCallback(async (name: string, duration: number, notes?: string) => {
    if (!user || !name.trim() || !Number.isFinite(duration) || duration < 0 || duration > 1440) return;
    const activity: Activity = { id: generateActivityId(), sessionId: user.id, name: name.trim(), duration, timestamp: Date.now(), notes };
    setActivities((current) => [activity, ...current]);
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ activityName: activity.name, activity_time: activity.duration }),
      });
    } catch {
      // Local tracking remains available if the optional aggregate log is unavailable.
    }
  }, [user]);

  return {
    activities,
    sessionId: user?.id ?? '',
    sessionCode: user?.email ?? '',
    isLoaded,
    addActivity,
    deleteActivity: (id: string) => setActivities((current) => current.filter((activity) => activity.id !== id)),
    updateActivity: (id: string, updates: Partial<Activity>) => setActivities((current) => current.map((activity) => activity.id === id ? { ...activity, ...updates } : activity)),
    replaceActivities: (nextActivities: Activity[]) => setActivities(nextActivities),
    clearAllActivities: () => setActivities([]),
    getActivities: () => activities,
    getActivitiesByDateRange: (startDate: number, endDate: number) => activities.filter((activity) => activity.timestamp >= startDate && activity.timestamp <= endDate),
  };
};
