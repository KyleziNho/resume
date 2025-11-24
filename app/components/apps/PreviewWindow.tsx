import React, { useState } from 'react';
import { ExternalLink, Share, ZoomIn, ZoomOut, Sidebar, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  date: string;
  size: string;
  tech: string[];
  desc: string;
  images: string[];
  link: string;
  color: string;
}

interface PreviewWindowProps {
  project: Project | null;
}

export default function PreviewWindow({ project }: PreviewWindowProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showInspector, setShowInspector] = useState(true);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full bg-[#e8e8e8]">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-sm font-medium">No document selected</p>
        </div>
      </div>
    );
  }

  const totalImages = project.images.length;

  return (
    <div className="flex flex-col h-full bg-[#e8e8e8] text-[#1d1d1f]">

      {/* Authentic macOS Preview Toolbar */}
      <div className="h-[52px] bg-[#ececec] border-b border-[#c8c8c8] flex items-center px-3 gap-3 shadow-sm">

        {/* Left Controls */}
        <div className="flex items-center gap-2">
          {/* Thumbnail Sidebar Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded hover:bg-[#d5d5d5] transition-colors ${showThumbnails ? 'bg-[#d0d0d0]' : ''}`}
            title="Show Thumbnails"
          >
            <Sidebar size={16} className="text-gray-700" />
          </button>

          <div className="w-[1px] h-6 bg-[#d0d0d0]"></div>

          {/* Navigation Arrows */}
          <div className="flex">
            <button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              className="p-1.5 rounded-l hover:bg-[#d5d5d5] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} className="text-gray-700" />
            </button>
            <button
              onClick={() => setCurrentImageIndex(Math.min(totalImages - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === totalImages - 1}
              className="p-1.5 rounded-r hover:bg-[#d5d5d5] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} className="text-gray-700" />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-[#d0d0d0]"></div>

          {/* Zoom Controls */}
          <div className="flex bg-white rounded border border-[#c0c0c0]">
            <button className="p-1.5 hover:bg-gray-50 border-r border-[#e0e0e0]">
              <ZoomOut size={14} className="text-gray-600" />
            </button>
            <button className="px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-50 border-r border-[#e0e0e0] min-w-[60px]">
              100%
            </button>
            <button className="p-1.5 hover:bg-gray-50">
              <ZoomIn size={14} className="text-gray-600" />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-[#d0d0d0]"></div>

          {/* Rotate */}
          <button className="p-1.5 rounded hover:bg-[#d5d5d5]">
            <RotateCw size={15} className="text-gray-700" />
          </button>
        </div>

        {/* Center - Page Indicator */}
        <div className="flex-1 flex justify-center">
          <span className="text-[11px] font-medium text-gray-600">
            {currentImageIndex + 1} of {totalImages}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#d5d5d5] rounded text-[11px] font-medium text-gray-700">
            <Share size={13} />
            Share
          </button>

          <div className="w-[1px] h-6 bg-[#d0d0d0]"></div>

          {/* Inspector Toggle */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${showInspector ? 'bg-[#d0d0d0] text-gray-800' : 'text-gray-600 hover:bg-[#d5d5d5]'}`}
          >
            Info
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Thumbnail Sidebar */}
        {showThumbnails && (
          <div className="w-[140px] bg-[#f5f5f5] border-r border-[#d0d0d0] overflow-y-auto">
            <div className="p-2 space-y-2">
              {project.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative cursor-pointer rounded overflow-hidden transition-all ${
                    currentImageIndex === idx
                      ? 'ring-3 ring-blue-500 shadow-lg'
                      : 'hover:ring-2 hover:ring-gray-400'
                  }`}
                >
                  {/* Thumbnail - showing project color as placeholder */}
                  <div className="aspect-[3/4] bg-white border border-gray-300 flex items-center justify-center relative">
                    <div className={`absolute inset-0 ${project.color} opacity-30`}></div>
                    <span className="text-2xl opacity-60">📸</span>
                    {/* In real implementation, you'd use: <img src={img} alt="" className="w-full h-full object-cover" /> */}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center Canvas - Image Display */}
        <div className="flex-1 bg-[#e8e8e8] flex items-center justify-center p-8 overflow-auto">
          {/* The displayed image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <div className="bg-white shadow-2xl border border-gray-300 rounded-sm overflow-hidden">
              {/* Image Display Area - using project color as placeholder */}
              <div className="relative" style={{ minWidth: '400px', minHeight: '500px' }}>
                <div className={`absolute inset-0 ${project.color} opacity-20`}></div>
                <div className="relative flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-7xl mb-4">🖼️</div>
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Screenshot {currentImageIndex + 1}</p>
                  </div>
                </div>
                {/* In real implementation with actual images:
                <img
                  src={project.images[currentImageIndex]}
                  alt={`${project.title} - Screenshot ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                /> */}
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel */}
        {showInspector && (
          <div className="w-[260px] bg-[#f9f9f9] border-l border-[#d0d0d0] flex flex-col overflow-y-auto">

            {/* Document Info Header */}
            <div className="p-4 border-b border-[#e5e5e5] bg-white">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {project.category === 'Mobile App' ? '📱' : project.category === 'Web Platform' ? '🌐' : '🗺️'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{project.title}</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-medium mt-0.5">{project.category}</p>
                </div>
              </div>
            </div>

            {/* More Info Section */}
            <div className="flex-1 overflow-y-auto">

              {/* General Info */}
              <div className="px-4 py-3 border-b border-[#e5e5e5]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">General</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kind:</span>
                    <span className="font-medium text-gray-800">Portfolio Project</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium text-gray-800">{project.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-800">{project.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Images:</span>
                    <span className="font-medium text-gray-800">{totalImages}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 py-3 border-b border-[#e5e5e5]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Description</h4>
                <p className="text-[11px] leading-relaxed text-gray-700">
                  {project.desc}
                </p>
              </div>

              {/* Tech Stack */}
              <div className="px-4 py-3 border-b border-[#e5e5e5]">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Technologies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-white border border-gray-300 text-gray-700 text-[10px] rounded shadow-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Button */}
            <div className="p-3 bg-white border-t border-[#e5e5e5]">
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#007AFF] hover:bg-[#0051D5] text-white py-2 rounded-md text-[11px] font-semibold shadow-sm transition-colors"
              >
                View on GitHub
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
