'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Calendar, Cpu, Heart } from 'lucide-react';
import FaultyTerminal from './components/FaultyTerminal';
import MacWindow from './components/ui/MacWindow';
import DesktopIcon from './components/ui/DesktopIcon';
import ContextMenu, { ContextMenuItem } from './components/ui/ContextMenu';
import Dock from './components/ui/Dock';
import PreviewWindow from './components/apps/PreviewWindow';
import Finder from './components/apps/Finder';
import Safari from './components/apps/Safari';
import MacPaint from './components/apps/MacPaint';
import MessagesApp from './components/apps/MessagesApp';
import NotesApp from './components/apps/NotesApp';
import KernelCrossing from './components/apps/CrossyRoad';
import AppStore, { AppData } from './components/apps/AppStore';
import AppDetail from './components/apps/AppDetail';
import LetterGlitch from './components/ui/LetterGlitch';
import RatingPopup from './components/ui/RatingPopup';
import ControlCenter, { ControlCenterButton, WallpaperType } from './components/ui/ControlCenter';
import RippleGrid from './components/ui/RippleGrid';
import Iridescence from './components/ui/Iridescence';
import { projects } from './data/projects';
import { haptic } from 'ios-haptics';
import {
  trackRating,
  shouldShowRatingPopup,
  markRatingCompleted,
} from './lib/analytics';

// Wallpaper configuration
const WALLPAPER_CONFIGS: Record<WallpaperType, { gradient: string }> = {
  'terminal': { gradient: '' },
  'ripple': { gradient: '' },
  'iridescence': { gradient: '' },
  'sequoia-light': { gradient: 'linear-gradient(135deg, #e8d5c4 0%, #d4a574 50%, #c49a6c 100%)' },
  'sequoia-dark': { gradient: 'linear-gradient(135deg, #2d1f1a 0%, #1a1210 50%, #0d0a08 100%)' },
  'sonoma': { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #f093fb 100%)' },
  'ventura': { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)' },
};

// Memoized background component to prevent restarts
const TerminalBackground = React.memo(() => {
  const gridMul = useMemo(() => [2, 1] as [number, number], []);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <FaultyTerminal
        scale={isMobile ? 1.5 : 1.2}
        gridMul={gridMul}
        digitSize={1.2}
        timeScale={0.2}
        pause={false}
        scanlineIntensity={0.3}
        glitchAmount={0.3}
        flickerAmount={0.2}
        noiseAmp={0.5}
        chromaticAberration={0}
        dither={0}
        curvature={0}
        tint="#cccccc"
        mouseReact={!isMobile}
        mouseStrength={0.05}
        pageLoadAnimation={false}
        brightness={0.3}
      />
    </div>
  );
});

TerminalBackground.displayName = 'TerminalBackground';

// RippleGrid background component
const RippleGridBackground = React.memo(() => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <RippleGrid
        enableRainbow={false}
        gridColor="#ffffff"
        rippleIntensity={0.05}
        gridSize={10}
        gridThickness={15}
        mouseInteraction={!isMobile}
        mouseInteractionRadius={1.2}
        opacity={0.8}
      />
    </div>
  );
});

RippleGridBackground.displayName = 'RippleGridBackground';

// Iridescence background component
const IridescenceBackground = React.memo(() => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <Iridescence
        color={[1, 1, 1]}
        mouseReact={!isMobile}
        amplitude={0.3}
        speed={1.0}
      />
    </div>
  );
});

IridescenceBackground.displayName = 'IridescenceBackground';

