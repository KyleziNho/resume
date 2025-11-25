import React from 'react';
import Image from 'next/image';

export const MacFolderIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/folder-icon.png"
      alt="Folder"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacDriveIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/contact-icon.png"
      alt="About Kyle"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacTerminalIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/terminal-icon.png"
      alt="Terminal"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacDocIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/pdf-icon.png"
      alt="PDF"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacSafariIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/safari-icon.png"
      alt="Safari"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
      unoptimized
    />
  </div>
);

export const MacPaintIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/paint-icon.png"
      alt="Paint"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacPreviewIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/preview-icon.png"
      alt="Preview"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacMessagesIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/messages-icon.png"
      alt="Messages"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
    />
  </div>
);

export const MacNotesIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg">
    <Image
      src="/notes-icon.png"
      alt="Notes"
      width={512}
      height={512}
      className="w-full h-full object-contain"
      priority
      unoptimized
    />
  </div>
);

export const MacAppStoreIcon = () => (
  <div className="w-full h-full relative group-hover:scale-105 transition-transform drop-shadow-lg flex items-center justify-center">
    <div className="w-[85%] h-[85%]">
      <Image
        src="/appstore-icon-new.png"
        alt="App Store"
        width={512}
        height={512}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  </div>
);

// App Icon Component for dynamically installed apps with Liquid Glass effect
export const AppIcon = ({ iconSrc }: { iconSrc: string }) => (
  <div className="w-full h-full flex items-center justify-center relative group-hover:scale-105 transition-transform">
    {/* Scaled down container to match other desktop icon sizes */}
    <div className="w-[80%] h-[80%] relative drop-shadow-lg">
      {/* Liquid Glass Container - iOS 26 style */}
      <div className="relative w-full h-full rounded-[12px] overflow-hidden">
        {/* Frosted glass backdrop with blur */}
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        {/* App icon content */}
        <div className="absolute inset-0">
          <Image
            src={`${iconSrc}?v=2`}
            alt="App"
            width={512}
            height={512}
            className="w-full h-full object-cover rounded-[12px]"
            unoptimized
          />
        </div>

        {/* Specular highlight - top left */}
        <div
          className="absolute top-0 left-0 w-[60%] h-[60%] rounded-full blur-xl opacity-40"
          style={{
            background: 'radial-gradient(circle at top left, rgba(255,255,255,0.8) 0%, transparent 70%)',
          }}
        />

        {/* Glass refraction edge highlight */}
        <div
          className="absolute inset-0 rounded-[12px]"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.2)',
          }}
        />

        {/* Outer glass border */}
        <div
          className="absolute inset-0 rounded-[12px]"
          style={{
            border: '0.5px solid rgba(255,255,255,0.2)',
          }}
        />
      </div>
    </div>
  </div>
);
