import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { cacheDeletedActivity } from '@/lib/cacheActivity';
import { hasTrustedOrigin, requireAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  try {
    const user = await requireAuthenticatedUser(request);
    if (user instanceof NextResponse) return user;
    const { activityName, activityId } = await request.json();
    if (typeof activityName !== 'string' || !/^[a-zA-Z0-9 _-]{1,100}$/.test(activityName) || typeof activityId !== 'string' || !activityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const db = await connectToDatabase();
    const log_code = user.id;
    const collectionName = `${activityName}_${log_code}`;
    const collection = db.collection(collectionName);
    const activity = await collection.findOne({ id: activityId });
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }
    // Cache the deleted activity
    await cacheDeletedActivity({ log_code, activity_name: activityName, activity_data: activity });
    // Delete from original collection
    await collection.deleteOne({ id: activityId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[activity-delete] ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
