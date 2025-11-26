import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Data directory for analytics (in production, use a database)
const DATA_DIR = path.join(process.cwd(), 'analytics-data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Get today's date string for file naming
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Append event to daily log file
async function logEvent(event: Record<string, unknown>) {
  await ensureDataDir();

  const filename = `${getTodayString()}.json`;
  const filepath = path.join(DATA_DIR, filename);

  let events: Record<string, unknown>[] = [];

  try {
    const existing = await fs.readFile(filepath, 'utf-8');
    events = JSON.parse(existing);
  } catch {
    // File doesn't exist yet, start fresh
  }

  events.push({
    ...event,
    serverTimestamp: Date.now(),
  });

  await fs.writeFile(filepath, JSON.stringify(events, null, 2));
}

// Store chat messages separately for easy access
async function logChatMessage(event: Record<string, unknown>) {
  await ensureDataDir();

  const filepath = path.join(DATA_DIR, 'chat-messages.json');

  let messages: Record<string, unknown>[] = [];

  try {
    const existing = await fs.readFile(filepath, 'utf-8');
    messages = JSON.parse(existing);
  } catch {
    // File doesn't exist yet
  }

  messages.push({
    ...event,
    serverTimestamp: Date.now(),
  });

  // Keep only last 1000 messages
  if (messages.length > 1000) {
    messages = messages.slice(-1000);
  }

  await fs.writeFile(filepath, JSON.stringify(messages, null, 2));
}

// Store ratings separately
async function logRating(event: Record<string, unknown>) {
  await ensureDataDir();

  const filepath = path.join(DATA_DIR, 'ratings.json');

  let ratings: Record<string, unknown>[] = [];

  try {
    const existing = await fs.readFile(filepath, 'utf-8');
    ratings = JSON.parse(existing);
  } catch {
    // File doesn't exist yet
  }

  ratings.push({
    ...event,
    serverTimestamp: Date.now(),
  });

  await fs.writeFile(filepath, JSON.stringify(ratings, null, 2));
}

// Extract IP address from request headers
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

// Get geo info from Vercel headers (available on Vercel deployments)
function getGeoInfo(request: NextRequest) {
  return {
    country: request.headers.get('x-vercel-ip-country') || undefined,
    region: request.headers.get('x-vercel-ip-country-region') || undefined,
    city: request.headers.get('x-vercel-ip-city') || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Add server-side info
    const ip = getClientIP(request);
    const geo = getGeoInfo(request);

    const enrichedEvent = {
      ...event,
      ip,
      ...geo,
    };

    // Log all events to daily file
    await logEvent(enrichedEvent);

    // Special handling for specific event types
    if (event.type === 'chat_message') {
      await logChatMessage(enrichedEvent);
    }

    if (event.type === 'rating') {
      await logRating(enrichedEvent);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}

// GET endpoint to retrieve analytics (protected - add auth in production)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    await ensureDataDir();

    if (type === 'chat') {
      const filepath = path.join(DATA_DIR, 'chat-messages.json');
      try {
        const data = await fs.readFile(filepath, 'utf-8');
        return NextResponse.json(JSON.parse(data));
      } catch {
        return NextResponse.json([]);
      }
    }

    if (type === 'ratings') {
      const filepath = path.join(DATA_DIR, 'ratings.json');
      try {
        const data = await fs.readFile(filepath, 'utf-8');
        return NextResponse.json(JSON.parse(data));
      } catch {
        return NextResponse.json([]);
      }
    }

    if (type === 'today') {
      const filepath = path.join(DATA_DIR, `${getTodayString()}.json`);
      try {
        const data = await fs.readFile(filepath, 'utf-8');
        return NextResponse.json(JSON.parse(data));
      } catch {
        return NextResponse.json([]);
      }
    }

    // Return list of available data files
    const files = await fs.readdir(DATA_DIR);
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
