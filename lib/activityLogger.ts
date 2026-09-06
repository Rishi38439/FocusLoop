import { connectToDatabase } from './mongodb';

export interface ActivityLog {
  userId: string;
  activityName: string;
  activity_time: number;
  date: string; // YYYY-MM-DD
  updated_time: Date;
  update_count: number;
}

export async function logActivity({ activityName, userId, activity_time }: { activityName: string; userId: string; activity_time: number; }) {
  const db = await connectToDatabase();
  const collection = db.collection<ActivityLog>('activity_logs');
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Try to find today's log for this user
  const existing = await collection.findOne({ userId, activityName, date: dateStr });

  if (!existing) {
    // Insert new log
    await collection.insertOne({
      userId,
      activityName,
      activity_time,
      date: dateStr,
      updated_time: today,
      update_count: 1,
    });
    return { created: true };
  } else {
    // Update logic
    const newCount = (existing.update_count || 1) + 1;
    if (newCount > 2) {
      await collection.updateOne(
        { _id: existing._id },
        { $set: { activity_time, updated_time: today, update_count: newCount } }
      );
      return { updated: true, update_count: newCount };
    } else {
      await collection.updateOne(
        { _id: existing._id },
        { $set: { updated_time: today }, $inc: { update_count: 1 } }
      );
      return { updated: false, update_count: newCount };
    }
  }
}
