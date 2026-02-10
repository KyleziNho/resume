import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-imposter';

// Public POST endpoint for iOS app to submit feedback
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { rating, realWord, imposterWord, categoryName, suggestion } = body;

    await db.collection('feedback').add({
      rating: rating ?? null,
      realWord: realWord ?? '',
      imposterWord: imposterWord ?? '',
      categoryName: categoryName ?? '',
      suggestion: suggestion ?? null,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

// GET endpoint for the dashboard
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json([]);
    }

    const snapshot = await db.collection('feedback')
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const feedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
  }
}
