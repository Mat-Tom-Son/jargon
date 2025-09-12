// API Configuration for Jargon Gateway
// Connects frontend to the main gateway server

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  endpoints: {
    health: '/health',
    terms: '/terms',
    sources: '/sources',
    rules: '/rules',
    config: {
      status: '/config/status',
      update: '/config/update'
    },
    semanticDebt: {
      metrics: '/semantic-debt/metrics',
      assess: '/semantic-debt/assess',
      dashboard: '/semantic-debt/dashboard'
    },
    context: '/context',
    execute: '/execute'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};
