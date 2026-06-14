'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, ExternalLink } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'query' | 'term' | 'source';
  x: number;
  y: number;
  domain?: string;
  logo?: string;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface SourceGraphProps {
  query: string;
  sources: Array<{
    url: string;
    title: string;
    domain: string;
    logo?: string;
    color?: string;
  }>;
}

export default function SourceGraph({ query, sources }: SourceGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Generate nodes layout
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // 1. Central Query Node
  const centerX = 250;
  const centerY = 200;
  nodes.push({
    id: 'query',
    label: query.length > 25 ? query.substring(0, 22) + '...' : query,
    type: 'query',
    x: centerX,
    y: centerY,
  });

  // 2. Intermediate Search Terms (limit to 3)
  const terms = ['Live Search', 'Brand Lookup', 'Fact Mining'];
  terms.forEach((term, index) => {
    const angle = (index * 2 * Math.PI) / terms.length;
    const distance = 80;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const id = `term-${index}`;

    nodes.push({ id, label: term, type: 'term', x, y });
    links.push({ source: 'query', target: id });
  });

  // 3. Source Nodes (outer ring)
  const maxSources = Math.min(sources.length, 6);
  sources.slice(0, maxSources).forEach((source, index) => {
    const angle = (index * 2 * Math.PI) / maxSources;
    const distance = 170;
    // Distribute among intermediate term anchors
    const termIndex = index % terms.length;
    const termId = `term-${termIndex}`;
    
    // Position outer nodes
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const id = `source-${index}`;

    nodes.push({
      id,
      label: source.domain,
      type: 'source',
      domain: source.domain,
      logo: source.logo,
      color: source.color,
      x,
      y,
    });
    
    links.push({ source: termId, target: id });
  });

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col h-[500px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Source Intelligence Graph</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">interactive_mapping_node</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <svg viewBox="0 0 500 400" className="w-full h-full max-h-[380px] select-none">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dotted Connections / Link Lines */}
          {links.map((link, idx) => {
            const sNode = nodes.find((n) => n.id === link.source);
            const tNode = nodes.find((n) => n.id === link.target);
            if (!sNode || !tNode) return null;

            const isHighlighted =
              hoveredNode === sNode.id ||
              hoveredNode === tNode.id ||
              (hoveredNode === 'query' && (sNode.id === 'query' || tNode.id === 'query'));

            return (
              <line
                key={idx}
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke={isHighlighted ? 'rgba(99, 102, 241, 0.6)' : 'rgba(255, 255, 255, 0.06)'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray={tNode.type === 'source' ? '3 3' : undefined}
                className={tNode.type === 'source' ? 'animate-[dash_8s_linear_infinite]' : undefined}
                style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isQuery = node.type === 'query';
            const isTerm = node.type === 'term';
            const isSource = node.type === 'source';

            // Visual Styling Parameters
            let fill = 'rgba(15, 23, 42, 0.8)';
            let stroke = 'rgba(255, 255, 255, 0.15)';
            let radius = 10;
            let filter = undefined;

            if (isQuery) {
              fill = 'rgba(99, 102, 241, 0.2)';
              stroke = '#6366f1';
              radius = 22;
              filter = 'url(#glow)';
            } else if (isTerm) {
              fill = 'rgba(6, 182, 212, 0.15)';
              stroke = '#06b6d4';
              radius = 12;
            } else if (isSource) {
              fill = node.color ? `${node.color}20` : 'rgba(236, 72, 153, 0.15)';
              stroke = node.color || '#ec4899';
              radius = 14;
            }

            if (isHovered) {
              stroke = '#ffffff';
              radius = radius * 1.15;
            }

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Node circle backdrop */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHovered ? 2 : 1.5}
                  filter={filter}
                  style={{ transition: 'r 0.3s, fill 0.3s, stroke 0.3s' }}
                />

                {/* Node Icons / Logos inside circle */}
                {isSource && node.logo && (
                  <image
                    href={node.logo}
                    x={node.x - 7}
                    y={node.y - 7}
                    height="14"
                    width="14"
                    clipPath="circle(7px)"
                  />
                )}

                {/* Node Text labels */}
                {(!isSource || isHovered) && (
                  <text
                    x={node.x}
                    y={node.y + radius + 12}
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#94a3b8'}
                    fontSize="9"
                    fontWeight={isHovered || isQuery ? 'bold' : 'normal'}
                    className="pointer-events-none select-none font-mono"
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover detail overlay card */}
        <div className="absolute bottom-2 left-2 right-2 p-3 rounded-xl bg-black/80 backdrop-blur border border-white/10 text-xs flex items-center justify-between pointer-events-none">
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">
              Active Node Metadata
            </span>
            <span className="text-slate-200 mt-0.5 block font-medium">
              {hoveredNode
                ? nodes.find((n) => n.id === hoveredNode)?.label || 'Inspecting Network...'
                : 'Hover nodes to inspect query routing...'}
            </span>
          </div>
          {hoveredNode && hoveredNode.startsWith('source-') && (
            <div className="flex items-center gap-1.5 text-indigo-400 font-medium text-[10px]">
              <span>Check domain index</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
