import React from 'react';
import { FileText } from 'lucide-react';

export const MacFolderIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg group-hover:scale-105 transition-transform">
    <div className="absolute bottom-0 w-full h-[85%] bg-[#5aa5e6] rounded-t-sm rounded-b-md shadow-inner"></div>
    <div className="absolute top-[5%] left-0 w-[40%] h-[15%] bg-[#4892d6] rounded-t-md"></div>
    <div className="absolute bottom-0 w-full h-[75%] bg-gradient-to-b from-[#8bc8f7] to-[#4f9de8] rounded-b-md shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center">
       <div className="absolute top-0 w-full h-[2px] bg-white opacity-30"></div>
    </div>
  </div>
);

export const MacDriveIcon = () => (
  <div className="w-full h-full relative drop-shadow-lg group-hover:scale-105 transition-transform">
    <div className="w-full h-[80%] mt-[10%] bg-gradient-to-b from-[#e6e6e6] to-[#b3b3b3] rounded shadow-[0_2px_5px_rgba(0,0,0,0.4)] flex items-center justify-center border border-[#999]">
      <div className="w-[80%] h-[40%] bg-[#d0d0d0] shadow-inner border border-[#aaa] flex items-center justify-center">
         <div className="w-full h-[2px] bg-green-400/50 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
      </div>
      <div className="absolute bottom-2 text-[#888]">
        <svg width="12" height="12" viewBox="0 0 170 170" fill="currentColor"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51z"/></svg>
      </div>
    </div>
  </div>
);

export const MacTerminalIcon = () => (
  <div className="w-full h-full bg-[#222] rounded shadow-lg border border-[#444] flex flex-col overflow-hidden group-hover:scale-105 transition-transform">
     <div className="h-[20%] bg-gradient-to-b from-[#555] to-[#333] border-b border-black flex items-center px-1 gap-[2px]">
        <div className="w-1 h-1 rounded-full bg-red-500"></div>
        <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
        <div className="w-1 h-1 rounded-full bg-green-500"></div>
     </div>
     <div className="flex-1 p-1">
        <div className="text-[6px] text-green-500 font-mono font-bold">_</div>
     </div>
  </div>
);

export const MacDocIcon = () => (
  <div className="w-[90%] h-full mx-auto relative group-hover:scale-105 transition-transform drop-shadow-lg">
    {/* Main document body */}
    <div className="w-full h-full bg-gradient-to-b from-white to-gray-50 rounded-[4px] border-2 border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden">

      {/* Folded corner */}
      <div className="absolute top-0 right-0 w-[30%] h-[30%]">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 shadow-sm"
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-white"
             style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}>
        </div>
      </div>

      {/* Red PDF header bar */}
      <div className="h-[25%] bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center border-b border-red-800">
        <span className="text-white font-bold text-[10px] tracking-wider drop-shadow">PDF</span>
      </div>

      {/* Document lines */}
      <div className="flex-1 px-2 py-2 space-y-1">
        <div className="w-[85%] h-[2px] bg-gray-300 rounded-full"></div>
        <div className="w-[75%] h-[2px] bg-gray-300 rounded-full"></div>
        <div className="w-[90%] h-[2px] bg-gray-300 rounded-full"></div>
        <div className="w-[65%] h-[2px] bg-gray-300 rounded-full"></div>
      </div>
    </div>
  </div>
);

