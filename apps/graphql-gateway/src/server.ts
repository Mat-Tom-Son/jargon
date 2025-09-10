import { createServer } from '@graphql-yoga/node';
import { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLString } from 'graphql';
import { Engine } from '@translation/core/src/engine';
import { SemanticContract } from '@translation/core/src/types';

/**
 * Build a simple GraphQL schema from the active semantic contract.  Each
 * term with field mappings becomes a GraphQL type, and a root query
 * resolver is generated that compiles and executes canonical queries
 * via the translation engine.  This is a stub intended for
 * experimentation rather than production use.
 */
function buildSchemaFromContract(engine: Engine, contract: SemanticContract) {
  const typeMap: Record<string, GraphQLObjectType> = {};
  for (const term of contract.terms) {
    const rules = contract.rules.filter(r => r.termId === term.id);
    const fields = new Set<string>();
    rules.forEach(r => Object.keys((r as any).fieldMappings || {}).forEach(f => fields.add(f)));
    if (fields.size > 0) {
      const typeName = term.name.replace(/\s+/g, '_');
      typeMap[term.name] = new GraphQLObjectType({
        name: typeName,
        fields: () => {
          const fieldConfig: any = {};
          fields.forEach(f => fieldConfig[f] = { type: GraphQLString });
          return fieldConfig;
        }
      });
    }
  }
  const queryFields: any = {};
  Object.entries(typeMap).forEach(([termName, gqlType]) => {
    queryFields[termName] = {
      type: new GraphQLList(gqlType),
      resolve: async (_src: any, _args: any) => {
        const q = {
          object: termName,
          select: Object.keys(gqlType.getFields()),
          limit: 50
        } as any;
        const plans = engine.compile(q);
        const result = await engine.executePlans(plans);
        return result.data;
      }
    };
  });
  const Query = new GraphQLObjectType({ name: 'Query', fields: queryFields });
  return new GraphQLSchema({ query: Query });
}

// The server bootstraps a semantic contract and engine just like the
// REST gateway.  In practice you would share the engine instance
// between HTTP and GraphQL layers.
export function startServer(engine: Engine, contract: SemanticContract) {
  const schema = buildSchemaFromContract(engine, contract);
  const server = createServer({ schema });
  server.start();
}