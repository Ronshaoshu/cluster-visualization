# Kubernetes Cluster Visualization Tool

A real-time interactive tool to visualize Kubernetes cluster topology and node information using kubectl data.

## Features

- **Real-time Cluster Data**: Fetches live cluster information using Kubernetes API
- **Interactive Node Topology**: Visual graph representation of cluster nodes
- **Detailed Node Information**: Click any node to view:
  - System information (OS, kernel, architecture)
  - Resource capacity and allocation (CPU, memory, pods)
  - Current resource usage metrics (if metrics-server is installed)
  - Network addresses
  - Labels and annotations
  - All pods running on the node
- **Manual Refresh**: Refresh button to update cluster data on demand
- **Color-coded Status**: Green for ready nodes, red for not-ready nodes

## Project Structure

```
.
├── backend/                 # Python backend
│   ├── cluster_analyzer.py  # Kubectl data fetching and analysis
│   ├── api.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript definitions
│   │   └── App.tsx        # Main application
│   └── package.json
├── start.sh                # Quick start script (Linux/Mac)
├── start.bat               # Quick start script (Windows)
└── README.md
```

## Prerequisites

- **Python 3.8+** - For the backend API server
- **Node.js 16+** - For the frontend application
- **kubectl** - Configured with access to a Kubernetes cluster
- **Active Kubernetes Cluster** - The cluster you want to visualize

### Verify Prerequisites

```bash
# Check Python version
python3 --version

# Check Node.js version
node --version

# Check kubectl is configured
kubectl cluster-info
kubectl get nodes
```

## Quick Start

### Using Start Script (Recommended)

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

The script will:
1. Check kubectl configuration
2. Set up Python virtual environment
3. Install dependencies
4. Start both backend and frontend servers

Access the application at [http://localhost:5173](http://localhost:5173)

### Manual Setup

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python api.py
```

Backend API will be available at [http://localhost:5000](http://localhost:5000)

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at [http://localhost:5173](http://localhost:5173)

## Usage

1. **Ensure kubectl is configured**:
   ```bash
   kubectl config current-context
   kubectl get nodes
   ```

2. **Start the backend server** (if not using start script):
   ```bash
   cd backend && python api.py
   ```

3. **Start the frontend** (if not using start script):
   ```bash
   cd frontend && npm run dev
   ```

4. **Open your browser** to [http://localhost:5173](http://localhost:5173)

5. **Interact with the visualization**:
   - View the cluster topology graph
   - Hover over nodes to see quick information
   - Click on any node to open detailed information panel
   - Use mouse to pan and zoom the graph
   - Click the "Refresh" button to update cluster data

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/cluster` - Complete cluster information
- `GET /api/nodes` - List all nodes
- `GET /api/nodes/<name>` - Get specific node details with pods
- `GET /api/pods` - List all pods across all namespaces
- `GET /api/namespaces` - List all namespaces
- `GET /api/deployments` - List all deployments
- `GET /api/services` - List all services

## Configuration

### Backend Configuration

The backend uses your local kubectl configuration (`~/.kube/config`). No additional configuration is needed if kubectl is already set up.

### Frontend Configuration

Create a `.env` file in the `frontend/` directory to customize the API URL:

```bash
cp frontend/.env.example frontend/.env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## Troubleshooting

### "Failed to load kubeconfig"
- Ensure kubectl is installed and in your PATH
- Check that `~/.kube/config` exists
- Verify cluster access: `kubectl cluster-info`

### "Cannot connect to backend"
- Verify backend is running on port 5000
- Check firewall settings
- Ensure no other service is using port 5000

### "No nodes found"
- Verify kubectl can access the cluster: `kubectl get nodes`
- Check your current context: `kubectl config current-context`

### "Metrics not available"
- Install metrics-server in your cluster for resource usage data
- Basic information will still work without metrics

### CORS Errors
- Ensure backend is running
- Check the `VITE_API_URL` in frontend configuration
- Backend has CORS enabled by default

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
python api.py  # Runs with debug mode enabled
```

### Frontend Development

```bash
cd frontend
npm run dev  # Hot reload enabled
```

## Tech Stack

**Backend:**
- Python 3.8+
- Flask (Web framework)
- kubernetes-client (Kubernetes API client)

**Frontend:**
- React 18 with TypeScript
- Vite (Build tool)
- vis-network (Graph visualization)
- Axios (HTTP client)

## License

See [LICENSE](LICENSE) file for details.
