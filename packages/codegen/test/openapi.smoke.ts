import assert from 'assert';
import { buildOpenAPI } from '../src/openapiBuilder';

const spec = buildOpenAPI();
assert.strictEqual(spec.openapi, '3.0.0');
assert.ok(spec.paths['/execute']);
assert.ok(spec.paths['/context']);
console.log('✅ openapi.smoke passed');

