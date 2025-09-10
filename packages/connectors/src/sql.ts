import { Connector } from './base';
import { makeStep } from '@translation/core/src/lineage';
import knex, { Knex } from 'knex';

/**
 * SQL connector using knex for safe parameterized queries.  The
 * configuration must specify a supported client (pg or mysql2) and
 * connection details.  Discovery and execution are stubbed for
 * demonstration.
 */
export class SqlConnector implements Connector {
  id: string;
  kind = 'sql' as const;
  private db: Knex;
  constructor(id: string, cfg: { client: 'pg' | 'mysql2'; connection: any }) {
    this.id = id;
    this.db = knex({ client: cfg.client, connection: cfg.connection });
  }
  async describe() {
    return { objects: [{ name: 'customers', fields: [ { name: 'id', type: 'int', nullable: false }, { name: 'name', type: 'text', nullable: false }, { name: 'region', type: 'text', nullable: true } ] }] };
  }
  async execute(nativeQuery: any) {
    let builder = this.db.select(nativeQuery.select as string[]).from(nativeQuery.object as string);
    for (const w of (nativeQuery.where ?? [])) {
      builder = builder.whereRaw('?? ' + w.op + ' ?', [w.field, w.value]);
    }
    if (nativeQuery.orderBy) {
      builder = builder.orderBy(nativeQuery.orderBy.field, nativeQuery.orderBy.direction.toLowerCase() as any);
    }
    builder = builder.limit(nativeQuery.limit ?? 50);
    const { sql, bindings } = builder.toSQL().toNative();
    // const rows = await this.db.raw(sql, bindings).then(r => (r.rows ?? r[0]));
    const rows = [{ id: 1, name: 'ACME', region: 'US' }];
    return { rows, step: makeStep(this.id, { ...nativeQuery, sourceId: this.id, fields: nativeQuery.select, operators: [] } as any) };
  }
}