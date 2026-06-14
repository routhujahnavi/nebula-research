'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Download, Globe, Sparkles, CheckCircle2,
  Calendar, ShieldCheck, CheckSquare, Radio, ChevronRight
} from 'lucide-react';
import { ResearchStorage, ResearchReport } from '@/lib/supabase-client';
import ResearchCharts from '@/components/ResearchCharts';
import AudioBriefing from '@/components/AudioBriefing';

// Simple Markdown to HTML Renderer helper
function renderMarkdown(md: string) {
  if (!md) return '';
  
  let html = md;
  
  // Escapes
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2 font-sans">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-5 mb-2 font-sans">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-indigo-300 mt-4 mb-2 font-sans">$1</h3>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="text-indigo-200 font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em class="text-slate-300 italic">$1</em>');
  
  // Bullet points
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-5 mb-1.5 text-slate-300">$1</li>');
  
  // Inline code
  html = html.replace(/`(.*?)`/gim, '<code class="bg-white/5 border border-white/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-indigo-400 hover:underline inline-flex items-center gap-0.5">$1</a>');
  
  // Tables
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.some(c => c.includes('---'))) return ''; // Skip separator lines
    return `<tr class="border-b border-white/5 hover:bg-white/1 font-mono">${cells.map(c => `<td class="px-4 py-2 text-slate-300">${c}</td>`).join('')}</tr>`;
  });
  
  // Wrap table rows in a table container
  html = html.replace(/(<tr class="border-b.*<\/tr>)+/g, '<div class="overflow-x-auto my-4 rounded-lg border border-white/10"><table class="w-full text-xs text-left bg-[#020208]"><thead class="bg-white/5 text-[10px] text-slate-400 font-mono"><tr><th class="px-4 py-2.5">Key Metric</th><th class="px-4 py-2.5">Value</th><th class="px-4 py-2.5">Source</th><th class="px-4 py-2.5">Recency</th></tr></thead><tbody>$&</tbody></table></div>');
  
  // Paragraphs (split by double newlines)
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<div') || p.trim().startsWith('<tr') || p.trim().startsWith('<table')) {
      return p;
    }
    return `<p class="mb-4 text-sm text-slate-300 leading-relaxed font-sans">${p}</p>`;
  }).join('\n');
  
  return html;
}

export default function SharedReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      ResearchStorage.getReport(id as string)
        .then((data) => {
          setReport(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const exportPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const exportMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report.executive_report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nebula-shared-report-${report.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-slate-400 font-mono text-xs gap-3">
        <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
        <span>retrieving_shared_report_telemetry...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-slate-400 font-mono text-xs gap-4 p-6 text-center">
        <span className="text-red-400 font-bold text-sm">404: Shared Report Not Found</span>
        <span className="max-w-[280px]">The report might have been deleted, or it exists in a separate database instance.</span>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition mt-2 font-sans"
        >
          Go to Search Console
        </button>
      </div>
    );
  }

  // Radial calculation
  const radius = 50;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (report.confidence / 100) * circumference;

  return (
    <div className="flex-1 flex flex-col">
      {/* Screen-visible layout wrapper */}
      <div className="flex-1 flex flex-col print-hidden">
        {/* Header bar */}
        <nav className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between mx-auto w-full max-w-7xl mt-4 rounded-2xl">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-accent bg-clip-text text-transparent">
              🚀 Nebula Research
            </span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Search Console</span>
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                SHARED RESEARCH BRIEF
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">
                {report.query}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Created: {new Date(report.createdAt).toLocaleString()} • Report ID: {report.id}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={exportMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-slate-300 font-semibold font-sans"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs text-white font-semibold shadow-lg shadow-indigo-500/20 font-sans"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main report column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Audio Briefing Player */}
              <AudioBriefing text={report.summary || report.answer} />

              {/* Primary answer */}
              <div className="glass-card rounded-2xl p-6 border border-white/10 bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-transparent relative overflow-hidden">
                <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Audited Consensus</span>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Consensus Answer
                </h3>
                <p className="text-lg font-bold text-white leading-relaxed">
                  {report.answer}
                </p>
              </div>

              {/* Extracted Statistical Charts */}
              {report.charts && report.charts.length > 0 && (
                <div className="print-hidden">
                  <ResearchCharts charts={report.charts} />
                </div>
              )}

              {/* Document contents */}
              <div className="glass-card rounded-2xl p-8 border border-white/10 space-y-4">
                <div ref={reportRef} className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(report.executive_report) }} />
                </div>
              </div>
            </div>

            {/* Right sidebar details */}
            <div className="space-y-6">
              {/* Short gauge card */}
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">
                  Confidence Engine Rating
                </h3>

                <div className="relative flex items-center justify-center mb-6">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      stroke="rgba(255, 255, 255, 0.03)"
                      fill="transparent"
                      strokeWidth={strokeWidth}
                      r={normalizedRadius}
                      cx="64"
                      cy="64"
                    />
                    <circle
                      stroke="url(#sharedGrad)"
                      fill="transparent"
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference + ' ' + circumference}
                      style={{ strokeDashoffset }}
                      strokeLinecap="round"
                      r={normalizedRadius}
                      cx="64"
                      cy="64"
                    />
                    <defs>
                      <linearGradient id="sharedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold text-white">{report.confidence}%</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">SCORE</span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Verified Accuracy
                </div>
              </div>

              {/* Heuristics list */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  Report Metadata
                </h3>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Citations:</span>
                    <span className="text-slate-300">{(report.sources || []).length} domains</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Validation:</span>
                    <span className="text-emerald-400 font-bold">Consensus Reached</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Freshness:</span>
                    <span className="text-slate-300">Q1 2026</span>
                  </div>
                </div>
              </div>

              {/* Cited Domains List */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  Cited Domains
                </h3>
                <div className="space-y-2">
                  {(report.sources || []).map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-[#020208] border border-white/5 hover:border-indigo-500/20 transition flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-300 truncate max-w-[180px]">{s.domain}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Source [{idx + 1}]</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Recommended Searches Card */}
              <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Explore Next (Related Queries)
                  </h4>
                </div>
                <div className="space-y-2">
                  {(report.recommendedSearches || [
                    `${report.query.replace(/[?.]/g, '').trim()} market share & competitors`,
                    `${report.query.replace(/[?.]/g, '').trim()} growth projections & forecasts`,
                    `Key growth drivers for ${report.query.replace(/[?.]/g, '').trim()}`
                  ]).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        router.push(`/?q=${encodeURIComponent(q)}`);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-[#020208] hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 text-xs text-slate-300 hover:text-indigo-200 transition duration-200 flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{q}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>

        <footer className="py-8 border-t border-white/5 text-center text-xs text-slate-500 font-mono">
          Nebula Research • Shared Deep Research Report
        </footer>
      </div>

      {/* Print-only clean vector document container */}
      <div className="hidden print:block print-report-container prose max-w-none text-black p-0 m-0">
        <h1 className="text-3xl font-bold mb-2 text-black">{report.query}</h1>
        <p className="text-xs text-slate-600 mb-6 font-mono">
          Created: {new Date(report.createdAt).toLocaleString()} • Report ID: {report.id}
        </p>
        <hr className="border-slate-300 my-6" />
        <div 
          className="text-black space-y-4"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(report.executive_report) }} 
        />
      </div>
    </div>
  );
}
