import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

// Extract IP address from request headers
function getClientIP(request: NextRequest): string {
  // Vercel-specific headers (check these first)
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Standard proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // True-Client-IP (Akamai, Cloudflare Enterprise)
  const trueClientIP = request.headers.get('true-client-ip');
  if (trueClientIP) {
    return trueClientIP;
  }

  return 'unknown';
}

// Get geo info from Vercel headers
function getGeoInfo(request: NextRequest) {
  const city = request.headers.get('x-vercel-ip-city');

  return {
    country: request.headers.get('x-vercel-ip-country') || undefined,
    region: request.headers.get('x-vercel-ip-country-region') || undefined,
    city: city ? decodeURIComponent(city) : undefined,
    latitude: request.headers.get('x-vercel-ip-latitude') || undefined,
    longitude: request.headers.get('x-vercel-ip-longitude') || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Add server-side info
    const ip = getClientIP(request);
    const geo = getGeoInfo(request);
    const serverTimestamp = Date.now();

    const enrichedEvent = {
      ...event,
      ip,
      ...geo,
      serverTimestamp,
    };

    // If Firebase is not configured, just return success (dev mode)
    if (!db) {
      console.log('Analytics event (Firebase not configured):', enrichedEvent);
      return NextResponse.json({ success: true, warning: 'Firebase not configured' });
    }

    // Store in Firestore
    if (event.type === 'chat_message') {
      await db.collection('chat_messages').add(enrichedEvent);
    } else if (event.type === 'rating') {
      await db.collection('ratings').add(enrichedEvent);
    }

    // Also store all events in a general collection
    await db.collection('events').add(enrichedEvent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // If Firebase is not configured, return empty arrays
    if (!db) {
      return NextResponse.json([]);
    }

    if (type === 'chat') {
      const snapshot = await db.collection('chat_messages')
        .orderBy('serverTimestamp', 'desc')
        .limit(1000)
        .get();

      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json(messages);
    }

    if (type === 'ratings') {
      const snapshot = await db.collection('ratings')
        .orderBy('serverTimestamp', 'desc')
        .limit(500)
        .get();

      const ratings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json(ratings);
    }

    // Return summary of collections
    return NextResponse.json({
      collections: ['chat_messages', 'ratings', 'events'],
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
