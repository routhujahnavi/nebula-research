'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartDataItem {
  label: string;
  value: number;
}

interface Chart {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: ChartDataItem[];
}

interface ResearchChartsProps {
  charts?: Chart[];
}

export default function ResearchCharts({ charts = [] }: ResearchChartsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    chartIdx: number;
    itemIdx: number;
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  if (charts.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center py-12">
        <BarChart3 className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-slate-400">No structured numeric trend found</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
          No comparative numerical metrics or validated historical trends could be extracted from the crawled sources for this search query.
        </p>
      </div>
    );
  }

  // Helper to format values nicely
  const formatVal = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
    if (val % 1 !== 0) return val.toFixed(2);
    return val.toString();
  };

  const svgWidth = 500;
  const svgHeight = 220;
  const paddingX = 55;
  const paddingY = 40;

  return (
    <div className="space-y-6">
      {charts.map((chart, chartIdx) => {
        const data = chart.data || [];
        if (data.length === 0) return null;

        const values = data.map((d) => d.value);
        const maxVal = Math.max(...values, 1);
        const minVal = Math.min(...values, 0); // Start baseline at 0 for clean graphs
        const valRange = maxVal - minVal || 1;

        // Calculate coordinates
        const points = data.map((item, idx) => {
          const x = paddingX + (idx * (svgWidth - 2 * paddingX)) / Math.max(data.length - 1, 1);
          const y = svgHeight - paddingY - ((item.value - minVal) / valRange) * (svgHeight - 2 * paddingY);
          return { x, y, label: item.label, value: item.value };
        });

        // SVG Path definitions
        const linePath = points.reduce((acc, p, idx) => {
          return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
        }, '');

        // Area fill under the line path
        const areaPath = points.length > 0
          ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
          : '';

        return (
          <div key={chartIdx} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4 relative overflow-visible">
            {/* Chart Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">{chart.title} (Trend Line)</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                line_metrics
              </span>
            </div>

            {/* SVG Line Graph */}
            <div className="relative w-full overflow-visible">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full max-h-[260px] select-none overflow-visible">
                <defs>
                  {/* Line stroke gradient */}
                  <linearGradient id={`lineGrad-${chartIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  
                  {/* Area fill gradient */}
                  <linearGradient id={`areaGrad-${chartIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = minVal + ratio * valRange;
                  const yPos = svgHeight - paddingY - ratio * (svgHeight - 2 * paddingY);
                  
                  return (
                    <g key={idx} className="opacity-40">
                      {/* Grid Line */}
                      <line
                        x1={paddingX}
                        y1={yPos}
                        x2={svgWidth - paddingX}
                        y2={yPos}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeDasharray="4 4"
                      />
                      {/* Grid Label */}
                      <text
                        x={paddingX - 10}
                        y={yPos + 3}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="8"
                        className="font-mono font-semibold"
                      >
                        {formatVal(yVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Under Line */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={`url(#areaGrad-${chartIdx})`}
                    className="transition-all duration-300"
                  />
                )}

                {/* Glowing guidelines for hovered node */}
                {hoveredPoint && hoveredPoint.chartIdx === chartIdx && (
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingY}
                    x2={hoveredPoint.x}
                    y2={svgHeight - paddingY}
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                {/* Actual SVG Line */}
                {linePath && (
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    d={linePath}
                    fill="none"
                    stroke={`url(#lineGrad-${chartIdx})`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Node Circles */}
                {points.map((p, idx) => {
                  const isPointHovered =
                    hoveredPoint &&
                    hoveredPoint.chartIdx === chartIdx &&
                    hoveredPoint.itemIdx === idx;

                  const parts = p.label.split('|');
                  const fullLabel = parts[0]?.trim() || p.label;
                  const displayLabel = parts[1]?.trim() || fullLabel;

                  return (
                    <g key={idx}>
                      {/* Invisible hover helper for easier cursor targeting */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="18"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            chartIdx,
                            itemIdx: idx,
                            label: p.label,
                            value: p.value,
                            x: p.x,
                            y: p.y,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />

                      {/* Outer Glow Ring on Hover */}
                      {isPointHovered && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="9"
                          fill="rgba(99, 102, 241, 0.3)"
                          stroke="rgba(99, 102, 241, 0.6)"
                          strokeWidth="1"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isPointHovered ? 6 : 4}
                        fill={isPointHovered ? '#ffffff' : '#06b6d4'}
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        style={{ transition: 'r 0.2s, fill 0.2s' }}
                      />

                      {/* X-Axis Labels */}
                      <text
                        x={p.x}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        fill={isPointHovered ? '#ffffff' : '#64748b'}
                        fontSize="8.5"
                        fontWeight={isPointHovered ? 'bold' : 'normal'}
                        className="font-mono transition-colors duration-200"
                      >
                        {displayLabel.length > 15 ? displayLabel.substring(0, 13) + '..' : displayLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Dynamic Overlay HTML Tooltip (Framer Motion) */}
              <AnimatePresence>
                {hoveredPoint && hoveredPoint.chartIdx === chartIdx && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bg-slate-950/95 backdrop-blur-md border border-indigo-500/30 p-2.5 rounded-xl text-[10px] font-mono shadow-2xl space-y-1 z-20 pointer-events-none"
                    style={{
                      left: `${Math.min(
                        Math.max((hoveredPoint.x / svgWidth) * 100 - 15, 2),
                        72
                      )}%`,
                      top: `${Math.max((hoveredPoint.y / svgHeight) * 100 - 35, 5)}%`,
                    }}
                  >
                    <span className="text-slate-400 font-semibold block">
                      {hoveredPoint.label.split('|')[0]?.trim()}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-white">
                      <span>value:</span>
                      <span className="text-indigo-400">{formatVal(hoveredPoint.value)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footnote */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono pt-1">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Hover chart nodes to trace metrics values and source origins.</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
