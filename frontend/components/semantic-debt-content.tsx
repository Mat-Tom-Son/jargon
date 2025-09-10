'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Clock, DollarSign, TrendingUp, TrendingDown, Loader2, BarChart3, Target, Zap } from "lucide-react"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface SemanticMetrics {
  overallScore: number;
  termCoverage: number;
  lineageCompleteness: number;
  wranglingMinutes: number;
  reworkTickets: number;
  monthlyWaste: number;
  annualWaste: number;
}

export function SemanticDebtContent() {
  const [metrics, setMetrics] = useState<SemanticMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.endpoints.semanticDebt.metrics));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch semantic debt metrics:', err);
        setError('Failed to load semantic debt metrics. Using fallback data.');

        // Fallback to mock data
        setMetrics({
          overallScore: 72,
          termCoverage: 65,
          lineageCompleteness: 78,
          wranglingMinutes: 45,
          reworkTickets: 12,
          monthlyWaste: 45000,
          annualWaste: 540000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading semantic debt assessment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Metrics</h3>
            <p className="text-muted-foreground">Unable to fetch semantic debt data from the backend.</p>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Semantic Debt Dashboard</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Comprehensive assessment of semantic debt across your organization. Measure impact, track improvements, and prioritize remediation efforts.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">Real-time health monitoring</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">ROI-driven recommendations</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">Actionable insights</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Trends
          </Button>
          <Button>
            <CheckCircle className="h-4 w-4 mr-2" />
            Run Assessment
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className={`border-0 shadow-lg ${
        metrics.overallScore >= 80 ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/50' :
        metrics.overallScore >= 60 ? 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/50 dark:to-orange-900/50' :
        'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/50 dark:to-rose-900/50'
      }`}>
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`p-3 rounded-full ${
              metrics.overallScore >= 80 ? 'bg-green-500/10' :
              metrics.overallScore >= 60 ? 'bg-yellow-500/10' :
              'bg-red-500/10'
            }`}>
              <BarChart3 className={`h-8 w-8 ${
                metrics.overallScore >= 80 ? 'text-green-600 dark:text-green-400' :
                metrics.overallScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
          <CardTitle className={`text-2xl font-bold ${
            metrics.overallScore >= 80 ? 'text-green-900 dark:text-green-100' :
            metrics.overallScore >= 60 ? 'text-yellow-900 dark:text-yellow-100' :
            'text-red-900 dark:text-red-100'
          }`}>
            Overall Semantic Health Score
          </CardTitle>
          <CardDescription className="text-base">Based on term coverage, lineage completeness, and process efficiency</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className={`text-7xl font-black ${getScoreColor(metrics.overallScore)}`}>
            {metrics.overallScore}%
          </div>

          <div className={`text-lg font-medium px-4 py-2 rounded-full inline-block ${
            metrics.overallScore >= 80 ? 'bg-green-500/10 text-green-800 dark:text-green-200' :
            metrics.overallScore >= 60 ? 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-200' :
            'bg-red-500/10 text-red-800 dark:text-red-200'
          }`}>
            {metrics.overallScore >= 80 ? 'Excellent - Well-managed semantic layer' :
             metrics.overallScore >= 60 ? 'Good - Room for improvement' :
             'Needs Attention - High semantic debt detected'}
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">${metrics.monthlyWaste.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Monthly Waste</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">Potential savings</div>
            </div>
            <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-white/20">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">${metrics.annualWaste.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Annual Waste</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">Total impact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-blue-900 dark:text-blue-100 font-semibold">Term Coverage</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">Business term definitions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{metrics.termCoverage}%</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">covered</div>
            </div>
            <div className="space-y-2">
              <Progress value={metrics.termCoverage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {metrics.termCoverage}%</span>
                <span>Target: 90%+</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Percentage of business terms with clear definitions and owners
            </p>
            {metrics.termCoverage < 70 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <div className="font-medium">Action Required</div>
                  <div>Define 5 more critical business terms to improve coverage</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100 font-semibold">Lineage Completeness</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">Data provenance tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{metrics.lineageCompleteness}%</div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">complete</div>
            </div>
            <div className="space-y-2">
              <Progress value={metrics.lineageCompleteness} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {metrics.lineageCompleteness}%</span>
                <span>Target: 95%+</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Percentage of queries that show complete data provenance
            </p>
            {metrics.lineageCompleteness < 80 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium">Recommendation</div>
                  <div>Enable lineage tracking for remaining queries</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-orange-900 dark:text-orange-100 font-semibold">Wrangling Efficiency</CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">Time to trustworthy answers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{metrics.wranglingMinutes}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">minutes</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current: {metrics.wranglingMinutes} min</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Target: &lt;30 min</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Median time to get a trustworthy answer from your data
            </p>
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <div className="font-medium">Improvement Opportunity</div>
                <div>Reduce time by optimizing semantic layer</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-900 dark:text-red-100 font-semibold">Rework Frequency</CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300">Definition-related tickets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">{metrics.reworkTickets}</div>
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">tickets/month</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current: {metrics.reworkTickets}/month</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Target: &lt;5/month</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Monthly tickets related to definition and semantic issues
            </p>
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <div className="font-medium">High Priority</div>
                <div>Reduce rework through better term definitions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            ROI Impact Analysis
          </CardTitle>
          <CardDescription>Estimated financial impact of current semantic debt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${(metrics.wranglingMinutes * 50 * 20).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Annual analyst time savings potential</div>
              <div className="text-xs text-green-600 mt-1">By reducing wrangling time by 50%</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                ${(metrics.reworkTickets * 2000).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monthly rework cost reduction</div>
              <div className="text-xs text-blue-600 mt-1">By eliminating rework tickets</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Math.round((100 - metrics.overallScore) * 0.8)}%
              </div>
              <div className="text-sm text-muted-foreground">Trust erosion reduction</div>
              <div className="text-xs text-purple-600 mt-1">By improving semantic health</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Recommendations</CardTitle>
          <CardDescription>Actionable steps to reduce semantic debt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800">High Priority: Define Critical Terms</div>
              <div className="text-sm text-yellow-700 mt-1">
                Define clear business definitions for your top 10 ambiguous terms. This will improve term coverage from {metrics.termCoverage}% to 90%+.
              </div>
              <div className="flex items-center mt-2 space-x-2">
                <Badge variant="outline" className="text-xs">2-3 months</Badge>
                <Badge variant="outline" className="text-xs">Medium effort</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-800">Medium Priority: Enable Lineage Tracking</div>
              <div className="text-sm text-blue-700 mt-1">
                Implement comprehensive lineage tracking for all queries to eliminate trust issues by showing complete data provenance.
              </div>
              <div className="flex items-center mt-2 space-x-2">
                <Badge variant="outline" className="text-xs">1-2 months</Badge>
                <Badge variant="outline" className="text-xs">Low effort</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
