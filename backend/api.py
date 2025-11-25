"""
Flask API Server for Kubernetes Cluster Visualization
Provides REST endpoints to access cluster data
"""

from flask import Flask, jsonify
from flask_cors import CORS
from cluster_analyzer import ClusterAnalyzer
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize cluster analyzer
try:
    analyzer = ClusterAnalyzer()
    print("Successfully connected to Kubernetes cluster")
except Exception as e:
    print(f"Failed to initialize cluster analyzer: {str(e)}")
    analyzer = None


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if analyzer:
        return jsonify({"status": "healthy", "message": "Connected to cluster"}), 200
    else:
        return jsonify({"status": "unhealthy", "message": "Not connected to cluster"}), 503


@app.route('/api/cluster', methods=['GET'])
def get_cluster_info():
    """Get complete cluster information"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        data = analyzer.get_cluster_info()
        return jsonify(data), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/nodes', methods=['GET'])
def get_nodes():
    """Get all nodes in the cluster"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        nodes = analyzer.get_nodes()
        return jsonify(nodes), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/nodes/<node_name>', methods=['GET'])
def get_node_details(node_name):
    """Get details for a specific node"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        nodes = analyzer.get_nodes()
        node = next((n for n in nodes if n['name'] == node_name), None)

        if node:
            # Get pods running on this node
            all_pods = analyzer.get_pods()
            node_pods = [p for p in all_pods if p['node'] == node_name]
            node['pods_details'] = node_pods
            return jsonify(node), 200
        else:
            return jsonify({"error": "Node not found"}), 404
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/pods', methods=['GET'])
def get_pods():
    """Get all pods in the cluster"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        pods = analyzer.get_pods()
        return jsonify(pods), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/namespaces', methods=['GET'])
def get_namespaces():
    """Get all namespaces"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        namespaces = analyzer.get_namespaces()
        return jsonify(namespaces), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/deployments', methods=['GET'])
def get_deployments():
    """Get all deployments"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        deployments = analyzer.get_deployments()
        return jsonify(deployments), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/services', methods=['GET'])
def get_services():
    """Get all services"""
    if not analyzer:
        return jsonify({"error": "Cluster analyzer not initialized"}), 503

    try:
        services = analyzer.get_services()
        return jsonify(services), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("Starting Kubernetes Cluster Visualization API Server...")
    print("API will be available at: http://localhost:5001")
    print("\nAvailable endpoints:")
    print("  GET /api/health       - Health check")
    print("  GET /api/cluster      - Complete cluster info")
    print("  GET /api/nodes        - All nodes")
    print("  GET /api/nodes/<name> - Specific node details")
    print("  GET /api/pods         - All pods")
    print("  GET /api/namespaces   - All namespaces")
    print("  GET /api/deployments  - All deployments")
    print("  GET /api/services     - All services")
    print()

    app.run(host='0.0.0.0', port=5001, debug=True)
