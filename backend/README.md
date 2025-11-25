# Backend - Kubernetes Cluster Analyzer

This is the Python backend that fetches cluster information using the Kubernetes API.

## Prerequisites

- Python 3.8 or higher
- kubectl configured with access to a Kubernetes cluster
- A valid kubeconfig file (usually at `~/.kube/config`)

## Installation

1. Install dependencies:

```bash
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### Test Cluster Analyzer

To test if the cluster analyzer can fetch data:

```bash
python cluster_analyzer.py
```

This will output cluster information in JSON format.

### Run API Server

To start the Flask API server:

```bash
python api.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/cluster` - Complete cluster information
- `GET /api/nodes` - List all nodes
- `GET /api/nodes/<name>` - Get specific node details with pods
- `GET /api/pods` - List all pods
- `GET /api/namespaces` - List all namespaces
- `GET /api/deployments` - List all deployments
- `GET /api/services` - List all services

## Configuration

The backend uses your local kubectl configuration. Make sure:

1. kubectl is installed
2. You have a valid kubeconfig at `~/.kube/config`
3. The current context points to the cluster you want to visualize

Test your kubectl connection:

```bash
kubectl cluster-info
kubectl get nodes
```

## Troubleshooting

### "Failed to load kubeconfig"

- Ensure kubectl is properly configured
- Check that `~/.kube/config` exists and is valid
- Verify you have permissions to access the cluster

### "Metrics API not available"

- This is normal if metrics-server is not installed in your cluster
- Resource usage metrics will show as "N/A"
- To enable metrics, install metrics-server in your cluster

### CORS Errors

- The API has CORS enabled for all origins
- If issues persist, check that the frontend is using the correct API URL
