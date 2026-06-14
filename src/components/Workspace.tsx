'use client';

import React, { useState } from 'react';
import { FileText, ClipboardList, Trash2, ArrowUpRight, BookOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkspaceCard {
  id: string;
  title: string;
  claim: string;
  sourceUrl: string;
  sourceTitle: string;
  citationIndex: number;
}

interface WorkspaceProps {
  evidence?: Array<{
    id: string;
    claim: string;
    sourceUrl: string;
    sourceTitle: string;
    confidence: number;
    citationIndex?: number;
  }>;
  clippedCards: WorkspaceCard[];
  onDropCard: (card: WorkspaceCard) => void;
  onRemoveCard: (id: string) => void;
  notes: string;
  onNotesChange: (text: string) => void;
}

export default function Workspace({
  evidence = [],
  clippedCards = [],
  onDropCard,
  onRemoveCard,
  notes = '',
  onNotesChange,
}: WorkspaceProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      
      const cardData = JSON.parse(dataStr) as WorkspaceCard;
      onDropCard(cardData);
    } catch (err) {
      console.error('Failed to parse dropped card data:', err);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[550px]">
      
      {/* COLUMN 1: Source Evidence Feed */}
      <div className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200 font-sans">Extracted Evidence Feed</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">live_facts</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {evidence.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic py-8">
              No evidence points available.
            </div>
          ) : (
            evidence.map((ev, idx) => {
              const citIndex = ev.citationIndex || (idx + 1);
              const isAlreadyClipped = clippedCards.some(c => c.id === ev.id);
              
              return (
                <div
                  key={ev.id}
                  draggable={!isAlreadyClipped}
                  onDragStart={(e) => {
                    const dragInfo = {
                      id: ev.id,
                      title: ev.sourceTitle,
                      claim: ev.claim,
                      sourceUrl: ev.sourceUrl,
                      sourceTitle: ev.sourceTitle,
                      citationIndex: citIndex
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(dragInfo));
                  }}
                  className={`p-3 rounded-xl border transition-all text-xs font-mono relative group ${
                    isAlreadyClipped
                      ? 'bg-emerald-500/5 border-emerald-500/10 opacity-50'
                      : 'bg-white/2 border-white/5 hover:border-white/12 cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-bold text-indigo-400">
                      [{citIndex}]
                    </span>
                    
                    <p className="flex-1 text-[11px] leading-relaxed text-slate-300">
                      {ev.claim}
                    </p>

                    <button
                      disabled={isAlreadyClipped}
                      onClick={() => onDropCard({
                        id: ev.id,
                        title: ev.sourceTitle,
                        claim: ev.claim,
                        sourceUrl: ev.sourceUrl,
                        sourceTitle: ev.sourceTitle,
                        citationIndex: citIndex
                      })}
                      className={`p-1.5 rounded transition shrink-0 ${
                        isAlreadyClipped
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                      }`}
                      title={isAlreadyClipped ? "Already Clipped" : "Clip to Sandbox"}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Drag & Drop Clipping Sandbox */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-card rounded-2xl p-6 flex flex-col transition-all border h-full ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.15)] scale-[1.01]'
            : 'border-white/10'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200 font-sans">Clipped Sandbox</h3>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
            {clippedCards.length} Clips
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {clippedCards.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 border border-dashed border-white/5 rounded-xl">
              <ClipboardList className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">Sandbox is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Drag evidence cards here OR click the &quot;+&quot; button in the feed to collect facts.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {clippedCards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/8 flex gap-3 group relative hover:border-white/15 transition-all"
                >
                  <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-bold text-indigo-400 font-mono">
                    [{card.citationIndex}]
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 leading-relaxed font-mono">
                      {card.claim}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block font-mono truncate max-w-[280px]">
                      Source: {card.sourceTitle}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onRemoveCard(card.id)}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Remove Clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={card.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition flex items-center justify-center"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* COLUMN 3: Synthesis Notepad */}
      <div className="glass-card rounded-2xl p-6 flex flex-col border border-white/10 h-full">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200 font-sans">Synthesis Notepad</h3>
        </div>

        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="# Draft your synthesized report here...

Use this playground to outline findings, merge estimates, and write down final numbers. All changes are saved automatically."
          className="flex-1 w-full bg-transparent resize-none outline-none text-slate-200 placeholder-slate-600 text-xs font-mono leading-relaxed"
        />

        <div className="border-t border-white/5 mt-4 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Format: GitHub Markdown</span>
          <span className="animate-pulse text-indigo-400">● Autosaved</span>
        </div>
      </div>
    </div>
  );
}
