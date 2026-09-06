import { MongoClient, Db, Collection, Document } from 'mongodb';
import { UserInfo } from '@/types/activity';
import type { OtpChallenge, VerificationTokenEntry, RateLimitEntry } from './authSecurity';


let client: MongoClient | null = null;
let db: Db | null = null;

// Connection state management
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db && client) {
    return db;
  }

  if (isConnecting && connectionPromise) {
    await connectionPromise;
    return db!;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const uri = process.env.MONGODB_URI || (process.env.NODE_ENV !== 'production' ? 'mongodb://127.0.0.1:27017' : '');
      if (!uri) {
        throw new Error('MONGODB_URI is not configured. Please set MONGODB_URI in your .env.local file.');
      }
      const dbName = process.env.MONGODB_DB ?? 'trakloop';
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      connectionPromise = null;
      throw error;
    } finally {
      isConnecting = false;
    }
  })();

  await connectionPromise;
  return db!;
}

export interface AuthUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  passwordHash: string;
  loginCodeHash?: string;
  loginCodeVersion?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastLoginCodeRegeneratedAt?: Date;
}

export interface AuthSessionDocument extends Document {
  tokenHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export async function getAuthUserCollection(): Promise<Collection<AuthUserDocument>> {
  const database = await connectToDatabase();
  const collection = database.collection<AuthUserDocument>('users');
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ email: 1 }, { unique: true }),
    collection.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true }),
    collection.createIndex({ isActive: 1 }),
  ]);
  return collection;
}

export async function getAuthSessionCollection(): Promise<Collection<AuthSessionDocument>> {
  const database = await connectToDatabase();
  const collection = database.collection<AuthSessionDocument>('auth_sessions');
  await Promise.all([
    collection.createIndex({ tokenHash: 1 }, { unique: true }),
    collection.createIndex({ userId: 1 }),
    collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return collection;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Disconnected from MongoDB');
  }
}

export function getCollection<T extends Document>(collectionName: string): Collection<T> {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db.collection<T>(collectionName);
}

// User info specific functions
export async function getUserInfoCollection(): Promise<Collection<UserInfo>> {
  const database = await connectToDatabase();
  const collection = database.collection<UserInfo>('user_info');
  
  // Create indexes for better performance
  await collection.createIndex({ log_code: 1 }, { unique: true });
  await collection.createIndex({ session_id: 1 });
  await collection.createIndex({ session_code: 1 });
  await collection.createIndex({ mobileNo: 1 });
  await collection.createIndex({ mobileNumber: 1 });
  await collection.createIndex({ session_code: 1, mobileNo: 1 });
  await collection.createIndex({ sessionCode: 1, mobileNumber: 1 });
  await collection.createIndex({ mobileNumber: 1, sessionCode: 1 });
  
  return collection;
}

export async function getOtpCollection(): Promise<Collection<OtpChallenge>> {
  const database = await connectToDatabase();
  const collection = database.collection<OtpChallenge>('otp_challenges');
  // TTL index to automatically delete expired OTPs
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ mobileNumber: 1 }, { unique: true });
  return collection;
}

export async function getVerificationTokenCollection(): Promise<Collection<VerificationTokenEntry>> {
  const database = await connectToDatabase();
  const collection = database.collection<VerificationTokenEntry>('verification_tokens');
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ tokenHash: 1 }, { unique: true });
  return collection;
}

export async function getRateLimitCollection(): Promise<Collection<RateLimitEntry>> {
  const database = await connectToDatabase();
  const collection = database.collection<RateLimitEntry>('rate_limits');
  await collection.createIndex({ windowStart: 1 }, { expireAfterSeconds: 86400 });
  await collection.createIndex({ key: 1 }, { unique: true });
  return collection;
}

export interface LoginCodeEntry extends Document {
  userId: string;
  codeHash: string;
  codeVersion: number;
  createdAt: Date;
}

export async function getLoginCodeCollection(): Promise<Collection<LoginCodeEntry>> {
  const database = await connectToDatabase();
  const collection = database.collection<LoginCodeEntry>('login_codes');
  await Promise.all([
    collection.createIndex({ userId: 1 }, { unique: true }),
    collection.createIndex({ codeHash: 1 }, { unique: true }),
  ]);
  return collection;
}
