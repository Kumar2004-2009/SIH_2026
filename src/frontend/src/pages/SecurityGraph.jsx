import React, { useState, useEffect } from 'react';
import { Network, Flame, ArrowRight, RefreshCw, Info } from 'lucide-react';
import { api } from '../api/client';
import RiskMeter from '../components/RiskMeter';

export default function SecurityGraph() {
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedAttackPath, setSelectedAttackPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGraph(); }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await api.getSecurityGraph();
      setGraphData(data);
      if (data?.attack_paths?.length > 0) setSelectedAttackPath(data.attack_paths[0]);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  const getNodeCoordinates = (node, index) => {
    const type = node.node_type;
    if (type === 'internet')  return { x: 90,  y: 220 };
    if (type === 'firewall')  return { x: 260, y: index % 2 === 0 ? 150 : 290 };
    if (type === 'router')    return { x: 440, y: 120 + index * 60 };
    if (type === 'switch')    return { x: 620, y: 160 + (index % 3) * 80 };
    if (type === 'network')   return { x: 500, y: 340 + (index % 2) * 50 };
    if (type === 'service')   return { x: 770, y: 180 + (index % 2) * 110 };
    return { x: 300 + index * 40, y: 200 };
  };

  const isEdgeInPath = (source, target) => {
    if (!selectedAttackPath) return false;
    for (let i = 0; i < selectedAttackPath.length - 1; i++) {
      if (selectedAttackPath[i] === source && selectedAttackPath[i + 1] === target) return true;
    }
    return false;
  };

  const isNodeInPath = (nodeId) => selectedAttackPath?.includes(nodeId) ?? false;

  const nodeColor = (node) =>
    node.node_type === 'internet' ? '#6b6b68' :
    node.risk_score >= 7.5        ? '#e54d2e' :
    node.risk_score >= 5.0        ? '#e0813a' :
    '#4ecdc4';

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Security Graph</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            NetworkX topology — lateral movement, perimeter exposure, crown-jewel reachability
          </p>
        </div>
        <button
          onClick={fetchGraph}
          className="btn btn-secondary self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Recompute
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Graph canvas */}
        <div className="lg:col-span-8 panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="status-dot dot-online" />
              <span className="text-[var(--text-muted)] uppercase tracking-wide">Active topology</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 border-t border-dashed border-[#e54d2e] inline-block" />
                Attack path
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 border-t border-[#2a2a2d] inline-block" />
                Normal edge
              </span>
            </div>
          </div>

          <div
            className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-sm overflow-auto cyber-grid flex items-center justify-center"
            style={{ height: 480 }}
          >
            {loading ? (
              <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--border-muted)] border-t-transparent rounded-full animate-spin" />
                Computing topology…
              </div>
            ) : graphData ? (
              <svg width="860" height="460" className="select-none">
                <defs>
                  <marker id="arr-normal" markerWidth="7" markerHeight="5" refX="14" refY="2.5" orient="auto">
                    <polygon points="0 0, 7 2.5, 0 5" fill="#38383c" />
                  </marker>
                  <marker id="arr-attack" markerWidth="7" markerHeight="5" refX="14" refY="2.5" orient="auto">
                    <polygon points="0 0, 7 2.5, 0 5" fill="#e54d2e" />
                  </marker>
                </defs>

                {/* Edges */}
                {graphData.edges?.map((edge, i) => {
                  const si = graphData.nodes.findIndex((n) => n.id === edge.source);
                  const di = graphData.nodes.findIndex((n) => n.id === edge.target);
                  if (si === -1 || di === -1) return null;
                  const sc = getNodeCoordinates(graphData.nodes[si], si);
                  const dc = getNodeCoordinates(graphData.nodes[di], di);
                  const attack = isEdgeInPath(edge.source, edge.target);
                  return (
                    <line
                      key={`e-${i}`}
                      x1={sc.x} y1={sc.y} x2={dc.x} y2={dc.y}
                      stroke={attack ? '#e54d2e' : '#2a2a2d'}
                      strokeWidth={attack ? 2 : 1}
                      strokeDasharray={attack ? '5,3' : 'none'}
                      markerEnd={attack ? 'url(#arr-attack)' : 'url(#arr-normal)'}
                    />
                  );
                })}

                {/* Nodes */}
                {graphData.nodes?.map((node, i) => {
                  const coord = getNodeCoordinates(node, i);
                  const inPath = isNodeInPath(node.id);
                  const sel = selectedNode?.id === node.id;
                  const color = nodeColor(node);
                  return (
                    <g
                      key={`n-${node.id}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                    >
                      {(inPath || sel) && (
                        <circle
                          cx={coord.x} cy={coord.y} r={22}
                          fill="none"
                          stroke={inPath ? '#e54d2e' : 'var(--accent)'}
                          strokeWidth={1}
                          strokeDasharray="3,3"
                        />
                      )}
                      <circle
                        cx={coord.x} cy={coord.y} r={15}
                        fill="var(--bg-raised)"
                        stroke={color}
                        strokeWidth={1.5}
                      />
                      <text
                        x={coord.x} y={coord.y + 28}
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="600"
                      >
                        {node.label}
                      </text>
                      <text
                        x={coord.x} y={coord.y + 39}
                        textAnchor="middle"
                        fill="var(--text-muted)"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {node.node_type}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                No graph data available.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: attack paths + node inspector */}
        <div className="lg:col-span-4 space-y-3">
          {/* Attack paths */}
          <div className="panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#e54d2e]" aria-hidden="true" />
              <span className="section-label">
                Attack paths ({graphData?.attack_paths?.length || 0})
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Exploitable reachability trajectories via graph traversal:
            </p>

            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {graphData?.attack_paths?.map((path, idx) => {
                const sel = selectedAttackPath === path;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedAttackPath(path)}
                    className={[
                      'w-full text-left panel-nested p-2.5 transition-colors cursor-pointer text-[11px] font-mono',
                      sel ? 'border-[#8c2519]' : 'hover:border-[var(--border-muted)]',
                    ].join(' ')}
                  >
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span style={{ color: '#e54d2e' }} className="font-bold">VECTOR #{idx + 1}</span>
                      <span className="text-[var(--text-muted)]">{path.length - 1} hops</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {path.map((node, i) => (
                        <React.Fragment key={i}>
                          <span
                            className="text-[10px] border px-1 py-0.5 rounded-sm"
                            style={{
                              color: i === 0 ? 'var(--text-muted)' :
                                     i === path.length - 1 ? '#f07050' : 'var(--text-secondary)',
                              borderColor: i === path.length - 1 ? '#8c2519' : 'var(--border)',
                            }}
                          >
                            {node}
                          </span>
                          {i < path.length - 1 && (
                            <ArrowRight className="w-2.5 h-2.5 text-[var(--border-muted)]" aria-hidden="true" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node inspector */}
          <div className="panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <span className="section-label">Node inspector</span>
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-[12px] font-mono">
                <div className="panel-nested p-3">
                  <div className="section-label mb-1">Target</div>
                  <div className="text-[14px] font-bold text-[var(--text-primary)]">{selectedNode.label}</div>
                  <div className="text-[11px] text-[var(--text-muted)] capitalize mt-0.5">
                    {selectedNode.node_type} · criticality: {selectedNode.criticality}
                  </div>
                </div>
                <RiskMeter score={selectedNode.risk_score} />
                {selectedNode.properties && (
                  <div className="panel-nested p-3 space-y-1 text-[11px]">
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-[var(--text-muted)] capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-[var(--text-secondary)] font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-[var(--border)] rounded-sm p-5 text-center text-[11px] font-mono text-[var(--text-muted)]">
                Click a node to inspect its properties and risk context.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
