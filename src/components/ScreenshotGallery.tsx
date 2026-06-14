'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Camera, ZoomIn, X, ExternalLink } from 'lucide-react';

interface Screenshot {
  url: string;
  screenshotUrl: string;
  title: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  images: string[];
}

export default function ScreenshotGallery({
  screenshots,
  images,
}: ScreenshotGalleryProps) {
  const [activeMedia, setActiveMedia] = useState<{ type: 'screenshot' | 'image'; url: string; title?: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Screenshots Section */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Source Webpage Screenshots</h3>
          </div>

          <div className="flex-1 overflow-x-auto flex gap-4 pb-2 scrollbar-thin">
            {screenshots.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-slate-500 text-xs italic">
                No screenshots captured for this report
              </div>
            ) : (
              screenshots.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveMedia({ type: 'screenshot', url: s.screenshotUrl, title: s.title })}
                  className="w-48 flex-shrink-0 group cursor-pointer relative overflow-hidden rounded-xl border border-white/10 bg-black/40 hover:border-indigo-500/40 transition"
                >
                  <div className="aspect-video w-full relative overflow-hidden bg-slate-900 border-b border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.screenshotUrl}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="p-3 text-[10px] text-slate-400 font-mono truncate">
                    {s.title}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Extracted Images Section */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Extracted Image Assets</h3>
          </div>

          <div className="flex-1 overflow-x-auto flex gap-4 pb-2 scrollbar-thin">
            {images.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-slate-500 text-xs italic">
                No images extracted from sources
              </div>
            ) : (
              images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveMedia({ type: 'image', url: imgUrl })}
                  className="w-40 flex-shrink-0 group cursor-pointer relative overflow-hidden rounded-xl border border-white/10 bg-black/40 hover:border-indigo-500/40 transition"
                >
                  <div className="aspect-square w-full relative overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt="Extracted media"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Expanded Media Modal overlay */}
      <AnimatePresence>
        {activeMedia && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMedia(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden glass rounded-2xl border border-white/15 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {activeMedia.type === 'screenshot' ? 'Webpage Capture' : 'Extracted Media Asset'}
                  </h4>
                  {activeMedia.title && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{activeMedia.title}</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveMedia(null)}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#010103]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeMedia.url}
                  alt="Expanded view"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-white/5"
                />
              </div>

              <div className="px-5 py-4 border-t border-white/10 bg-white/2 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono truncate max-w-[400px]">URL: {activeMedia.url}</span>
                <a
                  href={activeMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold font-mono"
                >
                  <span>Open raw link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
