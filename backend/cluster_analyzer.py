"""
Kubernetes Cluster Analyzer
Fetches and processes cluster information using kubectl/kubernetes API
"""

from kubernetes import client, config
from typing import Dict, List, Any
import json


class ClusterAnalyzer:
    def __init__(self):
        """Initialize Kubernetes client using local kubectl config"""
        try:
            # Load kubeconfig from default location (~/.kube/config)
            config.load_kube_config()
            self.v1 = client.CoreV1Api()
            self.apps_v1 = client.AppsV1Api()
            self.metrics_available = False

            # Try to initialize metrics API
            try:
                self.metrics = client.CustomObjectsApi()
                self.metrics_available = True
            except Exception:
                print("Metrics API not available - resource usage stats will be limited")

        except Exception as e:
            raise Exception(f"Failed to load kubeconfig: {str(e)}")

    def get_cluster_info(self) -> Dict[str, Any]:
        """Get comprehensive cluster information"""
        return {
            "nodes": self.get_nodes(),
            "namespaces": self.get_namespaces(),
            "pods": self.get_pods(),
            "deployments": self.get_deployments(),
            "services": self.get_services()
        }

    def get_nodes(self) -> List[Dict[str, Any]]:
        """Fetch all nodes with their details"""
        nodes = []
        node_list = self.v1.list_node()

        for node in node_list.items:
            node_info = {
                "name": node.metadata.name,
                "uid": node.metadata.uid,
                "labels": node.metadata.labels or {},
                "role": self._get_node_role(node),
                "status": self._get_node_status(node),
                "capacity": {
                    "cpu": node.status.capacity.get("cpu", "0"),
                    "memory": node.status.capacity.get("memory", "0"),
                    "pods": node.status.capacity.get("pods", "0")
                },
                "allocatable": {
                    "cpu": node.status.allocatable.get("cpu", "0"),
                    "memory": node.status.allocatable.get("memory", "0"),
                    "pods": node.status.allocatable.get("pods", "0")
                },
                "info": {
                    "os": node.status.node_info.operating_system,
                    "architecture": node.status.node_info.architecture,
                    "kernel": node.status.node_info.kernel_version,
                    "container_runtime": node.status.node_info.container_runtime_version,
                    "kubelet_version": node.status.node_info.kubelet_version
                },
                "addresses": [
                    {"type": addr.type, "address": addr.address}
                    for addr in (node.status.addresses or [])
                ],
                "pods_on_node": self._count_pods_on_node(node.metadata.name)
            }

            # Add metrics if available
            if self.metrics_available:
                try:
                    node_info["metrics"] = self._get_node_metrics(node.metadata.name)
                except Exception:
                    node_info["metrics"] = None

            nodes.append(node_info)

        return nodes

    def get_namespaces(self) -> List[Dict[str, Any]]:
        """Fetch all namespaces"""
        namespaces = []
        ns_list = self.v1.list_namespace()

        for ns in ns_list.items:
            namespaces.append({
                "name": ns.metadata.name,
                "uid": ns.metadata.uid,
                "status": ns.status.phase,
                "labels": ns.metadata.labels or {},
                "creation_timestamp": ns.metadata.creation_timestamp.isoformat() if ns.metadata.creation_timestamp else None
            })

        return namespaces

    def get_pods(self) -> List[Dict[str, Any]]:
        """Fetch all pods across all namespaces"""
        pods = []
        pod_list = self.v1.list_pod_for_all_namespaces()

        for pod in pod_list.items:
            pods.append({
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "uid": pod.metadata.uid,
                "node": pod.spec.node_name,
                "status": pod.status.phase,
                "ip": pod.status.pod_ip,
                "labels": pod.metadata.labels or {},
                "containers": [
                    {
                        "name": container.name,
                        "image": container.image,
                        "ready": self._is_container_ready(pod, container.name)
                    }
                    for container in (pod.spec.containers or [])
                ],
                "restart_count": sum(
                    cs.restart_count for cs in (pod.status.container_statuses or [])
                )
            })

        return pods

    def get_deployments(self) -> List[Dict[str, Any]]:
        """Fetch all deployments"""
        deployments = []
        deploy_list = self.apps_v1.list_deployment_for_all_namespaces()

        for deploy in deploy_list.items:
            deployments.append({
                "name": deploy.metadata.name,
                "namespace": deploy.metadata.namespace,
                "uid": deploy.metadata.uid,
                "replicas": deploy.spec.replicas,
                "available_replicas": deploy.status.available_replicas or 0,
                "ready_replicas": deploy.status.ready_replicas or 0,
                "labels": deploy.metadata.labels or {}
            })

        return deployments

    def get_services(self) -> List[Dict[str, Any]]:
        """Fetch all services"""
        services = []
        svc_list = self.v1.list_service_for_all_namespaces()

        for svc in svc_list.items:
            services.append({
                "name": svc.metadata.name,
                "namespace": svc.metadata.namespace,
                "uid": svc.metadata.uid,
                "type": svc.spec.type,
                "cluster_ip": svc.spec.cluster_ip,
                "ports": [
                    {
                        "port": port.port,
                        "target_port": str(port.target_port),
                        "protocol": port.protocol
                    }
                    for port in (svc.spec.ports or [])
                ],
                "labels": svc.metadata.labels or {},
                "selector": svc.spec.selector or {}
            })

        return services

    def _get_node_status(self, node) -> str:
        """Determine node status from conditions"""
        for condition in (node.status.conditions or []):
            if condition.type == "Ready":
                return "Ready" if condition.status == "True" else "NotReady"
        return "Unknown"

    def _get_node_role(self, node) -> str:
        """Determine node role from labels"""
        labels = node.metadata.labels or {}

        # Check for master/control-plane role
        if any(key.startswith('node-role.kubernetes.io/master') for key in labels):
            return "master"
        if any(key.startswith('node-role.kubernetes.io/control-plane') for key in labels):
            return "master"

        # Check for worker role
        if any(key.startswith('node-role.kubernetes.io/worker') for key in labels):
            return "worker"

        # If no role is found, assign "worker" as default
        return "worker"

    def _count_pods_on_node(self, node_name: str) -> int:
        """Count number of pods running on a specific node"""
        field_selector = f"spec.nodeName={node_name}"
        pods = self.v1.list_pod_for_all_namespaces(field_selector=field_selector)
        return len(pods.items)

    def _is_container_ready(self, pod, container_name: str) -> bool:
        """Check if a specific container is ready"""
        if not pod.status.container_statuses:
            return False

        for status in pod.status.container_statuses:
            if status.name == container_name:
                return status.ready
        return False

    def _get_node_metrics(self, node_name: str) -> Dict[str, str]:
        """Get node metrics (requires metrics-server)"""
        try:
            metrics = self.metrics.list_cluster_custom_object(
                group="metrics.k8s.io",
                version="v1beta1",
                plural="nodes"
            )

            for item in metrics.get("items", []):
                if item["metadata"]["name"] == node_name:
                    return {
                        "cpu": item["usage"]["cpu"],
                        "memory": item["usage"]["memory"]
                    }
        except Exception:
            pass

        return {"cpu": "N/A", "memory": "N/A"}


if __name__ == "__main__":
    # Test the analyzer
    try:
        analyzer = ClusterAnalyzer()
        cluster_data = analyzer.get_cluster_info()
        print(json.dumps(cluster_data, indent=2, default=str))
    except Exception as e:
        print(f"Error: {str(e)}")
