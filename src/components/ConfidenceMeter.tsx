'use client';

import React from 'react';
import { ShieldCheck, Calendar, Radio, CheckSquare } from 'lucide-react';

interface ConfidenceMeterProps {
  score: number;
  sourcesCount: number;
  freshness: string;
}

export default function ConfidenceMeter({
  score,
  sourcesCount,
  freshness,
}: ConfidenceMeterProps) {
  // SVG Calculations for Circle
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine qualitative tier
  let tier = 'High Reliability';
  let colorClass = 'text-emerald-400';
  let bgGradient = 'from-emerald-500/10 to-cyan-500/10';
  let strokeColor = 'url(#confidenceGrad)';

  if (score < 70) {
    tier = 'Low Reliability';
    colorClass = 'text-amber-500';
    bgGradient = 'from-amber-500/10 to-orange-500/10';
    strokeColor = '#f59e0b';
  } else if (score < 90) {
    tier = 'Moderate Reliability';
    colorClass = 'text-indigo-400';
    bgGradient = 'from-indigo-500/10 to-cyan-500/10';
  }

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="flex flex-col items-center text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Confidence Engine Rating
        </h3>

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-40 h-40 transform -rotate-90">
            <defs>
              <linearGradient id="confidenceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Background circle */}
            <circle
              stroke="rgba(255, 255, 255, 0.03)"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx="80"
              cy="80"
            />
            {/* Progress circle */}
            <circle
              stroke={strokeColor}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="80"
              cy="80"
              className="drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            />
          </svg>

          {/* Absolute Center text */}
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {score}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              ACCURACY
            </span>
          </div>
        </div>

        {/* Qualitative Info */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 ${colorClass}`}>
          {tier}
        </div>
      </div>

      {/* Breakdown Factors */}
      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Citations</h4>
            <p className="text-xs text-slate-400 mt-0.5">{sourcesCount} Verified Sources</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Freshness</h4>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[100px]">{freshness}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Cross-Ref</h4>
            <p className="text-xs text-slate-400 mt-0.5">Dual-Validated</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Methodology</h4>
            <p className="text-xs text-slate-400 mt-0.5">Deep Research</p>
          </div>
        </div>
      </div>
    </div>
  );
}
