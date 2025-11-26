'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface DeviceInfo {
  visitorId?: string;
  ip?: string;
  userAgent?: string;
  os?: string;
  browser?: string;
  deviceType?: string;
  deviceModel?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timezone?: string;
  country?: string;
  city?: string;
  region?: string;
}

interface ChatMessage extends DeviceInfo {
  type: 'chat_message';
  message: string;
  response: string;
  timestamp: number;
  serverTimestamp: number;
}

interface Rating extends DeviceInfo {
  type: 'rating';
  rating: number;
  review?: string;
  timestamp: number;
  serverTimestamp: number;
}

interface Visitor {
  visitorId: string;
  ip?: string;
  os?: string;
  browser?: string;
  deviceType?: string;
  deviceModel?: string;
  country?: string;
  city?: string;
  chatCount: number;
  ratings: Rating[];
  lastSeen: number;
  firstSeen: number;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'visitors' | 'chat' | 'ratings'>('overview');
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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

  // Group data by visitor
  const visitors = useMemo(() => {
    const visitorMap = new Map<string, Visitor>();

    // Process chat messages
    chatMessages.forEach((msg) => {
      const id = msg.visitorId || msg.ip || 'unknown';
      const existing = visitorMap.get(id);

      if (existing) {
        existing.chatCount++;
        existing.lastSeen = Math.max(existing.lastSeen, msg.serverTimestamp);
        existing.firstSeen = Math.min(existing.firstSeen, msg.serverTimestamp);
      } else {
        visitorMap.set(id, {
          visitorId: id,
          ip: msg.ip,
          os: msg.os,
          browser: msg.browser,
          deviceType: msg.deviceType,
          deviceModel: msg.deviceModel,
          country: msg.country,
          city: msg.city,
          chatCount: 1,
          ratings: [],
          lastSeen: msg.serverTimestamp,
          firstSeen: msg.serverTimestamp,
        });
      }
    });

    // Process ratings
    ratings.forEach((rating) => {
      const id = rating.visitorId || rating.ip || 'unknown';
      const existing = visitorMap.get(id);

      if (existing) {
        existing.ratings.push(rating);
        existing.lastSeen = Math.max(existing.lastSeen, rating.serverTimestamp);
        existing.firstSeen = Math.min(existing.firstSeen, rating.serverTimestamp);
        // Update device info if missing
        if (!existing.os && rating.os) existing.os = rating.os;
        if (!existing.browser && rating.browser) existing.browser = rating.browser;
        if (!existing.deviceType && rating.deviceType) existing.deviceType = rating.deviceType;
        if (!existing.country && rating.country) existing.country = rating.country;
        if (!existing.city && rating.city) existing.city = rating.city;
      } else {
        visitorMap.set(id, {
          visitorId: id,
          ip: rating.ip,
          os: rating.os,
          browser: rating.browser,
          deviceType: rating.deviceType,
          deviceModel: rating.deviceModel,
          country: rating.country,
          city: rating.city,
          chatCount: 0,
          ratings: [rating],
          lastSeen: rating.serverTimestamp,
          firstSeen: rating.serverTimestamp,
        });
      }
    });

    return Array.from(visitorMap.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }, [chatMessages, ratings]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
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

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'Mobile') return '📱';
    if (deviceType === 'Tablet') return '📱';
    return '💻';
  };

  const getVisitorLabel = (visitor: Visitor) => {
    const parts = [];
    if (visitor.deviceModel) parts.push(visitor.deviceModel);
    else if (visitor.os) parts.push(visitor.os);
    if (visitor.city && visitor.country) parts.push(`${visitor.city}, ${visitor.country}`);
    else if (visitor.country) parts.push(visitor.country);
    return parts.join(' • ') || 'Unknown Device';
  };

