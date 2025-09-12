'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertTriangle, CheckCircle, Clock, Users, Calendar, FileText, User, Shield, Target, TrendingUp } from "lucide-react"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface TermDefinition {
  id: string
  name: string
  businessDefinition: string
  examples: string[]
  counterExamples: string[]
  owner: string
  status: 'draft' | 'pending_review' | 'approved' | 'rejected'
  lastReviewed?: string
  reviewCycle: 'monthly' | 'quarterly' | 'biannual' | 'annual'
}

export function GovernanceContent() {
  const [terms, setTerms] = useState<TermDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.endpoints.terms));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Transform backend data to match our interface
        const transformedTerms: TermDefinition[] = data.map((term: any) => ({
          id: term.id,
          name: term.name,
          businessDefinition: term.description || 'No description available',
          examples: [], // Backend doesn't have examples yet
          counterExamples: [], // Backend doesn't have counter-examples yet
          owner: term.owner || 'Unassigned',
          status: 'approved' as const, // Default status for now
          lastReviewed: undefined,
          reviewCycle: 'quarterly' as const
        }));

        setTerms(transformedTerms);
      } catch (err) {
        console.error('Failed to fetch terms:', err);
        setError('Failed to load terms. Please check if the backend is running.');
        setTerms([]); // Empty array instead of sample data
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading governance data...</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending_review': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending_review': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'draft': return <FileText className="h-4 w-4 text-gray-600" />
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const approveTerm = (termId: string) => {
    // In real app, this would call our backend API
    console.log('Approving term:', termId)
  }

  const rejectTerm = (termId: string) => {
    // In real app, this would call our backend API
    console.log('Rejecting term:', termId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Semantic Governance</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Enterprise-grade term lifecycle management. Define, review, approve, and maintain business terminology standards across your organization.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">Approval workflows</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">Data stewardship</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">Compliance tracking</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Review Schedule
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Define New Term
          </Button>
        </div>
      </div>

      {/* Governance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100 font-semibold">Approved Terms</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">Governance approved</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{terms.filter(t => t.status === 'approved').length}</div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">approved</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((terms.filter(t => t.status === 'approved').length / terms.length) * 100)}% governance compliance
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-900 dark:text-yellow-100 font-semibold">Pending Review</CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">Approval queue</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{terms.filter(t => t.status === 'pending_review').length}</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">awaiting</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Requires governance review
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-blue-900 dark:text-blue-100 font-semibold">Review Compliance</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">Scheduled reviews</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {Math.round(terms.filter(t => t.lastReviewed).length / terms.length * 100)}%
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">compliant</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Terms reviewed on schedule
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-purple-900 dark:text-purple-100 font-semibold">Data Owners</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">Stewardship teams</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{new Set(terms.map(t => t.owner)).size}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">owners</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Active stewardship teams
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Term Management */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            All Terms ({terms.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4" />
            Pending ({terms.filter(t => t.status === 'pending_review').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CheckCircle className="h-4 w-4" />
            Approved ({terms.filter(t => t.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            Drafts ({terms.filter(t => t.status === 'draft').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {terms.map(term => (
            <Card key={term.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(term.status)}
                    <div>
                      <CardTitle className="text-lg">{term.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <User className="h-3 w-3" />
                        <span>{term.owner}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{term.reviewCycle} reviews</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(term.status)}>
                      {term.status.replace('_', ' ')}
                    </Badge>
                    {term.lastReviewed && (
                      <span className="text-xs text-muted-foreground">
                        Last reviewed: {term.lastReviewed}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Business Definition</h4>
                    <p className="text-sm text-muted-foreground">{term.businessDefinition}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 text-green-700">Examples</h4>
                      <ul className="text-sm space-y-1">
                        {term.examples.map((example, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-green-700">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 text-red-700">Counter-Examples</h4>
                      <ul className="text-sm space-y-1">
                        {term.counterExamples.map((counter, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-red-700">{counter}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {term.status === 'pending_review' && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => rejectTerm(term.id)}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => approveTerm(term.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {terms.filter(t => t.status === 'pending_review').map(term => (
            <Card key={term.id} className="border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <CardTitle className="text-lg">{term.name}</CardTitle>
                      <CardDescription>Submitted by {term.owner}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{term.businessDefinition}</p>
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => rejectTerm(term.id)}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => approveTerm(term.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {terms.filter(t => t.status === 'approved').map(term => (
            <Card key={term.id} className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">{term.name}</CardTitle>
                      <CardDescription>Owned by {term.owner}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{term.businessDefinition}</p>
                {term.lastReviewed && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last reviewed: {term.lastReviewed} • Next review: {term.reviewCycle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {terms.filter(t => t.status === 'draft').map(term => (
            <Card key={term.id} className="border-gray-200 bg-gray-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-lg">{term.name}</CardTitle>
                      <CardDescription>Draft by {term.owner}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{term.businessDefinition}</p>
                <div className="flex items-center justify-end mt-4">
                  <Button size="sm">
                    <FileText className="h-3 w-3 mr-1" />
                    Continue Editing
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
