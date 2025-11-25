export interface NodeAddress {
  type: string;
  address: string;
}

export interface NodeInfo {
  os: string;
  architecture: string;
  kernel: string;
  container_runtime: string;
  kubelet_version: string;
}

export interface ResourceInfo {
  cpu: string;
  memory: string;
  pods?: string;
}

export interface NodeMetrics {
  cpu: string;
  memory: string;
}

export interface Container {
  name: string;
  image: string;
  ready: boolean;
}

export interface Pod {
  name: string;
  namespace: string;
  uid: string;
  node: string;
  status: string;
  ip: string;
  labels: Record<string, string>;
  containers: Container[];
  restart_count: number;
}

export interface Node {
  name: string;
  uid: string;
  labels: Record<string, string>;
  role: string;
  status: string;
  capacity: ResourceInfo;
  allocatable: ResourceInfo;
  info: NodeInfo;
  addresses: NodeAddress[];
  pods_on_node: number;
  metrics?: NodeMetrics;
  pods_details?: Pod[];
}

export interface Namespace {
  name: string;
  uid: string;
  status: string;
  labels: Record<string, string>;
  creation_timestamp: string | null;
}

export interface Deployment {
  name: string;
  namespace: string;
  uid: string;
  replicas: number;
  available_replicas: number;
  ready_replicas: number;
  labels: Record<string, string>;
}

export interface ServicePort {
  port: number;
  target_port: string;
  protocol: string;
}

export interface Service {
  name: string;
  namespace: string;
  uid: string;
  type: string;
  cluster_ip: string;
  ports: ServicePort[];
  labels: Record<string, string>;
  selector: Record<string, string>;
}

export interface ClusterData {
  nodes: Node[];
  namespaces: Namespace[];
  pods: Pod[];
  deployments: Deployment[];
  services: Service[];
}
