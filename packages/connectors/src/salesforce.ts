import { Connector } from './base';
import { makeStep } from '@translation/core/src/lineage';

/**
 * Salesforce connector.  In a real implementation this would use
 * jsforce or the official Salesforce SDK and handle OAuth token
 * refresh.  Here it returns static describe data and stubbed query
 * results for demonstration.
 */
export class SalesforceConnector implements Connector {
  id: string;
  kind = 'salesforce' as const;
  private client: any;
  constructor(id: string, cfg: { instanceUrl: string; accessToken: string }) {
    this.id = id;
    // this.client = new jsforce.Connection({ instanceUrl: cfg.instanceUrl, accessToken: cfg.accessToken });
    this.client = { query: async (_: string) => ({ records: [] }) };
  }
  async describe() {
    return {
      objects: [
        {
          name: 'Account',
          fields: [
            { name: 'Id', type: 'id', nullable: false },
            { name: 'Name', type: 'string', nullable: false },
            { name: 'BillingCountry', type: 'string', nullable: true }
          ]
        },
        {
          name: 'Opportunity',
          fields: [
            { name: 'Id', type: 'id', nullable: false },
            { name: 'Name', type: 'string', nullable: false },
            { name: 'StageName', type: 'string', nullable: false },
            { name: 'Amount', type: 'number', nullable: true },
            { name: 'CreatedDate', type: 'timestamp', nullable: false }
          ]
        }
      ]
    };
  }
  async execute(nativeQuery: any) {
    // Build a SOQL string from the native query.  For brevity we
    // implement a trivial builder here; use a library in production.
    const soql = buildSOQL(nativeQuery);
    // const res = await this.client.query(soql);
    const res = { records: [{ Id: '006', Name: 'ACME', StageName: 'Proposal', Amount: 10000 }] };
    return { rows: res.records, step: makeStep(this.id, { ...nativeQuery, sourceId: this.id, fields: nativeQuery.select, operators: [] } as any) };
  }
}

function buildSOQL(q: any) {
    const where = (q.where ?? []).map((w: any) => `${w.field} ${w.op} ${formatSOQLValue(w.value)}`).join(' AND ');
    return `SELECT ${q.select.join(',')} FROM ${q.object}` + (where ? ` WHERE ${where}` : '') +
           (q.orderBy ? ` ORDER BY ${q.orderBy.field} ${q.orderBy.direction}` : '') + ` LIMIT ${q.limit ?? 50}`;
}
function formatSOQLValue(v: any) {
    return typeof v === 'string' && !v.startsWith('LAST_') ? `\'${v.replace(/'/g, "\\'")}\'` : String(v);
}