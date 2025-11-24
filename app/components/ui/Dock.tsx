import React from 'react';
import { Github, Linkedin } from 'lucide-react';
import { FloatingDock } from './floating-dock';
import { MacFolderIcon, MacDocIcon, MacTerminalIcon, MacDriveIcon, MacPreviewIcon, MacSafariIcon } from './Icons';

type WindowId = 'welcome' | 'finder' | 'preview' | 'resume' | 'terminal' | 'contact' | 'safari' | 'paint';

interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  title: string;
  iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari';
  pos: { x: number; y: number };
  size: { width: number; height: number };
}

interface DockProps {
  windows: Record<WindowId, WindowState>;
  onOpenWindow: (id: WindowId) => void;
  onRestoreWindow: (id: WindowId) => void;
  onFocusWindow: (id: WindowId) => void;
}

const Dock: React.FC<DockProps> = ({ windows, onOpenWindow, onRestoreWindow, onFocusWindow }) => {
  const renderIcon = (iconType: 'drive' | 'folder' | 'terminal' | 'doc' | 'preview' | 'safari') => {
    switch (iconType) {
      case 'drive': return <MacDriveIcon />;
      case 'folder': return <MacFolderIcon />;
      case 'terminal': return <MacTerminalIcon />;
      case 'doc': return <MacDocIcon />;
      case 'preview': return <MacPreviewIcon />;
      case 'safari': return <MacSafariIcon />;
      default: return <MacFolderIcon />;
    }
  };

  // Create dock items for all windows
  const windowItems: Array<{ id: WindowId; title: string; icon: React.ReactNode; isOpen: boolean }> = [
    { id: 'finder', title: windows.finder.title, icon: renderIcon(windows.finder.iconType), isOpen: windows.finder.isOpen },
    { id: 'safari', title: windows.safari.title, icon: renderIcon(windows.safari.iconType), isOpen: windows.safari.isOpen },
    { id: 'preview', title: windows.preview.title, icon: renderIcon(windows.preview.iconType), isOpen: windows.preview.isOpen },
    { id: 'paint', title: windows.paint.title, icon: renderIcon(windows.paint.iconType), isOpen: windows.paint.isOpen },
    { id: 'resume', title: windows.resume.title, icon: renderIcon(windows.resume.iconType), isOpen: windows.resume.isOpen },
    { id: 'terminal', title: windows.terminal.title, icon: renderIcon(windows.terminal.iconType), isOpen: windows.terminal.isOpen },
    { id: 'contact', title: windows.contact.title, icon: renderIcon(windows.contact.iconType), isOpen: windows.contact.isOpen },
  ];

  const applicationItems = windowItems.map((win) => ({
    title: win.title,
    icon: <div className="w-full h-full flex items-center justify-center">{win.icon}</div>,
    onClick: () => {
      const window = windows[win.id];
      if (window.isMinimized) {
        // If minimized, restore it
        onRestoreWindow(win.id);
      } else if (!window.isOpen) {
        // If closed, open it
        onOpenWindow(win.id);
      } else {
        // If open and visible, focus it
        onFocusWindow(win.id);
      }
    },
    isOpen: win.isOpen,
  }));

  // Permanent dock apps (GitHub and LinkedIn) - add divider
  const permanentApps = [
    {
      title: 'GitHub',
      icon: (
        <div className="w-full h-full bg-[#24292e] rounded-lg flex items-center justify-center">
          <Github className="text-white" size={24} />
        </div>
      ),
      onClick: () => window.open('https://github.com/KyleziNho', '_blank', 'noopener,noreferrer'),
      isOpen: false,
    },
    {
      title: 'LinkedIn',
      icon: (
        <div className="w-full h-full bg-[#0077b5] rounded-lg flex items-center justify-center">
          <Linkedin className="text-white" size={24} />
        </div>
      ),
      onClick: () => window.open('https://www.linkedin.com/in/kos33/', '_blank', 'noopener,noreferrer'),
      isOpen: false,
    },
  ];

  // Combine application windows with permanent apps
  const dockItems = [...applicationItems, ...permanentApps];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]">
      <FloatingDock
        items={dockItems}
        desktopClassName="bg-black/10 dark:bg-neutral-900/80 backdrop-blur-2xl border border-white/20"
      />
    </div>
  );
};

export default Dock;
