'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, History, Key, FileText, Download, X, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  onSearch: (query: string) => void;
  onOpenKeys: () => void;
  onOpenHistory: () => void;
  history: Array<{ id: string; query: string }>;
}

export default function CommandPalette({
  onSearch,
  onOpenKeys,
  onOpenHistory,
  history,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items = [
    {
      id: 'search',
      title: search ? `Research: "${search}"` : 'Type a research query...',
      subtitle: 'Analyze web and synthesize data',
      icon: Search,
      action: () => {
        if (search) {
          onSearch(search);
          setIsOpen(false);
          setSearch('');
        }
      },
    },
    {
      id: 'keys',
      title: 'Configure OpenAI API Key',
      subtitle: 'Add custom credentials for live mode',
      icon: Key,
      action: () => {
        onOpenKeys();
        setIsOpen(false);
      },
    },
    {
      id: 'history',
      title: 'View Saved Research History',
      subtitle: 'Browse previous queries and reports',
      icon: History,
      action: () => {
        onOpenHistory();
        setIsOpen(false);
      },
    },
    ...history.slice(0, 3).map((h) => ({
      id: `history-${h.id}`,
      title: h.query,
      subtitle: 'Previous research report',
      icon: Compass,
      action: () => {
        onSearch(h.query);
        setIsOpen(false);
      },
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selectedIndex]?.action();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Visual Indicator trigger floating on landing page */}
      <div className="hidden md:flex fixed bottom-5 right-5 items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 glass text-xs text-slate-400 select-none shadow-xl pointer-events-none">
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono border border-white/10">⌘</kbd>
        <span>+</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono border border-white/10">K</kbd>
        <span>to search</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-w-xl overflow-hidden glass rounded-2xl border border-white/15 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 px-4 border-b border-white/10">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask any research question..."
                  className="w-full py-4 bg-transparent outline-none text-slate-100 placeholder-slate-500 text-base"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2 max-h-[350px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    No options found
                  </div>
                ) : (
                  items.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          item.action();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30'
                            : 'border border-transparent hover:bg-white/5'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] text-slate-500 bg-white/10 px-2 py-0.5 rounded border border-white/5 font-mono">
                            ENTER
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
