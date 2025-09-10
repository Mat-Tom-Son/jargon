/**
 * Build a simple OpenAPI specification for the translation layer API.
 * This definition covers the /execute and /context endpoints.  You
 * could extend it with more details or path parameters.  The goal
 * here is to provide a machine‑readable contract for SDK generators.
 */
export function buildOpenAPI() {
  return {
    openapi: '3.0.0',
    info: { title: 'Translation Layer API', version: '0.1.0' },
    paths: {
      '/execute': {
        post: {
          summary: 'Run a canonical query',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CanonicalQuery' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Response envelope',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ResponseEnvelope' }
                }
              }
            }
          }
        }
      },
      '/context': {
        get: {
          summary: 'Fetch LLM context bundle',
          responses: {
            '200': { description: 'Context bundle' }
          }
        }
      }
    },
    components: {
      schemas: {
        CanonicalQuery: {
          type: 'object',
          properties: {
            object: { type: 'string' },
            select: { type: 'array', items: { type: 'string' } },
            where: {
              type: 'array',
              items: {
                type: 'object',
                properties: { field: { type: 'string' }, op: { type: 'string' }, value: {} }
              }
            },
            orderBy: {
              type: 'object',
              properties: { field: { type: 'string' }, direction: { type: 'string', enum: ['ASC', 'DESC'] } }
            },
            limit: { type: 'integer' }
          },
          required: ['object', 'select']
        },
        ResponseEnvelope: {
          type: 'object'
        }
      }
    }
  };
}