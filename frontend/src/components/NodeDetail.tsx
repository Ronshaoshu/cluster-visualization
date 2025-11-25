import { useEffect, useState } from 'react';
import { fetchNodeDetails } from '../api';
import type { Node } from '../types';
import './NodeDetail.css';

interface NodeDetailProps {
  nodeName: string | null;
  onClose: () => void;
}

const NodeDetail = ({ nodeName, onClose }: NodeDetailProps) => {
  const [node, setNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeName) {
      setNode(null);
      return;
    }

    const loadNodeDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNodeDetails(nodeName);
        setNode(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load node details');
      } finally {
        setLoading(false);
      }
    };

    loadNodeDetails();
  }, [nodeName]);

  if (!nodeName) return null;

  return (
    <div className="node-detail-overlay" onClick={onClose}>
      <div className="node-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="node-detail-header">
          <h2>Node Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">Error: {error}</div>}

        {node && (
          <div className="node-detail-content">
            <section className="detail-section">
              <h3>General Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{node.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Role:</span>
                  <span className="value" style={{
                    color: node.role === 'master' ? '#2196f3' : '#4caf50',
                    fontWeight: 600
                  }}>
                    {node.role.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`value status-${node.status.toLowerCase()}`}>
                    {node.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Pods:</span>
                  <span className="value">{node.pods_on_node}</span>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <h3>System Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">OS:</span>
                  <span className="value">{node.info.os}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Architecture:</span>
                  <span className="value">{node.info.architecture}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Kernel:</span>
                  <span className="value">{node.info.kernel}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Container Runtime:</span>
                  <span className="value">{node.info.container_runtime}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Kubelet Version:</span>
                  <span className="value">{node.info.kubelet_version}</span>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <h3>Resources</h3>
              <div className="resource-table">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>CPU</th>
                      <th>Memory</th>
                      <th>Pods</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Capacity</strong></td>
                      <td>{node.capacity.cpu}</td>
                      <td>{node.capacity.memory}</td>
                      <td>{node.capacity.pods}</td>
                    </tr>
                    <tr>
                      <td><strong>Allocatable</strong></td>
                      <td>{node.allocatable.cpu}</td>
                      <td>{node.allocatable.memory}</td>
                      <td>{node.allocatable.pods}</td>
                    </tr>
                    {node.metrics && (
                      <tr>
                        <td><strong>Current Usage</strong></td>
                        <td>{node.metrics.cpu}</td>
                        <td>{node.metrics.memory}</td>
                        <td>-</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="detail-section">
              <h3>Addresses</h3>
              <div className="detail-grid">
                {node.addresses.map((addr, idx) => (
                  <div key={idx} className="detail-item">
                    <span className="label">{addr.type}:</span>
                    <span className="value">{addr.address}</span>
                  </div>
                ))}
              </div>
            </section>

            {node.labels && Object.keys(node.labels).length > 0 && (
              <section className="detail-section">
                <h3>Labels</h3>
                <div className="labels-container">
                  {Object.entries(node.labels).map(([key, value]) => (
                    <div key={key} className="label-tag">
                      {key}: {value}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {node.pods_details && node.pods_details.length > 0 && (
              <section className="detail-section">
                <h3>Pods on this Node ({node.pods_details.length})</h3>
                <div className="pods-list">
                  {node.pods_details.map((pod) => (
                    <div key={pod.uid} className="pod-item">
                      <div className="pod-header">
                        <span className="pod-name">{pod.name}</span>
                        <span className={`pod-status status-${pod.status.toLowerCase()}`}>
                          {pod.status}
                        </span>
                      </div>
                      <div className="pod-info">
                        <span className="pod-namespace">Namespace: {pod.namespace}</span>
                        <span className="pod-ip">IP: {pod.ip || 'N/A'}</span>
                        <span className="pod-restarts">Restarts: {pod.restart_count}</span>
                      </div>
                      <div className="pod-containers">
                        {pod.containers.map((container, idx) => (
                          <span key={idx} className={`container-tag ${container.ready ? 'ready' : 'not-ready'}`}>
                            {container.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetail;
