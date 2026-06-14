'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Link as LinkIcon, BadgePercent, Quote, Eye, Plus } from 'lucide-react';

interface EvidenceCardProps {
  id: string;
  title: string;
  claim: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  citationIndex: number;
  screenshotUrl?: string;
  onViewScreenshot?: (url: string) => void;
  // Drag-and-drop support: optional callback when card is dragged/dropped
  onDragStart?: (e: React.DragEvent, data: any) => void;
  onClip?: (card: any) => void;
}

export default function EvidenceCard({
  id,
  title,
  claim,
  sourceUrl,
  sourceTitle,
  confidence,
  citationIndex,
  screenshotUrl,
  onViewScreenshot,
  onDragStart,
  onClip,
}: EvidenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract domain name
  let domain = '';
  try {
    domain = new URL(sourceUrl).hostname;
  } catch {}

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, { id, title, claim, sourceUrl, sourceTitle, citationIndex });
    }
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      className={onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}
    >
      <motion.div
        layout
        className="glass-card rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-md overflow-hidden"
      >
      <div className="p-4 flex flex-col justify-between h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-400">
              [{citationIndex}]
            </span>
            <span className="text-xs font-semibold text-slate-300 truncate font-mono">
              {domain}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <BadgePercent className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">{confidence}%</span>
          </div>
        </div>

        {/* Claim / Fact */}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-100 line-clamp-3 leading-relaxed">
            {claim}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center justify-between border-t border-white/5 mt-4 pt-3">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <LinkIcon className="w-3 h-3" />
            <span className="truncate max-w-[120px]">Visit Source</span>
          </a>

          <div className="flex items-center gap-1">
            {screenshotUrl && onViewScreenshot && (
              <button
                onClick={() => onViewScreenshot(screenshotUrl)}
                className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 transition"
                title="View Screenshot"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            {onClip && (
              <button
                onClick={() => onClip({ id, title, claim, sourceUrl, sourceTitle, citationIndex })}
                className="p-1 rounded-md hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 transition"
                title="Clip to Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 transition"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 bg-white/2"
          >
            <div className="p-4 space-y-3.5 text-xs text-slate-400 leading-relaxed font-mono">
              <div className="flex gap-2">
                <Quote className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-300 block mb-1">
                    Clipped Excerpt
                  </span>
                  <span>{claim}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Source Title</span>
                <span className="text-slate-400">{sourceTitle}</span>
              </div>

              {onDragStart && (
                <div className="text-[10px] text-indigo-300/60 mt-1 italic text-center">
                  💡 Drag this card into the workspace sandbox to build notes.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
