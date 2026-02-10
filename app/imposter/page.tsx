'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface WordPair {
  id: string;
  categoryId: string;
  realWord: string;
  imposterWord: string;
  hint: string;
  createdAt: number;
  updatedAt: number;
}

interface Character {
  id: string;
  name: string;
  key: string;
  accentColor: string;
  normalImage: string;
  imposterImage: string;
  voteImage: string;
  normalImageData?: string;
  imposterImageData?: string;
  voteImageData?: string;
  createdAt: number;
}

interface FeedbackEntry {
  id: string;
  rating: number | null;
  realWord: string;
  imposterWord: string;
  categoryName: string;
  suggestion: string | null;
  timestamp: number;
}

interface GameSession {
  id: string;
  sessionId: string;
  categoryName: string;
  realWord: string;
  imposterWord: string;
  playerCount: number;
  imposterCount: number;
  hintsEnabled: boolean;
  roundDuration: number;
  didCatchImposter: boolean;
  gameDurationSeconds: number;
  characters: string[];
  phaseDurations: Record<string, number>;
  totalVotes: number;
  imposterVoteCount: number;
  timerExpired: boolean;
  voteMargin: number;
  suspicionAccuracy: number;
  imposterStealthScore: number;
  isUnanimous: boolean;
  clientTimestamp: number;
  serverTimestamp: number;
}

interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
  wordPairs: { realWord: string; imposterWord: string; hint: string }[];
  creatorId: string;
  creatorName: string;
  createdAt: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  downloadCount: number;
}

// Grouped feedback: rating + suggestion merged into one row when they share the same word pair within a time window
interface GroupedFeedback {
  id: string;
  rating: number | null;
  realWord: string;
  imposterWord: string;
  categoryName: string;
  suggestion: string | null;
  timestamp: number;
}

// ── API helpers ────────────────────────────────────────────────────────────────
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts);
  return res.json();
}

function apiGet(type: string, extra = '') {
  return api(`/api/imposter?type=${type}${extra}`);
}