export const MacSafariIcon = () => (
  <div className="w-full h-full relative group-hover:scale-105 transition-transform drop-shadow-lg">
    {/* Safari Compass Icon - Official Style */}
    <div className="w-full h-full rounded-full relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      {/* Outer gradient ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0C7FE6] via-[#1E96FF] to-[#0052CC]"></div>

      {/* Glossy highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/5 to-transparent opacity-90 rounded-full"></div>

      {/* Inner white compass face */}
      <div className="absolute inset-[18%] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] flex items-center justify-center">
        {/* Tick marks */}
        <div className="absolute inset-0">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <div
              key={deg}
              className="absolute top-1/2 left-1/2 w-[1px] h-full origin-center"
              style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
            >
              <div className={`absolute top-[6%] left-1/2 -translate-x-1/2 w-[1px] ${deg % 90 === 0 ? 'h-[8%] bg-gray-400' : 'h-[5%] bg-gray-300'}`}></div>
            </div>
          ))}
        </div>

        {/* Cardinal directions */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[7px] font-bold text-[#E8453C]">N</div>
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-[6px] font-semibold text-gray-500">S</div>
        <div className="absolute right-[10%] top-1/2 -translate-y-1/2 text-[6px] font-semibold text-gray-500">E</div>
        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 text-[6px] font-semibold text-gray-500">W</div>

        {/* Compass needle */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'rotate(35deg)' }}>
          {/* Red north needle */}
          <div
            className="absolute w-0 h-0 z-10"
            style={{
              borderLeft: '3.5px solid transparent',
              borderRight: '3.5px solid transparent',
              borderBottom: '18px solid #E8453C',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
              transform: 'translateY(-3px)'
            }}
          ></div>

          {/* White south needle */}
          <div
            className="absolute w-0 h-0"
            style={{
              borderLeft: '3.5px solid transparent',
              borderRight: '3.5px solid transparent',
              borderTop: '18px solid #E8E8E8',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              transform: 'translateY(3px)'
            }}
          ></div>

          {/* Center circle */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg z-20"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white/30 z-20 transform -translate-y-[1px] -translate-x-[1px]"></div>
        </div>
      </div>

      {/* Outer rim shine */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]"></div>
    </div>
  </div>
);

export const MacPreviewIcon = () => (
  <div className="w-full h-full relative group-hover:scale-105 transition-transform drop-shadow-lg">
    {/* Back Photo - Mountain landscape */}
    <div className="absolute top-0 left-[12%] w-[75%] h-[72%] bg-white rounded-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.25)] rotate-[8deg] overflow-hidden border-2 border-white">
      <div className="w-full h-full bg-gradient-to-b from-sky-300 via-blue-400 to-green-600"></div>
    </div>

    {/* Middle Photo - Sunset scene */}
    <div className="absolute top-[6%] left-[6%] w-[75%] h-[72%] bg-white rounded-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.3)] -rotate-[4deg] overflow-hidden border-2 border-white z-10">
      <div className="w-full h-full bg-gradient-to-br from-orange-300 via-pink-400 to-purple-500"></div>
    </div>

    {/* Front Photo - Ocean/Beach scene */}
    <div className="absolute top-[12%] left-0 w-[75%] h-[72%] bg-white rounded-[3px] shadow-[0_3px_10px_rgba(0,0,0,0.35)] rotate-[2deg] overflow-hidden border-2 border-white z-20">
      <div className="w-full h-full bg-gradient-to-b from-sky-200 via-cyan-400 to-blue-600"></div>
    </div>

    {/* Magnifying Glass - The iconic Preview identifier */}
    <div className="absolute bottom-0 right-0 w-[45%] h-[45%] z-30">
      {/* Handle */}
      <div className="absolute bottom-0 right-[10%] w-[15%] h-[35%] bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-md rotate-[45deg] origin-top"></div>

      {/* Glass rim */}
      <div className="absolute top-0 right-0 w-[70%] h-[70%] rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-[0_2px_6px_rgba(0,0,0,0.4)] flex items-center justify-center">
        {/* Glass lens with reflection */}
        <div className="w-[75%] h-[75%] rounded-full bg-gradient-to-br from-white/40 via-blue-100/30 to-transparent border-2 border-white/50 relative overflow-hidden">
          {/* Lens reflection highlight */}
          <div className="absolute top-[15%] left-[15%] w-[40%] h-[40%] rounded-full bg-white/60 blur-[2px]"></div>
        </div>
      </div>
    </div>
  </div>
);

export const MacMessagesIcon = () => (
  <div className="w-full h-full relative group-hover:scale-105 transition-transform drop-shadow-lg">
    {/* Speech bubble - classic green Messages icon from OS X */}
    <div className="w-full h-full rounded-full relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      {/* Main green gradient background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6CE86C] via-[#4CD964] to-[#2FB344]"></div>

      {/* Glossy highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/5 to-transparent opacity-90 rounded-full"></div>

      {/* Speech bubble shape */}
      <div className="absolute inset-[20%] flex items-center justify-center">
        {/* Main bubble body */}
        <div className="relative w-full h-[70%]">
          <div className="absolute inset-0 bg-white rounded-[20%] shadow-[0_2px_4px_rgba(0,0,0,0.15)]"></div>

          {/* Speech bubble tail */}
          <div className="absolute -bottom-[20%] left-[15%] w-0 h-0"
               style={{
                 borderLeft: '8px solid transparent',
                 borderRight: '4px solid transparent',
                 borderTop: '10px solid white',
                 filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
               }}>
          </div>
        </div>
      </div>

      {/* Outer rim shine */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]"></div>
    </div>
  </div>
);
