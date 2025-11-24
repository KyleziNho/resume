import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Share2, Plus, X, Star, Menu } from 'lucide-react';

interface SafariProps {
  initialUrl?: string;
}

interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  loadError: boolean;
}

const BOOKMARKS = [
  { name: 'Kyro', url: 'https://www.kyro.onl' },
  { name: 'Frift', url: 'https://www.frift.uk' },
];

export default function Safari({ initialUrl = 'https://www.kyro.onl' }: SafariProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'New Tab', url: initialUrl, isLoading: true, loadError: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bookmarksRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(tab => tab.id === activeTabId)!;

  // Close bookmarks when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bookmarksRef.current && !bookmarksRef.current.contains(e.target as Node)) {
        setShowBookmarks(false);
      }
    };

    if (showBookmarks) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBookmarks]);

  const handleNavigate = (url?: string) => {
    let processedUrl = url || inputUrl.trim();

    // Check if it's a URL or a search query
    const isUrl = processedUrl.includes('.') ||
                  processedUrl.startsWith('http://') ||
                  processedUrl.startsWith('https://') ||
                  processedUrl.startsWith('localhost');

    if (isUrl) {
      // It's a URL - add https:// if no protocol is specified
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
      }
    } else {
      // It's a search query - use Google search
      processedUrl = `https://www.google.com/search?q=${encodeURIComponent(processedUrl)}`;
    }

    setTabs(tabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, url: processedUrl, isLoading: true, loadError: false }
        : tab
    ));
    setInputUrl(processedUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = activeTab.url;
      setTabs(tabs.map(tab =>
        tab.id === activeTabId
          ? { ...tab, isLoading: true, loadError: false }
          : tab
      ));
    }
  };

  const handleIframeLoad = () => {
    setTabs(tabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, isLoading: false, loadError: false }
        : tab
    ));
  };

  const handleIframeError = () => {
    setTabs(tabs.map(tab =>
      tab.id === activeTabId
        ? { ...tab, isLoading: false, loadError: true }
        : tab
    ));
  };

  const createNewTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, {
      id: newId,
      title: 'New Tab',
      url: 'https://www.kyro.onl',
      isLoading: true,
      loadError: false
    }]);
    setActiveTabId(newId);
    setInputUrl('https://www.kyro.onl');
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close last tab

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      const newActiveTab = newTabs[newTabs.length - 1];
      setActiveTabId(newActiveTab.id);
      setInputUrl(newActiveTab.url);
    }
  };

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setInputUrl(tab.url);
    }
  };

  const handleBookmarkClick = (bookmarkUrl: string) => {
    handleNavigate(bookmarkUrl);
    setShowBookmarks(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Bar - Hidden on mobile, shown on larger screens */}
      <div className="hidden md:flex bg-[#e8e8e8] border-b border-[#c8c8c8] items-end px-1 pt-1 gap-0.5 min-h-[32px]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`
              relative group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer min-w-[100px] max-w-[180px]
              ${tab.id === activeTabId
                ? 'bg-white border-t border-l border-r border-[#c8c8c8]'
                : 'bg-[#d8d8d8] hover:bg-[#e0e0e0] border border-transparent'
              }
            `}
          >
            <span className="text-xs truncate flex-1 font-medium text-gray-700">
              {tab.title}
            </span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-gray-300 transition-colors"
              >
                <X size={12} className="text-gray-600" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={createNewTab}
          className="p-1.5 hover:bg-[#d8d8d8] rounded-t-lg transition-colors ml-1"
          title="New Tab"
        >
          <Plus size={14} className="text-gray-600" />
        </button>
      </div>

      {/* Safari Toolbar - Mobile optimized */}
      <div className="h-12 md:h-14 bg-gradient-to-b from-[#f6f6f6] to-[#ececec] border-b border-[#d1d1d1] flex items-center px-2 md:px-3 gap-2 md:gap-3 shadow-sm relative">
        {/* Bookmarks Button (Mobile) */}
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className="p-2 md:p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-200/50 rounded transition-all flex-shrink-0"
          title="Bookmarks"
        >
          <Star size={18} className="md:hidden" />
          <Star size={16} className="hidden md:block" />
        </button>

        {/* URL Bar Container */}
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#d1d1d1] rounded-full md:rounded-md px-3 py-2 md:py-1.5 shadow-inner hover:border-[#0071e3] focus-within:border-[#0071e3] transition-colors">
          {/* Lock Icon */}
          <div className="flex-shrink-0 hidden md:block">
            <svg width="14" height="14" viewBox="0 0 12 16" fill="currentColor" className="text-gray-400">
              <path d="M10 5V4a4 4 0 00-8 0v1H1a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1h-1zM4 4a2 2 0 114 0v1H4V4z"/>
            </svg>
          </div>

          {/* URL Input */}
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={(e) => e.target.select()}
            placeholder="Search or enter URL"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 text-gray-700"
          />

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded transition-all"
            title="Refresh"
          >
            <RotateCw size={16} className={`md:w-[14px] md:h-[14px] ${activeTab.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs Button (Mobile) / New Tab (Desktop) */}
        <button
          onClick={createNewTab}
          className="p-2 md:p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-200/50 rounded transition-all flex-shrink-0 hidden md:flex"
          title="New Tab"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>

        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-200/50 rounded transition-all flex-shrink-0 relative"
          title="Tabs"
        >
          <div className="relative">
            <Menu size={18} />
            {tabs.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                {tabs.length}
              </span>
            )}
          </div>
        </button>

        {/* Bookmarks Dropdown */}
        {showBookmarks && (
          <div ref={bookmarksRef} className="absolute top-full left-2 right-2 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-2">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
              <Star size={14} className="text-yellow-500" fill="currentColor" />
              <span className="text-xs font-semibold text-gray-700">Bookmarks</span>
            </div>
            <div className="flex flex-col gap-1">
              {BOOKMARKS.map((bookmark) => (
                <button
                  key={bookmark.url}
                  onClick={() => handleBookmarkClick(bookmark.url)}
                  className="text-left text-sm text-gray-700 hover:bg-gray-100 px-3 py-2 rounded transition-colors font-medium"
                >
                  {bookmark.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {activeTab.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-[#0071e3]/20 z-10">
            <div className="h-full bg-[#0071e3] animate-[loading_1s_ease-in-out_infinite]"></div>
          </div>
        )}

        {activeTab.loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-8 z-20">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Can't Open This Page</h2>
              <p className="text-sm text-gray-600 mb-4">
                This website refuses to be displayed in a frame for security reasons.
              </p>
              <div className="text-xs text-gray-500 mb-3">
                <p className="mb-2">Sites that should work:</p>
                <ul className="text-left space-y-1 max-w-xs mx-auto">
                  <li>• www.kyro.onl</li>
                  <li>• www.frift.uk</li>
                  <li>• example.com</li>
                  <li>• Your other portfolio sites</li>
                </ul>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Note: Google, YouTube, Facebook, and most major sites block iframe embedding.
              </p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-[#0071e3] text-white rounded-lg text-sm hover:bg-[#0051a8] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <iframe
          key={activeTabId}
          ref={iframeRef}
          src={activeTab.url}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="w-full h-full border-0"
          title="Safari Browser"
        />
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 50%; margin-left: 25%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
