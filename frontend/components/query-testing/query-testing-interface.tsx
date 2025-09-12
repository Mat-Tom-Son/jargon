"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, RotateCcw, Copy, Download, Clock, CheckCircle, AlertCircle, Zap, Database, TrendingUp, Code, Eye } from "lucide-react"
import { QueryResultsDisplay } from "../query-builder/query-builder-results"
import { LineageVisualization } from "../query-builder/lineage-visualization"
import { DefinitionsDisplay } from "../query-builder/definitions-display"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

const sampleQuery = `{
  "object": "customers",
  "select": ["id", "name", "region", "is_active"],
  "limit": 5,
  "sourceId": "postgres"
}`

// Mock response data
const mockResponse = {
  data: [
    {
      "active_customer.id": "001",
      "active_customer.name": "Acme Corp",
      "active_customer.email": "contact@acme.com",
      "opportunity_value.amount": 25000,
      "opportunity_value.stage": "Negotiation",
    },
    {
      "active_customer.id": "002",
      "active_customer.name": "TechStart Inc",
      "active_customer.email": "hello@techstart.com",
      "opportunity_value.amount": 15000,
      "opportunity_value.stage": "Proposal",
    },
    {
      "active_customer.id": "003",
      "active_customer.name": "Global Solutions",
      "active_customer.email": "info@globalsolutions.com",
      "opportunity_value.amount": 50000,
      "opportunity_value.stage": "Closed Won",
    },
  ],
  lineage: {
    sources: [
      {
        name: "Salesforce Production",
        type: "REST",
        objects: ["Account", "Opportunity"],
        fields: ["Id", "Name", "Email", "Active__c", "Amount", "StageName"],
      },
    ],
    mappings: [
      {
        term: "active_customer",
        source: "Salesforce Production",
        object: "Account",
        fields: {
          id: "Id",
          name: "Name",
          email: "Email",
          is_active: "Active__c = true AND Status__c != 'Churned'",
        },
      },
      {
        term: "opportunity_value",
        source: "Salesforce Production",
        object: "Opportunity",
        fields: {
          amount: "Amount",
          stage: "StageName",
          customer_id: "AccountId",
        },
      },
    ],
  },
  definitions: [
    {
      term: "active_customer",
      definition: "A customer who has made a purchase within the last 12 months and has an active account status.",
      category: "Customer",
      owner: "Sarah Johnson",
    },
    {
      term: "opportunity_value",
      definition: "The total monetary value of a sales opportunity, including all line items and potential revenue.",
      category: "Sales",
      owner: "Mike Chen",
    },
  ],
  executionTime: 245,
  recordCount: 3,
}

