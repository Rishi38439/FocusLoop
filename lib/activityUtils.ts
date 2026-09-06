import { Activity, ActivityStats, ChartData } from '@/types/activity';
import { v4 as uuidv4 } from 'uuid';

export const generateSessionId = (): string => uuidv4();

export const generateActivityId = (): string => uuidv4();

export const calculateStats = (activities: Activity[]): ActivityStats => {
  if (activities.length === 0) {
    return {
      totalActivities: 0,
      totalDuration: 0,
      averageDuration: 0,
    };
  }

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);

  return {
    totalActivities: activities.length,
    totalDuration,
    averageDuration: Math.round(totalDuration / activities.length),
  };
};

export const getChartData = (activities: Activity[], days: number = 7): ChartData[] => {
  const now = new Date();
  const dates: Record<string, ChartData> = {};

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dates[dateStr] = { date: dateStr, duration: 0, count: 0 };
  }

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dates[dateStr]) {
      dates[dateStr].duration += activity.duration;
      dates[dateStr].count += 1;
    }
  });

  return Object.values(dates);
};

export const exportActivitiesToJson = (activities: Activity[]): string => {
  return JSON.stringify(
    {
      app: 'trakloop',
      version: 2,
      exportedAt: new Date().toISOString(),
      strategy: 'replace',
      activities,
    },
    null,
    2
  );
};

const normalizeImportedActivity = (value: unknown): Activity | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const duration = typeof candidate.duration === 'number' ? candidate.duration : Number.NaN;
  const timestamp = typeof candidate.timestamp === 'number' ? candidate.timestamp : Number.NaN;

  if (!name || !Number.isFinite(duration) || duration < 0 || duration > 1440 || !Number.isFinite(timestamp)) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : generateActivityId(),
    sessionId: typeof candidate.sessionId === 'string' ? candidate.sessionId : '',
    name,
    duration,
    timestamp,
    notes: typeof candidate.notes === 'string' && candidate.notes.trim() ? candidate.notes : undefined,
  };
};

const extractActivityArray = (parsed: unknown): unknown[] | null => {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  for (const value of [candidate.activities, candidate.items, candidate.data]) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return null;
};

export const importActivitiesFromJson = (json: string): Activity[] => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Malformed JSON file. Please select a valid JSON export.');
  }

  const importedArray = extractActivityArray(parsed);

  if (!importedArray) {
    throw new Error('Invalid import structure. Expected an array of activities or an object with an activities array.');
  }

  const normalized = importedArray
    .map(normalizeImportedActivity)
    .filter((activity): activity is Activity => Boolean(activity));

  if (normalized.length === 0) {
    throw new Error('No valid activities were found in the selected file.');
  }

  return normalized.sort((a, b) => b.timestamp - a.timestamp);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? mins + 'm' : ''}`.trim();
};

export const getActivityColor = (activityName: string): string => {
  const palette = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
  const hash = activityName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};