function apiPost(body: Record<string, unknown>) {
  return api('/api/imposter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Group feedback entries ─────────────────────────────────────────────────────
function groupFeedback(entries: FeedbackEntry[]): GroupedFeedback[] {
  // Group entries that share the same word pair and are within 120s of each other
  const groups: GroupedFeedback[] = [];
  const used = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    if (used.has(entries[i].id)) continue;
    const entry = entries[i];
    used.add(entry.id);

    // Look for a sibling entry (same word pair, within 120s)
    let merged: GroupedFeedback = { ...entry };
    for (let j = i + 1; j < entries.length; j++) {
      if (used.has(entries[j].id)) continue;
      const other = entries[j];
      if (
        other.realWord === entry.realWord &&
        other.imposterWord === entry.imposterWord &&
        Math.abs(other.timestamp - entry.timestamp) < 120_000
      ) {
        used.add(other.id);
        // Merge: take rating from whichever has it, suggestion from whichever has it
        merged = {
          ...merged,
          rating: merged.rating ?? other.rating,
          suggestion: merged.suggestion ?? other.suggestion,
          categoryName: merged.categoryName || other.categoryName,
          timestamp: Math.min(merged.timestamp, other.timestamp),
        };
      }
    }
    groups.push(merged);
  }
  return groups;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ImposterDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'words' | 'characters' | 'feedback' | 'analytics' | 'submissions'>('words');

  // Words tab state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [words, setWords] = useState<WordPair[]>([]);
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  // Characters tab state
  const [characters, setCharacters] = useState<Character[]>([]);

  // Feedback tab state
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);

  // Analytics tab state
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');

  // Submissions tab state
  const [pendingCategories, setPendingCategories] = useState<CustomCategory[]>([]);
  const [communityCategories, setCommunityCategories] = useState<CustomCategory[]>([]);
  const [submissionsView, setSubmissionsView] = useState<'pending' | 'approved'>('pending');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [feedbackEditId, setFeedbackEditId] = useState<string | null>(null); // grouped entry id being edited
  const [feedbackEditWord, setFeedbackEditWord] = useState<{ wordId: string; categoryId: string; realWord: string; imposterWord: string; hint: string } | null>(null);
  const [feedbackEditLoading, setFeedbackEditLoading] = useState<string | null>(null); // entry id loading lookup

  // UI state — words
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'realWord' | 'imposterWord' | 'hint'>('realWord');
  const [editingWord, setEditingWord] = useState({ realWord: '', imposterWord: '', hint: '' });
  const [addingWord, setAddingWord] = useState(false);
  const [newWord, setNewWord] = useState({ realWord: '', imposterWord: '', hint: '' });
  const editInputRef = useRef<HTMLInputElement>(null);
  const addFirstRef = useRef<HTMLInputElement>(null);

  // UI state — categories
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: '#A855F7' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState({ name: '', icon: '', color: '' });

  // UI state — characters
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [newCharacter, setNewCharacter] = useState({ name: '', key: '', accentColor: '#3B82F6', normalImage: '', imposterImage: '', voteImage: '', normalImageData: '', imposterImageData: '', voteImageData: '' });
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editingCharacter, setEditingCharacter] = useState({ name: '', key: '', accentColor: '', normalImage: '', imposterImage: '', voteImage: '', normalImageData: '', imposterImageData: '', voteImageData: '' });

  const [seeding, setSeeding] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '90201') {
      setIsAuthenticated(true);
      setError('');
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setError('Invalid code');
      setCode('');
    }
  };

  // ── Data loading (stable refs — no cascading re-fetches) ────────────────────
  const selectedCategoryIdRef = useRef(selectedCategoryId);
  selectedCategoryIdRef.current = selectedCategoryId;

  const loadCategories = useCallback(async () => {
    const data = await apiGet('categories');
    if (Array.isArray(data)) {
      setCategories(data);
      if (data.length > 0 && !selectedCategoryIdRef.current) setSelectedCategoryId(data[0].id);
    }
  }, []);

  const loadWords = useCallback(async (categoryId: string) => {
    setLoading(true);
    const data = await apiGet('words', `&categoryId=${categoryId}`);
    if (Array.isArray(data)) setWords(data);
    setLoading(false);
  }, []);

  const loadWordCounts = useCallback(async () => {
    const data = await apiGet('wordCounts');
    if (data && typeof data === 'object') setWordCounts(data);
  }, []);

  const loadCharacters = useCallback(async () => {
    const data = await apiGet('characters');
    if (Array.isArray(data)) setCharacters(data);
  }, []);

  const loadFeedback = useCallback(async () => {
    const data = await api('/api/imposter/feedback');
    if (Array.isArray(data)) setFeedback(data);
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api('/api/imposter/analytics');
      if (Array.isArray(data)) {
        setSessions(data);
      } else {
        console.error('Analytics API returned non-array:', data);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, []);

  const loadPendingCategories = useCallback(async () => {
    const data = await apiGet('pending_categories');
    if (Array.isArray(data)) setPendingCategories(data);
  }, []);

  const loadCommunityCategories = useCallback(async () => {
    const data = await apiGet('community_categories');
    if (Array.isArray(data)) setCommunityCategories(data);
  }, []);

  // Initial load — runs once on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    loadCategories();
    loadWordCounts();
    loadCharacters();
    loadFeedback();
    loadSessions();
    loadPendingCategories();
    loadCommunityCategories();
  }, [isAuthenticated, loadCategories, loadWordCounts, loadCharacters, loadFeedback, loadSessions, loadPendingCategories, loadCommunityCategories]);

  // Load words when selected category changes
  useEffect(() => {
    if (selectedCategoryId) loadWords(selectedCategoryId);
  }, [selectedCategoryId, loadWords]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingWordId) setTimeout(() => editInputRef.current?.focus(), 0);
  }, [editingWordId, editingField]);

  useEffect(() => {
    if (addingWord) setTimeout(() => addFirstRef.current?.focus(), 0);
  }, [addingWord]);

  // ── Seed ────────────────────────────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    await apiPost({ action: 'seed' });
    await Promise.all([loadCategories(), loadWordCounts(), loadCharacters()]);
    setSeeding(false);
  };

  // ── Category CRUD ───────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    await apiPost({ action: 'addCategory', ...newCategory, order: categories.length });
    setNewCategory({ name: '', icon: '', color: '#A855F7' });
    setShowAddCategory(false);
    await loadCategories();
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId) return;
    await apiPost({ action: 'updateCategory', id: editingCategoryId, ...editingCategory });
    setEditingCategoryId(null);
    await loadCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its words?')) return;
    await apiPost({ action: 'deleteCategory', id });
    if (selectedCategoryId === id) { setSelectedCategoryId(null); setWords([]); }
    await Promise.all([loadCategories(), loadWordCounts()]);
  };

  // ── Word CRUD ───────────────────────────────────────────────────────────────
  const startEditWord = (word: WordPair, field: 'realWord' | 'imposterWord' | 'hint' = 'realWord') => {
    setEditingWordId(word.id);
    setEditingField(field);
    setEditingWord({ realWord: word.realWord, imposterWord: word.imposterWord, hint: word.hint });
    setAddingWord(false);
  };

  const saveEditWord = async () => {
    if (!editingWordId) return;
    const id = editingWordId;
    const updated = { ...editingWord };
    setEditingWordId(null);
    // Update local state immediately — no refetch needed
    setWords(prev => prev.map(w => w.id === id ? { ...w, ...updated, updatedAt: Date.now() } : w));
    await apiPost({ action: 'updateWord', id, ...updated });
  };

  const cancelEdit = () => setEditingWordId(null);

  const handleEditKeyDown = (e: React.KeyboardEvent, field: 'realWord' | 'imposterWord' | 'hint') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Tab to next field, or save on last field
      if (field === 'realWord') setEditingField('imposterWord');
      else if (field === 'imposterWord') setEditingField('hint');
      else saveEditWord();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (field === 'realWord') { e.preventDefault(); setEditingField('imposterWord'); }
      else if (field === 'imposterWord') { e.preventDefault(); setEditingField('hint'); }
      else if (field === 'hint') { e.preventDefault(); saveEditWord(); }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (field === 'hint') { e.preventDefault(); setEditingField('imposterWord'); }
      else if (field === 'imposterWord') { e.preventDefault(); setEditingField('realWord'); }
    }
  };

  const handleAddWord = async () => {
    if (!newWord.realWord || !selectedCategoryId) return;
    const catId = selectedCategoryId;
    const word = { ...newWord };
    setNewWord({ realWord: '', imposterWord: '', hint: '' });
    setAddingWord(false);
    const result = await apiPost({ action: 'addWord', categoryId: catId, ...word });
    // Update local state with the new word
    if (result?.id) {
      const now = Date.now();
      setWords(prev => [{ id: result.id, categoryId: catId, ...word, createdAt: now, updatedAt: now }, ...prev]);
      setWordCounts(prev => ({ ...prev, [catId]: (prev[catId] || 0) + 1 }));
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent, field: 'realWord' | 'imposterWord' | 'hint') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'hint') handleAddWord();
    } else if (e.key === 'Escape') {
      setAddingWord(false);
      setNewWord({ realWord: '', imposterWord: '', hint: '' });
    }
  };

  const handleDeleteWord = async (id: string) => {
    // Update local state immediately
    const catId = selectedCategoryId;
    setWords(prev => prev.filter(w => w.id !== id));
    if (catId) setWordCounts(prev => ({ ...prev, [catId]: Math.max(0, (prev[catId] || 1) - 1) }));
    await apiPost({ action: 'deleteWord', id });
  };

  // ── Character CRUD ──────────────────────────────────────────────────────────
  const handleAddCharacter = async () => {
    if (!newCharacter.name) return;
    await apiPost({ action: 'addCharacter', ...newCharacter });
    setNewCharacter({ name: '', key: '', accentColor: '#3B82F6', normalImage: '', imposterImage: '', voteImage: '', normalImageData: '', imposterImageData: '', voteImageData: '' });
    setShowAddCharacter(false);
    await loadCharacters();
  };

  const handleUpdateCharacter = async () => {
    if (!editingCharacterId) return;
    await apiPost({ action: 'updateCharacter', id: editingCharacterId, ...editingCharacter });
    setEditingCharacterId(null);
    await loadCharacters();
  };

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Delete this character?')) return;
    await apiPost({ action: 'deleteCharacter', id });
    await loadCharacters();
  };

  // ── Feedback word edit/delete ────────────────────────────────────────────────
  const lookupFeedbackWord = async (entry: GroupedFeedback) => {
    setFeedbackEditLoading(entry.id);
    const params = new URLSearchParams({ realWord: entry.realWord, imposterWord: entry.imposterWord });
    if (entry.categoryName) params.set('categoryName', entry.categoryName);
    const data = await apiGet('findWord', `&${params.toString()}`);
    setFeedbackEditLoading(null);
    if (data && data.id) {
      setFeedbackEditId(entry.id);
      setFeedbackEditWord({
        wordId: data.id,
        categoryId: data.categoryId,
        realWord: data.realWord,
        imposterWord: data.imposterWord,
        hint: data.hint || '',
      });
    } else {
      alert('Word not found in database — it may have already been deleted.');
    }
  };

  const saveFeedbackWordEdit = async () => {
    if (!feedbackEditWord) return;
    const edit = { ...feedbackEditWord };
    setFeedbackEditId(null);
    setFeedbackEditWord(null);
    // Update words tab local state if same category is selected
    if (edit.categoryId === selectedCategoryId) {
      setWords(prev => prev.map(w => w.id === edit.wordId ? { ...w, realWord: edit.realWord, imposterWord: edit.imposterWord, hint: edit.hint, updatedAt: Date.now() } : w));
    }
    await apiPost({ action: 'updateWord', id: edit.wordId, realWord: edit.realWord, imposterWord: edit.imposterWord, hint: edit.hint });
  };

  const deleteFeedbackWord = async (entry: GroupedFeedback) => {
    setFeedbackEditLoading(entry.id);
    const params = new URLSearchParams({ realWord: entry.realWord, imposterWord: entry.imposterWord });
    if (entry.categoryName) params.set('categoryName', entry.categoryName);
    const data = await apiGet('findWord', `&${params.toString()}`);
    setFeedbackEditLoading(null);
    if (!data || !data.id) {
      alert('Word not found in database — it may have already been deleted.');
      return;
    }
    if (!confirm(`Delete "${data.realWord} / ${data.imposterWord}" from the database?`)) return;
    // Update local state immediately
    if (data.categoryId === selectedCategoryId) {
      setWords(prev => prev.filter(w => w.id !== data.id));
    }
    setWordCounts(prev => ({ ...prev, [data.categoryId]: Math.max(0, (prev[data.categoryId] || 1) - 1) }));
    await apiPost({ action: 'deleteWord', id: data.id });
  };

  const feedbackEditKeyDown = (e: React.KeyboardEvent, field: 'realWord' | 'imposterWord' | 'hint') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'hint') saveFeedbackWordEdit();
    } else if (e.key === 'Escape') {
      setFeedbackEditId(null);
      setFeedbackEditWord(null);
    }
  };

  // ── Submissions CRUD ────────────────────────────────────────────────────────
  const handleApproveSubmission = async (id: string) => {
    if (!confirm('Approve this submission? It will be visible to all users.')) return;
    // Optimistically update UI
    const approved = pendingCategories.find(c => c.id === id);
    if (approved) {
      setPendingCategories(prev => prev.filter(c => c.id !== id));
      setCommunityCategories(prev => [{ ...approved, status: 'approved' }, ...prev]);
    }
    await apiPost({ action: 'approveSubmission', id });
  };

  const handleRejectSubmission = async (id: string) => {
    if (!confirm('Reject this submission? It will be permanently deleted.')) return;
    setPendingCategories(prev => prev.filter(c => c.id !== id));
    await apiPost({ action: 'rejectSubmission', id });
  };

  const handleDeleteCommunityCategory = async (id: string) => {
    if (!confirm('Delete this community category? It will be removed for all users.')) return;
    setCommunityCategories(prev => prev.filter(c => c.id !== id));
    await apiPost({ action: 'deleteCommunityCategory', id });
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'normalImageData' | 'imposterImageData' | 'voteImageData',
    target: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await fileToBase64(file);
    if (target === 'new') setNewCharacter(p => ({ ...p, [field]: data }));
    else setEditingCharacter(p => ({ ...p, [field]: data }));
  };

  const grouped = groupFeedback(feedbackFilter === 'all' ? feedback : feedback.filter(f => f.categoryName === feedbackFilter));

  // ── Editable cell helper ────────────────────────────────────────────────────
  const EditableCell = ({ word, field, className = '' }: { word: WordPair; field: 'realWord' | 'imposterWord' | 'hint'; className?: string }) => {
    const isEditing = editingWordId === word.id && editingField === field;
    const isEditingRow = editingWordId === word.id;

    if (isEditing) {
      return (
        <input
          ref={editInputRef}
          value={editingWord[field]}
          onChange={e => setEditingWord(p => ({ ...p, [field]: e.target.value }))}
          onKeyDown={e => handleEditKeyDown(e, field)}
          onBlur={saveEditWord}
          className={`w-full bg-white border-b-2 border-black px-1 py-0.5 text-[11px] focus:outline-none ${className}`}
        />
      );
    }

    return (
      <span
        onClick={() => startEditWord(word, field)}
        className={`block w-full px-1 py-0.5 cursor-text rounded-sm ${isEditingRow ? 'bg-[#e8e8e8]' : 'hover:bg-[#f0f0f0]'} ${className}`}
      >
        {word[field] || <span className="text-gray-300 italic">empty</span>}
      </span>
    );
  };

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'repeating-conic-gradient(#c0c0c0 0% 25%, #808080 0% 50%) 0 0 / 8px 8px' }}>
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-0 w-[320px]">
          <div className="bg-[#c0c0c0] border-b-2 border-black px-3 py-1 flex items-center gap-2">
            <div className="w-3 h-3 border border-black bg-white" />
            <span className="text-[11px] font-bold tracking-wide uppercase flex-1 text-center">Imposter Dashboard</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-2 border-black flex items-center justify-center text-3xl bg-[#f0f0f0]">
              🕵️
            </div>
            <p className="text-[11px] text-center tracking-wide">Enter admin code to continue</p>
            <form onSubmit={handleLogin} className="w-full flex flex-col gap-2">
              <input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full border-2 border-black p-2 text-center text-[12px] font-mono bg-white focus:outline-none"
                placeholder="••••••"
                autoFocus
              />
              {error && <p className="text-[10px] text-red-600 text-center">{error}</p>}
              <button type="submit" className="w-full border-2 border-black bg-[#c0c0c0] py-1.5 text-[11px] font-bold tracking-wider uppercase active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shadow-[2px_2px_0_rgba(0,0,0,1)]">
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'repeating-conic-gradient(#c0c0c0 0% 25%, #808080 0% 50%) 0 0 / 8px 8px' }}>
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
          {/* Title bar */}
          <div className="bg-[#c0c0c0] border-b-2 border-black px-3 py-1 flex items-center gap-2">
            <div className="w-3 h-3 border border-black bg-[#ff5f57]" />
            <span className="text-[11px] font-bold tracking-wide uppercase flex-1 text-center">Imposter — Word Pack Manager</span>
            <div className="w-3 h-3" />
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-black">
            {(['words', 'characters', 'feedback', 'analytics', 'submissions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-[11px] font-bold tracking-wider uppercase border-r-2 border-black last:border-r-0 ${activeTab === tab ? 'bg-white' : 'bg-[#d0d0d0]'}`}
              >
                {tab === 'words' ? `Words (${Object.values(wordCounts).reduce((a, b) => a + b, 0)})` : tab === 'characters' ? `Characters (${characters.length})` : tab === 'feedback' ? `Feedback (${grouped.length})` : tab === 'analytics' ? `Analytics (${sessions.length})` : `Submissions (${pendingCategories.length})`}
              </button>
            ))}
          </div>

          {/* Seed banner */}
          {categories.length === 0 && activeTab === 'words' && (
            <div className="bg-[#ffffcc] border-b-2 border-black p-3 flex items-center justify-between">
              <span className="text-[11px]">No categories found. Seed the database with default word packs?</span>
              <button onClick={handleSeed} disabled={seeding} className="border-2 border-black bg-[#c0c0c0] px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50">
                {seeding ? 'Seeding...' : 'Seed Database'}
              </button>
            </div>
          )}

          {/* Tab content */}
          <div className="min-h-[500px]">

            {/* ── WORDS TAB ─────────────────────────────────────────────── */}
            {activeTab === 'words' && (
              <div className="flex min-h-[500px]">
                {/* Category sidebar */}
                <div className="w-[200px] border-r-2 border-black bg-[#f0f0f0] flex flex-col">
                  <div className="border-b border-black px-2 py-1.5 bg-[#d0d0d0]">
                    <span className="text-[10px] font-bold tracking-wider uppercase">Categories</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {categories.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => { setSelectedCategoryId(cat.id); setEditingWordId(null); setAddingWord(false); }}
                        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-[#d0d0d0] text-[11px] ${selectedCategoryId === cat.id ? 'bg-black text-white' : 'hover:bg-[#e0e0e0]'}`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full border border-black/30 flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 truncate">{cat.name}</span>
                        <span className={`text-[9px] ${selectedCategoryId === cat.id ? 'text-white/70' : 'text-gray-400'}`}>
                          {wordCounts[cat.id] ?? '—'}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); setEditingCategoryId(cat.id); setEditingCategory({ name: cat.name, icon: cat.icon, color: cat.color }); }}
                          className={`text-[9px] ${selectedCategoryId === cat.id ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-black'}`}
                        >✎</button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                          className={`text-[9px] ${selectedCategoryId === cat.id ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-red-600'}`}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  {showAddCategory ? (
                    <div className="border-t-2 border-black p-2 bg-white space-y-1.5">
                      <input value={newCategory.name} onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full border border-black px-1.5 py-0.5 text-[10px] bg-white focus:outline-none" autoFocus />
                      <input value={newCategory.icon} onChange={e => setNewCategory(p => ({ ...p, icon: e.target.value }))} placeholder="Icon key" className="w-full border border-black px-1.5 py-0.5 text-[10px] bg-white focus:outline-none" />
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={newCategory.color} onChange={e => setNewCategory(p => ({ ...p, color: e.target.value }))} className="w-6 h-6 border border-black cursor-pointer" />
                        <span className="text-[9px] font-mono text-gray-500">{newCategory.color}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={handleAddCategory} className="flex-1 border border-black bg-[#c0c0c0] py-0.5 text-[9px] font-bold uppercase">Save</button>
                        <button onClick={() => setShowAddCategory(false)} className="flex-1 border border-black bg-white py-0.5 text-[9px] font-bold uppercase">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddCategory(true)} className="border-t-2 border-black py-1.5 text-[10px] font-bold tracking-wider uppercase bg-[#d0d0d0] hover:bg-[#c0c0c0]">
                      + Add Category
                    </button>
                  )}
                </div>

                {/* Edit category modal */}
                {editingCategoryId && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditingCategoryId(null)}>
                    <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] w-[300px]" onClick={e => e.stopPropagation()}>
                      <div className="bg-[#c0c0c0] border-b-2 border-black px-3 py-1 flex items-center gap-2">
                        <div className="w-3 h-3 border border-black bg-white cursor-pointer" onClick={() => setEditingCategoryId(null)} />
                        <span className="text-[11px] font-bold tracking-wide uppercase flex-1 text-center">Edit Category</span>
                      </div>
                      <div className="p-4 space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider">Name</label>
                        <input value={editingCategory.name} onChange={e => setEditingCategory(p => ({ ...p, name: e.target.value }))} className="w-full border-2 border-black px-2 py-1 text-[11px] focus:outline-none" />
                        <label className="block text-[10px] font-bold uppercase tracking-wider">Icon Key</label>
                        <input value={editingCategory.icon} onChange={e => setEditingCategory(p => ({ ...p, icon: e.target.value }))} className="w-full border-2 border-black px-2 py-1 text-[11px] focus:outline-none" />
                        <label className="block text-[10px] font-bold uppercase tracking-wider">Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={editingCategory.color} onChange={e => setEditingCategory(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 border border-black cursor-pointer" />
                          <span className="text-[10px] font-mono">{editingCategory.color}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={handleUpdateCategory} className="flex-1 border-2 border-black bg-[#c0c0c0] py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Save</button>
                          <button onClick={() => setEditingCategoryId(null)} className="flex-1 border-2 border-black bg-white py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Words main area */}
                <div className="flex-1 flex flex-col">
                  {selectedCategoryId ? (
                    <>
                      {/* Toolbar */}
                      <div className="border-b border-black px-3 py-1.5 bg-[#e8e8e8] flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider uppercase">
                          {categories.find(c => c.id === selectedCategoryId)?.name ?? ''} — {words.length} words
                        </span>
                        <button
                          onClick={() => { setAddingWord(true); setEditingWordId(null); }}
                          className="border border-black bg-[#c0c0c0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[1px_1px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                          + Add Word
                        </button>
                      </div>

                      {/* Words table */}
                      <div className="flex-1 overflow-y-auto">
                        {loading ? (
                          <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">Loading...</div>
                        ) : (
                          <table className="w-full text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-[#e8e8e8] border-b border-black text-left">
                                <th className="px-3 py-1.5 font-bold tracking-wider uppercase text-[10px] w-[28%]">Real Word</th>
                                <th className="px-3 py-1.5 font-bold tracking-wider uppercase text-[10px] w-[28%]">Imposter Word</th>
                                <th className="px-3 py-1.5 font-bold tracking-wider uppercase text-[10px]">Hint</th>
                                <th className="py-1.5 w-6"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Inline add row */}
                              {addingWord && (
                                <tr className="border-b border-[#d0d0d0] bg-[#ffffcc]">
                                  <td className="px-2 py-1">
                                    <input ref={addFirstRef} value={newWord.realWord} onChange={e => setNewWord(p => ({ ...p, realWord: e.target.value }))} onKeyDown={e => handleAddKeyDown(e, 'realWord')} placeholder="Real word" className="w-full bg-white border-b-2 border-black px-1 py-0.5 text-[11px] font-mono focus:outline-none" />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input value={newWord.imposterWord} onChange={e => setNewWord(p => ({ ...p, imposterWord: e.target.value }))} onKeyDown={e => handleAddKeyDown(e, 'imposterWord')} placeholder="Imposter word" className="w-full bg-white border-b-2 border-black px-1 py-0.5 text-[11px] font-mono focus:outline-none" />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input value={newWord.hint} onChange={e => setNewWord(p => ({ ...p, hint: e.target.value }))} onKeyDown={e => handleAddKeyDown(e, 'hint')} placeholder="Hint — Enter to save" className="w-full bg-white border-b-2 border-black px-1 py-0.5 text-[11px] text-gray-600 focus:outline-none" />
                                  </td>
                                  <td className="pr-1">
                                    <button onClick={() => { setAddingWord(false); setNewWord({ realWord: '', imposterWord: '', hint: '' }); }} className="text-[10px] text-gray-400 hover:text-black" title="Cancel">✕</button>
                                  </td>
                                </tr>
                              )}
                              {words.map(word => (
                                <tr key={word.id} className={`border-b border-[#e8e8e8] group ${editingWordId === word.id ? 'bg-[#f5f5dc]' : 'hover:bg-[#fafafa]'}`}>
                                  <td className="px-2 py-0.5 font-mono">
                                    <EditableCell word={word} field="realWord" />
                                  </td>
                                  <td className="px-2 py-0.5 font-mono">
                                    <EditableCell word={word} field="imposterWord" />
                                  </td>
                                  <td className="px-2 py-0.5 text-gray-600">
                                    <EditableCell word={word} field="hint" />
                                  </td>
                                  <td className="pr-1 py-0.5">
                                    <button
                                      onClick={() => handleDeleteWord(word.id)}
                                      className="text-transparent group-hover:text-gray-300 hover:!text-red-500 transition-colors"
                                      title="Delete"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {words.length === 0 && !loading && !addingWord && (
                                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">No words in this category</td></tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-[11px] text-gray-400">
                      {categories.length > 0 ? 'Select a category' : 'No categories — seed the database first'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CHARACTERS TAB ────────────────────────────────────────── */}
            {activeTab === 'characters' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold tracking-wider uppercase">All Characters</span>
                  <button onClick={() => { setShowAddCharacter(true); setEditingCharacterId(null); }} className="border border-black bg-[#c0c0c0] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[1px_1px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                    + Add Character
                  </button>
                </div>

                {showAddCharacter && (
                  <div className="border-2 border-black bg-[#ffffcc] p-3 mb-4 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">Name</label>
                        <input value={newCharacter.name} onChange={e => setNewCharacter(p => ({ ...p, name: e.target.value }))} className="w-full border border-black px-2 py-1 text-[11px] focus:outline-none" autoFocus />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">Key</label>
                        <input value={newCharacter.key} onChange={e => setNewCharacter(p => ({ ...p, key: e.target.value }))} placeholder="player-name" className="w-full border border-black px-2 py-1 text-[11px] focus:outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">Accent Color</label>
                        <div className="flex items-center gap-1.5">
                          <input type="color" value={newCharacter.accentColor} onChange={e => setNewCharacter(p => ({ ...p, accentColor: e.target.value }))} className="w-6 h-6 border border-black cursor-pointer" />
                          <span className="text-[9px] font-mono">{newCharacter.accentColor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      {(['normal', 'imposter', 'vote'] as const).map(variant => {
                        const dataField = `${variant}ImageData` as 'normalImageData' | 'imposterImageData' | 'voteImageData';
                        const keyField = `${variant}Image` as 'normalImage' | 'imposterImage' | 'voteImage';
                        return (
                          <div key={variant}>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">{variant} Image</label>
                            <div className="border border-black bg-white p-1.5 flex flex-col items-center gap-1.5">
                              {newCharacter[dataField] ? (
                                <img src={newCharacter[dataField]} alt={variant} className="w-16 h-16 object-contain" />
                              ) : (
                                <div className="w-16 h-16 bg-[#f0f0f0] border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">No image</div>
                              )}
                              <label className="border border-black bg-[#e0e0e0] px-2 py-0.5 text-[8px] font-bold uppercase cursor-pointer hover:bg-[#d0d0d0]">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, dataField, 'new')} />
                              </label>
                              <input value={newCharacter[keyField]} onChange={e => setNewCharacter(p => ({ ...p, [keyField]: e.target.value }))} placeholder="asset key" className="w-full border border-black px-1 py-0.5 text-[9px] focus:outline-none text-center" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddCharacter} className="border border-black bg-[#c0c0c0] px-3 py-0.5 text-[9px] font-bold uppercase">Add</button>
                      <button onClick={() => setShowAddCharacter(false)} className="border border-black bg-white px-3 py-0.5 text-[9px] font-bold uppercase">Cancel</button>
                    </div>
                  </div>
                )}

                {editingCharacterId && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditingCharacterId(null)}>
                    <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] w-[480px]" onClick={e => e.stopPropagation()}>
                      <div className="bg-[#c0c0c0] border-b-2 border-black px-3 py-1 flex items-center gap-2">
                        <div className="w-3 h-3 border border-black bg-white cursor-pointer" onClick={() => setEditingCharacterId(null)} />
                        <span className="text-[11px] font-bold tracking-wide uppercase flex-1 text-center">Edit Character</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">Name</label>
                            <input value={editingCharacter.name} onChange={e => setEditingCharacter(p => ({ ...p, name: e.target.value }))} className="w-full border-2 border-black px-2 py-1 text-[11px] focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">Key</label>
                            <input value={editingCharacter.key} onChange={e => setEditingCharacter(p => ({ ...p, key: e.target.value }))} className="w-full border-2 border-black px-2 py-1 text-[11px] focus:outline-none" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">Accent Color</label>
                            <div className="flex items-center gap-1.5">
                              <input type="color" value={editingCharacter.accentColor} onChange={e => setEditingCharacter(p => ({ ...p, accentColor: e.target.value }))} className="w-6 h-6 border border-black cursor-pointer" />
                              <span className="text-[9px] font-mono">{editingCharacter.accentColor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {(['normal', 'imposter', 'vote'] as const).map(variant => {
                            const dataField = `${variant}ImageData` as 'normalImageData' | 'imposterImageData' | 'voteImageData';
                            const keyField = `${variant}Image` as 'normalImage' | 'imposterImage' | 'voteImage';
                            const currentChar = characters.find(c => c.id === editingCharacterId);
                            const existingData = currentChar?.[dataField];
                            const previewSrc = editingCharacter[dataField] || existingData;
                            return (
                              <div key={variant}>
                                <label className="block text-[9px] font-bold uppercase tracking-wider mb-0.5">{variant}</label>
                                <div className="border-2 border-black bg-[#f0f0f0] p-1.5 flex flex-col items-center gap-1.5">
                                  {previewSrc ? (
                                    <img src={previewSrc} alt={variant} className="w-20 h-20 object-contain" />
                                  ) : (
                                    <div className="w-20 h-20 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">No image</div>
                                  )}
                                  <label className="border border-black bg-[#d0d0d0] px-2 py-0.5 text-[8px] font-bold uppercase cursor-pointer hover:bg-[#c0c0c0]">
                                    Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, dataField, 'edit')} />
                                  </label>
                                  <input value={editingCharacter[keyField]} onChange={e => setEditingCharacter(p => ({ ...p, [keyField]: e.target.value }))} placeholder="asset key" className="w-full border border-black px-1 py-0.5 text-[9px] focus:outline-none text-center" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={handleUpdateCharacter} className="flex-1 border-2 border-black bg-[#c0c0c0] py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Save</button>
                          <button onClick={() => setEditingCharacterId(null)} className="flex-1 border-2 border-black bg-white py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {characters.map(char => (
                    <div key={char.id} className="border-2 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: char.accentColor }} />
                          <span className="text-[12px] font-bold">{char.name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditingCharacterId(char.id); setEditingCharacter({ name: char.name, key: char.key, accentColor: char.accentColor, normalImage: char.normalImage, imposterImage: char.imposterImage, voteImage: char.voteImage, normalImageData: char.normalImageData || '', imposterImageData: char.imposterImageData || '', voteImageData: char.voteImageData || '' }); setShowAddCharacter(false); }} className="text-[10px] text-gray-400 hover:text-black">✎</button>
                          <button onClick={() => handleDeleteCharacter(char.id)} className="text-[10px] text-gray-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                      {(char.normalImageData || char.imposterImageData || char.voteImageData) && (
                        <div className="flex gap-2 mb-2">
                          {[{ label: 'Normal', src: char.normalImageData }, { label: 'Imp', src: char.imposterImageData }, { label: 'Vote', src: char.voteImageData }].map(img => (
                            <div key={img.label} className="flex-1 text-center">
                              {img.src ? <img src={img.src} alt={img.label} className="w-full h-14 object-contain border border-[#e0e0e0] bg-[#f8f8f8]" /> : <div className="w-full h-14 border border-dashed border-[#d0d0d0] bg-[#f8f8f8] flex items-center justify-center text-[8px] text-gray-400">—</div>}
                              <span className="text-[8px] text-gray-400 uppercase">{img.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-0.5 text-[10px] font-mono text-gray-600">
                        <p><span className="text-gray-400">key:</span> {char.key}</p>
                        <p><span className="text-gray-400">normal:</span> {char.normalImage}</p>
                        <p><span className="text-gray-400">imposter:</span> {char.imposterImage}</p>
                        <p><span className="text-gray-400">vote:</span> {char.voteImage}</p>
                      </div>
                    </div>
                  ))}
                  {characters.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-[11px] text-gray-400">No characters — seed the database first</div>
                  )}
                </div>
              </div>
            )}

            {/* ── ANALYTICS TAB ─────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <AnalyticsTab sessions={sessions} />
            )}

            {/* ── SUBMISSIONS TAB ───────────────────────────────────────── */}
            {activeTab === 'submissions' && (
              <div className="flex flex-col min-h-[500px]">
                {/* Sub-tabs for Pending vs Approved */}
                <div className="border-b border-black px-3 py-1.5 bg-[#e8e8e8] flex items-center gap-4">
                  <button
                    onClick={() => setSubmissionsView('pending')}
                    className={`text-[10px] font-bold tracking-wider uppercase ${submissionsView === 'pending' ? 'text-black underline' : 'text-gray-500 hover:text-black'}`}
                  >
                    Pending ({pendingCategories.length})
                  </button>
                  <button
                    onClick={() => setSubmissionsView('approved')}
                    className={`text-[10px] font-bold tracking-wider uppercase ${submissionsView === 'approved' ? 'text-black underline' : 'text-gray-500 hover:text-black'}`}
                  >
                    Approved ({communityCategories.length})
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {submissionsView === 'pending' && pendingCategories.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">No pending submissions</div>
                  )}
                  {submissionsView === 'approved' && communityCategories.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">No approved community categories</div>
                  )}

                  {(submissionsView === 'pending' ? pendingCategories : communityCategories).map(cat => (
                    <div key={cat.id} className="border-2 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)]">
                      {/* Header */}
                      <div
                        className="px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-[#fafafa]"
                        onClick={() => setExpandedSubmission(expandedSubmission === cat.id ? null : cat.id)}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: cat.colorHex + '30' }}>
                          {cat.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[12px]">{cat.name}</div>
                          <div className="text-[10px] text-gray-500">
                            by {cat.creatorName} • {cat.wordPairs.length} words • {new Date(cat.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {submissionsView === 'approved' && (
                          <div className="text-[10px] text-gray-400">
                            {cat.downloadCount} downloads
                          </div>
                        )}
                        <span className="text-[10px] text-gray-400">{expandedSubmission === cat.id ? '▼' : '▶'}</span>
                      </div>

                      {/* Expanded content */}
                      {expandedSubmission === cat.id && (
                        <div className="border-t border-black">
                          {/* Word pairs preview */}
                          <div className="max-h-[200px] overflow-y-auto">
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="bg-[#f0f0f0] border-b border-black text-left">
                                  <th className="px-3 py-1 font-bold uppercase tracking-wider">Real Word</th>
                                  <th className="px-3 py-1 font-bold uppercase tracking-wider">Imposter Word</th>
                                  <th className="px-3 py-1 font-bold uppercase tracking-wider">Hint</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.wordPairs.map((wp, i) => (
                                  <tr key={i} className="border-b border-[#e8e8e8]">
                                    <td className="px-3 py-1 font-mono">{wp.realWord}</td>
                                    <td className="px-3 py-1 font-mono text-gray-600">{wp.imposterWord}</td>
                                    <td className="px-3 py-1 text-gray-500">{wp.hint || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Actions */}
                          <div className="px-3 py-2 bg-[#f8f8f8] border-t border-black flex gap-2">
                            {submissionsView === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleApproveSubmission(cat.id)}
                                  className="border-2 border-black bg-green-100 hover:bg-green-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleRejectSubmission(cat.id)}
                                  className="border-2 border-black bg-red-100 hover:bg-red-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                >
                                  ✕ Reject
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDeleteCommunityCategory(cat.id)}
                                className="border-2 border-black bg-red-100 hover:bg-red-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                              >
                                ✕ Delete
                              </button>
                            )}
                            <span className="flex-1" />
                            <span className="text-[9px] text-gray-400 self-center">ID: {cat.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FEEDBACK TAB ──────────────────────────────────────────── */}
            {activeTab === 'feedback' && (
              <div className="flex flex-col min-h-[500px]">
                <div className="border-b border-black px-3 py-1.5 bg-[#e8e8e8] flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    Feedback — {grouped.length} {grouped.length === 1 ? 'entry' : 'entries'}
                  </span>
                  <select value={feedbackFilter} onChange={e => setFeedbackFilter(e.target.value)} className="border border-black bg-white px-1.5 py-0.5 text-[10px] focus:outline-none">
                    <option value="all">All Categories</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {grouped.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-[11px] text-gray-400">No feedback yet</div>
                  ) : (
                    grouped.map(entry => {
                      const isEditing = feedbackEditId === entry.id && feedbackEditWord;
                      const isLoading = feedbackEditLoading === entry.id;
                      return (
                        <div key={entry.id} className="border-b border-[#e0e0e0] px-3 py-2.5 hover:bg-[#fafafa] group">
                          <div className="flex items-center gap-2">
                            {/* Rating badge */}
                            {entry.rating != null && (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] ${entry.rating === 5 ? 'bg-green-100' : 'bg-red-100'}`}>
                                {entry.rating === 5 ? '👍' : '👎'}
                              </span>
                            )}
                            {entry.rating == null && (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[10px] text-gray-400">—</span>
                            )}

                            {/* Word pair — inline editable */}
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={feedbackEditWord.realWord}
                                  onChange={e => setFeedbackEditWord(p => p ? { ...p, realWord: e.target.value } : p)}
                                  onKeyDown={e => feedbackEditKeyDown(e, 'realWord')}
                                  className="w-[120px] bg-white border-b-2 border-black px-1 py-0.5 text-[12px] font-mono font-bold focus:outline-none"
                                  autoFocus
                                />
                                <span className="text-[10px] text-gray-300">/</span>
                                <input
                                  value={feedbackEditWord.imposterWord}
                                  onChange={e => setFeedbackEditWord(p => p ? { ...p, imposterWord: e.target.value } : p)}
                                  onKeyDown={e => feedbackEditKeyDown(e, 'imposterWord')}
                                  className="w-[120px] bg-white border-b-2 border-black px-1 py-0.5 text-[11px] font-mono focus:outline-none"
                                />
                                <input
                                  value={feedbackEditWord.hint}
                                  onChange={e => setFeedbackEditWord(p => p ? { ...p, hint: e.target.value } : p)}
                                  onKeyDown={e => feedbackEditKeyDown(e, 'hint')}
                                  placeholder="hint"
                                  className="w-[140px] bg-white border-b-2 border-black px-1 py-0.5 text-[10px] text-gray-600 focus:outline-none"
                                />
                                <button onClick={saveFeedbackWordEdit} className="border border-black bg-[#c0c0c0] px-1.5 py-0.5 text-[8px] font-bold uppercase">Save</button>
                                <button onClick={() => { setFeedbackEditId(null); setFeedbackEditWord(null); }} className="text-[9px] text-gray-400 hover:text-black">✕</button>
                              </div>
                            ) : (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[12px] font-mono font-bold">{entry.realWord}</span>
                                <span className="text-[10px] text-gray-300">/</span>
                                <span className="text-[11px] font-mono text-gray-500">{entry.imposterWord}</span>
                              </div>
                            )}

                            {/* Category pill */}
                            {entry.categoryName && (
                              <span className="text-[9px] bg-[#e8e8e8] border border-[#d0d0d0] px-1.5 py-0.5 uppercase tracking-wider">{entry.categoryName}</span>
                            )}

                            {/* Suggestion indicator */}
                            {entry.suggestion && (
                              <span className="text-[9px] bg-[#fff3cd] border border-[#e0d5a0] px-1.5 py-0.5 uppercase tracking-wider">has suggestion</span>
                            )}

                            {/* Edit / Delete buttons — visible on hover */}
                            {!isEditing && (
                              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => lookupFeedbackWord(entry)}
                                  disabled={isLoading}
                                  className="text-[9px] text-gray-400 hover:text-black disabled:opacity-30"
                                  title="Edit word"
                                >
                                  {isLoading ? '...' : '✎'}
                                </button>
                                <button
                                  onClick={() => deleteFeedbackWord(entry)}
                                  disabled={isLoading}
                                  className="text-[9px] text-gray-400 hover:text-red-600 disabled:opacity-30"
                                  title="Delete word"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            <span className="text-[9px] text-gray-400 ml-auto">{formatTime(entry.timestamp)}</span>
                          </div>

                          {/* Suggestion text */}
                          {entry.suggestion && (
                            <div className="mt-1.5 ml-8 bg-[#fffef0] border border-[#e8e0b0] px-2.5 py-1.5 text-[10px] text-gray-700 italic">
                              &ldquo;{entry.suggestion}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="bg-[#c0c0c0] border-t-2 border-black px-3 py-1 flex items-center justify-between">
            <span className="text-[9px] font-mono text-gray-600">
              {categories.length} categories / {Object.values(wordCounts).reduce((a, b) => a + b, 0)} words / {characters.length} characters
            </span>
            <span className="text-[9px] font-mono text-gray-600">Imposter Dashboard v1.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analytics Tab Component ──────────────────────────────────────────────────
function AnalyticsTab({ sessions }: { sessions: GameSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[11px] text-gray-400">
        No game sessions recorded yet
      </div>
    );
  }

  // ── Computed stats ──────────────────────────────────────────────────────
  const totalGames = sessions.length;
  const avgPlayers = totalGames > 0 ? (sessions.reduce((s, g) => s + g.playerCount, 0) / totalGames) : 0;
  const imposterEscapeRate = totalGames > 0 ? (sessions.filter(g => !g.didCatchImposter).length / totalGames) * 100 : 0;
  const avgDuration = totalGames > 0 ? sessions.reduce((s, g) => s + g.gameDurationSeconds, 0) / totalGames : 0;

  // Word difficulty leaderboard
  const wordMap = new Map<string, { realWord: string; imposterWord: string; category: string; played: number; imposterWins: number }>();
  for (const s of sessions) {
    const key = `${s.realWord}|${s.imposterWord}`;
    const entry = wordMap.get(key) || { realWord: s.realWord, imposterWord: s.imposterWord, category: s.categoryName, played: 0, imposterWins: 0 };
    entry.played++;
    if (!s.didCatchImposter) entry.imposterWins++;
    wordMap.set(key, entry);
  }
  const wordLeaderboard = Array.from(wordMap.values())
    .filter(w => w.played >= 2)
    .sort((a, b) => (b.imposterWins / b.played) - (a.imposterWins / a.played));

  // Category breakdown
  const catMap = new Map<string, { played: number; imposterWins: number }>();
  for (const s of sessions) {
    const entry = catMap.get(s.categoryName) || { played: 0, imposterWins: 0 };
    entry.played++;
    if (!s.didCatchImposter) entry.imposterWins++;
    catMap.set(s.categoryName, entry);
  }
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.played - a.played);

  // Settings insights
  const hintsOn = sessions.filter(s => s.hintsEnabled);
  const hintsOff = sessions.filter(s => !s.hintsEnabled);
  const hintsOnWinRate = hintsOn.length > 0 ? (hintsOn.filter(s => s.didCatchImposter).length / hintsOn.length * 100) : 0;
  const hintsOffWinRate = hintsOff.length > 0 ? (hintsOff.filter(s => s.didCatchImposter).length / hintsOff.length * 100) : 0;

  const playerCountMap = new Map<number, number>();
  for (const s of sessions) {
    playerCountMap.set(s.playerCount, (playerCountMap.get(s.playerCount) || 0) + 1);
  }
  const mostCommonPlayerCount = Array.from(playerCountMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const avgRoundDuration = totalGames > 0 ? sessions.reduce((s, g) => s + g.roundDuration, 0) / totalGames : 0;

  // Fun stats
  const unanimityRate = totalGames > 0 ? (sessions.filter(s => s.isUnanimous).length / totalGames * 100) : 0;
  const closeCallCount = sessions.filter(s => s.voteMargin === 1).length;
  const quickCatchRate = totalGames > 0 ? (sessions.filter(s => !s.timerExpired).length / totalGames * 100) : 0;
  const avgSuspicionAccuracy = totalGames > 0 ? (sessions.reduce((s, g) => s + g.suspicionAccuracy, 0) / totalGames * 100) : 0;

  // Most popular character
  const charMap = new Map<string, number>();
  for (const s of sessions) {
    for (const c of (s.characters || [])) {
      charMap.set(c, (charMap.get(c) || 0) + 1);
    }
  }
  const mostPopularChar = Array.from(charMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const charDisplayName = (key: string) => {
    const name = key.replace('player-', '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const winRateColor = (rate: number) => {
    if (rate >= 60) return 'text-red-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const winRateBg = (rate: number) => {
    if (rate >= 60) return 'bg-red-50';
    if (rate >= 40) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Games" value={totalGames.toString()} />
        <StatCard label="Avg Players" value={avgPlayers.toFixed(1)} />
        <StatCard label="Imposter Escape Rate" value={`${imposterEscapeRate.toFixed(0)}%`} />
        <StatCard label="Avg Game Duration" value={formatDuration(avgDuration)} />
      </div>

      {/* Word Difficulty Leaderboard */}
      {wordLeaderboard.length > 0 && (
        <div className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
          <div className="bg-[#d0d0d0] border-b-2 border-black px-3 py-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase">Word Difficulty Leaderboard</span>
            <span className="text-[9px] text-gray-500 ml-2">(min 2 plays)</span>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#e8e8e8] border-b border-black text-left">
                <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider">Real Word</th>
                <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider">Imposter Word</th>
                <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider">Category</th>
                <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-center">Played</th>
                <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-right">Imposter Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {wordLeaderboard.slice(0, 20).map((w, i) => {
                const rate = (w.imposterWins / w.played) * 100;
                return (
                  <tr key={i} className={`border-b border-[#e8e8e8] ${winRateBg(rate)}`}>
                    <td className="px-3 py-1.5 font-mono font-bold">{w.realWord}</td>
                    <td className="px-3 py-1.5 font-mono text-gray-600">{w.imposterWord}</td>
                    <td className="px-3 py-1.5">{w.category}</td>
                    <td className="px-3 py-1.5 text-center">{w.played}</td>
                    <td className={`px-3 py-1.5 text-right font-bold ${winRateColor(rate)}`}>{rate.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
        <div className="bg-[#d0d0d0] border-b-2 border-black px-3 py-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase">Category Breakdown</span>
        </div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[#e8e8e8] border-b border-black text-left">
              <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider">Category</th>
              <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-center">Games</th>
              <th className="px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-right">Imposter Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map(cat => {
              const rate = (cat.imposterWins / cat.played) * 100;
              return (
                <tr key={cat.name} className="border-b border-[#e8e8e8] hover:bg-[#fafafa]">
                  <td className="px-3 py-1.5 font-bold">{cat.name}</td>
                  <td className="px-3 py-1.5 text-center">{cat.played}</td>
                  <td className={`px-3 py-1.5 text-right font-bold ${winRateColor(rate)}`}>{rate.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Settings Insights */}
      <div className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
        <div className="bg-[#d0d0d0] border-b-2 border-black px-3 py-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase">Settings Insights</span>
        </div>
        <div className="p-3 grid grid-cols-3 gap-3 text-[11px]">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Hints On vs Off</span>
            <div className="flex gap-3">
              <span>On: <b className="text-green-600">{hintsOnWinRate.toFixed(0)}%</b> catch rate ({hintsOn.length})</span>
              <span>Off: <b className="text-red-600">{hintsOffWinRate.toFixed(0)}%</b> catch rate ({hintsOff.length})</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Most Common Players</span>
            {mostCommonPlayerCount ? <span><b>{mostCommonPlayerCount[0]}</b> players ({mostCommonPlayerCount[1]} games)</span> : <span>—</span>}
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Avg Round Duration</span>
            <span><b>{formatDuration(avgRoundDuration)}</b></span>
          </div>
        </div>
      </div>

      {/* Fun Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Unanimity Rate" value={`${unanimityRate.toFixed(0)}%`} />
        <StatCard label="Close Calls (1 vote)" value={closeCallCount.toString()} />
        <StatCard label="Quick Catch Rate" value={`${quickCatchRate.toFixed(0)}%`} />
        <StatCard label="Avg Suspicion Accuracy" value={`${avgSuspicionAccuracy.toFixed(0)}%`} />
        <StatCard label="Most Popular Character" value={mostPopularChar ? charDisplayName(mostPopularChar[0]) : '—'} />
      </div>

      {/* Recent Sessions */}
      <div className="border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
        <div className="bg-[#d0d0d0] border-b-2 border-black px-3 py-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase">Recent Sessions</span>
          <span className="text-[9px] text-gray-500 ml-2">(last 50)</span>
        </div>
        <div className="overflow-y-auto max-h-[300px]">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#e8e8e8] border-b border-black text-left sticky top-0">
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider">Time</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider">Category</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider">Word</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider text-center">Players</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider text-center">Imps</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider text-center">Hints</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider text-center">Result</th>
                <th className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wider text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 50).map(s => (
                <tr key={s.id} className="border-b border-[#e8e8e8] hover:bg-[#fafafa]">
                  <td className="px-2 py-1.5 text-gray-500">{formatTime(s.serverTimestamp)}</td>
                  <td className="px-2 py-1.5">{s.categoryName}</td>
                  <td className="px-2 py-1.5 font-mono">
                    <span className="font-bold">{s.realWord}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">{s.imposterWord}</span>
                  </td>
                  <td className="px-2 py-1.5 text-center">{s.playerCount}</td>
                  <td className="px-2 py-1.5 text-center">{s.imposterCount}</td>
                  <td className="px-2 py-1.5 text-center">{s.hintsEnabled ? 'On' : 'Off'}</td>
                  <td className={`px-2 py-1.5 text-center font-bold ${s.didCatchImposter ? 'text-green-600' : 'text-red-600'}`}>
                    {s.didCatchImposter ? 'Caught' : 'Escaped'}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono">{formatDuration(s.gameDurationSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] p-3 text-center">
      <div className="text-[18px] font-black font-mono">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-1">{label}</div>
    </div>
  );
}
