import assert from 'assert';
import { Compiler } from '../src/compiler';
import { SemanticContract, CanonicalQuery } from '../src/types';

const contract: SemanticContract = {
  id: 'test',
  name: 'Test Contract',
  terms: [
    { id: 't_active_customer', name: 'Active Customer', description: 'A test term' }
  ],
  rules: [
    {
      id: 'r1',
      termId: 't_active_customer',
      sourceId: 'postgres_v1',
      object: 'customers',
      expression: "is_active = true",
      fields: ['id', 'name', 'is_active'],
      fieldMappings: { id: 'id', name: 'name', is_active: 'is_active' }
    }
  ],
  constraints: { defaultLimit: 50, maxLimit: 200 }
};

const q: CanonicalQuery = { object: 'customers', select: ['id', 'name'], limit: 10 };

const plans = new Compiler(contract).compile(q);
assert.strictEqual(plans.length, 1, 'Expected one plan');
assert.strictEqual(plans[0].sourceId, 'postgres_v1');
assert.ok(plans[0].fields.includes('id'));
assert.ok(plans[0].operators.length === 0);

console.log('✅ compiler.basic passed');

