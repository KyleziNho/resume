'use client';

import React, { useState, useEffect } from 'react';

interface ChatMessage {
  type: 'chat_message';
  message: string;
  response: string;
  timestamp: number;
  serverTimestamp: number;
}

interface Rating {
  type: 'rating';
  rating: number;
  review?: string;
  timestamp: number;
  serverTimestamp: number;
}

// Checkerboard pattern for classic Mac background
const checkerboardStyle = {
  backgroundImage: `
    linear-gradient(45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(-45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #c0c0c0 75%),
    linear-gradient(-45deg, transparent 75%, #c0c0c0 75%)
  `,
  backgroundSize: '4px 4px',
  backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
  backgroundColor: '#808080',
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'ratings'>('overview');

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

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [chatRes, ratingsRes] = await Promise.all([
          fetch('/api/analytics?type=chat'),
          fetch('/api/analytics?type=ratings'),
        ]);

        const chatData = await chatRes.json();
        const ratingsData = await ratingsRes.json();

        setChatMessages(Array.isArray(chatData) ? chatData : []);
        setRatings(Array.isArray(ratingsData) ? ratingsData : []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      }
      setLoading(false);
    };

    fetchData();
  }, [isAuthenticated]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating]++;
      }
    });
    return dist;
  };

  // Login screen - Classic Mac dialog style
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={checkerboardStyle}>
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] p-1 w-full max-w-xs">
          {/* Title bar */}
          <div className="bg-white border-b-2 border-black px-2 py-1 flex items-center">
            <div className="w-3 h-3 border border-black mr-2"></div>
            <span className="text-xs font-bold uppercase tracking-wider flex-1 text-center">KyleOS Admin</span>
          </div>

          <div className="p-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 border-2 border-black mx-auto mb-3 flex items-center justify-center bg-white">
                <span className="text-2xl">🔒</span>
              </div>
              <p className="text-xs uppercase tracking-wider">Enter Access Code</p>
            </div>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="•••••"
                className="w-full px-3 py-2 border-2 border-black text-center text-xl tracking-[0.5em] font-mono bg-white focus:outline-none"
                autoFocus
              />
              {error && (
                <p className="text-xs text-center mt-2 uppercase tracking-wider">⚠️ {error}</p>
              )}
              <button
                type="submit"
                className="w-full mt-3 py-2 bg-white border-2 border-black text-xs font-bold uppercase tracking-wider hover:bg-gray-100 active:bg-gray-200 shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard - Classic Mac style
  return (
    <div className="min-h-screen" style={checkerboardStyle}>
      {/* Menu Bar */}
      <div className="h-6 bg-white border-b-2 border-black flex items-center px-2 text-[10px] uppercase tracking-wider select-none sticky top-0 z-50">
        <span className="mr-4 font-bold">📊 Analytics</span>
        <span className="mr-4">File</span>
        <span className="mr-4">Edit</span>
        <span className="mr-4">View</span>
        <div className="flex-1"></div>
        <button
          onClick={() => {
            sessionStorage.removeItem('admin_auth');
            setIsAuthenticated(false);
          }}
          className="hover:bg-black hover:text-white px-2"
        >
          Logout
        </button>
      </div>

      {/* Main Window */}
      <div className="p-2 md:p-4">
        <div className="bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">
          {/* Window Title Bar */}
          <div className="h-6 bg-white border-b-2 border-black flex items-center px-2">
            <div className="w-3 h-3 border border-black mr-2"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-center">KyleOS Analytics Dashboard</span>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b-2 border-black bg-gray-100">
            {(['overview', 'chat', 'ratings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-r border-black ${
                  activeTab === tab
                    ? 'bg-white'
                    : 'bg-gray-200 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-3 md:p-4 min-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-xs uppercase tracking-wider animate-pulse">Loading...</div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Total Messages */}
                      <div className="border-2 border-black p-3 bg-white">
                        <div className="text-[10px] uppercase tracking-wider mb-2 border-b border-black pb-1">
                          💬 Chat Messages
                        </div>
                        <p className="text-3xl font-bold font-mono">{chatMessages.length}</p>
                      </div>

                      {/* Total Ratings */}
                      <div className="border-2 border-black p-3 bg-white">
                        <div className="text-[10px] uppercase tracking-wider mb-2 border-b border-black pb-1">
                          ⭐ Total Ratings
                        </div>
                        <p className="text-3xl font-bold font-mono">{ratings.length}</p>
                      </div>

                      {/* Average Rating */}
                      <div className="border-2 border-black p-3 bg-white">
                        <div className="text-[10px] uppercase tracking-wider mb-2 border-b border-black pb-1">
                          📈 Average Rating
                        </div>
                        <p className="text-3xl font-bold font-mono">{getAverageRating()}<span className="text-lg">/5</span></p>
                      </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="border-2 border-black p-3 bg-white">
                      <div className="text-[10px] uppercase tracking-wider mb-3 border-b border-black pb-1">
                        Rating Distribution
                      </div>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const dist = getRatingDistribution();
                          const count = dist[star];
                          const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs font-mono w-16">{star} star</span>
                              <div className="flex-1 h-4 border border-black bg-white">
                                <div
                                  className="h-full bg-black transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="border-2 border-black bg-white">
                      <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100">
                        Recent Activity
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {[...chatMessages, ...ratings]
                          .sort((a, b) => b.serverTimestamp - a.serverTimestamp)
                          .slice(0, 10)
                          .map((item, i) => (
                            <div key={i} className="p-2 border-b border-gray-300 hover:bg-gray-50 text-xs">
                              <div className="flex items-start gap-2">
                                <span className="shrink-0">
                                  {item.type === 'chat_message' ? '💬' : '⭐'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  {item.type === 'chat_message' ? (
                                    <p className="truncate">{(item as ChatMessage).message}</p>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono">{(item as Rating).rating}/5</span>
                                      {(item as Rating).review && (
                                        <span className="truncate text-gray-600">- {(item as Rating).review}</span>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(item.serverTimestamp)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        {chatMessages.length === 0 && ratings.length === 0 && (
                          <p className="p-4 text-center text-xs text-gray-500">No activity yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="border-2 border-black bg-white">
                    <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100 flex justify-between">
                      <span>Chat Messages</span>
                      <span className="font-mono">{chatMessages.length} total</span>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-300">
                      {chatMessages
                        .sort((a, b) => b.serverTimestamp - a.serverTimestamp)
                        .map((msg, i) => (
                          <div key={i} className="p-3 hover:bg-gray-50">
                            {/* User Message */}
                            <div className="flex items-start gap-2 mb-2">
                              <div className="w-6 h-6 border border-black flex items-center justify-center shrink-0 text-xs bg-gray-100">
                                👤
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs">{msg.message}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(msg.serverTimestamp)}</p>
                              </div>
                            </div>
                            {/* Bot Response */}
                            <div className="flex items-start gap-2 ml-4">
                              <div className="w-6 h-6 border border-black flex items-center justify-center shrink-0 text-xs bg-black text-white">
                                🤖
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700">{msg.response}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      {chatMessages.length === 0 && (
                        <div className="p-8 text-center text-xs text-gray-500">No chat messages yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ratings Tab */}
                {activeTab === 'ratings' && (
                  <div className="border-2 border-black bg-white">
                    <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100 flex justify-between">
                      <span>Ratings & Reviews</span>
                      <span className="font-mono">{ratings.length} total • {getAverageRating()} avg</span>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-300">
                      {ratings
                        .sort((a, b) => b.serverTimestamp - a.serverTimestamp)
                        .map((rating, i) => (
                          <div key={i} className="p-3 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 font-bold font-mono text-lg bg-white">
                                {rating.rating}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s} className="text-sm">
                                      {s <= rating.rating ? '★' : '☆'}
                                    </span>
                                  ))}
                                </div>
                                {rating.review && (
                                  <p className="text-xs mt-1">{rating.review}</p>
                                )}
                                <p className="text-[10px] text-gray-500 mt-1">{formatDate(rating.serverTimestamp)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      {ratings.length === 0 && (
                        <div className="p-8 text-center text-xs text-gray-500">No ratings yet</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-5 bg-gray-100 border-t-2 border-black flex items-center px-2 text-[10px]">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <div className="flex-1"></div>
            <span className="font-mono">{chatMessages.length + ratings.length} events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
