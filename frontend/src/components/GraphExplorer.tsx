import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Network,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { GraphData } from '../types';

interface GraphExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphData | null;
  selectedNodeId?: string | null;
  onFilterByCategory?: (category: string) => void;
}

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
  isOpen,
  onClose,
  graphData,
  selectedNodeId,
  onFilterByCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [activeNode, setActiveNode] = useState<any | null>(null);
  const [layoutName, setLayoutName] = useState<string>('cose');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !containerRef.current || !graphData) return;

    // Convert nodes & edges to cytoscape element format
    const elements = [
      ...graphData.nodes.map((n) => ({
        data: {
          id: n.data.id,
          label: n.data.label,
          type: n.data.type,
          color: n.data.color || '#6366F1',
          properties: n.data.properties || {},
          provenance: n.data.provenance || null,
        },
      })),
      ...graphData.edges.map((e) => ({
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          label: e.data.label,
          relation: e.data.relation,
          properties: e.data.properties || {},
          provenance: e.data.provenance || null,
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': 'data(color)',
            color: '#f8fafc',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-color': '#0f172a',
            'text-background-opacity': 0.85,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            width: 32,
            height: 32,
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.3,
          },
        },
        {
          selector: 'node[type = "City"]',
          style: {
            width: 48,
            height: 48,
            'font-size': '13px',
            'border-width': 3,
            'border-color': '#ec4899',
          },
        },
        {
          selector: 'node[type = "Place"]',
          style: {
            width: 38,
            height: 38,
            'border-color': '#818cf8',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#334155',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '8px',
            color: '#94a3b8',
            'text-rotation': 'autorotate',
            'text-background-color': '#020617',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
          },
        },
        {
          selector: 'edge[relation = "NEARBY_TO"]',
          style: {
            'line-style': 'dashed',
            'line-color': '#6366f1',
            'target-arrow-shape': 'none',
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#38bdf8',
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
          },
        },
      ],
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
      } as any,
    });

    cyRef.current = cy;

    // Node click handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setActiveNode(node.data());
    });

    // Background click handler
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setActiveNode(null);
      }
    });

    // If initial selected node passed, focus on it
    if (selectedNodeId) {
      const target = cy.getElementById(selectedNodeId);
      if (target.length > 0) {
        cy.center(target);
        cy.zoom({ level: 1.5, position: target.position() });
        target.select();
        setActiveNode(target.data());
      }
    }

    return () => {
      cy.destroy();
    };
  }, [isOpen, graphData]);

  // Run layout change
  const handleLayoutChange = (newLayout: string) => {
    setLayoutName(newLayout);
    if (cyRef.current) {
      cyRef.current.layout({ name: newLayout, animate: true } as any).run();
    }
  };

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.reset();
      cyRef.current.fit(undefined, 30);
    }
  };

  const handleSearchNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cyRef.current || !searchQuery.trim()) return;

    const matched = cyRef.current.nodes().filter((node) => {
      const label = node.data('label') || '';
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (matched.length > 0) {
      cyRef.current.nodes().unselect();
      matched.select();
      cyRef.current.center(matched);
      const firstNode = matched.nodes().first();
      if (firstNode.isNode()) {
        cyRef.current.zoom({ level: 1.4, position: firstNode.position() });
        setActiveNode(firstNode.data());
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              Knowledge Graph Explorer
              <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                NetworkX • MultiDiGraph
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive typed nodes, semantic edges, and verified provenance.
            </p>
          </div>
        </div>

        {/* Layout Switcher & Controls */}
        <div className="flex items-center space-x-2">
          {/* Node Search Form */}
          <form onSubmit={handleSearchNode} className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph node..."
              className="w-44 pl-7 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
          </form>

          {/* Layout Buttons */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {['cose', 'concentric', 'breadthfirst', 'circle'].map((l) => (
              <button
                key={l}
                onClick={() => handleLayoutChange(l)}
                className={`px-2 py-1 rounded capitalize transition ${
                  layoutName === l ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fit to screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2 border border-slate-800"
            aria-label="Close graph explorer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Side Inspector */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* Cytoscape Canvas */}
        <div ref={containerRef} className="flex-1 w-full h-full bg-slate-950 cursor-grab active:cursor-grabbing" />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[11px] shadow-lg pointer-events-none">
          <span className="font-semibold text-slate-300 block mb-1.5">Node Types:</span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]"></span>
              <span className="text-slate-400">Place</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]"></span>
              <span className="text-slate-400">City</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <span className="text-slate-400">Category</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
              <span className="text-slate-400">Companion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span>
              <span className="text-slate-400">Atmosphere</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span>
              <span className="text-slate-400">Time of Day</span>
            </div>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        {activeNode && (
          <div className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto shrink-0 shadow-2xl z-20 animate-in slide-in-from-right duration-150">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: activeNode.color || '#6366F1' }}
                >
                  {activeNode.type}
                </span>
                <button
                  onClick={() => setActiveNode(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-white mt-3">{activeNode.label}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {activeNode.id}</p>

              {/* Node Properties */}
              {activeNode.properties && Object.keys(activeNode.properties).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Properties
                  </h4>
                  <div className="space-y-1.5 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {Object.entries(activeNode.properties).map(([k, v]) => {
                      if (typeof v === 'object' && v !== null) {
                        return (
                          <div key={k} className="flex flex-col">
                            <span className="text-slate-500 font-mono text-[10px]">{k}:</span>
                            <span className="text-slate-300 font-mono text-[10px] pl-2">{JSON.stringify(v)}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={k} className="flex justify-between items-center">
                          <span className="text-slate-500 font-mono text-[10px]">{k}</span>
                          <span className="text-slate-300 font-medium truncate max-w-[180px]">{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Provenance Metadata */}
              {activeNode.provenance && (
                <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Data Provenance</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p><span className="text-slate-500">Source:</span> {activeNode.provenance.source || 'Independently Sourced'}</p>
                    <p><span className="text-slate-500">Verification:</span> <span className="text-emerald-400">{activeNode.provenance.status || 'Verified'}</span></p>
                    {activeNode.provenance.retrieval_date && (
                      <p><span className="text-slate-500">Date:</span> {activeNode.provenance.retrieval_date}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-800 mt-6 space-y-2">
              {activeNode.type === 'Category' && onFilterByCategory && (
                <button
                  onClick={() => {
                    const catSlug = activeNode.id.replace('category:', '');
                    onFilterByCategory(catSlug);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter places by this category</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
