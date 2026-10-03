import React, { useState, useEffect } from 'react';
import {
  Network,
  Flame,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../api/client';
import RiskMeter from '../components/RiskMeter';

export default function SecurityGraph() {
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedAttackPath, setSelectedAttackPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraph();
  }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getSecurityGraph();
      setGraphData(data);
      if (data?.attack_paths?.length > 0) {
        setSelectedAttackPath(data.attack_paths[0]);
      }
    } catch (e) {
      console.error('Failed to load security graph:', e);
    } finally {
      setLoading(false);
    }
  };

  const getNodeCoordinates = (node, index, total) => {
    const type = node.node_type;
    if (type === 'internet') return { x: 90, y: 220 };
    if (type === 'firewall') return { x: 260, y: index % 2 === 0 ? 150 : 290 };
    if (type === 'router') return { x: 440, y: 120 + (index * 60) };
    if (type === 'switch') return { x: 620, y: 160 + ((index % 3) * 80) };
    if (type === 'network') return { x: 500, y: 340 + ((index % 2) * 50) };
    if (type === 'service') return { x: 770, y: 180 + ((index % 2) * 110) };
    return { x: 300 + (index * 40), y: 200 };
  };

  const isEdgeInSelectedPath = (source, target) => {
    if (!selectedAttackPath) return false;
    for (let i = 0; i < selectedAttackPath.length - 1; i++) {
      if (selectedAttackPath[i] === source && selectedAttackPath[i + 1] === target) {
        return true;
      }
    }
    return false;
  };

  const isNodeInSelectedPath = (nodeId) => {
    return selectedAttackPath ? selectedAttackPath.includes(nodeId) : false;
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            Topological Security Graph & Attack Reachability
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            NetworkX graph model calculating cross-domain lateral movement, perimeter exposure, and crown jewel reachability
          </p>
        </div>

        <button
          onClick={fetchGraph}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-colors self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-compute Topology</span>
        </button>
      </div>

      {/* Main Graph & Attack Path Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Graph Canvas Visualizer */}
        <div className="lg:col-span-8 bg-[#0f1523] border border-slate-800 rounded-lg p-5 relative overflow-hidden flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>ACTIVE GRAPH TOPOLOGY</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical Path
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Normal Edge
              </span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="w-full h-[480px] bg-[#080d17] rounded-md border border-slate-800 relative overflow-auto cyber-grid flex items-center justify-center">
            {graphData ? (
              <svg width="860" height="460" className="select-none">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="7"
                    markerHeight="5"
                    refX="14"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 2.5, 0 5" fill="#475569" />
                  </marker>
                  <marker
                    id="arrowhead-attack"
                    markerWidth="7"
                    markerHeight="5"
                    refX="14"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 2.5, 0 5" fill="#f43f5e" />
                  </marker>
                </defs>

                {/* Edges */}
                {graphData.edges?.map((edge, i) => {
                  const srcIndex = graphData.nodes.findIndex((n) => n.id === edge.source);
                  const dstIndex = graphData.nodes.findIndex((n) => n.id === edge.target);
                  if (srcIndex === -1 || dstIndex === -1) return null;

                  const srcCoord = getNodeCoordinates(graphData.nodes[srcIndex], srcIndex, graphData.nodes.length);
                  const dstCoord = getNodeCoordinates(graphData.nodes[dstIndex], dstIndex, graphData.nodes.length);
                  const isAttack = isEdgeInSelectedPath(edge.source, edge.target);

                  return (
                    <g key={`edge-${i}`}>
                      <line
                        x1={srcCoord.x}
                        y1={srcCoord.y}
                        x2={dstCoord.x}
                        y2={dstCoord.y}
                        stroke={isAttack ? '#f43f5e' : '#334155'}
                        strokeWidth={isAttack ? 2.5 : 1.5}
                        strokeDasharray={isAttack ? '4,4' : 'none'}
                        markerEnd={isAttack ? 'url(#arrowhead-attack)' : 'url(#arrowhead)'}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {graphData.nodes?.map((node, i) => {
                  const coord = getNodeCoordinates(node, i, graphData.nodes.length);
                  const isPathNode = isNodeInSelectedPath(node.id);
                  const isSelected = selectedNode?.id === node.id;

                  const nodeColor =
                    node.node_type === 'internet'
                      ? '#6366f1'
                      : node.risk_score >= 7.5
                      ? '#f43f5e'
                      : node.risk_score >= 5.0
                      ? '#f59e0b'
                      : '#3b82f6';

                  return (
                    <g
                      key={`node-${node.id}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                    >
                      {/* Selection Ring */}
                      {(isPathNode || isSelected) && (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={23}
                          fill="none"
                          stroke={isPathNode ? '#f43f5e' : '#3b82f6'}
                          strokeWidth={1.5}
                          strokeDasharray="3,3"
                        />
                      )}

                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={17}
                        fill="#0f1523"
                        stroke={nodeColor}
                        strokeWidth={2}
                      />

                      {/* Node Label */}
                      <text
                        x={coord.x}
                        y={coord.y + 30}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {node.label}
                      </text>

                      {/* Type Label */}
                      <text
                        x={coord.x}
                        y={coord.y + 42}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {node.node_type}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="text-slate-500 font-mono text-xs">Generating graph projection...</div>
            )}
          </div>
        </div>

        {/* Attack Paths & Asset Telemetry Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Attack Path Selector */}
          <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-3 shadow-subtle">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                Identified Attack Paths ({graphData?.attack_paths?.length || 0})
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Exploitable reachability trajectories calculated via graph traversal:
            </p>

            <div className="space-y-2">
              {graphData?.attack_paths?.map((path, idx) => {
                const isSelected = selectedAttackPath === path;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedAttackPath(path)}
                    className={`p-3 rounded-md border text-xs font-mono cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-900 border-rose-500/70'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                      <span className="text-rose-400">VECTOR #{idx + 1}</span>
                      <span>{path.length - 1} Hops</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-200">
                      {path.map((node, i) => (
                        <React.Fragment key={i}>
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              i === 0
                                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                                : i === path.length - 1
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {node}
                          </span>
                          {i < path.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Inspector Card */}
          <div className="bg-[#0f1523] border border-slate-800 rounded-lg p-5 space-y-3 shadow-subtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Asset Node Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-md bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-blue-400 font-semibold uppercase">Target ID</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">{selectedNode.label}</div>
                  <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                    Type: {selectedNode.node_type} • Criticality: {selectedNode.criticality}
                  </div>
                </div>

                <RiskMeter score={selectedNode.risk_score} />

                {selectedNode.properties && (
                  <div className="p-3 rounded-md bg-[#080d17] border border-slate-800 text-[11px] space-y-1 text-slate-300">
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                        <span className="text-slate-200 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-800 rounded-md">
                Click any node in the topology above to examine network parameters and reachability context.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
