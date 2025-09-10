export type SourceKind = 'salesforce' | 'rest' | 'sql';

export interface DataSourceRef {
  id: string;
  kind: SourceKind;
  name: string;
  config: Record<string, any>;
}

export interface Term {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  examples?: string[];  // Qualifying examples
  counterExamples?: string[];  // Non-qualifying examples
  businessDefinition?: string;  // Clear business definition
  version?: string;  // Semantic versioning
  lastReviewed?: string;  // When was this term last validated?
  governance?: {
    requiresApproval?: boolean;
    approvalWorkflow?: string;
    dataSteward?: string;
    reviewCycle?: string;  // Monthly, quarterly, etc.
  };
}

export interface MappingRule {
  id: string;
  termId: string;
  sourceId: string;
  object: string;
  expression: string;
  fields: string[];
  fieldMappings: Record<string, string>;
}

export interface SemanticContract {
  id: string;
  name: string;
  terms: Term[];
  rules: MappingRule[];
  constraints?: {
    defaultLimit?: number;
    maxLimit?: number;
    timezone?: string;
  };
  governance?: {
    organization: string;
    dataStewards: string[];
    approvalWorkflow: 'single' | 'majority' | 'unanimous';
    reviewCycle: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  };
  semanticDebt?: {
    termCoverage: number;  // % of top terms with clear definitions
    lineageCompleteness: number;  // % of queries with full provenance
    wranglingMinutes: number;  // Median time to get trustworthy answer
    reworkTickets: number;  // Monthly definition-related tickets
    driftIncidents: number;  // Semantic drift events detected
    lastAssessment: string;
  };
}

export interface CanonicalQuery {
  object: string;
  select: string[];
  where?: Array<{ field: string; op: string; value: any }>;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' };
  limit?: number;
}

export interface SafePlan {
  sourceId: string;
  nativeQuery: any;
  operators: string[];
  fields: string[];
}

export interface Lineage {
  runId: string;
  timestamp: string;
  steps: Array<{
    sourceId: string;
    object: string;
    fields: string[];
    filter?: any;
    query?: any;
  }>;
}

export interface ResponseEnvelope<T = any> {
  data: T;
  lineage: Lineage;
  definitions?: Record<string, string>;
  notes?: string[];
}

export interface DiscoverySummary {
  objects: Array<{ name: string; fields: Array<{ name: string; type: string; nullable: boolean }>; hints?: { idField?: string; createdAt?: string; updatedAt?: string } }>;
}

export interface FieldProfile {
  name: string;
  nullRatio: number;
  distinctCount?: number;
  topValues?: Array<{ value: any; count: number }>;
  typeGuess?: string;
}

export interface SemanticDrift {
  id: string;
  termId: string;
  sourceId: string;
  detectedAt: string;
  driftType: 'schema_change' | 'field_removal' | 'type_change' | 'constraint_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string[];
  resolution?: string;
  resolvedAt?: string;
}

export interface SemanticDebtAssessment {
  organization: string;
  assessmentDate: string;
  assessedBy: string;
  overallScore: number;  // 0-100, higher is better
  metrics: {
    termCoverage: {
      score: number;
      current: number;
      target: number;
      topAmbiguousTerms: string[];
    };
    lineageCompleteness: {
      score: number;
      current: number;
      queriesWithoutProvenance: number;
    };
    wranglingEfficiency: {
      score: number;
      medianMinutes: number;
      improvement: number;  // % improvement since last assessment
    };
    reworkFrequency: {
      score: number;
      monthlyTickets: number;
      definitionRelated: number;
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: 'governance' | 'technical' | 'process' | 'training';
    action: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}