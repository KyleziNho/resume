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

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Log all events to daily file
    await logEvent(event);

    // Special handling for specific event types
    if (event.type === 'chat_message') {
      await logChatMessage(event);
    }

    if (event.type === 'rating') {
      await logRating(event);
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
