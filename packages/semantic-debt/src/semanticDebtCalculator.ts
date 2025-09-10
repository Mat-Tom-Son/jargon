/**
 * Semantic Debt Calculator
 *
 * Helps enterprises assess their current semantic debt level
 * and provides actionable recommendations for improvement.
 */

export interface AssessmentInput {
  // Organization basics
  organizationSize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  dataSources: number;
  businessTerms: number;

  // Current state
  definedTerms: number; // Terms with clear definitions
  termsWithOwners: number; // Terms with assigned owners
  queriesWithLineage: number; // Queries showing complete provenance
  totalQueries: number;
  avgTimeToAnswer: number; // Minutes
  monthlyReworkTickets: number;

  // Pain points
  conflictingDefinitions: number; // Number of terms with multiple definitions
  manualOverrides: number; // Monthly manual data corrections
  stakeholderDisagreements: number; // Monthly definition debates
}

export interface AssessmentResult {
  overallScore: number;
  semanticDebtLevel: 'low' | 'moderate' | 'high' | 'critical';
  metrics: {
    termCoverage: number;
    lineageCompleteness: number;
    wranglingEfficiency: number;
    reworkFrequency: number;
    governanceMaturity: number;
  };
  estimatedCosts: {
    monthlyWaste: number;
    annualWaste: number;
    trustErosion: number;
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'governance' | 'technical' | 'process' | 'organizational';
    action: string;
    expectedSavings: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: 'immediate' | '1-3 months' | '3-6 months' | '6+ months';
  }>;
  nextSteps: string[];
}

export class SemanticDebtCalculator {
  calculate(input: AssessmentInput): AssessmentResult {
    const metrics = this.calculateMetrics(input);
    const overallScore = this.calculateOverallScore(metrics);
    const semanticDebtLevel = this.determineDebtLevel(overallScore);
    const estimatedCosts = this.estimateCosts(input, metrics);
    const recommendations = this.generateRecommendations(input, metrics);

    return {
      overallScore,
      semanticDebtLevel,
      metrics,
      estimatedCosts,
      recommendations,
      nextSteps: this.generateNextSteps(semanticDebtLevel, recommendations)
    };
  }

  private calculateMetrics(input: AssessmentInput) {
    const termCoverage = Math.round((input.definedTerms / input.businessTerms) * 100);
    const lineageCompleteness = Math.round((input.queriesWithLineage / input.totalQueries) * 100);

    // Wrangling efficiency score (lower time = higher score)
    const wranglingEfficiency = Math.max(0, Math.min(100, 100 - (input.avgTimeToAnswer * 2)));

    // Rework frequency score (lower tickets = higher score)
    const reworkFrequency = Math.max(0, 100 - (input.monthlyReworkTickets * 5));

    // Governance maturity based on ownership and conflicts
    const ownershipRate = Math.round((input.termsWithOwners / input.businessTerms) * 100);
    const conflictRate = Math.round((input.conflictingDefinitions / input.businessTerms) * 100);
    const governanceMaturity = Math.max(0, ownershipRate - (conflictRate * 2));

    return {
      termCoverage,
      lineageCompleteness,
      wranglingEfficiency,
      reworkFrequency,
      governanceMaturity
    };
  }

  private calculateOverallScore(metrics: any): number {
    // Weighted average based on semantic debt framework
    return Math.round(
      (metrics.termCoverage * 0.25) +
      (metrics.lineageCompleteness * 0.25) +
      (metrics.wranglingEfficiency * 0.2) +
      (metrics.reworkFrequency * 0.15) +
      (metrics.governanceMaturity * 0.15)
    );
  }

  private determineDebtLevel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private estimateCosts(input: AssessmentInput, metrics: any) {
    const analystHourlyRate = 75; // Average analyst hourly rate
    const executiveHourlyRate = 150; // Average executive hourly rate

    // Monthly waste from wrangling
    const monthlyWaste = (input.avgTimeToAnswer / 60) * analystHourlyRate * 20; // 20 analysts

    // Annual waste
    const annualWaste = monthlyWaste * 12;

    // Trust erosion (estimated impact on decision quality)
    const trustErosion = Math.round((100 - metrics.overallScore) * 0.8); // Percentage

    return {
      monthlyWaste: Math.round(monthlyWaste),
      annualWaste: Math.round(annualWaste),
      trustErosion
    };
  }

  private generateRecommendations(input: AssessmentInput, metrics: any) {
    const recommendations = [];

    // Critical recommendations
    if (metrics.termCoverage < 50) {
      recommendations.push({
        priority: 'critical' as const,
        category: 'governance' as const,
        action: 'Conduct term inventory and establish clear definitions for top 20 business terms',
        expectedSavings: Math.round(input.monthlyReworkTickets * 1000),
        effort: 'medium' as const,
        timeframe: '1-3 months' as const
      });
    }

    if (metrics.lineageCompleteness < 60) {
      recommendations.push({
        priority: 'critical' as const,
        category: 'technical' as const,
        action: 'Implement automated lineage tracking for all data queries',
        expectedSavings: Math.round((input.avgTimeToAnswer * 0.3) * 75 * 20 * 12),
        effort: 'medium' as const,
        timeframe: '1-3 months' as const
      });
    }

    // High priority
    if (input.conflictingDefinitions > input.businessTerms * 0.1) {
      recommendations.push({
        priority: 'high' as const,
        category: 'organizational' as const,
        action: 'Establish data stewardship council to resolve definition conflicts',
        expectedSavings: Math.round(input.stakeholderDisagreements * 2000),
        effort: 'high' as const,
        timeframe: '3-6 months' as const
      });
    }

    if (metrics.governanceMaturity < 40) {
      recommendations.push({
        priority: 'high' as const,
        category: 'process' as const,
        action: 'Implement term lifecycle management with approval workflows',
        expectedSavings: Math.round(input.monthlyReworkTickets * 1500),
        effort: 'medium' as const,
        timeframe: '3-6 months' as const
      });
    }

    // Medium priority
    if (input.manualOverrides > 50) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'process' as const,
        action: 'Automate data validation rules and reduce manual overrides',
        expectedSavings: Math.round(input.manualOverrides * 100),
        effort: 'medium' as const,
        timeframe: '3-6 months' as const
      });
    }

    return recommendations;
  }

  private generateNextSteps(debtLevel: string, recommendations: any[]): string[] {
    const steps = [
      'Schedule semantic debt assessment workshop with key stakeholders',
      'Identify and prioritize top 10 ambiguous business terms',
      'Establish data stewardship governance structure'
    ];

    if (debtLevel === 'critical' || debtLevel === 'high') {
      steps.unshift('Conduct executive briefing on semantic debt impact');
    }

    if (recommendations.some(r => r.category === 'technical')) {
      steps.push('Evaluate semantic layer technology solutions');
    }

    steps.push('Create semantic debt reduction roadmap and timeline');

    return steps;
  }
}

// Export a default assessment calculator instance
export const semanticDebtCalculator = new SemanticDebtCalculator();
