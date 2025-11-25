import axios from 'axios';
import type { Node, ClusterData } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchClusterData = async (): Promise<ClusterData> => {
  const response = await api.get<ClusterData>('/cluster');
  return response.data;
};

export const fetchNodes = async (): Promise<Node[]> => {
  const response = await api.get<Node[]>('/nodes');
  return response.data;
};

export const fetchNodeDetails = async (nodeName: string): Promise<Node> => {
  const response = await api.get<Node>(`/nodes/${nodeName}`);
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; message: string }> => {
  const response = await api.get('/health');
  return response.data;
};
