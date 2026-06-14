'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, PlayCircle, AlertTriangle, Circle } from 'lucide-react';

interface TimelineStep {
  number: number;
  label: string;
  description: string;
}

interface ReasoningTimelineProps {
  currentStep: number;
  stepStatus: 'idle' | 'active' | 'completed' | 'error';
  logs: Array<{ step: number; status: string; message: string; timestamp: number }>;
}

const PIPELINE_STEPS: TimelineStep[] = [
  { number: 1, label: 'Query Analysis', description: 'Evaluate intent, entities, and temporal context of query' },
  { number: 2, label: 'Search Plan Formulation', description: 'Formulate search terms, analysts, reports, and target domains' },
  { number: 3, label: 'Web Search Execution', description: 'Execute searches in parallel via Context.dev API' },
  { number: 4, label: 'Crawl & Media Scraping', description: 'Retrieve brand details, download markdown, capture screenshots' },
  { number: 5, label: 'Fact Extraction', description: 'Isolate statistics, dates, numerical values, and source claims' },
  { number: 6, label: 'Cross-Referencing', description: 'Group matching findings and map sources to statements' },
  { number: 7, label: 'Conflict Detection', description: 'Isolate discrepancies, estimate variance, and identify delta bias' },
  { number: 8, label: 'Consensus Synthesis', description: 'Build mathematical and qualitative agreement structures' },
  { number: 9, label: 'Confidence Score Engine', description: 'Evaluate source authority, consensus ratio, and freshness index' },
  { number: 10, label: 'Finalizing Report', description: 'Compile markdown report with citations, charts, and media log' },
];

export default function ReasoningTimeline({
  currentStep,
  stepStatus,
  logs,
}: ReasoningTimelineProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">AI Reasoning Engine</h3>
          <p className="text-xs text-slate-400 mt-0.5">Streaming pipeline telemetry and data-points</p>
        </div>
        {stepStatus === 'active' && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing Step {currentStep}/10</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline Progress */}
        <div className="space-y-3">
          {PIPELINE_STEPS.map((step) => {
            const isCompleted = step.number < currentStep || (step.number === currentStep && stepStatus === 'completed');
            const isActive = step.number === currentStep && stepStatus === 'active';
            const isError = step.number === currentStep && stepStatus === 'error';
            const isPending = step.number > currentStep;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: step.number * 0.05 }}
                className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/10 to-transparent border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                    : isCompleted
                    ? 'bg-transparent border-white/5 opacity-80'
                    : isError
                    ? 'bg-red-500/5 border-red-500/30 text-red-200'
                    : 'bg-transparent border-transparent opacity-40'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : isError ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${isActive ? 'text-indigo-300' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                      Step {step.number}: {step.label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live Stream Terminal */}
        <div className="flex flex-col h-[480px] rounded-xl border border-white/10 bg-[#020208] overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/5">
            <span className="text-slate-400 font-medium">telemetry_feed.log</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500">LIVE</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">awaiting_query_initialization...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-indigo-400 shrink-0 select-none">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                  </span>
                  <span className="text-emerald-400 shrink-0 select-none">sys:</span>
                  <span className={log.status === 'error' ? 'text-red-400' : 'text-slate-300'}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
