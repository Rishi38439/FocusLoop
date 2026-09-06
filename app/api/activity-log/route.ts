import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activityLogger';
import { hasTrustedOrigin, requireAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  try {
    const user = await requireAuthenticatedUser(request);
    if (user instanceof NextResponse) return user;
    const { activityName, activity_time } = await request.json();
    if (typeof activityName !== 'string' || activityName.trim().length < 1 || activityName.length > 100 || typeof activity_time !== 'number' || !Number.isFinite(activity_time) || activity_time < 0 || activity_time > 1440) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await logActivity({ activityName: activityName.trim(), userId: user.id, activity_time });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[activity-log] ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