  // Group visitors by country
  const countryStats = useMemo(() => {
    const stats = new Map<string, { count: number; visitors: Visitor[]; cities: Map<string, number> }>();

    visitors.forEach(visitor => {
      const country = visitor.country || 'Unknown';
      const existing = stats.get(country);

      if (existing) {
        existing.count++;
        existing.visitors.push(visitor);
        if (visitor.city) {
          existing.cities.set(visitor.city, (existing.cities.get(visitor.city) || 0) + 1);
        }
      } else {
        const cities = new Map<string, number>();
        if (visitor.city) {
          cities.set(visitor.city, 1);
        }
        stats.set(country, { count: 1, visitors: [visitor], cities });
      }
    });

    return Array.from(stats.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        visitors: data.visitors,
        cities: Array.from(data.cities.entries()).sort((a, b) => b[1] - a[1]),
      }))
      .sort((a, b) => b.count - a.count);
  }, [visitors]);

  // Country code to name mapping
  const countryNames: Record<string, string> = {
    'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
    'DE': 'Germany', 'FR': 'France', 'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands',
    'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway',
    'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland', 'PT': 'Portugal', 'PL': 'Poland',
    'CZ': 'Czech Republic', 'RO': 'Romania', 'HU': 'Hungary', 'GR': 'Greece', 'RU': 'Russia',
    'UA': 'Ukraine', 'TR': 'Turkey', 'IL': 'Israel', 'AE': 'UAE', 'SA': 'Saudi Arabia',
    'IN': 'India', 'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea', 'SG': 'Singapore',
    'MY': 'Malaysia', 'TH': 'Thailand', 'ID': 'Indonesia', 'PH': 'Philippines', 'VN': 'Vietnam',
    'BR': 'Brazil', 'MX': 'Mexico', 'AR': 'Argentina', 'CO': 'Colombia', 'CL': 'Chile',
    'ZA': 'South Africa', 'NG': 'Nigeria', 'EG': 'Egypt', 'KE': 'Kenya', 'NZ': 'New Zealand',
  };

  const getCountryName = (code: string) => countryNames[code] || code;

  const getCountryFlag = (code: string) => {
    if (!code || code === 'Unknown' || code.length !== 2) return '🌍';
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
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
          <div className="flex border-b-2 border-black bg-gray-100 overflow-x-auto">
            {(['overview', 'map', 'visitors', 'chat', 'ratings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedVisitor(null); setSelectedCountry(null); }}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-r border-black whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white'
                    : 'bg-gray-200 hover:bg-gray-100'
                }`}
              >
                {tab === 'map' ? '🗺️ Map' : tab}
                {tab === 'visitors' && ` (${visitors.length})`}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="border-2 border-black p-3 bg-white">
                        <div className="text-[10px] uppercase tracking-wider mb-2 border-b border-black pb-1">
                          👥 Unique Visitors
                        </div>
                        <p className="text-3xl font-bold font-mono">{visitors.length}</p>
                      </div>

                      <div className="border-2 border-black p-3 bg-white">
                        <div className="text-[10px] uppercase tracking-wider mb-2 border-b border-black pb-1">
                          💬 Chat Messages
                        </div>
                        <p className="text-3xl font-bold font-mono">{chatMessages.length}</p>
                      </div>

                      <div className="border-2 border-black p-3 bg-white">
                        <div className="text-[10px] uppercase tracking-wider mb-2 border-b border-black pb-1">
                          ⭐ Total Ratings
                        </div>
                        <p className="text-3xl font-bold font-mono">{ratings.length}</p>
                      </div>

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

                    {/* Recent Visitors */}
                    <div className="border-2 border-black bg-white">
                      <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100">
                        Recent Visitors
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {visitors.slice(0, 10).map((visitor, i) => (
                          <div
                            key={i}
                            className="p-2 border-b border-gray-300 hover:bg-gray-50 text-xs cursor-pointer"
                            onClick={() => { setActiveTab('visitors'); setSelectedVisitor(visitor.visitorId); }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getDeviceIcon(visitor.deviceType)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{getVisitorLabel(visitor)}</p>
                                <p className="text-[10px] text-gray-500">
                                  {visitor.chatCount} msgs • {visitor.ratings.length} ratings • {formatShortDate(visitor.lastSeen)}
                                </p>
                              </div>
                              {visitor.ratings.length > 0 && (
                                <span className="font-mono">
                                  {visitor.ratings[visitor.ratings.length - 1].rating}★
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {visitors.length === 0 && (
                          <p className="p-4 text-center text-xs text-gray-500">No visitors yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Map Tab */}
                {activeTab === 'map' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* World Map Visualization */}
                    <div className="md:col-span-2 border-2 border-black bg-white">
                      <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100">
                        Visitor Locations
                      </div>
                      <div className="p-4">
                        {/* Simple grid-based world map */}
                        <div className="relative bg-gray-100 border border-black aspect-[2/1] overflow-hidden">
                          {/* Grid background */}
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)',
                              backgroundSize: '20px 20px',
                            }}
                          />

                          {/* Continent shapes - simplified ASCII art style */}
                          <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full">
                            {/* North America */}
                            <path d="M10,8 L25,8 L28,15 L25,22 L18,25 L12,22 L8,15 Z" fill="#ccc" stroke="#999" strokeWidth="0.3"/>
                            {/* South America */}
                            <path d="M20,28 L28,28 L30,35 L28,45 L22,48 L18,42 L17,32 Z" fill="#ccc" stroke="#999" strokeWidth="0.3"/>
                            {/* Europe */}
                            <path d="M45,8 L55,6 L58,12 L55,18 L48,18 L44,14 Z" fill="#ccc" stroke="#999" strokeWidth="0.3"/>
                            {/* Africa */}
                            <path d="M45,20 L55,18 L60,25 L58,38 L50,42 L42,38 L40,28 Z" fill="#ccc" stroke="#999" strokeWidth="0.3"/>
                            {/* Asia */}
                            <path d="M58,5 L85,5 L92,15 L88,25 L75,28 L65,25 L58,18 L56,10 Z" fill="#ccc" stroke="#999" strokeWidth="0.3"/>
                            {/* Australia */}
                            <path d="M78,32 L90,32 L92,40 L85,45 L78,42 Z" fill="#ccc" stroke="#999" strokeWidth="0.3"/>
                          </svg>

                          {/* Country markers */}
                          {countryStats.map((stat, i) => {
                            // Approximate positions for countries
                            const positions: Record<string, { x: number; y: number }> = {
                              'US': { x: 18, y: 30 }, 'CA': { x: 18, y: 20 }, 'MX': { x: 15, y: 40 },
                              'BR': { x: 28, y: 65 }, 'AR': { x: 25, y: 80 }, 'CO': { x: 22, y: 50 },
                              'GB': { x: 48, y: 22 }, 'IE': { x: 45, y: 20 }, 'FR': { x: 50, y: 28 },
                              'DE': { x: 52, y: 25 }, 'ES': { x: 47, y: 32 }, 'IT': { x: 53, y: 30 },
                              'NL': { x: 51, y: 23 }, 'BE': { x: 50, y: 24 }, 'CH': { x: 52, y: 28 },
                              'AT': { x: 54, y: 27 }, 'PL': { x: 56, y: 24 }, 'SE': { x: 55, y: 15 },
                              'NO': { x: 52, y: 12 }, 'DK': { x: 52, y: 18 }, 'FI': { x: 58, y: 12 },
                              'RU': { x: 70, y: 18 }, 'UA': { x: 60, y: 26 }, 'TR': { x: 60, y: 32 },
                              'IN': { x: 72, y: 42 }, 'CN': { x: 78, y: 32 }, 'JP': { x: 88, y: 30 },
                              'KR': { x: 85, y: 32 }, 'SG': { x: 78, y: 52 }, 'AU': { x: 85, y: 75 },
                              'NZ': { x: 92, y: 80 }, 'ZA': { x: 55, y: 72 }, 'NG': { x: 52, y: 52 },
                              'EG': { x: 58, y: 42 }, 'AE': { x: 65, y: 42 }, 'SA': { x: 62, y: 42 },
                              'IL': { x: 60, y: 38 }, 'PH': { x: 82, y: 48 }, 'TH': { x: 76, y: 48 },
                              'ID': { x: 80, y: 55 }, 'MY': { x: 78, y: 52 }, 'VN': { x: 78, y: 45 },
                            };
                            const pos = positions[stat.country] || { x: 50, y: 50 };
                            const size = Math.min(8, 3 + stat.count * 1.5);

                            return (
                              <div
                                key={i}
                                className={`absolute cursor-pointer transition-transform hover:scale-150 ${selectedCountry === stat.country ? 'z-10' : ''}`}
                                style={{
                                  left: `${pos.x}%`,
                                  top: `${pos.y}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                                onClick={() => setSelectedCountry(selectedCountry === stat.country ? null : stat.country)}
                              >
                                <div
                                  className={`rounded-full border-2 ${selectedCountry === stat.country ? 'border-red-500 bg-red-500' : 'border-black bg-black'} flex items-center justify-center text-white font-mono`}
                                  style={{
                                    width: `${size * 4}px`,
                                    height: `${size * 4}px`,
                                    fontSize: `${Math.max(8, size * 1.5)}px`,
                                  }}
                                >
                                  {stat.count}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="mt-3 flex items-center justify-center gap-4 text-[10px]">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-black border border-black"></div>
                            <span>= 1 visitor</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-black border border-black"></div>
                            <span>= more visitors</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Country List */}
                    <div className="border-2 border-black bg-white">
                      <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100">
                        Countries ({countryStats.length})
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-300">
                        {countryStats.map((stat, i) => (
                          <div
                            key={i}
                            className={`p-2 cursor-pointer ${selectedCountry === stat.country ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedCountry(selectedCountry === stat.country ? null : stat.country)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getCountryFlag(stat.country)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs">{getCountryName(stat.country)}</p>
                                <p className={`text-[10px] ${selectedCountry === stat.country ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {stat.count} visitor{stat.count !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-lg">{stat.count}</span>
                            </div>
                          </div>
                        ))}
                        {countryStats.length === 0 && (
                          <div className="p-4 text-center text-xs text-gray-500">No location data yet</div>
                        )}
                      </div>

                      {/* Selected country details */}
                      {selectedCountry && (
                        <div className="border-t-2 border-black p-2 bg-gray-50">
                          <div className="text-[10px] uppercase tracking-wider mb-2 font-bold">
                            {getCountryFlag(selectedCountry)} {getCountryName(selectedCountry)}
                          </div>
                          {(() => {
                            const stat = countryStats.find(s => s.country === selectedCountry);
                            if (!stat) return null;
                            return (
                              <div className="space-y-2">
                                {/* Cities */}
                                {stat.cities.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 mb-1">Cities:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {stat.cities.slice(0, 5).map(([city, count], i) => (
                                        <span key={i} className="text-[10px] bg-white border border-black px-1">
                                          {city} ({count})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Visitors list */}
                                <div>
                                  <p className="text-[10px] text-gray-500 mb-1">Visitors:</p>
                                  <div className="max-h-[100px] overflow-y-auto space-y-1">
                                    {stat.visitors.map((v, i) => (
                                      <div key={i} className="text-[10px] flex items-center gap-1">
                                        <span>{getDeviceIcon(v.deviceType)}</span>
                                        <span className="truncate">{v.city || 'Unknown city'}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">{v.os}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Visitors Tab */}
                {activeTab === 'visitors' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visitor List */}
                    <div className="border-2 border-black bg-white">
                      <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100">
                        All Visitors ({visitors.length})
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-300">
                        {visitors.map((visitor, i) => (
                          <div
                            key={i}
                            className={`p-3 cursor-pointer ${selectedVisitor === visitor.visitorId ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedVisitor(visitor.visitorId)}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xl">{getDeviceIcon(visitor.deviceType)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate">{getVisitorLabel(visitor)}</p>
                                <p className={`text-[10px] mt-0.5 ${selectedVisitor === visitor.visitorId ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {visitor.browser} • {visitor.os}
                                </p>
                                <p className={`text-[10px] ${selectedVisitor === visitor.visitorId ? 'text-gray-300' : 'text-gray-500'}`}>
                                  IP: {visitor.ip || 'unknown'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] ${selectedVisitor === visitor.visitorId ? 'text-gray-300' : 'text-gray-600'}`}>
                                    💬 {visitor.chatCount}
                                  </span>
                                  <span className={`text-[10px] ${selectedVisitor === visitor.visitorId ? 'text-gray-300' : 'text-gray-600'}`}>
                                    ⭐ {visitor.ratings.length}
                                  </span>
                                  {visitor.ratings.length > 0 && (
                                    <span className="font-mono text-[10px]">
                                      ({visitor.ratings.map(r => r.rating).join(', ')}★)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {visitors.length === 0 && (
                          <div className="p-8 text-center text-xs text-gray-500">No visitors yet</div>
                        )}
                      </div>
                    </div>

                    {/* Visitor Detail */}
                    <div className="border-2 border-black bg-white">
                      <div className="text-[10px] uppercase tracking-wider p-2 border-b-2 border-black bg-gray-100">
                        Visitor Details
                      </div>
                      {selectedVisitor ? (
                        (() => {
                          const visitor = visitors.find(v => v.visitorId === selectedVisitor);
                          if (!visitor) return <div className="p-4 text-xs text-gray-500">Visitor not found</div>;

                          const visitorChats = chatMessages.filter(
                            m => (m.visitorId || m.ip) === selectedVisitor
                          ).sort((a, b) => b.serverTimestamp - a.serverTimestamp);

                          return (
                            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                              {/* Device Info */}
                              <div className="border border-black p-2">
                                <div className="text-[10px] uppercase tracking-wider mb-2 font-bold">Device Info</div>
                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                  <span className="text-gray-500">OS:</span>
                                  <span>{visitor.os || 'Unknown'}</span>
                                  <span className="text-gray-500">Browser:</span>
                                  <span>{visitor.browser || 'Unknown'}</span>
                                  <span className="text-gray-500">Type:</span>
                                  <span>{visitor.deviceType || 'Unknown'}</span>
                                  <span className="text-gray-500">Model:</span>
                                  <span>{visitor.deviceModel || 'Unknown'}</span>
                                  <span className="text-gray-500">IP:</span>
                                  <span className="font-mono">{visitor.ip || 'Unknown'}</span>
                                  <span className="text-gray-500">Location:</span>
                                  <span>{visitor.city && visitor.country ? `${visitor.city}, ${visitor.country}` : 'Unknown'}</span>
                                  <span className="text-gray-500">First Seen:</span>
                                  <span>{formatShortDate(visitor.firstSeen)}</span>
                                  <span className="text-gray-500">Last Seen:</span>
                                  <span>{formatShortDate(visitor.lastSeen)}</span>
                                </div>
                              </div>

                              {/* Ratings from this visitor */}
                              {visitor.ratings.length > 0 && (
                                <div className="border border-black p-2">
                                  <div className="text-[10px] uppercase tracking-wider mb-2 font-bold">
                                    Ratings ({visitor.ratings.length})
                                  </div>
                                  {visitor.ratings.map((r, i) => (
                                    <div key={i} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <span key={s} className="text-xs">
                                            {s <= r.rating ? '★' : '☆'}
                                          </span>
                                        ))}
                                        <span className="text-[10px] text-gray-500 ml-2">{formatShortDate(r.serverTimestamp)}</span>
                                      </div>
                                      {r.review && <p className="text-xs mt-1">{r.review}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Chat messages from this visitor */}
                              {visitorChats.length > 0 && (
                                <div className="border border-black p-2">
                                  <div className="text-[10px] uppercase tracking-wider mb-2 font-bold">
                                    Chat History ({visitorChats.length})
                                  </div>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {visitorChats.map((msg, i) => (
                                      <div key={i} className="text-[10px] pb-2 border-b border-gray-200 last:border-0">
                                        <p className="font-medium">👤 {msg.message}</p>
                                        <p className="text-gray-600 mt-0.5">🤖 {msg.response}</p>
                                        <p className="text-gray-400 mt-0.5">{formatShortDate(msg.serverTimestamp)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-500">
                          Select a visitor to see details
                        </div>
                      )}
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
                            {/* Visitor Info */}
                            <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
                              <span>{getDeviceIcon(msg.deviceType)}</span>
                              <span>{msg.os} • {msg.browser}</span>
                              {msg.city && msg.country && <span>• {msg.city}, {msg.country}</span>}
                              <span className="font-mono">• {msg.ip}</span>
                            </div>
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
                            {/* Visitor Info */}
                            <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
                              <span>{getDeviceIcon(rating.deviceType)}</span>
                              <span>{rating.os} • {rating.browser}</span>
                              {rating.city && rating.country && <span>• {rating.city}, {rating.country}</span>}
                              <span className="font-mono">• {rating.ip}</span>
                            </div>
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
            <span className="font-mono">{visitors.length} visitors • {chatMessages.length + ratings.length} events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
