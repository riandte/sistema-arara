import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { logger } from '@/backend/logger';

export async function GET() {
  try {
    // Check Database Connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Health Check Failed', error);
    return NextResponse.json({
      status: 'down',
      database: 'disconnected',
      error: 'Service Unavailable' // Generic message
    }, { status: 503 });
  }
}
