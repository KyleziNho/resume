'use client';

import React from 'react';
import Image from 'next/image';
import { AppData } from './AppStore';
import { ExternalLink, Globe } from 'lucide-react';
import { haptic } from 'ios-haptics';

interface AppDetailProps {
  app: AppData;
}

export default function AppDetail({ app }: AppDetailProps) {
  return (
    <div
      className="h-full flex flex-col font-sans select-none overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 100%)',
      }}
    >
      {/* Pinstripe Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2px)',
        }}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* App Header */}
        <div className="flex items-start gap-4">
          {/* App Icon */}
          <div
            className="w-20 h-20 rounded-[16px] overflow-hidden shrink-0"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)',
            }}
          >
            <Image
              src={`${app.icon}?v=2`}
              alt={app.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
            {/* Icon glossy overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.05) 100%)',
              }}
            />
          </div>

          {/* App Info */}
          <div className="flex-1">
            <h1
              className="text-xl font-bold mb-0.5"
              style={{
                color: '#333',
                textShadow: '0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              {app.name}
            </h1>
            <p className="text-sm text-gray-600 mb-2">{app.tagline}</p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* App Store / Project Button */}
              <a
                href={app.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => haptic()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #6cb4f5 0%, #3d9df5 30%, #1a7de8 70%, #1565c0 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.2)',
                  textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                }}
              >
                <ExternalLink size={12} />
                <span>{app.stage === 'Live on App Store' ? 'App Store' : 'View'}</span>
              </a>

              {/* Website Button - only show if website exists */}
              {app.website && (
                <a
                  href={app.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => haptic()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #7ed97e 0%, #5bc95b 30%, #3ab53a 70%, #2a9d2a 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.2)',
                    textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                  }}
                >
                  <Globe size={12} />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Screenshots Carousel - horizontal scroll */}
        {app.images.length > 0 && (
          <div className="-mx-4">
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
              {app.images.map((image, index) => (
                <div
                  key={index}
                  className="shrink-0 snap-start rounded-xl overflow-hidden"
                  style={{
                    height: '220px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <Image
                    src={`${image}?v=2`}
                    alt={`${app.name} screenshot ${index + 1}`}
                    width={110}
                    height={220}
                    className="h-full w-auto object-contain"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Section */}
        <div
          className="p-3 rounded-lg border border-[#aaa]"
          style={{
            background: 'linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            className="text-sm font-bold mb-2"
            style={{
              color: '#333',
              textShadow: '0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            About
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            {app.description}
          </p>
        </div>

        {/* Progress Section */}
        <div
          className="p-3 rounded-lg border border-[#aaa]"
          style={{
            background: 'linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-sm font-bold"
              style={{
                color: '#333',
                textShadow: '0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              Progress
            </h2>
            <span className="text-xs font-semibold text-gray-600">
              {app.progress}%
            </span>
          </div>

          {/* Aqua Progress Bar */}
          <div
            className="h-4 rounded-full overflow-hidden relative mb-3"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #3d3d3d 20%, #2a2a2a 80%, #1a1a1a 100%)',
              boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.6), inset 0 -1px 2px rgba(255,255,255,0.1), 0 1px 4px rgba(0,0,0,0.3)',
              border: '1px solid #0a0a0a',
            }}
          >
            {/* Progress Fill - Aqua Blue Gel */}
            <div
              className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{
                width: `${app.progress}%`,
                background: 'linear-gradient(180deg, #6cb4f5 0%, #3d9df5 25%, #1a7de8 50%, #1565c0 75%, #0d47a1 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {/* Glossy Shine Overlay */}
              <div
                className="absolute inset-x-0 top-0 h-1/2 rounded-t-full"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)',
                }}
              />
            </div>
          </div>

          {/* Progress Notes */}
          {app.progressNotes && (
            <p className="text-xs text-gray-700 leading-relaxed">
              {app.progressNotes}
            </p>
          )}
        </div>

        {/* Technologies Section */}
        <div
          className="p-3 rounded-lg border border-[#aaa]"
          style={{
            background: 'linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            className="text-sm font-bold mb-2"
            style={{
              color: '#333',
              textShadow: '0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            Technologies
          </h2>
          <div className="flex flex-wrap gap-2">
            {app.technologies.map((tech) => (
              <div
                key={tech}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  background: 'linear-gradient(180deg, #d8d8d8 0%, #c0c0c0 100%)',
                  color: '#333',
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.2)',
                  border: '1px solid #999',
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
