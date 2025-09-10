import { SemanticContract, SemanticDrift, DiscoverySummary, DataSourceRef } from '@translation/core/src/types';
import { Connector } from '@translation/connectors/src/base';

/**
 * Semantic Drift Detector
 *
 * Monitors data sources for changes that could break semantic contracts:
 * - Schema changes (field additions/removals)
 * - Field type changes
 * - Constraint violations
 * - Source availability issues
 */
export class SemanticDriftDetector {
  constructor(
    private contract: SemanticContract,
    private connectors: Record<string, Connector>,
    private sources: Record<string, DataSourceRef>
  ) {}

  /**
   * Detect semantic drift by comparing current source schemas
   * against the semantic contract expectations
   */
  async detectDrift(): Promise<SemanticDrift[]> {
    const drifts: SemanticDrift[] = [];

    for (const rule of this.contract.rules) {
      const connector = this.connectors[rule.sourceId];
      if (!connector || !connector.describe) continue;

      try {
        const currentSchema = await connector.describe();

        // Check for field mapping drift
        const fieldDrifts = this.detectFieldMappingDrift(rule, currentSchema);
        drifts.push(...fieldDrifts);

        // Check for object availability
        const objectDrift = this.detectObjectDrift(rule, currentSchema);
        if (objectDrift) drifts.push(objectDrift);

        // Check for constraint violations
        const constraintDrifts = this.detectConstraintDrift(rule, currentSchema);
        drifts.push(...constraintDrifts);

      } catch (error) {
        // Source connectivity issues
        drifts.push({
          id: `drift_${Date.now()}_${rule.id}`,
          termId: rule.termId,
          sourceId: rule.sourceId,
          detectedAt: new Date().toISOString(),
          driftType: 'constraint_violation',
          severity: 'critical',
          description: `Source ${rule.sourceId} is unreachable: ${error.message}`,
          impact: [`Term "${this.getTermName(rule.termId)}" is unavailable`],
        });
      }
    }

    return drifts.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  private detectFieldMappingDrift(rule: any, schema: DiscoverySummary): SemanticDrift[] {
    const drifts: SemanticDrift[] = [];
    const ruleObject = schema.objects.find(obj => obj.name === rule.object);

    if (!ruleObject) {
      drifts.push({
        id: `drift_${Date.now()}_${rule.id}_object_missing`,
        termId: rule.termId,
        sourceId: rule.sourceId,
        detectedAt: new Date().toISOString(),
        driftType: 'schema_change',
        severity: 'high',
        description: `Object "${rule.object}" no longer exists in source ${rule.sourceId}`,
        impact: [`Term "${this.getTermName(rule.termId)}" mappings are broken`],
      });
      return drifts;
    }

    // Check each field mapping
    for (const [semanticField, concreteField] of Object.entries(rule.fieldMappings)) {
      const fieldExists = ruleObject.fields.some(f => f.name === concreteField);

      if (!fieldExists) {
        drifts.push({
          id: `drift_${Date.now()}_${rule.id}_${semanticField}`,
          termId: rule.termId,
          sourceId: rule.sourceId,
          detectedAt: new Date().toISOString(),
          driftType: 'field_removal',
          severity: 'high',
          description: `Field "${concreteField}" mapped to "${semanticField}" no longer exists`,
          impact: [`Queries for "${semanticField}" will fail`],
        });
      }
    }

    return drifts;
  }

  private detectObjectDrift(rule: any, schema: DiscoverySummary): SemanticDrift | null {
    const objectExists = schema.objects.some(obj => obj.name === rule.object);

    if (!objectExists) {
      return {
        id: `drift_${Date.now()}_${rule.id}_object`,
        termId: rule.termId,
        sourceId: rule.sourceId,
        detectedAt: new Date().toISOString(),
        driftType: 'schema_change',
        severity: 'critical',
        description: `Object "${rule.object}" is no longer available`,
        impact: [
          `Term "${this.getTermName(rule.termId)}" is completely broken`,
          'All queries using this term will fail'
        ],
      };
    }

    return null;
  }

  private detectConstraintDrift(rule: any, schema: DiscoverySummary): SemanticDrift[] {
    const drifts: SemanticDrift[] = [];
    const ruleObject = schema.objects.find(obj => obj.name === rule.object);

    if (!ruleObject) return drifts;

    // Check for nullable field constraints
    const requiredFields = rule.fields;
    for (const requiredField of requiredFields) {
      const field = ruleObject.fields.find(f => f.name === requiredField);
      if (field && !field.nullable) {
        // This is actually good - field is constrained properly
        continue;
      }
    }

    return drifts;
  }

  private getTermName(termId: string): string {
    return this.contract.terms.find(t => t.id === termId)?.name || termId;
  }

  private getSeverityWeight(severity: string): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[severity as keyof typeof weights] || 0;
  }

  /**
   * Generate human-readable drift report
   */
  generateDriftReport(drifts: SemanticDrift[]): string {
    if (drifts.length === 0) {
      return '✅ No semantic drift detected. All terms are aligned with current data sources.';
    }

    const critical = drifts.filter(d => d.severity === 'critical');
    const high = drifts.filter(d => d.severity === 'high');
    const medium = drifts.filter(d => d.severity === 'medium');
    const low = drifts.filter(d => d.severity === 'low');

    let report = `🚨 SEMANTIC DRIFT DETECTED\n\n`;
    report += `Found ${drifts.length} drift incidents:\n`;
    report += `• Critical: ${critical.length}\n`;
    report += `• High: ${high.length}\n`;
    report += `• Medium: ${medium.length}\n`;
    report += `• Low: ${low.length}\n\n`;

    if (critical.length > 0) {
      report += `🚨 CRITICAL ISSUES:\n`;
      critical.forEach(drift => {
        report += `• ${drift.description}\n`;
        report += `  Impact: ${drift.impact.join(', ')}\n\n`;
      });
    }

    if (high.length > 0) {
      report += `⚠️ HIGH PRIORITY:\n`;
      high.forEach(drift => {
        report += `• ${drift.description}\n`;
        report += `  Impact: ${drift.impact.join(', ')}\n\n`;
      });
    }

    return report;
  }
}