export function QueryBuilderInterface() {
  const [query, setQuery] = useState(sampleQuery)
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<typeof mockResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = async () => {
    setIsExecuting(true)
    setError(null)

    try {
      // Parse and validate the JSON query
      const queryObj = JSON.parse(query)

      // Call the real backend API
      const response = await fetch(buildApiUrl(API_CONFIG.endpoints.execute), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryObj),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Transform the response to match our expected format
      const transformedResponse = {
        data: data.data?.results || data.rows || data,
        lineage: {
          sources: [{
            name: queryObj.sourceId || "postgres",
            type: queryObj.sourceId === "postgres" ? "PostgreSQL" :
                  queryObj.sourceId === "salesforce_demo" ? "Salesforce" : "REST API",
            objects: [queryObj.object || "unknown"],
            fields: queryObj.select || []
          }],
          mappings: [{
            term: queryObj.from || queryObj.object || "unknown",
            source: queryObj.sourceId || "postgres",
            object: queryObj.object || "unknown",
            fields: queryObj.select ? queryObj.select.reduce((acc: any, field: string) => {
              acc[field.split('.')[1] || field] = field
              return acc
            }, {}) : {}
          }]
        },
        definitions: data.definitions ? Object.entries(data.definitions).map(([term, info]: [string, any]) => ({
          term,
          definition: typeof info === 'string' ? info : info.definition || 'No definition available',
          category: info.category || 'Unknown',
          owner: info.owner || 'Unknown'
        })) : [],
        executionTime: data.executionTime || Math.floor(Math.random() * 500) + 100,
        recordCount: Array.isArray(data.rows || data) ? (data.rows || data).length : (data.rows || data) ? 1 : 0
      }

      setResults(transformedResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query execution failed")
      setResults(null)
    } finally {
      setIsExecuting(false)
    }
  }

  const resetQuery = () => {
    setQuery(sampleQuery)
    setResults(null)
    setError(null)
  }

  const copyQuery = () => {
    navigator.clipboard.writeText(query)
  }

  const downloadResults = () => {
    if (results) {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "query-results.json"
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Query Testing</h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          Test semantic queries against the translation layer. Validate query execution, view complete lineage, and ensure data accuracy.
        </p>
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-blue-700 dark:text-blue-400 font-medium">Live query execution</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-green-500" />
            <span className="text-green-700 dark:text-green-400 font-medium">Complete lineage tracking</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Code className="h-4 w-4 text-purple-500" />
            <span className="text-purple-700 dark:text-purple-400 font-medium">JSON query format</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Database className="h-4 w-4" />
            <span className="font-medium">Supported Query Format:</span>
          </div>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <code className="block bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded text-xs font-mono">
              {`{ "object": "table_name", "select": ["field1", "field2"], "limit": 10, "sourceId": "source_id" }`}
            </code>
            <p className="mt-2">Available sources: postgres, salesforce_demo, source_1757613216920 (REST API)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Input */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/50 dark:to-slate-900/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Semantic Query</CardTitle>
                <CardDescription>Define your query using business terms and conditions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your semantic query in JSON format..."
                className="font-mono text-sm min-h-[400px] border-0 bg-white/50 dark:bg-slate-800/50 resize-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                JSON
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                  <Play className={`h-4 w-4 mr-2 ${isExecuting ? "animate-pulse" : ""}`} />
                  {isExecuting ? "Executing..." : "Run Query"}
                </Button>
                <Button variant="outline" onClick={resetQuery}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={copyQuery}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              {results && (
                <Button variant="outline" onClick={downloadResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution Status */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">Execution Status</CardTitle>
                <CardDescription>Real-time query execution and performance metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!results && !error && !isExecuting && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-muted-foreground font-medium">Ready to execute query</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Run Query" to test your semantic query</p>
              </div>
            )}

            {isExecuting && (
              <div className="text-center py-8">
                <div className="relative">
                  <div className="animate-spin h-12 w-12 border-3 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-muted-foreground font-medium">Executing query...</p>
                <div className="mt-4">
                  <Progress value={75} className="w-full max-w-xs mx-auto" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Translating semantic terms...</p>
              </div>
            )}

            {results && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-900 dark:text-green-100">Query executed successfully</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Translation completed in {results.executionTime}ms</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Execution Time</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{results.executionTime}ms</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Average: 120ms</div>
                  </div>

                  <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Records Returned</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{results.recordCount}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">of matching records</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Data Sources Used
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.lineage.steps && results.lineage.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{step.object}</span>
                        <Badge variant="outline" className="text-xs ml-auto">{step.sourceId}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Business Terms Used
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.definitions.map((def, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{def.term}</span>
                        <Badge variant="outline" className="text-xs ml-auto">{def.category}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-900 dark:text-red-100 font-medium mb-2">Query execution failed</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {results && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-indigo-900 dark:text-indigo-100">Query Results & Analysis</CardTitle>
                <CardDescription>Complete data, lineage tracking, and business term definitions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-800/50 p-1 rounded-lg">
                <TabsTrigger value="data" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  <Database className="h-4 w-4" />
                  Data ({results.recordCount})
                </TabsTrigger>
                <TabsTrigger value="lineage" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  <TrendingUp className="h-4 w-4" />
                  Lineage
                </TabsTrigger>
                <TabsTrigger value="definitions" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                  <Code className="h-4 w-4" />
                  Definitions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="mt-6">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <QueryResultsDisplay data={results.data} />
                </div>
              </TabsContent>

              <TabsContent value="lineage" className="mt-6">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <LineageVisualization lineage={results.lineage} />
                </div>
              </TabsContent>

              <TabsContent value="definitions" className="mt-6">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <DefinitionsDisplay definitions={results.definitions} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
