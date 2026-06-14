'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Settings, History, Send, Loader2, Sparkles, 
  ArrowLeft, Download, Share2, Globe, CheckCircle2, ChevronRight,
  TrendingUp, Key, Cpu, HelpCircle, Network
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Component imports
import CommandPalette from '@/components/CommandPalette';
import ReasoningTimeline from '@/components/ReasoningTimeline';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import SourceGraph from '@/components/SourceGraph';
import EvidenceCard from '@/components/EvidenceCard';
import Workspace from '@/components/Workspace';
import ScreenshotGallery from '@/components/ScreenshotGallery';
import ResearchCharts from '@/components/ResearchCharts';
import AudioBriefing from '@/components/AudioBriefing';
import ShareModal from '@/components/ShareModal';

// Library imports
import { ResearchStorage, ResearchReport } from '@/lib/supabase-client';

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

export default function Home() {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatus, setStepStatus] = useState<'idle' | 'active' | 'completed' | 'error'>('idle');
  const [logs, setLogs] = useState<Array<{ step: number; status: string; message: string; timestamp: number }>>([]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; query: string; createdAt: string; confidence: number }>>([]);
  
  const [activeTab, setActiveTab] = useState<'report' | 'evidence' | 'workspace' | 'media'>('report');
  
  // API settings
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [serverHasKey, setServerHasKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Workspace state
  const [clippedCards, setClippedCards] = useState<any[]>([]);
  const [workspaceNotes, setWorkspaceNotes] = useState('');
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  // Load history & API keys & check server key config
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('nebula_openai_key') || '';
      setOpenaiApiKey(savedKey);
      
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.hasOpenaiKey) {
            setServerHasKey(true);
          }
        })
        .catch((e) => console.error('Failed to load server config:', e));

      ResearchStorage.getHistory().then((data) => {
        setHistory(data);
      });

      // Automatically trigger search if query parameter exists in URL
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get('q') || params.get('query');
      if (urlQuery) {
        // Clear parameter from address bar to prevent looping searches on reload
        window.history.replaceState({}, document.title, window.location.pathname);
        handleSearch(urlQuery);
      }
    }
  }, []);

  // Synchronize workspace contents when switching reports
  useEffect(() => {
    if (report && typeof window !== 'undefined') {
      const savedCards = localStorage.getItem(`nebula_ws_cards_${report.id}`);
      const savedNotes = localStorage.getItem(`nebula_ws_notes_${report.id}`);
      if (savedCards) setClippedCards(JSON.parse(savedCards));
      else setClippedCards([]);
      if (savedNotes) setWorkspaceNotes(savedNotes);
      else setWorkspaceNotes('');
    }
  }, [report]);

  const handleDropCard = (card: any) => {
    if (!report) return;
    if (clippedCards.some((c) => c.id === card.id)) return;
    const updated = [...clippedCards, card];
    setClippedCards(updated);
    localStorage.setItem(`nebula_ws_cards_${report.id}`, JSON.stringify(updated));
  };

  const handleRemoveClip = (id: string) => {
    if (!report) return;
    const updated = clippedCards.filter((c) => c.id !== id);
    setClippedCards(updated);
    localStorage.setItem(`nebula_ws_cards_${report.id}`, JSON.stringify(updated));
  };

  const handleNotesChange = (text: string) => {
    if (!report) return;
    setWorkspaceNotes(text);
    localStorage.setItem(`nebula_ws_notes_${report.id}`, text);
  };

  const handleSaveKey = (key: string) => {
    setOpenaiApiKey(key);
    localStorage.setItem('nebula_openai_key', key);
    setShowSettings(false);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setIsResearching(true);
    setReport(null);
    setCurrentStep(1);
    setStepStatus('active');
    setLogs([{ step: 1, status: 'active', message: 'Initializing research request...', timestamp: Date.now() }]);
    setActiveTab('report');

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openai-api-key': openaiApiKey,
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize connection: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable stream body found');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            const update = JSON.parse(dataStr);
            
            // Handle error state
            if (update.status === 'error') {
              setStepStatus('error');
              setLogs((prev) => [...prev, {
                step: update.step,
                status: 'error',
                message: update.message,
                timestamp: Date.now(),
              }]);
              setIsResearching(false);
              return;
            }

            // Normal step logs
            setLogs((prev) => [...prev, {
              step: update.step,
              status: update.status,
              message: update.message,
              timestamp: Date.now(),
            }]);

            setCurrentStep(update.step);
            setStepStatus(update.status);

            // If Step 10 compiles the report, capture final payload
            if (update.step === 10 && update.status === 'completed' && update.data) {
              const finalReport = update.data as ResearchReport;
              setReport(finalReport);
              setIsResearching(false);
              
              // Trigger confetti celebration!
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#06b6d4', '#ec4899']
              });

              // Save to database/localStorage
              await ResearchStorage.saveReport(finalReport);
              
              // Refresh History list
              const updatedHistory = await ResearchStorage.getHistory();
              setHistory(updatedHistory);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Research retrieval error:', error);
      setStepStatus('error');
      setLogs((prev) => [...prev, {
        step: currentStep,
        status: 'error',
        message: error.message || 'Network stream error.',
        timestamp: Date.now(),
      }]);
      setIsResearching(false);
    }
  };

  // Exporters
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
    link.setAttribute('download', `nebula-research-${report.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyShareLink = () => {
    if (!report) return;
    setIsShareModalOpen(true);
  };

  const trendingTopics = [
    { title: 'AirPods Global Sales', query: 'How many AirPods were sold this year?' },
    { title: 'AI Startup Valuations', query: 'Which AI startup raised the most funding in 2026?' },
    { title: 'India EV Market Size', query: 'What is the market size of electric vehicles in India?' },
    { title: 'ChatGPT Active Users', query: 'How many users does ChatGPT have?' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Command Palette */}
      <CommandPalette
        onSearch={handleSearch}
        onOpenKeys={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        history={history}
      />

      {/* Navigation Header */}
      <nav className="glass border-b border-white/5 px-6 py-4 flex items-center justify-between mx-auto w-full max-w-7xl mt-4 rounded-2xl print-hidden">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setReport(null); setIsResearching(false); }}>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-accent bg-clip-text text-transparent">
            🚀 Nebula Research
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition relative"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
            {!openaiApiKey && !serverHasKey && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Core Body Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* SEARCH PAGE STATE */}
          {!isResearching && !report && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-3xl mx-auto w-full text-center space-y-10 py-12"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                >
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </motion.div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Research Anything.<br />
                  <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-accent bg-clip-text text-transparent">
                    Discover Consolidated Truth.
                  </span>
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Multi-agent deep research crawls target pages, handles conflicts, and compiles audited consensus reports.
                </p>
              </div>

              {/* Glowing Console Search Input */}
              <div className="glass rounded-2xl border border-white/10 p-2.5 shadow-2xl relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 opacity-50 blur-xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <Search className="w-5 h-5 text-slate-500 shrink-0 ml-3" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                    placeholder="Enter target research question..."
                    className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-sm py-2"
                  />
                  <button
                    onClick={() => handleSearch(query)}
                    disabled={!query.trim()}
                    className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white disabled:opacity-40 disabled:pointer-events-none hover:opacity-95 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* API Notice */}
              {!openaiApiKey && !serverHasKey && (
                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 flex items-center justify-between max-w-lg mx-auto">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 shrink-0" />
                    <span className="text-left font-mono">Running in Simulation Mode. Configure your OpenAI Key for Live Deep Research.</span>
                  </div>
                  <button onClick={() => setShowSettings(true)} className="underline font-bold hover:text-indigo-200 ml-2">Settings</button>
                </div>
              )}

              {/* Trending list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trending Research Targets</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {trendingTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSearch(topic.query)}
                      className="p-3.5 rounded-xl glass hover:bg-white/5 border border-white/5 hover:border-white/12 cursor-pointer transition text-left flex items-center justify-between group"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate block">
                          {topic.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-mono">
                          {topic.query}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* RESEARCH RUNNING TELEMETRY TIMELINE */}
          {isResearching && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto w-full space-y-8 py-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white font-mono">Deep Research Agent Core</h2>
                <p className="text-xs text-slate-400 font-mono">Query: &quot;{query}&quot;</p>
              </div>
              <ReasoningTimeline currentStep={currentStep} stepStatus={stepStatus} logs={logs} />
            </motion.div>
          )}

          {/* REPORT VIEW DASHBOARD */}
          {report && !isResearching && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 py-4 print-hidden"
              >
                {/* Report Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="space-y-2">
                    <button
                      onClick={() => { setReport(null); setQuery(''); }}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition font-mono print-hidden"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Search Console</span>
                    </button>
                    <h2 className="text-2xl font-extrabold text-white">
                      {report.query}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Compiled: {new Date(report.createdAt).toLocaleString()} • ID: {report.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 print-hidden">
                    <button
                      onClick={exportMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-slate-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Markdown</span>
                    </button>
                    
                    <button
                      onClick={exportPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-slate-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Report</span>
                    </button>

                    <button
                      onClick={copyShareLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs text-white font-semibold shadow-lg shadow-indigo-500/20"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Report</span>
                    </button>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-2 print-hidden">
                  {[
                    { id: 'report', label: 'Consensus Report' },
                    { id: 'evidence', label: 'Evidence & Sources' },
                    { id: 'workspace', label: 'Research Workspace' },
                    { id: 'media', label: 'Captured Media' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition relative ${
                        activeTab === tab.id
                          ? 'text-white bg-white/5 border border-white/10'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-indigo-500"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* TABS VIEWPORT */}
                <div className="mt-4">
                  
                  {/* TAB 1: Consensus Report */}
                  {activeTab === 'report' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Summary and Markdown report */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Audio Briefing Player */}
                        <AudioBriefing text={report.summary || report.answer} />

                        {/* Short Answer Summary Banner */}
                        <div className="glass-card rounded-2xl p-6 border border-white/10 bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-transparent relative overflow-hidden">
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>AI Consensus Reached</span>
                          </div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Primary Answer
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

                        {/* Complete Executive Report */}
                        <div className="glass-card rounded-2xl p-8 border border-white/10 space-y-4 print-report-container">
                          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Executive Research Brief
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">report_compilation.md</span>
                          </div>

                          {/* Printable container ref */}
                          <div ref={reportRef} className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(report.executive_report) }} />
                          </div>
                        </div>
                      </div>

                      {/* Right: Confidence Gauge, Source Graph and Recommended Searches */}
                      <div className="space-y-6 print-hidden">
                        <ConfidenceMeter
                          score={report.confidence}
                          sourcesCount={(report.sources || []).length}
                          freshness="Q1 2026"
                        />
                        <SourceGraph query={report.query} sources={report.sources || []} />
                        
                        {/* Recommended Searches Card */}
                        <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
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
                                onClick={() => handleSearch(q)}
                                className="w-full text-left p-3 rounded-xl bg-white/2 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 text-xs text-slate-300 hover:text-indigo-200 transition duration-200 flex items-center justify-between group"
                              >
                                <span className="truncate pr-2">{q}</span>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Evidence & Sources */}
                  {activeTab === 'evidence' && (
                    <div className="space-y-6">
                      {/* Source Index list */}
                      <div className="glass-card rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                          <Globe className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-semibold text-slate-200">Index of Verified Sources</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(report.sources || []).map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3.5 rounded-xl bg-[#020208] border border-white/5 hover:border-indigo-500/20 transition-all flex items-start gap-3.5"
                            >
                              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded bg-white/5 border border-white/8 text-xs font-bold text-slate-400 font-mono">
                                [{idx + 1}]
                              </span>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-200 truncate">{s.title}</h4>
                                <span className="text-[10px] text-slate-500 font-mono block mt-1 truncate">{s.domain}</span>
                                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{s.description}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Evidence Cards */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-slate-300">
                            Extracted Fact Evidence Cards
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            💡 You can drag these cards into the Workspace Notepad
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(report.evidence || []).map((ev, idx) => {
                            const citationIndex = (report.sources || []).findIndex(s => s.url === ev.sourceUrl) + 1;
                            const screenshot = (report.screenshots || []).find(s => s.url === ev.sourceUrl);
                            return (
                              <EvidenceCard
                                key={ev.id}
                                id={ev.id}
                                title={ev.title}
                                claim={ev.claim}
                                sourceUrl={ev.sourceUrl}
                                sourceTitle={ev.sourceTitle}
                                confidence={ev.confidence}
                                citationIndex={citationIndex > 0 ? citationIndex : idx + 1}
                                screenshotUrl={screenshot?.screenshotUrl}
                                onViewScreenshot={(url) => setActiveTab('media')}
                                onDragStart={(e, cardInfo) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify(cardInfo));
                                }}
                                onClip={handleDropCard}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Research Workspace */}
                  {activeTab === 'workspace' && (
                    <Workspace
                      evidence={report.evidence || []}
                      clippedCards={clippedCards}
                      onDropCard={handleDropCard}
                      onRemoveCard={handleRemoveClip}
                      notes={workspaceNotes}
                      onNotesChange={handleNotesChange}
                    />
                  )}

                  {/* TAB 4: Media Gallery */}
                  {activeTab === 'media' && (
                    <ScreenshotGallery
                      screenshots={report.screenshots || []}
                      images={report.images || []}
                    />
                  )}

                </div>
              </motion.div>

              {/* Print-only clean vector document container */}
              <div className="hidden print:block print-report-container prose max-w-none text-black p-0 m-0">
                <h1 className="text-3xl font-bold mb-2 text-black">{report.query}</h1>
                <p className="text-xs text-slate-600 mb-6 font-mono">
                  Compiled: {new Date(report.createdAt).toLocaleString()} • Report ID: {report.id}
                </p>
                <hr className="border-slate-300 my-6" />
                <div 
                  className="text-black space-y-4"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(report.executive_report) }} 
                />
              </div>
            </>
          )}

        </AnimatePresence>
      </main>

      {/* SETTINGS DIALOG (API KEYS) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md overflow-hidden glass rounded-2xl border border-white/10 shadow-2xl z-10"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span>Configure API Credentials</span>
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block font-mono">
                    OpenAI API Key (GPT-4o/5)
                    {serverHasKey && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/35 text-[9px] font-bold text-emerald-400">
                        SERVER KEY ACTIVE
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    placeholder={serverHasKey ? "•••••••••••••••• (Using Server Key)" : "sk-..."}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#020208] text-slate-200 outline-none text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                    {serverHasKey 
                      ? "The server has an OpenAI key configured. You can leave this blank to use the default server key, or enter a custom key to override it."
                      : "This key is saved strictly in your local browser storage and is sent via secure headers to authenticate model synthesis and report generation."}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/10 bg-white/2 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg hover:bg-white/5 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveKey(openaiApiKey)}
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY SIDEBAR */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full glass border-l border-white/10 shadow-2xl relative z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span>Research Library</span>
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 transition text-xs font-mono"
                >
                  [CLOSE]
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs italic text-center p-6">
                    No research history found
                  </div>
                ) : (
                  history.map((h) => (
                    <div
                      key={h.id}
                      onClick={async () => {
                        const fullReport = await ResearchStorage.getReport(h.id);
                        if (fullReport) {
                          setReport(fullReport);
                          setQuery(fullReport.query);
                          setShowHistory(false);
                        }
                      }}
                      className="p-3.5 rounded-xl border border-white/5 hover:border-indigo-500/20 bg-[#020208] cursor-pointer hover:bg-white/2 transition-all flex justify-between items-center group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-semibold text-slate-200 truncate block group-hover:text-indigo-300 transition">
                          {h.query}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono shrink-0">
                        {h.confidence}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL (QR CODE) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        reportId={report?.id || ''}
        query={report?.query || ''}
      />

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-slate-500 font-mono print-hidden">
        Nebula Research • Powered by Context.dev API + AI Reasoner
      </footer>
    </div>
  );
}