// Static wallpaper background component
const WallpaperBackground = React.memo(({ wallpaper }: { wallpaper: WallpaperType }) => {
  const config = WALLPAPER_CONFIGS[wallpaper];

  return (
    <div
      className="fixed inset-0 z-0 transition-opacity duration-700"
      style={{
        backgroundImage: config.gradient,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
});

WallpaperBackground.displayName = 'WallpaperBackground';

type WindowId = 'welcome' | 'finder' | 'preview' | 'resume' | 'terminal' | 'safari' | 'paint' | 'messages' | 'game' | 'appstore';

interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  title: string;
  iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari' | 'messages' | 'paint' | 'notes' | 'appstore';
  pos: { x: number; y: number };
  size: { width: number; height: number };
}

export default function MacOsPortfolio() {
  const [booted, setBooted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [time, setTime] = useState('');
  const [zIndex, setZIndex] = useState(10);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [showAppleMenu, setShowAppleMenu] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperType>('terminal');
  const [wallpaperTransition, setWallpaperTransition] = useState(false);
  const appleMenuRef = useRef<HTMLDivElement>(null);

  // Project rename state - maps project IDs to custom names
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [paintImage, setPaintImage] = useState('/grinding.jpg');

  const [windows, setWindows] = useState<Record<WindowId, WindowState>>({
    welcome: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'About Kyle',
      iconType: 'notes' as const,
      pos: { x: 300, y: 100 }, size: { width: 600, height: 500 }
    },
    finder: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Finder',
      iconType: 'folder' as const,
      pos: { x: 100, y: 100 }, size: { width: 700, height: 500 }
    },
    preview: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Preview',
      iconType: 'preview' as const,
      pos: { x: 200, y: 100 }, size: { width: 850, height: 550 }
    },
    resume: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'resume.pdf',
      iconType: 'doc' as const,
      pos: { x: 400, y: 100 }, size: { width: 600, height: 600 }
    },
    terminal: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Terminal',
      iconType: 'terminal' as const,
      pos: { x: 100, y: 400 }, size: { width: 500, height: 350 }
    },
    safari: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Safari',
      iconType: 'safari' as const,
      pos: { x: 150, y: 120 }, size: { width: 900, height: 600 }
    },
    paint: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Paint',
      iconType: 'paint' as const,
      pos: { x: 180, y: 90 }, size: { width: 580, height: 650 }
    },
    messages: {
      isOpen: true, isMinimized: false, isMaximized: false, zIndex: 10,
      title: 'KyleBOT',
      iconType: 'messages' as const,
      pos: { x: 150, y: 80 }, size: { width: 850, height: 600 }
    },
    game: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'Kernel Crossing',
      iconType: 'folder' as const,
      pos: { x: 100, y: 50 }, size: { width: 800, height: 650 }
    },
    appstore: {
      isOpen: false, isMinimized: false, isMaximized: false, zIndex: 9,
      title: 'App Store',
      iconType: 'appstore' as const,
      pos: { x: 200, y: 80 }, size: { width: 400, height: 580 }
    }
  });

  const [hasMessagesNotification, setHasMessagesNotification] = useState(false);
  const [appStoreNotificationCount, setAppStoreNotificationCount] = useState(4);

  const [iconPos, setIconPos] = useState({
    hd: { x: 20, y: 40 },
    finder: { x: 20, y: 150 },
    resume: { x: 20, y: 260 },
    terminal: { x: 20, y: 370 },
    safari: { x: 20, y: 480 },
    paint: { x: 20, y: 590 },
    messages: { x: 20, y: 700 },
    game: { x: 20, y: 810 },
    appstore: { x: 20, y: 920 }
  });

  const [iconScale, setIconScale] = useState(1);

  const [iconLabels, setIconLabels] = useState({
    hd: 'intro',
    finder: 'my apps',
    resume: 'resume.pdf',
    terminal: 'Terminal',
    safari: 'Safari',
    paint: 'Paint',
    messages: 'KyleBOT',
    game: 'Game.app',
    appstore: 'App Store'
  });

  const [installedApps, setInstalledApps] = useState<AppData[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppData | null>(null);
  const [installedAppPositions, setInstalledAppPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [safariUrl, setSafariUrl] = useState('https://www.kyro.onl');
  const [showRatingPopup, setShowRatingPopup] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 1000);

    // Animate loading progress with pulsing haptic feedback
    let progress = 0;

    // Pulsing haptic feedback during boot (like app installation)
    haptic.error();
    const pulseInterval = setInterval(() => {
      haptic.error();
    }, 300);

    const loadingInterval = setInterval(() => {
      progress += Math.random() * 15 + 5; // Random increment between 5-20
      if (progress >= 100) {
        progress = 100;
        setLoadingProgress(100);
        clearInterval(loadingInterval);
        clearInterval(pulseInterval);

        // Final completion haptics
        setTimeout(() => {
          haptic();
          setTimeout(() => {
            haptic();
          }, 100);
        }, 250);

        setTimeout(() => setBooted(true), 300);
      } else {
        setLoadingProgress(progress);
      }
    }, 150);

    return () => {
      clearInterval(timer);
      clearInterval(loadingInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  // Rating popup: Show after 1 minute if user hasn't rated
  useEffect(() => {
    if (!booted) return;

    const timer = setTimeout(() => {
      if (shouldShowRatingPopup()) {
        setShowRatingPopup(true);
      }
    }, 60000); // 1 minute

    return () => clearTimeout(timer);
  }, [booted]);

  // Prevent pull-to-refresh on mobile (but allow scrolling inside app windows)
  useEffect(() => {
    let startY = 0;
    let startElement: Element | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
      startElement = e.target as Element;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].pageY;
      const isPullingDown = currentY > startY;

      // Check if we're inside a scrollable container
      let element = startElement;
      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

        if (isScrollable && element.scrollHeight > element.clientHeight) {
          // This is a scrollable element
          const scrollTop = element.scrollTop;

          // Allow scrolling up inside the element if not at top
          if (isPullingDown && scrollTop > 0) {
            return; // Don't prevent - let the element scroll
          }

          // Allow scrolling down inside the element if not at bottom
          if (!isPullingDown && scrollTop < element.scrollHeight - element.clientHeight) {
            return; // Don't prevent - let the element scroll
          }
        }
        element = element.parentElement;
      }

      // Prevent pull-to-refresh only when at top of page and pulling down
      if (window.scrollY <= 0 && isPullingDown) {
        e.preventDefault();
      }
    };

    // Must use passive: false to allow preventDefault on iOS
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Load installed apps from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('installedApps');
    if (stored) {
      try {
        setInstalledApps(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse installed apps from localStorage', e);
      }
    }
  }, []);

  // Save installed apps to localStorage whenever they change
  useEffect(() => {
    if (installedApps.length > 0) {
      localStorage.setItem('installedApps', JSON.stringify(installedApps));
    }
  }, [installedApps]);

  // Position initial messages (KyleBOT) window on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24;
      const padding = 10; // Equal spacing on sides and from top

      const mobileWindowWidth = viewportWidth - (padding * 2);
      const mobileWindowHeight = viewportHeight * 0.5; // Shorter for keyboard visibility

      setWindows(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          pos: { x: padding, y: menuBarHeight + padding },
          size: { width: mobileWindowWidth, height: mobileWindowHeight }
        }
      }));
    }
  }, []);

  // Close Apple menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (appleMenuRef.current && !appleMenuRef.current.contains(e.target as Node)) {
        setShowAppleMenu(false);
      }
    };

    if (showAppleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAppleMenu]);

  // Responsive desktop icons - adjust positions and scale based on window size
  useEffect(() => {
    const calculateIconLayout = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuBarHeight = 24; // Top menu bar
      const dockHeight = 80; // Bottom dock area
      const availableHeight = viewportHeight - menuBarHeight - dockHeight;

      const iconCount = 9; // Number of desktop icons
      const isMobile = viewportWidth < 768;

      if (isMobile) {
        // Mobile: Random scattered layout like a messy desktop
        const baseIconSize = 70; // Icon hitbox size
        const minSpacing = 25; // Minimum space between icons
        const horizontalPadding = 15;
        const topPadding = 40;
        const bottomPadding = 100; // Space for dock

        const usableWidth = viewportWidth - (horizontalPadding * 2) - baseIconSize;
        const usableHeight = viewportHeight - topPadding - bottomPadding - baseIconSize;

        const scale = viewportWidth < 400 ? 0.85 : 0.95;

        const icons = [
          'hd', 'finder', 'resume', 'terminal',
          'safari', 'paint', 'messages', 'game', 'appstore'
        ];

        // Generate random positions with collision detection
        const newPositions: any = {};
        const placedPositions: { x: number; y: number }[] = [];

        // Seeded random for consistent positions (based on viewport)
        const seededRandom = (seed: number) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };

        icons.forEach((icon, index) => {
          let attempts = 0;
          let x: number, y: number;
          let validPosition = false;

          // Try to find a non-overlapping position
          while (!validPosition && attempts < 50) {
            // Use seeded random for consistent layout
            const seedX = (index + 1) * 1337 + attempts * 7;
            const seedY = (index + 1) * 2749 + attempts * 13;

            x = horizontalPadding + seededRandom(seedX) * usableWidth;
            y = topPadding + seededRandom(seedY) * usableHeight;

            // Check for collisions with already placed icons
            validPosition = true;
            for (const pos of placedPositions) {
              const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
              if (distance < baseIconSize + minSpacing) {
                validPosition = false;
                break;
              }
            }
            attempts++;
          }

          // Fallback to grid if can't find valid position
          if (!validPosition) {
            const cols = 3;
            const col = index % cols;
            const row = Math.floor(index / cols);
            x = horizontalPadding + (col * (usableWidth / cols));
            y = topPadding + (row * (baseIconSize + minSpacing));
          }

          newPositions[icon] = { x: x!, y: y! };
          placedPositions.push({ x: x!, y: y! });
        });

        setIconPos(newPositions);
        setIconScale(scale);
      } else {
        // Desktop: Single column
        const baseIconHeight = 110;
        const minIconHeight = 70;
        const topPadding = 40;
        const requiredHeight = (iconCount * baseIconHeight) + topPadding;

        let scale = 1;
        let iconSpacing = baseIconHeight;

        if (requiredHeight > availableHeight) {
          const maxSpacing = (availableHeight - topPadding) / iconCount;
          iconSpacing = Math.max(minIconHeight, maxSpacing);
          scale = Math.max(0.6, iconSpacing / baseIconHeight);
        }

        setIconPos({
          hd: { x: 20, y: topPadding },
          finder: { x: 20, y: topPadding + iconSpacing },
          resume: { x: 20, y: topPadding + iconSpacing * 2 },
          terminal: { x: 20, y: topPadding + iconSpacing * 3 },
          safari: { x: 20, y: topPadding + iconSpacing * 4 },
          paint: { x: 20, y: topPadding + iconSpacing * 5 },
          messages: { x: 20, y: topPadding + iconSpacing * 6 },
          game: { x: 20, y: topPadding + iconSpacing * 7 },
          appstore: { x: 20, y: topPadding + iconSpacing * 8 }
        });

        setIconScale(scale);
      }
    };

    calculateIconLayout();
    window.addEventListener('resize', calculateIconLayout);

    return () => window.removeEventListener('resize', calculateIconLayout);
  }, []);

  // Calculate positions for installed apps to avoid overlap with existing icons
  useEffect(() => {
    if (installedApps.length === 0 || Object.keys(iconPos).length === 0) return;

    const calculateInstalledAppPositions = () => {
      const isMobile = window.innerWidth < 768;
      const baseIconSize = 70;
      const minSpacing = 25;

      // Seeded random for consistent positions
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const newPositions: Record<string, { x: number; y: number }> = {};

      // Start with all existing desktop icon positions
      const occupiedPositions = Object.values(iconPos).map(pos => ({ x: pos.x, y: pos.y }));

      installedApps.forEach((app, index) => {
        // Skip if we already have a position for this app
        if (installedAppPositions[app.id]) {
          occupiedPositions.push(installedAppPositions[app.id]);
          return;
        }

        let finalPos: { x: number; y: number };

        if (isMobile) {
          // Mobile: Find a non-overlapping position using collision detection
          const horizontalPadding = 15;
          const topPadding = 40;
          const bottomPadding = 100;
          const usableWidth = window.innerWidth - (horizontalPadding * 2) - baseIconSize;
          const usableHeight = window.innerHeight - topPadding - bottomPadding - baseIconSize;

          let attempts = 0;
          let x = 0, y = 0;
          let validPosition = false;

          // Try to find a non-overlapping position
          while (!validPosition && attempts < 100) {
            // Use app id hash for consistent but unique seeding
            const appIdHash = app.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const seedX = (appIdHash + index + 1) * 1337 + attempts * 7;
            const seedY = (appIdHash + index + 1) * 2749 + attempts * 13;

            x = horizontalPadding + seededRandom(seedX) * usableWidth;
            y = topPadding + seededRandom(seedY) * usableHeight;

            // Check for collisions with all existing and previously placed icons
            validPosition = true;
            for (const pos of occupiedPositions) {
              const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
              if (distance < baseIconSize + minSpacing) {
                validPosition = false;
                break;
              }
            }
            attempts++;
          }

          // Fallback to grid position if can't find valid spot
          if (!validPosition) {
            const cols = 3;
            const totalIcons = Object.keys(iconPos).length + index;
            const col = totalIcons % cols;
            const row = Math.floor(totalIcons / cols);
            x = horizontalPadding + (col * (usableWidth / cols));
            y = topPadding + (row * (baseIconSize + minSpacing));
          }

          finalPos = { x, y };
        } else {
          // Desktop: Continue the column after existing icons
          const baseIconHeight = 110;
          const topPadding = 40;
          const existingIconCount = Object.keys(iconPos).length;
          finalPos = {
            x: 20,
            y: topPadding + (existingIconCount + index) * baseIconHeight * iconScale
          };
        }

        newPositions[app.id] = finalPos;
        occupiedPositions.push(finalPos);
      });

      if (Object.keys(newPositions).length > 0) {
        setInstalledAppPositions(prev => ({ ...prev, ...newPositions }));
      }
    };

    calculateInstalledAppPositions();
  }, [installedApps, iconPos, iconScale]);

  const focusWindow = (id: string) => {
    const windowId = id as WindowId;
    setZIndex(z => z + 1);
    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], zIndex: zIndex + 1 } }));
  };

  const openWindow = (id: string) => {
    const windowId = id as WindowId;
    focusWindow(id);

    // Haptic feedback for opening app
    haptic();

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, full width with small equal padding
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24;
      const padding = 10; // Equal spacing on sides and from top

      const mobileWindowWidth = viewportWidth - (padding * 2);

      // Safari and Paint get more height, welcome/notes gets less, messages shorter for keyboard
      let mobileWindowHeight: number;
      if (windowId === 'safari' || windowId === 'paint') {
        mobileWindowHeight = viewportHeight * 0.845;
      } else if (windowId === 'welcome') {
        mobileWindowHeight = viewportHeight * 0.45;
      } else if (windowId === 'messages') {
        // Shorter height so keyboard doesn't cover input field
        mobileWindowHeight = viewportHeight * 0.5;
      } else if (windowId === 'appstore') {
        // Taller to show uninstall button
        mobileWindowHeight = viewportHeight * 0.75;
      } else {
        mobileWindowHeight = viewportHeight * 0.65;
      }

      setWindows(prev => ({
        ...prev,
        [windowId]: {
          ...prev[windowId],
          isOpen: true,
          isMinimized: false,
          pos: { x: padding, y: menuBarHeight + padding },
          size: { width: mobileWindowWidth, height: mobileWindowHeight }
        }
      }));
    } else {
      setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: true, isMinimized: false } }));
    }

    // Clear messages notification when opened
    if (windowId === 'messages') {
      setHasMessagesNotification(false);
    }

    // Clear app store notification when opened
    if (windowId === 'appstore') {
      setAppStoreNotificationCount(0);
    }
  };

  const closeWindow = (id: string) => {
    const windowId = id as WindowId;

    // Haptic feedback for closing app
    haptic();

    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: false } }));
  };

  const handleAppInstalled = (app: AppData) => {
    // Special case for Arcadeus - open Safari with the website instead
    if (app.id === 'arcadeus' && app.website) {
      setSafariUrl(app.website);
      openWindow('safari');
      return;
    }

    // Add app to installed apps if not already there
    setInstalledApps(prev => {
      if (prev.find(a => a.id === app.id)) {
        // If already installed, open the app detail window
        setSelectedApp(app);
        openWindow(`app-${app.id}`);
        return prev;
      }
      return [...prev, app];
    });

    // Open the app detail window
    setSelectedApp(app);
    openWindow(`app-${app.id}`);
  };

  const handleUninstallAll = () => {
    // Close all installed app windows
    installedApps.forEach(app => {
      const windowId = `app-${app.id}` as WindowId;
      setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isOpen: false } }));
    });

    // Clear installed apps from state
    setInstalledApps([]);

    // Clear from localStorage
    localStorage.removeItem('installedApps');

    // Clear selected app
    setSelectedApp(null);
  };

  // Rating popup handlers
  const handleRatingClose = () => {
    setShowRatingPopup(false);
    // Don't mark as dismissed - will show again next page load after 1 minute
  };

  const handleRatingSubmit = (rating: number, review?: string) => {
    trackRating(rating, review);
    markRatingCompleted();
    if (review) {
      // If review is submitted, close immediately
      setShowRatingPopup(false);
    }
  };

  // Wallpaper change handler with smooth transition
  const handleWallpaperChange = (wallpaper: WallpaperType) => {
    if (wallpaper === currentWallpaper) return;

    // Trigger transition
    setWallpaperTransition(true);

    // After fade out, change wallpaper
    setTimeout(() => {
      setCurrentWallpaper(wallpaper);
      // Save to localStorage
      localStorage.setItem('kyleos_wallpaper', wallpaper);
    }, 300);

    // End transition after fade in
    setTimeout(() => {
      setWallpaperTransition(false);
    }, 600);
  };

  // Load saved wallpaper on mount
  useEffect(() => {
    const saved = localStorage.getItem('kyleos_wallpaper') as WallpaperType | null;
    if (saved && WALLPAPER_CONFIGS[saved]) {
      setCurrentWallpaper(saved);
    }
  }, []);

  const minimizeWindow = (id: string) => {
    const windowId = id as WindowId;

    // Haptic feedback for minimizing app
    haptic();

    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMinimized: true } }));
  };

  const restoreWindow = (id: string) => {
    const windowId = id as WindowId;
    focusWindow(id);

    // Haptic feedback for restoring app
    haptic();

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // On mobile, full width with small equal padding
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuBarHeight = 24;
      const padding = 10; // Equal spacing on sides and from top

      const mobileWindowWidth = viewportWidth - (padding * 2);

      // Safari and Paint get more height, welcome/notes gets less
      let mobileWindowHeight: number;
      if (windowId === 'safari' || windowId === 'paint') {
        mobileWindowHeight = viewportHeight * 0.8;
      } else if (windowId === 'welcome') {
        mobileWindowHeight = viewportHeight * 0.45;
      } else {
        mobileWindowHeight = viewportHeight * 0.65;
      }

      setWindows(prev => ({
        ...prev,
        [windowId]: {
          ...prev[windowId],
          isMinimized: false,
          pos: { x: padding, y: menuBarHeight + padding },
          size: { width: mobileWindowWidth, height: mobileWindowHeight }
        }
      }));
    } else {
      setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMinimized: false } }));
    }
  };

  const maximizeWindow = (id: string) => {
    const windowId = id as WindowId;

    // Pulsing haptic feedback during resize animation
    // Uses three rapid haptics for a pulsing feel
    haptic.error();

    setWindows(prev => ({ ...prev, [windowId]: { ...prev[windowId], isMaximized: !prev[windowId].isMaximized } }));
  };

  const openProjectPreview = (project: any) => {
    setActiveProject(project);
    setWindows(prev => ({
      ...prev,
      preview: { ...prev.preview, isOpen: true, title: `Preview — ${project.title}`, isMinimized: false, zIndex: zIndex + 1 }
    }));
  };

  const renameProject = (projectId: string, newName: string) => {
    setProjectNames(prev => ({ ...prev, [projectId]: newName }));
    // If this project is currently previewed, update the window title
    if (activeProject && activeProject.id === projectId) {
      setWindows(prev => ({
        ...prev,
        preview: { ...prev.preview, title: `Preview — ${newName}` }
      }));
      setActiveProject((prev: any) => ({ ...prev, title: newName }));
    }
  };

  // Create enriched projects with custom names
  const enrichedProjects = projects.map(project => ({
    ...project,
    title: projectNames[project.id] || project.title
  }));

  const handleIconRename = (iconId: string, newLabel: string) => {
    setIconLabels(prev => ({ ...prev, [iconId]: newLabel }));
  };

  const handleIconContextMenu = (e: React.MouseEvent, iconId: string, label: string, startRename: () => void) => {
    const iconToWindowMap: Record<string, WindowId> = {
      hd: 'welcome',
      finder: 'finder',
      resume: 'resume',
      terminal: 'terminal',
      safari: 'safari',
      paint: 'paint',
      messages: 'messages',
      game: 'game',
      appstore: 'appstore',
    };

    const items: ContextMenuItem[] = [
      {
        label: 'Open',
        action: () => {
          const windowId = iconToWindowMap[iconId];
          if (windowId) openWindow(windowId);
        },
        shortcut: '⌘O'
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Get Info',
        action: () => console.log('Get Info for', label),
        shortcut: '⌘I'
      },
      {
        label: 'Rename',
        action: startRename
      },
      { separator: true } as ContextMenuItem,
      {
        label: 'Duplicate',
        action: () => console.log('Duplicate', label),
        disabled: true
      },
      {
        label: 'Move to Trash',
        action: () => console.log('Delete', label),
        disabled: true
      }
    ];

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items
    });
  };

  if (!booted) {
    return (
        <div className="h-screen w-screen bg-[#c0c0c0] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #7a7a7a 0%, #a8a8a8 15%, #c8c8c8 50%, #a8a8a8 85%, #7a7a7a 100%)'
          }}
        >
            {/* Apple Logo - Glossy Chrome Style */}
            <div className="mb-10 relative">
                <svg width="80" height="96" viewBox="0 0 170 170" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id="appleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6a6a6a" />
                      <stop offset="40%" stopColor="#4a4a4a" />
                      <stop offset="60%" stopColor="#3a3a3a" />
                      <stop offset="100%" stopColor="#2a2a2a" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#appleGradient)" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.71.12 1.083.17 2.166.17 3.24z"/>
                </svg>
            </div>

            {/* Aqua Gel Progress Bar - Snow Leopard Style */}
            <div
              className="w-52 h-3 rounded-full overflow-hidden relative"
              style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, #3d3d3d 20%, #2a2a2a 80%, #1a1a1a 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -1px 2px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.4)',
                border: '1px solid #0a0a0a'
              }}
            >
              {/* Progress Fill - Aqua Blue Gel */}
              <div
                className="h-full rounded-full transition-all duration-150 ease-out relative overflow-hidden"
                style={{
                  width: `${loadingProgress}%`,
                  background: 'linear-gradient(180deg, #6cb4f5 0%, #3d9df5 25%, #1a7de8 50%, #1565c0 75%, #0d47a1 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {/* Glossy Shine Overlay */}
                <div
                  className="absolute inset-x-0 top-0 h-1/2 rounded-t-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)'
                  }}
                />
                {/* Animated Stripe Effect */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px)',
                    animation: 'stripes 1s linear infinite'
                  }}
                />
              </div>
            </div>

            {/* Loading Text - Embossed Style */}
            <p
              className="text-sm mt-5 font-medium tracking-wide"
              style={{
                color: '#4a4a4a',
                textShadow: '0 1px 0 rgba(255,255,255,0.5)'
              }}
            >
              launching KyleOS
            </p>

            {/* Stripe Animation Keyframes */}
            <style jsx>{`
              @keyframes stripes {
                0% { background-position: 0 0; }
                100% { background-position: 32px 0; }
              }
            `}</style>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden font-sans text-[#333] select-none">
      {/* Background with transition */}
      <div className={`transition-opacity duration-300 ${wallpaperTransition ? 'opacity-0' : 'opacity-100'}`}>
        {currentWallpaper === 'terminal' ? (
          <TerminalBackground />
        ) : currentWallpaper === 'ripple' ? (
          <RippleGridBackground />
        ) : currentWallpaper === 'iridescence' ? (
          <IridescenceBackground />
        ) : (
          <WallpaperBackground wallpaper={currentWallpaper} />
        )}
      </div>

      {/* Menu Bar */}
      <div className="absolute top-0 w-full h-6 bg-gradient-to-b from-[#e6e6e6] to-[#a8a8a8] border-b border-[#444] shadow-md flex items-center justify-between px-4 z-50 text-xs font-bold text-[#222] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
         <div className="relative" ref={appleMenuRef}>
            <div
              className="flex gap-2 items-center cursor-pointer hover:bg-blue-600/20 px-2 py-0.5 rounded-[3px] transition-colors"
              onClick={() => {
                haptic();
                setShowAppleMenu(!showAppleMenu);
              }}
            >
               <svg width="14" height="14" viewBox="0 0 170 170" fill="currentColor" className="relative -top-px">
                 <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.71.12 1.083.17 2.166.17 3.24z"/>
               </svg>
               <span className="font-bold">KyleOS</span>
            </div>

            {/* Apple Menu Dropdown with LetterGlitch */}
            {showAppleMenu && (
              <div className="absolute top-full left-0 mt-1 w-[320px] md:w-[300px] h-[220px] bg-[#1a1a1a]/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden">
                <LetterGlitch
                  glitchSpeed={50}
                  centerVignette={true}
                  outerVignette={false}
                  smooth={true}
                />
                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-5 border border-white/20 shadow-2xl pointer-events-auto">
                    <p className="text-white text-center text-base font-semibold mb-3 leading-relaxed">
                      Hire me to create a<br />resume website :)
                    </p>
                    <a
                      href="https://www.linkedin.com/in/kos33/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006396] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Kyle O'Sullivan
                    </a>
                  </div>
                </div>
              </div>
            )}
         </div>

         <div className="flex gap-3 items-center">
            <ControlCenterButton onClick={() => setShowControlCenter(true)} />
            <button
              type="button"
              onClick={() => {
                haptic();
                setShowControlCenter(true);
              }}
              className="md:cursor-default hover:bg-black/10 active:bg-black/20 md:hover:bg-transparent md:active:bg-transparent px-1 py-0.5 rounded transition-colors"
            >
              {time}
            </button>
         </div>
      </div>

      {/* Control Center */}
      <ControlCenter
        isOpen={showControlCenter}
        onClose={() => setShowControlCenter(false)}
        currentWallpaper={currentWallpaper}
        onWallpaperChange={handleWallpaperChange}
      />

      {/* Desktop Icons */}
      <div className="absolute top-8 left-0 z-0 w-full h-full pointer-events-auto">
         <DesktopIcon
           id="hd"
           label={iconLabels.hd}
           type="notes"
           initialPos={iconPos.hd}
           scale={iconScale}
           onDoubleClick={() => openWindow('welcome')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
{/* Temporarily removed - my apps folder (keep for future folder implementation)
         <DesktopIcon
           id="finder"
           label={iconLabels.finder}
           type="folder"
           initialPos={iconPos.finder}
           scale={iconScale}
           onDoubleClick={() => openWindow('finder')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
*/}
         <DesktopIcon
           id="resume"
           label={iconLabels.resume}
           type="doc"
           initialPos={iconPos.resume}
           scale={iconScale}
           onDoubleClick={() => openWindow('resume')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="terminal"
           label={iconLabels.terminal}
           type="terminal"
           initialPos={iconPos.terminal}
           scale={iconScale}
           onDoubleClick={() => openWindow('terminal')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="safari"
           label={iconLabels.safari}
           type="safari"
           initialPos={iconPos.safari}
           scale={iconScale}
           onDoubleClick={() => openWindow('safari')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="paint"
           label={iconLabels.paint}
           type="paint"
           initialPos={iconPos.paint}
           scale={iconScale}
           onDoubleClick={() => openWindow('paint')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
         <DesktopIcon
           id="messages"
           label={iconLabels.messages}
           type="messages"
           initialPos={iconPos.messages}
           scale={iconScale}
           onDoubleClick={() => openWindow('messages')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
{/* Temporarily removed
         <DesktopIcon
           id="game"
           label={iconLabels.game}
           type="folder"
           initialPos={iconPos.game}
           scale={iconScale}
           onDoubleClick={() => openWindow('game')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />
*/}
         <DesktopIcon
           id="appstore"
           label={iconLabels.appstore}
           type="appstore"
           initialPos={iconPos.appstore}
           scale={iconScale}
           onDoubleClick={() => openWindow('appstore')}
           onRename={handleIconRename}
           onContextMenu={handleIconContextMenu}
         />

         {installedApps.map((app) => {
           // Use pre-calculated position that avoids overlap with existing icons
           const position = installedAppPositions[app.id];
           // Don't render until position is calculated
           if (!position) return null;

           return (
             <DesktopIcon
               key={app.id}
               id={`app-${app.id}`}
               label={app.name}
               type="app"
               iconSrc={app.icon}
               initialPos={position}
               scale={iconScale}
               onDoubleClick={() => {
                 setSelectedApp(app);
                 openWindow(`app-${app.id}`);
               }}
               onRename={(id, newLabel) => {
                 // Update app name in installed apps
                 setInstalledApps(prev => prev.map(a =>
                   a.id === app.id ? { ...a, name: newLabel } : a
                 ));
               }}
               onContextMenu={handleIconContextMenu}
             />
           );
         })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Dock */}
      <Dock
        windows={windows}
        onOpenWindow={openWindow}
        onRestoreWindow={restoreWindow}
        onFocusWindow={focusWindow}
        hasMessagesNotification={hasMessagesNotification}
        appStoreNotificationCount={appStoreNotificationCount}
        installedApps={installedApps}
        installedAppWindows={
          installedApps.reduce((acc, app) => {
            const windowId = `app-${app.id}` as WindowId;
            acc[app.id] = {
              isOpen: windows[windowId]?.isOpen ?? false,
              isMinimized: windows[windowId]?.isMinimized ?? false,
            };
            return acc;
          }, {} as Record<string, { isOpen: boolean; isMinimized: boolean }>)
        }
        onOpenApp={(appId) => {
          const app = installedApps.find(a => a.id === appId);
          if (app) {
            setSelectedApp(app);
            openWindow(`app-${appId}`);
          }
        }}
        onRestoreApp={(appId) => {
          restoreWindow(`app-${appId}`);
        }}
        onFocusApp={(appId) => {
          focusWindow(`app-${appId}`);
        }}
      />

      {/* --- WINDOWS --- */}

      {/* WELCOME WINDOW */}
      <MacWindow
        id="welcome"
        title={windows.welcome.title}
        isOpen={windows.welcome.isOpen}
        isMinimized={windows.welcome.isMinimized}
        isMaximized={windows.welcome.isMaximized}
        zIndex={windows.welcome.zIndex}
        pos={windows.welcome.pos}
        size={windows.welcome.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
        <NotesApp />
      </MacWindow>

      {/* FINDER WINDOW */}
      <MacWindow
        id="finder"
        title={windows.finder.title}
        isOpen={windows.finder.isOpen}
        isMinimized={windows.finder.isMinimized}
        isMaximized={windows.finder.isMaximized}
        zIndex={windows.finder.zIndex}
        pos={windows.finder.pos}
        size={windows.finder.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <Finder items={enrichedProjects} onNavigate={openProjectPreview} onRename={renameProject} />
      </MacWindow>

      {/* PREVIEW WINDOW */}
      <MacWindow
        id="preview"
        title={windows.preview.title}
        isOpen={windows.preview.isOpen}
        isMinimized={windows.preview.isMinimized}
        isMaximized={windows.preview.isMaximized}
        zIndex={windows.preview.zIndex}
        pos={windows.preview.pos}
        size={windows.preview.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <PreviewWindow project={activeProject} />
      </MacWindow>

      {/* RESUME WINDOW */}
      <MacWindow
        id="resume"
        title={windows.resume.title}
        isOpen={windows.resume.isOpen}
        isMinimized={windows.resume.isMinimized}
        isMaximized={windows.resume.isMaximized}
        zIndex={windows.resume.zIndex}
        pos={windows.resume.pos}
        size={windows.resume.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
          <div className="bg-[#525252] h-full flex flex-col overflow-hidden">
            <iframe
              src="/resume.pdf#view=FitH"
              className="flex-1 w-full border-0"
              title="Kyle O'Sullivan Resume"
              style={{ minHeight: '100%' }}
            />
          </div>
      </MacWindow>

      {/* TERMINAL WINDOW */}
      <MacWindow
        id="terminal"
        title={windows.terminal.title}
        isOpen={windows.terminal.isOpen}
        isMinimized={windows.terminal.isMinimized}
        isMaximized={windows.terminal.isMaximized}
        zIndex={windows.terminal.zIndex}
        pos={windows.terminal.pos}
        size={windows.terminal.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <div className="bg-black p-2 font-mono text-xs text-white h-full selection:bg-gray-500">
             <p>Last login: {time} on ttys000</p>
             <br/>
             <p>Kyles-MacBook-Pro:~ kyle$ <span className="text-yellow-400">cat skills.json</span></p>
             <pre className="text-green-400 mt-1">
{`{
  "languages": ["Python", "SQL", "R", "Dart", "JavaScript"],
  "frameworks": ["Flutter", "React", "Next.js", "Firebase"],
  "tools": ["LangGraph", "Office.js", "Excel"],
  "soft_skills": ["Strategy", "Public Speaking"]
}`}
             </pre>
             <p className="mt-2">Kyles-MacBook-Pro:~ kyle$ <span className="animate-pulse">_</span></p>
         </div>
      </MacWindow>

      {/* SAFARI WINDOW */}
      <MacWindow
        id="safari"
        title={windows.safari.title}
        isOpen={windows.safari.isOpen}
        isMinimized={windows.safari.isMinimized}
        isMaximized={windows.safari.isMaximized}
        zIndex={windows.safari.zIndex}
        pos={windows.safari.pos}
        size={windows.safari.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <Safari initialUrl={safariUrl} key={safariUrl} />
      </MacWindow>

      {/* PAINT WINDOW */}
      <MacWindow
        id="paint"
        title={windows.paint.title}
        isOpen={windows.paint.isOpen}
        isMinimized={windows.paint.isMinimized}
        isMaximized={windows.paint.isMaximized}
        zIndex={windows.paint.zIndex}
        pos={windows.paint.pos}
        size={windows.paint.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <MacPaint imageSrc={paintImage} fileName="me.paint" />
      </MacWindow>

      {/* MESSAGES WINDOW */}
      <MacWindow
        id="messages"
        title={windows.messages.title}
        isOpen={windows.messages.isOpen}
        isMinimized={windows.messages.isMinimized}
        isMaximized={windows.messages.isMaximized}
        zIndex={windows.messages.zIndex}
        pos={windows.messages.pos}
        size={windows.messages.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
        flashCloseButton={true}
      >
         <MessagesApp />
      </MacWindow>

      <MacWindow
        id="game"
        title={windows.game.title}
        isOpen={windows.game.isOpen}
        isMinimized={windows.game.isMinimized}
        isMaximized={windows.game.isMaximized}
        zIndex={windows.game.zIndex}
        pos={windows.game.pos}
        size={windows.game.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <KernelCrossing />
      </MacWindow>

      {/* APP STORE WINDOW */}
      <MacWindow
        id="appstore"
        title={windows.appstore.title}
        isOpen={windows.appstore.isOpen}
        isMinimized={windows.appstore.isMinimized}
        isMaximized={windows.appstore.isMaximized}
        zIndex={windows.appstore.zIndex}
        pos={windows.appstore.pos}
        size={windows.appstore.size}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
      >
         <AppStore
           onAppInstalled={handleAppInstalled}
           onUninstallAll={handleUninstallAll}
           initialInstalledApps={installedApps}
         />
      </MacWindow>

      {/* DYNAMICALLY CREATED APP DETAIL WINDOWS */}
      {installedApps.map((app) => {
        const windowId = `app-${app.id}`;
        const isOpen = windows[windowId as WindowId]?.isOpen ?? false;
        const isMinimized = windows[windowId as WindowId]?.isMinimized ?? false;
        const isMaximized = windows[windowId as WindowId]?.isMaximized ?? false;
        const zIndex = windows[windowId as WindowId]?.zIndex ?? 10;
        const pos = windows[windowId as WindowId]?.pos ?? { x: 220, y: 100 };
        const size = windows[windowId as WindowId]?.size ?? { width: 500, height: 600 };

        return (
          <MacWindow
            key={windowId}
            id={windowId}
            title={app.name}
            isOpen={isOpen}
            isMinimized={isMinimized}
            isMaximized={isMaximized}
            zIndex={zIndex}
            pos={pos}
            size={size}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onFocus={focusWindow}
          >
            <AppDetail app={app} />
          </MacWindow>
        );
      })}

      {/* Rating Popup */}
      {showRatingPopup && (
        <RatingPopup
          onClose={handleRatingClose}
          onSubmitRating={handleRatingSubmit}
        />
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes minimize {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.1) translateY(100vh); opacity: 0; }
        }
        .animate-minimize {
          animation: minimize 0.4s cubic-bezier(0.4, 0.0, 1, 1) forwards;
        }
        @keyframes slide-up {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e8e8e8;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
