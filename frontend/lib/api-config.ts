// API Configuration - Easy to modify for different environments

// 🎯 QUICK SWITCH: Uncomment one of these to test with real APIs!

// Option A: JSONPlaceholder (Free public API - Great for testing)
// export const API_CONFIG = {
//   baseUrl: 'https://jsonplaceholder.typicode.com',
//   endpoints: {
//     terms: '/posts',     // Maps blog posts to business terms
//     sources: '/users',   // Maps users to data sources
//     rules: '/comments',  // Maps comments to rules
//     // Other endpoints use fallback data
//   }
// };

// Option B: ReqRes (Clean mock API)
// export const API_CONFIG = {
//   baseUrl: 'https://reqres.in/api',
//   endpoints: {
//     terms: '/users',
//     sources: '/users',
//   }
// };

// Option C: Your Production API (When ready)
// export const API_CONFIG = {
//   baseUrl: 'https://your-production-api.com/api/v1',
//   endpoints: {
//     health: '/health',
//     terms: '/business-terms',
//     sources: '/data-sources',
//     semanticDebt: {
//       metrics: '/analytics/semantic-debt',
//       assess: '/analytics/assess',
//       dashboard: '/analytics/dashboard'
//     }
//   }
// };

// Default: Local Mock Server
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  endpoints: {
    health: '/health',
    terms: '/terms',
    sources: '/sources',
    rules: '/rules',
    semanticDebt: {
      metrics: '/semantic-debt/metrics',
      assess: '/semantic-debt/assess',
      dashboard: '/semantic-debt/dashboard'
    },
    context: '/context',
    execute: '/execute'
  }
};

// 🎯 QUICK API SWITCHING EXAMPLES:
// ================================

// 1. Switch to JSONPlaceholder (for testing terms)
// export const API_CONFIG = {
//   baseUrl: 'https://jsonplaceholder.typicode.com',
//   endpoints: {
//     terms: '/posts', // Maps posts to terms
//     sources: '/users',
//     // Other endpoints will fallback to mock data
//   }
// };

// 2. Switch to GitHub API (for testing)
// export const API_CONFIG = {
//   baseUrl: 'https://api.github.com',
//   endpoints: {
//     terms: '/repos/vercel/next.js/issues',
//     sources: '/users/octocat/repos',
//   }
// };

// 3. Switch to ReqRes API (for testing users)
// export const API_CONFIG = {
//   baseUrl: 'https://reqres.in/api',
//   endpoints: {
//     terms: '/users',
//     sources: '/users',
//   }
// };

// 4. Your Production API
// export const API_CONFIG = {
//   baseUrl: 'https://your-production-api.com/api/v1',
//   endpoints: {
//     health: '/health',
//     terms: '/business-terms',
//     sources: '/data-sources',
//     semanticDebt: {
//       metrics: '/analytics/semantic-debt',
//       assess: '/analytics/assess',
//       dashboard: '/analytics/dashboard'
//     }
//   }
// };

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

// Example of switching to a real API:
// export const API_CONFIG = {
//   baseUrl: 'https://your-real-api.com/api/v1',
//   endpoints: { ... }
// };

// Or for testing with public APIs:
// export const API_CONFIG = {
//   baseUrl: 'https://jsonplaceholder.typicode.com',
//   endpoints: {
//     terms: '/posts', // Map to different endpoints
//     ...rest of your endpoints
//   }
// };
