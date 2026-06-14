'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioBriefingProps {
  text: string;
}

export default function AudioBriefing({ text }: AudioBriefingProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices asynchronously
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English voices for consistency
      const enVoices = allVoices.filter((v) => v.lang.startsWith('en'));
      setVoices(enVoices);

      // Default to a premium sounding voice like Google US English or Samantha if available
      const defaultVoice =
        enVoices.find((v) => v.name.includes('Google') && v.lang === 'en-US') ||
        enVoices.find((v) => v.name.includes('Natural')) ||
        enVoices.find((v) => v.name.includes('Samantha')) ||
        enVoices[0];

      if (defaultVoice) {
        setSelectedVoiceName(defaultVoice.name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      // Start fresh utterance
      window.speechSynthesis.cancel();

      // Clean markdown tags or citations like [1] from text
      const cleanText = text
        .replace(/\[\d+\]/g, '') // remove citation numbers
        .replace(/[*#_\-`]/g, '') // remove markdown symbols
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = voices.find((v) => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // 8 visual equalizer bars with staggered animations
  const barCustoms = [1, 2, 3, 4, 3, 2, 4, 1];

  const equalizerVariants = {
    animate: (i: number) => ({
      scaleY: [0.3, 1, 0.4, 0.9, 0.3],
      transition: {
        duration: 0.8 + i * 0.15,
        repeat: Infinity,
        repeatType: 'reverse' as const,
        ease: 'easeInOut',
      },
    }),
    idle: {
      scaleY: 0.2,
      transition: { duration: 0.3 },
    },
  };

  if (voices.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-visible shadow-lg bg-slate-900/60 backdrop-blur-md">
      {/* Voice Selection & Details */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-indigo-400 font-mono tracking-wider font-bold block">
            AI AUDIO BRIEFING
          </span>
          <div className="flex items-center gap-2">
            <select
              value={selectedVoiceName}
              onChange={(e) => setSelectedVoiceName(e.target.value)}
              className="bg-slate-950/70 border border-white/10 text-slate-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/40 cursor-pointer pr-8 appearance-none relative select-arrow"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {voices.map((v, idx) => (
                <option key={`${v.name}-${v.lang}-${idx}`} value={v.name}>
                  {v.name.replace(/Microsoft|Google|Apple/g, '').trim()} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equalizer Visualizer & Controls */}
      <div className="flex items-center gap-5 justify-between md:justify-end">
        {/* Animated Waveform Equalizer */}
        <div className="flex items-end gap-[3px] h-6 w-24 px-2.5 overflow-hidden">
          {barCustoms.map((custom, idx) => (
            <motion.div
              key={idx}
              custom={custom}
              variants={equalizerVariants}
              animate={isPlaying && !isPaused ? 'animate' : 'idle'}
              initial="idle"
              className="w-[3px] h-full rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 origin-bottom"
              style={{
                boxShadow: isPlaying && !isPaused ? '0 0 6px rgba(99, 102, 241, 0.4)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border cursor-pointer select-none transition-all duration-200 ${
              isPlaying && !isPaused
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
            }`}
          >
            {isPlaying && !isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Listen</span>
              </>
            )}
          </button>

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-white/5 cursor-pointer transition-colors"
              title="Stop playback"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
