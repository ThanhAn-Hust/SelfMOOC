import { NextResponse } from 'next/server';
import { pgPool, getMongoDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let pgStatus = 'unknown';
  let mongoStatus = 'unknown';
  let pgError = null;
  let mongoError = null;

  // 1. Ping PostgreSQL (Neon Serverless)
  try {
    const pgRes = await pgPool.query('SELECT 1 as alive');
    pgStatus = pgRes.rowCount ? 'online' : 'unreachable';
  } catch (err: any) {
    pgStatus = 'error';
    pgError = err?.message || 'Postgres error';
  }

  // 2. Ping MongoDB (Atlas)
  try {
    const mongoDb = await getMongoDb();
    await mongoDb.command({ ping: 1 });
    mongoStatus = 'online';
  } catch (err: any) {
    mongoStatus = 'error';
    mongoError = err?.message || 'Mongo error';
  }

  return NextResponse.json(
    {
      status: pgStatus === 'online' && mongoStatus === 'online' ? 'healthy' : 'partial',
      service: 'SelfMOOC LMS',
      timestamp: new Date().toISOString(),
      database: {
        postgres: pgStatus,
        mongodb: mongoStatus,
      },
      errors: pgError || mongoError ? { postgres: pgError, mongodb: mongoError } : undefined,
    },
    { status: 200 }
  );
}

