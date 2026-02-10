import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-imposter';

function getClientIP(request: NextRequest): string {
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim();

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  return 'unknown';
}

function getGeoInfo(request: NextRequest) {
  const city = request.headers.get('x-vercel-ip-city');
  return {
    country: request.headers.get('x-vercel-ip-country') || undefined,
    region: request.headers.get('x-vercel-ip-country-region') || undefined,
    city: city ? decodeURIComponent(city) : undefined,
  };
}

// POST — iOS app submits a game session
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const enriched = {
      ...body,
      ip: getClientIP(request),
      ...getGeoInfo(request),
      serverTimestamp: Date.now(),
    };

    // Use sessionId as document ID — duplicate submissions overwrite harmlessly
    await db.collection('sessions').doc(sessionId).set(enriched);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ error: 'Failed to submit session' }, { status: 500 });
  }
}

// GET — dashboard fetches all sessions
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json([]);
    }

    const snapshot = await db.collection('sessions')
      .limit(5000)
      .get();

    const sessions = snapshot.docs.map(doc => {
      const data = doc.data();

      // Convert Firestore Timestamps to plain numbers (they don't serialize to JSON properly)
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
          cleaned[key] = (value as { toMillis: () => number }).toMillis();
        } else {
          cleaned[key] = value;
        }
      }

      const timestamp = (cleaned.timestamp as number) || (cleaned.serverTimestamp as number) || Date.now();

      return {
        id: doc.id,
        ...cleaned,
        serverTimestamp: timestamp,
        clientTimestamp: timestamp,
      };
    });

    // Sort by timestamp descending (newest first)
    sessions.sort((a, b) => (b.serverTimestamp as number) - (a.serverTimestamp as number));

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve sessions' }, { status: 500 });
  }
}
