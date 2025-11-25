import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import 'vis-network/styles/vis-network.css';
import { fetchNodes } from '../api';
import type { Node } from '../types';
import './ClusterTopology.css';

interface ClusterTopologyProps {
  onNodeClick: (nodeName: string) => void;
}

const ClusterTopology = ({ onNodeClick }: ClusterTopologyProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; node: Node | null }>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });

  const loadClusterData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nodeData = await fetchNodes();
      console.log('Fetched nodes:', nodeData.length, nodeData);
      setNodes(nodeData);
    } catch (err) {
      console.error('Error fetching nodes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cluster data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadClusterData();
  };

  useEffect(() => {
    loadClusterData();
  }, []);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) {
      console.log('Skipping network creation:', { hasContainer: !!containerRef.current, nodeCount: nodes.length });
      return;
    }

    console.log('Creating network with', nodes.length, 'nodes');

    // Separate master and worker nodes
    const masterNodes = nodes.filter(n => n.role === 'master');
    const workerNodes = nodes.filter(n => n.role === 'worker');

    // Prepare nodes for vis-network with role-based styling and hierarchy
    const visNodes = nodes.map((node, index) => {
      const isMaster = node.role === 'master';

      // Different colors for master vs worker
      let backgroundColor, borderColor;
      if (isMaster) {
        backgroundColor = node.status === 'Ready' ? '#2196f3' : '#f44336';
        borderColor = node.status === 'Ready' ? '#1565c0' : '#c62828';
      } else {
        backgroundColor = node.status === 'Ready' ? '#4caf50' : '#f44336';
        borderColor = node.status === 'Ready' ? '#2e7d32' : '#c62828';
      }

      return {
        id: node.name,
        label: `${node.name}\n${node.role.toUpperCase()}\n${node.pods_on_node} pods`,
        color: {
          background: backgroundColor,
          border: borderColor,
          highlight: {
            background: isMaster ? '#42a5f5' : '#66bb6a',
            border: '#ffffff',
          },
        },
        font: {
          color: '#ffffff',
          size: 10,
          face: 'Courier New, Consolas, monospace',
          bold: {
            color: '#ffffff',
          },
        },
        shape: 'box',
        margin: 10,
        borderWidth: 4,
        borderWidthSelected: 5,
        level: isMaster ? 0 : 1,
        widthConstraint: {
          minimum: 100,
          maximum: 140,
        },
        shapeProperties: {
          borderRadius: 2,
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.6)',
          size: 12,
          x: 4,
          y: 4,
        },
      };
    });

    // Create edges (connections from masters to workers)
    const visEdges: any[] = [];

    // If we have masters, connect them to all workers
    if (masterNodes.length > 0 && workerNodes.length > 0) {
      masterNodes.forEach(master => {
        workerNodes.forEach(worker => {
          visEdges.push({
            from: master.name,
            to: worker.name,
            color: { color: '#666666', highlight: '#4a9eff' },
            width: 2,
            arrows: {
              to: {
                enabled: false,
              },
            },
            smooth: {
              type: 'cubicBezier',
              forceDirection: 'vertical',
              roundness: 0.4,
            },
          });
        });
      });
    } else if (masterNodes.length === 0 && workerNodes.length > 1) {
      // If no masters, create horizontal connections between workers
      for (let i = 0; i < workerNodes.length - 1; i++) {
        visEdges.push({
          from: workerNodes[i].name,
          to: workerNodes[i + 1].name,
          color: { color: '#666666', highlight: '#4a9eff' },
          width: 2,
          smooth: {
            type: 'continuous',
          },
        });
      }
    }

    // Network options
    const options = {
      nodes: {
        borderWidth: 3,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.5)',
          size: 10,
          x: 5,
          y: 5,
        },
      },
      edges: {
        smooth: {
          type: 'continuous',
        },
      },
      physics: {
        enabled: false,  // Disable physics for hierarchical layout
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true,
        zoomView: true,
        dragView: true,
      },
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'UD',  // Up-Down: masters on top, workers below
          sortMethod: 'directed',
          nodeSpacing: 180,
          levelSeparation: 200,
          treeSpacing: 180,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true,
        },
      },
      autoResize: true,
      height: '100%',
      width: '100%',
    };

    console.log('vis-network nodes:', visNodes);
    console.log('vis-network edges:', visEdges);

    // Create network
    const network = new Network(
      containerRef.current,
      { nodes: visNodes, edges: visEdges },
      options
    );

    console.log('Network created successfully');

    // Fit network to screen (hierarchical layout doesn't need stabilization)
    setTimeout(() => {
      network.fit({
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad',
        },
      });
    }, 100);

    // Handle node clicks
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string;
        onNodeClick(nodeId);
      }
    });

    // Handle hover to show custom tooltip
    network.on('hoverNode', (params) => {
      const nodeId = params.node as string;
      const hoveredNode = nodes.find(n => n.name === nodeId);
      if (hoveredNode) {
        const domPosition = network.canvasToDOM(params.pointer.canvas);
        setTooltip({
          visible: true,
          x: domPosition.x,
          y: domPosition.y,
          node: hoveredNode,
        });
      }
    });

    network.on('blurNode', () => {
      setTooltip({ visible: false, x: 0, y: 0, node: null });
    });

    // Hide tooltip when dragging
    network.on('dragging', () => {
      setTooltip({ visible: false, x: 0, y: 0, node: null });
    });

    networkRef.current = network;

    return () => {
      network.destroy();
    };
  }, [nodes, onNodeClick]);

  if (loading) {
    return (
      <div className="cluster-topology-container">
        <div className="loading-message">Loading cluster data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cluster-topology-container">
        <div className="error-message">
          <h3>Error Loading Cluster Data</h3>
          <p>{error}</p>
          <p className="error-hint">
            Make sure the backend server is running and kubectl is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="cluster-topology-container">
        <div className="empty-message">
          <h3>No Nodes Found</h3>
          <p>No nodes were found in the cluster.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cluster-topology-container">
      <div className="cluster-info-bar">
        <div className="info-item">
          <span className="info-label">Total Nodes:</span>
          <span className="info-value">{nodes.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Masters:</span>
          <span className="info-value" style={{ color: '#2196f3' }}>
            {nodes.filter((n) => n.role === 'master').length}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Workers:</span>
          <span className="info-value status-ready">
            {nodes.filter((n) => n.role === 'worker').length}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Ready:</span>
          <span className="info-value status-ready">
            {nodes.filter((n) => n.status === 'Ready').length}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Not Ready:</span>
          <span className="info-value status-notready">
            {nodes.filter((n) => n.status !== 'Ready').length}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Pods:</span>
          <span className="info-value">
            {nodes.reduce((sum, n) => sum + n.pods_on_node, 0)}
          </span>
        </div>
        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
        </button>
      </div>
      <div ref={containerRef} className="network-canvas" />
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196f3' }} />
          <span>Master (Ready)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4caf50' }} />
          <span>Worker (Ready)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f44336' }} />
          <span>Not Ready</span>
        </div>
      </div>

      {tooltip.visible && tooltip.node && (
        <div
          className="custom-tooltip"
          style={{
            left: `${tooltip.x + 20}px`,
            top: `${tooltip.y - 20}px`,
          }}
          onMouseEnter={() => setTooltip(prev => ({ ...prev, visible: true }))}
          onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, node: null })}
        >
          <div className="tooltip-header">
            <h3>{tooltip.node.name}</h3>
            <span className={`tooltip-status ${tooltip.node.status === 'Ready' ? 'ready' : 'not-ready'}`}>
              {tooltip.node.status}
            </span>
          </div>

          <div className="tooltip-section">
            <div className="tooltip-item">
              <span className="tooltip-label">Role:</span>
              <span className="tooltip-value role-badge" style={{
                backgroundColor: tooltip.node.role === 'master' ? '#2196f3' : '#4caf50'
              }}>
                {tooltip.node.role.toUpperCase()}
              </span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-label">Pods:</span>
              <span className="tooltip-value">{tooltip.node.pods_on_node} / {tooltip.node.capacity.pods}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-label">CPU:</span>
              <span className="tooltip-value">{tooltip.node.allocatable.cpu}</span>
            </div>
            <div className="tooltip-item">
              <span className="tooltip-label">Memory:</span>
              <span className="tooltip-value">{tooltip.node.allocatable.memory}</span>
            </div>
          </div>

          <div className="tooltip-section">
            <div className="tooltip-section-title">Labels ({Object.keys(tooltip.node.labels || {}).length})</div>
            <div className="tooltip-labels">
              {Object.entries(tooltip.node.labels || {}).slice(0, 10).map(([key, value]) => (
                <div key={key} className="tooltip-label-item">
                  <span className="label-key">{key}:</span>
                  <span className="label-value">{value}</span>
                </div>
              ))}
              {Object.keys(tooltip.node.labels || {}).length > 10 && (
                <div className="tooltip-label-more">
                  +{Object.keys(tooltip.node.labels).length - 10} more...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterTopology;
