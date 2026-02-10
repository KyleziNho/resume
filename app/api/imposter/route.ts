import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-imposter';

// iOS app uses 'categories' collection with embedded wordPairs
// Structure: { name, icon, color, wordPairs: [{ realWord, imposterWord, hint }] }

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'categories') {
      const snapshot = await db.collection('categories').get();
      const categories = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          order: index,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        };
      });
      // Sort by name to maintain consistent order
      categories.sort((a, b) => {
        const order = ['Brainrot', 'Pop Culture', 'Jobs', 'Spicy', 'Sports', 'Party'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
      return NextResponse.json(categories);
    }

    if (type === 'words') {
      const categoryId = searchParams.get('categoryId');
      if (!categoryId) {
        return NextResponse.json([]);
      }

      // Get the category document and extract wordPairs
      const catDoc = await db.collection('categories').doc(categoryId).get();
      if (!catDoc.exists) {
        return NextResponse.json([]);
      }

      const catData = catDoc.data();
      const wordPairs = catData?.wordPairs || [];

      // Convert embedded wordPairs to the format the dashboard expects
      const words = wordPairs.map((wp: { realWord: string; imposterWord: string; hint: string }, index: number) => ({
        id: `${categoryId}_${index}`, // Composite ID: categoryId_index
        categoryId,
        realWord: wp.realWord,
        imposterWord: wp.imposterWord,
        hint: wp.hint || '',
        createdAt: catData?.createdAt || Date.now(),
        updatedAt: catData?.updatedAt || Date.now(),
      }));

      return NextResponse.json(words);
    }

    if (type === 'characters') {
      // Characters aren't used by iOS app currently, return empty
      return NextResponse.json([]);
    }

    if (type === 'feedback') {
      const snapshot = await db.collection('feedback').orderBy('timestamp', 'desc').limit(500).get();
      const feedback = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          rating: data.rating,
          realWord: data.realWord,
          imposterWord: data.imposterWord,
          categoryName: data.categoryName,
          suggestion: data.suggestion,
          timestamp: data.timestamp?.toMillis?.() || data.timestamp || Date.now(),
        };
      });
      return NextResponse.json(feedback);
    }

    // Return word counts per category
    if (type === 'wordCounts') {
      const snapshot = await db.collection('categories').get();
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const wordPairs = data.wordPairs || [];
        counts[doc.id] = wordPairs.length;
      });
      return NextResponse.json(counts);
    }

    // Find a specific word by realWord + imposterWord + categoryName
    if (type === 'findWord') {
      const realWord = searchParams.get('realWord');
      const imposterWord = searchParams.get('imposterWord');
      const categoryName = searchParams.get('categoryName');

      if (!realWord || !imposterWord) {
        return NextResponse.json({ error: 'Missing realWord or imposterWord' }, { status: 400 });
      }

      // Find the category
      let categoryDoc = null;
      if (categoryName) {
        const catSnapshot = await db.collection('categories').get();
        for (const doc of catSnapshot.docs) {
          if (doc.data().name === categoryName) {
            categoryDoc = doc;
            break;
          }
        }
      }

      if (!categoryDoc) {
        // Search all categories
        const catSnapshot = await db.collection('categories').get();
        for (const doc of catSnapshot.docs) {
          const wordPairs = doc.data().wordPairs || [];
          const idx = wordPairs.findIndex((wp: { realWord: string; imposterWord: string }) =>
            wp.realWord === realWord && wp.imposterWord === imposterWord
          );
          if (idx !== -1) {
            categoryDoc = doc;
            break;
          }
        }
      }

      if (!categoryDoc) {
        return NextResponse.json(null);
      }

      const wordPairs = categoryDoc.data().wordPairs || [];
      const idx = wordPairs.findIndex((wp: { realWord: string; imposterWord: string }) =>
        wp.realWord === realWord && wp.imposterWord === imposterWord
      );

      if (idx === -1) {
        return NextResponse.json(null);
      }

      const wp = wordPairs[idx];
      return NextResponse.json({
        id: `${categoryDoc.id}_${idx}`,
        categoryId: categoryDoc.id,
        realWord: wp.realWord,
        imposterWord: wp.imposterWord,
        hint: wp.hint || '',
      });
    }

    // Returns all categories with their words embedded — for iOS app compatibility
    if (type === 'all') {
      const snapshot = await db.collection('categories').get();
      const categories = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          color: data.color,
          wordPairs: data.wordPairs || [],
        };
      });
      return NextResponse.json({ categories });
    }

    // Get pending categories (user submissions awaiting approval)
    if (type === 'pending_categories') {
      const snapshot = await db.collection('pending_categories').orderBy('createdAt', 'desc').get();
      const categories = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          colorHex: data.colorHex,
          wordPairs: data.wordPairs || [],
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          status: data.status,
          downloadCount: data.downloadCount || 0,
        };
      });
      return NextResponse.json(categories);
    }

    // Get community categories (approved user submissions)
    if (type === 'community_categories') {
      const snapshot = await db.collection('community_categories').orderBy('downloadCount', 'desc').get();
      const categories = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          colorHex: data.colorHex,
          wordPairs: data.wordPairs || [],
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          status: data.status,
          downloadCount: data.downloadCount || 0,
        };
      });
      return NextResponse.json(categories);
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Imposter GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { action } = body;

    // ── Categories ──────────────────────────────────────────────────────────
    if (action === 'addCategory') {
      const { name, icon, color } = body;
      const now = Date.now();
      const ref = await db.collection('categories').add({
        name, icon, color, wordPairs: [], createdAt: now, updatedAt: now,
      });
      return NextResponse.json({ id: ref.id });
    }

    if (action === 'updateCategory') {
      const { id, name, icon, color } = body;
      await db.collection('categories').doc(id).update({
        name, icon, color, updatedAt: Date.now(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteCategory') {
      const { id } = body;
      await db.collection('categories').doc(id).delete();
      return NextResponse.json({ success: true });
    }

    // ── Words (embedded in categories) ──────────────────────────────────────
    if (action === 'addWord') {
      const { categoryId, realWord, imposterWord, hint } = body;

      const catRef = db.collection('categories').doc(categoryId);
      const catDoc = await catRef.get();

      if (!catDoc.exists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const catData = catDoc.data();
      const wordPairs = catData?.wordPairs || [];

      // Add new word to the beginning of the array
      wordPairs.unshift({ realWord, imposterWord, hint: hint || '' });

      await catRef.update({ wordPairs, updatedAt: Date.now() });

      return NextResponse.json({ id: `${categoryId}_0` });
    }

    if (action === 'updateWord') {
      const { id, realWord, imposterWord, hint } = body;

      // Parse the composite ID: categoryId_index
      const [categoryId, indexStr] = id.split('_');
      const index = parseInt(indexStr, 10);

      if (!categoryId || isNaN(index)) {
        return NextResponse.json({ error: 'Invalid word ID format' }, { status: 400 });
      }

      const catRef = db.collection('categories').doc(categoryId);
      const catDoc = await catRef.get();

      if (!catDoc.exists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const catData = catDoc.data();
      const wordPairs = [...(catData?.wordPairs || [])];

      if (index < 0 || index >= wordPairs.length) {
        return NextResponse.json({ error: 'Word index out of range' }, { status: 404 });
      }

      // Update the word at the specified index
      wordPairs[index] = { realWord, imposterWord, hint: hint || '' };

      await catRef.update({ wordPairs, updatedAt: Date.now() });

      return NextResponse.json({ success: true });
    }

    if (action === 'deleteWord') {
      const { id } = body;

      // Parse the composite ID: categoryId_index
      const [categoryId, indexStr] = id.split('_');
      const index = parseInt(indexStr, 10);

      if (!categoryId || isNaN(index)) {
        return NextResponse.json({ error: 'Invalid word ID format' }, { status: 400 });
      }

      const catRef = db.collection('categories').doc(categoryId);
      const catDoc = await catRef.get();

      if (!catDoc.exists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const catData = catDoc.data();
      const wordPairs = [...(catData?.wordPairs || [])];

      if (index < 0 || index >= wordPairs.length) {
        return NextResponse.json({ error: 'Word index out of range' }, { status: 404 });
      }

      // Remove the word at the specified index
      wordPairs.splice(index, 1);

      await catRef.update({ wordPairs, updatedAt: Date.now() });

      return NextResponse.json({ success: true });
    }

    // ── Characters (not used by iOS app) ────────────────────────────────────
    if (action === 'addCharacter' || action === 'updateCharacter' || action === 'deleteCharacter') {
      return NextResponse.json({ success: true });
    }

    // ── Seed — disabled for production ──────────────────────────────────────
    if (action === 'seed') {
      return NextResponse.json({ error: 'Seeding disabled - use iOS app to upload words' }, { status: 400 });
    }

    // ── Approve pending submission ────────────────────────────────────────────
    if (action === 'approveSubmission') {
      const { id } = body;

      // Get the pending category
      const pendingDoc = await db.collection('pending_categories').doc(id).get();
      if (!pendingDoc.exists) {
        return NextResponse.json({ error: 'Pending category not found' }, { status: 404 });
      }

      const data = pendingDoc.data();

      // Move to community_categories with approved status
      await db.collection('community_categories').doc(id).set({
        ...data,
        status: 'approved',
        approvedAt: Date.now(),
      });

      // Delete from pending
      await db.collection('pending_categories').doc(id).delete();

      return NextResponse.json({ success: true });
    }

    // ── Reject pending submission ─────────────────────────────────────────────
    if (action === 'rejectSubmission') {
      const { id } = body;

      // Simply delete from pending_categories
      await db.collection('pending_categories').doc(id).delete();

      return NextResponse.json({ success: true });
    }

    // ── Delete community category ─────────────────────────────────────────────
    if (action === 'deleteCommunityCategory') {
      const { id } = body;
      await db.collection('community_categories').doc(id).delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Imposter POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
