import { SemanticContract, SemanticDebtAssessment, Term, MappingRule, ResponseEnvelope } from '@translation/core/src/types';

/**
 * Semantic Debt Assessment Engine
 *
 * Measures the four key indicators of semantic debt:
 * 1. Term Coverage - % of top ambiguous terms with clear definitions
 * 2. Lineage Completeness - % of answers with full provenance
 * 3. Wrangling Efficiency - Time to get trustworthy answers
 * 4. Rework Frequency - Definition-related tickets and incidents
 */
export class SemanticDebtAssessor {
  constructor(
    private contract: SemanticContract,
    private queryHistory: ResponseEnvelope[] = []
  ) {}

  /**
   * Comprehensive semantic debt assessment for an organization
   */
  assess(organization: string, assessedBy: string): SemanticDebtAssessment {
    const termCoverage = this.assessTermCoverage();
    const lineageCompleteness = this.assessLineageCompleteness();
    const wranglingEfficiency = this.assessWranglingEfficiency();
    const reworkFrequency = this.assessReworkFrequency();

    const metrics = {
      termCoverage,
      lineageCompleteness,
      wranglingEfficiency,
      reworkFrequency
    };

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (termCoverage.score * 0.3) +
      (lineageCompleteness.score * 0.3) +
      (wranglingEfficiency.score * 0.2) +
      (reworkFrequency.score * 0.2)
    );

    return {
      organization,
      assessmentDate: new Date().toISOString(),
      assessedBy,
      overallScore,
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };
  }

  private assessTermCoverage() {
    const terms = this.contract.terms;
    const definedTerms = terms.filter(t =>
      t.businessDefinition &&
      t.examples &&
      t.examples.length > 0 &&
      t.owner
    );

    // Identify top ambiguous terms (terms used in multiple rules = high ambiguity)
    const termUsage = new Map<string, number>();
    this.contract.rules.forEach(rule => {
      termUsage.set(rule.termId, (termUsage.get(rule.termId) || 0) + 1);
    });

    const topAmbiguousTerms = Array.from(termUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([termId]) => terms.find(t => t.id === termId)?.name || termId)
      .filter(name => !definedTerms.some(t => t.name === name));

    return {
      score: Math.round((definedTerms.length / terms.length) * 100),
      current: definedTerms.length,
      target: terms.length,
      topAmbiguousTerms
    };
  }

  private assessLineageCompleteness() {
    if (this.queryHistory.length === 0) {
      return { score: 0, current: 0, queriesWithoutProvenance: 0 };
    }

    const withCompleteLineage = this.queryHistory.filter(response =>
      response.lineage &&
      response.lineage.steps.length > 0 &&
      response.lineage.steps.every(step =>
        step.sourceId && step.object && step.fields.length > 0
      )
    );

    return {
      score: Math.round((withCompleteLineage.length / this.queryHistory.length) * 100),
      current: withCompleteLineage.length,
      queriesWithoutProvenance: this.queryHistory.length - withCompleteLineage.length
    };
  }

  private assessWranglingEfficiency() {
    // This would be populated from actual usage metrics
    // For now, provide a framework for measurement
    const medianMinutes = 45; // Mock data - would come from actual measurements
    const baselineMinutes = 120; // Industry average
    const improvement = Math.round(((baselineMinutes - medianMinutes) / baselineMinutes) * 100);

    return {
      score: Math.max(0, Math.min(100, 100 - medianMinutes)), // Lower minutes = higher score
      medianMinutes,
      improvement
    };
  }

  private assessReworkFrequency() {
    // This would be populated from ticketing system integration
    const monthlyTickets = 12; // Mock data
    const definitionRelated = 8; // Mock data

    // Score based on rework frequency (lower tickets = higher score)
    const score = Math.max(0, 100 - (monthlyTickets * 5));

    return {
      score,
      monthlyTickets,
      definitionRelated
    };
  }

  private generateRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.termCoverage.score < 70) {
      recommendations.push({
        priority: 'high' as const,
        category: 'governance' as const,
        action: 'Define clear business definitions for top 10 ambiguous terms',
        expectedImpact: `Increase term coverage from ${metrics.termCoverage.score}% to 90%+`,
        effort: 'medium' as const
      });
    }

    if (metrics.lineageCompleteness.score < 80) {
      recommendations.push({
        priority: 'high' as const,
        category: 'technical' as const,
        action: 'Implement comprehensive lineage tracking for all queries',
        expectedImpact: 'Eliminate trust issues by showing complete data provenance',
        effort: 'low' as const
      });
    }

    if (metrics.wranglingEfficiency.medianMinutes > 60) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'process' as const,
        action: 'Establish semantic contract review process',
        expectedImpact: 'Reduce time to trustworthy answers by 50%',
        effort: 'medium' as const
      });
    }

    return recommendations;
  }
}
