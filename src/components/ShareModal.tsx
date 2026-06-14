'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  query: string;
}

export default function ShareModal({ isOpen, onClose, reportId, query }: ShareModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/${reportId}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}&color=63-66-241&bgcolor=09-0d-21`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const res = await fetch(qrCodeUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nebula-qr-${reportId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to fetch blob, opening in new tab instead:', err);
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-visible">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
        />

        {/* Modal content card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="glass-card rounded-3xl border border-white/10 p-6 max-w-sm w-full mx-4 relative overflow-visible shadow-2xl bg-slate-900/90 backdrop-blur-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Share Report Link</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-white/5 rounded-2xl p-5 mb-5 relative group overflow-hidden">
            {/* Ambient Background Glow behind QR */}
            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 pointer-events-none" />
            
            <img
              src={qrCodeUrl}
              alt="Scan QR Code to view shared report"
              className="w-48 h-48 rounded-xl border border-indigo-500/20 shadow-lg relative z-10"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-3.5 tracking-wide">
              SCAN QR CODE WITH MOBILE
            </span>
          </div>

          {/* Quick-Action Link Clipboard */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-slate-950/80 border border-white/15 text-slate-400 text-xs font-mono rounded-xl px-3.5 py-2.5 flex-1 select-all truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
                }`}
                title="Copy share link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-white/5 cursor-pointer shadow-md hover:shadow-indigo-500/5 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download QR Code Image</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
