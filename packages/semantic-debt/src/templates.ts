/**
 * Semantic Definition Templates
 *
 * Pre-built templates for common enterprise business terms
 * that help organizations quickly establish semantic contracts.
 */

export interface TermTemplate {
  category: string;
  name: string;
  businessDefinition: string;
  examples: string[];
  counterExamples: string[];
  commonMappings: {
    salesforce?: Record<string, string>;
    sql?: Record<string, string>;
    rest?: Record<string, string>;
  };
  governance: {
    reviewCycle: 'monthly' | 'quarterly' | 'biannual' | 'annual';
    dataSteward: string;
    requiresApproval: boolean;
  };
}

export const SEMANTIC_TEMPLATES: Record<string, TermTemplate> = {
  // Customer & User Terms
  active_customer: {
    category: 'Customer',
    name: 'Active Customer',
    businessDefinition: 'A customer who has an active paid subscription and has not initiated churn within the last 90 days',
    examples: [
      'Customer with subscription renewed in last 30 days',
      'Customer who upgraded their plan this quarter',
      'Customer with active auto-renewal enabled'
    ],
    counterExamples: [
      'Trial user who hasn\'t converted to paid',
      'Customer who cancelled subscription last month',
      'Free tier user without paid features',
      'Customer in grace period before churn'
    ],
    commonMappings: {
      salesforce: {
        id: 'Id',
        name: 'Name',
        is_active: 'Active__c = true AND Churn_Date__c = null',
        last_payment: 'Last_Payment_Date__c'
      },
      sql: {
        id: 'customer_id',
        name: 'customer_name',
        is_active: 'subscription_status = \'active\' AND last_payment_date > DATE_SUB(NOW(), INTERVAL 90 DAY)',
        last_payment: 'last_payment_date'
      }
    },
    governance: {
      reviewCycle: 'quarterly',
      dataSteward: 'Customer Success Team',
      requiresApproval: true
    }
  },

  customer_lifetime_value: {
    category: 'Customer',
    name: 'Customer Lifetime Value',
    businessDefinition: 'The total net profit attributed to the entire future relationship with a customer',
    examples: [
      'Total revenue minus cost of acquisition and support for a 5-year customer',
      'Projected future value based on current subscription and growth rate'
    ],
    counterExamples: [
      'One-time purchase value',
      'Current quarter revenue only'
    ],
    commonMappings: {
      sql: {
        customer_id: 'customer_id',
        lifetime_value: 'SUM(revenue - cac - support_cost) OVER (PARTITION BY customer_id ORDER BY date)',
        acquisition_date: 'first_purchase_date'
      }
    },
    governance: {
      reviewCycle: 'quarterly',
      dataSteward: 'Finance Team',
      requiresApproval: true
    }
  },

  // Revenue Terms
  recurring_revenue: {
    category: 'Revenue',
    name: 'Recurring Revenue',
    businessDefinition: 'Revenue from subscriptions and contracts that renew automatically or on a regular basis',
    examples: [
      'Monthly subscription payments',
      'Annual contract renewals',
      'Auto-renewing service agreements'
    ],
    counterExamples: [
      'One-time consulting fees',
      'One-off product sales',
      'Professional services revenue'
    ],
    commonMappings: {
      salesforce: {
        id: 'Id',
        amount: 'Amount',
        is_recurring: 'Recurring__c = true',
        renewal_date: 'Renewal_Date__c'
      },
      sql: {
        id: 'revenue_id',
        amount: 'amount',
        is_recurring: 'revenue_type IN (\'subscription\', \'contract\')',
        frequency: 'billing_frequency'
      }
    },
    governance: {
      reviewCycle: 'monthly',
      dataSteward: 'Finance Team',
      requiresApproval: true
    }
  },

  // Product Terms
  product_usage: {
    category: 'Product',
    name: 'Product Usage',
    businessDefinition: 'Measured engagement with product features and services over a defined time period',
    examples: [
      'Daily active users with feature X enabled',
      'API calls per month above baseline',
      'Feature adoption rate within first 30 days'
    ],
    counterExamples: [
      'Total registered users',
      'One-time feature visits',
      'Support ticket volume'
    ],
    commonMappings: {
      sql: {
        user_id: 'user_id',
        feature: 'feature_name',
        usage_count: 'COUNT(*) FILTER (WHERE event_type = \'usage\')',
        last_used: 'MAX(event_timestamp)'
      }
    },
    governance: {
      reviewCycle: 'monthly',
      dataSteward: 'Product Team',
      requiresApproval: true
    }
  },

  // Support Terms
  customer_satisfaction: {
    category: 'Support',
    name: 'Customer Satisfaction',
    businessDefinition: 'Measure of how well the product or service meets customer expectations',
    examples: [
      'NPS score of 8 or higher',
      'CSAT survey response of "Very Satisfied"',
      'Support ticket resolution with positive feedback'
    ],
    counterExamples: [
      'Raw ticket volume',
      'Response time metrics only',
      'Feature usage statistics'
    ],
    commonMappings: {
      sql: {
        customer_id: 'customer_id',
        satisfaction_score: 'nps_score',
        survey_response: 'csat_response',
        feedback_date: 'survey_date'
      }
    },
    governance: {
      reviewCycle: 'monthly',
      dataSteward: 'Customer Success Team',
      requiresApproval: true
    }
  },

  // Operational Terms
  system_uptime: {
    category: 'Operations',
    name: 'System Uptime',
    businessDefinition: 'Percentage of time the system is available and functioning as expected',
    examples: [
      '99.9% availability excluding planned maintenance',
      'Zero downtime incidents in the last quarter',
      'All critical services operational during business hours'
    ],
    counterExamples: [
      'Total uptime including maintenance windows',
      'Individual service uptime without business impact',
      'Development environment availability'
    ],
    commonMappings: {
      sql: {
        service: 'service_name',
        uptime_percentage: '(total_time - downtime_minutes) / total_time * 100',
        incidents: 'COUNT(*) FILTER (WHERE severity = \'critical\')',
        last_incident: 'MAX(incident_date)'
      }
    },
    governance: {
      reviewCycle: 'monthly',
      dataSteward: 'DevOps Team',
      requiresApproval: true
    }
  }
};

export function getTemplatesByCategory(category: string): TermTemplate[] {
  return Object.values(SEMANTIC_TEMPLATES).filter(template =>
    template.category.toLowerCase() === category.toLowerCase()
  );
}

export function getAllCategories(): string[] {
  return [...new Set(Object.values(SEMANTIC_TEMPLATES).map(t => t.category))];
}

export function searchTemplates(query: string): TermTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(SEMANTIC_TEMPLATES).filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.category.toLowerCase().includes(lowercaseQuery) ||
    template.businessDefinition.toLowerCase().includes(lowercaseQuery)
  );
}

export function getTemplateByName(name: string): TermTemplate | undefined {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return SEMANTIC_TEMPLATES[key];
}
