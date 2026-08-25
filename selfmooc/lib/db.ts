// src/lib/db.ts
import { Pool } from 'pg';
import { MongoClient, Db } from 'mongodb';

// ==========================================
// 1. CẤU HÌNH KẾT NỐI POSTGRESQL (NEON)
// ==========================================
const pgConnectionString = process.env.DATABASE_URL;

if (!pgConnectionString) {
  throw new Error('Thiếu DATABASE_URL trong file .env.local');
}

// Khai báo global object để giữ lại connection pool khi Next.js hot-reload
const globalForPg = globalThis as unknown as { pgPool: Pool };

export const pgPool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: pgConnectionString,
    // Neon Serverless Pooler xử lý connection rất tốt, 
    // giữ max 10-20 là an toàn cho môi trường dev/free tier
    max: 15, 
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pgPool;
}


// ==========================================
// 2. CẤU HÌNH KẾT NỐI MONGODB (ATLAS)
// ==========================================
const globalForMongo = globalThis as unknown as { 
  _mongoClientPromise?: Promise<MongoClient>;
};

export async function getMongoClientPromise(): Promise<MongoClient> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Thiếu MONGODB_URI trong biến môi trường (.env.local)');
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(mongoUri);
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

/**
 * Hàm tiện ích để lấy trực tiếp database instance của MongoDB.
 * Cách dùng ở file khác: const db = await getMongoDb();
 */
export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db('lms_db'); 
}