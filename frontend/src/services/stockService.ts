import apiClient from '@/utils/api';
import { ApiResponse, PortfolioSummary } from '@/types';

/**
 * Fetches the full portfolio data including live CMP, P/E ratios,
 * and computed fields from the backend API.
 */
export async function fetchPortfolio(): Promise<PortfolioSummary> {
  const response = await apiClient.get<ApiResponse<PortfolioSummary>>('/stocks/portfolio');
  return response.data.data;
}

/**
 * Fetches backend health status.
 */
export async function fetchHealthStatus(): Promise<{
  status: string;
  uptime: number;
  timestamp: string;
}> {
  const response = await apiClient.get('/health');
  return response.data;
}
