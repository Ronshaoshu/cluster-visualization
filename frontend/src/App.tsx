import { useState } from 'react'
import ClusterTopology from './components/ClusterTopology'
import NodeDetail from './components/NodeDetail'
import './App.css'

function App() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const handleNodeClick = (nodeName: string) => {
    setSelectedNode(nodeName)
  }

  const handleCloseDetail = () => {
    setSelectedNode(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kubernetes Cluster Visualization</h1>
        <p className="subtitle">Real-time cluster topology and node monitoring</p>
      </header>
      <ClusterTopology onNodeClick={handleNodeClick} />
      <NodeDetail nodeName={selectedNode} onClose={handleCloseDetail} />
    </div>
  )
}

export default App
