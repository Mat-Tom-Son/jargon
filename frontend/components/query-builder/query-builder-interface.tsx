"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Play, RotateCcw, Copy, Download, Clock, CheckCircle, AlertCircle, Zap, Database, TrendingUp, Code, Eye, Save, FolderOpen, Star, Trash2 } from "lucide-react"
import { QueryResultsDisplay } from "./query-builder-results"
import { LineageVisualization } from "./lineage-visualization"
import { DefinitionsDisplay } from "./definitions-display"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

const sampleQuery = `{
  "object": "drug/ndc.json",
  "select": ["brand_name", "generic_name", "product_ndc"],
  "limit": 5,
  "sourceId": "openfda_v1",
  "params": { "search": "brand_name:ibuprofen" }
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

interface SavedQuery {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  query: any
  dataSourceId: string
  created_by: string
  execution_count: number
  last_executed?: string
  avg_execution_time: number
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export function QueryBuilderInterface() {
  const [query, setQuery] = useState(sampleQuery)
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<typeof mockResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parsedQuery, setParsedQuery] = useState<any>(null)
  const [termsById, setTermsById] = useState<Record<string, string>>({})
  const [availableSources, setAvailableSources] = useState<Array<{id: string; name: string; kind: string}>>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>("openfda_v1")
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("")

  // Query management state
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [currentQuery, setCurrentQuery] = useState<SavedQuery | null>(null)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [queryName, setQueryName] = useState("")
  const [queryDescription, setQueryDescription] = useState("")
  const [queryCategory, setQueryCategory] = useState("reporting")
  const [queryTags, setQueryTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  // Load saved queries on component mount
  useEffect(() => {
    loadSavedQueries()
    // Attempt to load query from Saved Queries handoff
    try {
      const raw = sessionStorage.getItem('QB_LOAD_QUERY')
      if (raw) {
        const obj = JSON.parse(raw)
        setQuery(JSON.stringify(obj, null, 2))
        sessionStorage.removeItem('QB_LOAD_QUERY')
      }
    } catch {}
  }, [])

  // Load terms for display mapping (termId -> term name)
  useEffect(() => {
    // Load available sources for the selector
    const loadSources = async () => {
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.sources))
        if (!res.ok) return
        const sources = await res.json()
        setAvailableSources(sources)
        // Default selection: keep current selected if present, else first
        const exists = sources.some((s: any) => s.id === selectedSourceId)
        const next = exists ? selectedSourceId : (sources[0]?.id || 'postgres')
        setSelectedSourceId(next)
        try {
          const obj = JSON.parse(query)
          if (obj.sourceId !== next) {
            obj.sourceId = next
            setQuery(JSON.stringify(obj, null, 2))
          }
        } catch {}
      } catch {}
    }
    loadSources()
  }, [])

  // Keep JSON query's sourceId in sync with selector
  useEffect(() => {
    try {
      const obj = JSON.parse(query)
      if (obj.sourceId !== selectedSourceId) {
        obj.sourceId = selectedSourceId
        setQuery(JSON.stringify(obj, null, 2))
      }
    } catch {}
  }, [selectedSourceId])

  // Load endpoints for selected source
  useEffect(() => {
    const loadEndpoints = async () => {
      if (!selectedSourceId) return
      try {
        const res = await fetch(`${API_CONFIG.baseUrl}/sources/${encodeURIComponent(selectedSourceId)}/endpoints`)
        if (!res.ok) {
          setAvailableEndpoints([])
          return
        }
        const endpoints = await res.json()
        setAvailableEndpoints(Array.isArray(endpoints) ? endpoints : [])
        // If current endpoint isn't in list, default to first
        const current = selectedEndpoint
        const next = endpoints?.includes(current) ? current : (endpoints?.[0] || "")
        setSelectedEndpoint(next)
        // Sync JSON object/endpoint
        try {
          const obj = JSON.parse(query)
          if (next) {
            // Prefer object as full path for REST
            obj.object = next.replace(/^\/+/, '')
          }
          setQuery(JSON.stringify(obj, null, 2))
        } catch {}
      } catch {
        setAvailableEndpoints([])
      }
    }
    loadEndpoints()
  }, [selectedSourceId])

  // Keep JSON object's resource in sync with endpoint selector
  useEffect(() => {
    try {
      if (!selectedEndpoint) return
      const obj = JSON.parse(query)
      obj.object = selectedEndpoint.replace(/^\/+/, '')
      setQuery(JSON.stringify(obj, null, 2))
    } catch {}
  }, [selectedEndpoint])

  // Load terms for display mapping (termId -> term name)
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.terms))
        if (!res.ok) return
        const terms = await res.json()
        const map: Record<string, string> = {}
        terms.forEach((t: any) => {
          if (t?.id) map[t.id] = t.name || t.id
        })
        setTermsById(map)
      } catch (_) {
        // ignore
      }
    }
    loadTerms()
  }, [])

  const loadSavedQueries = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.endpoints.queries))
      if (response.ok) {
        const queries = await response.json()
        setSavedQueries(queries)
      }
    } catch (error) {
      console.error('Error loading saved queries:', error)
    }
  }

  const saveQuery = async () => {
    if (!queryName.trim()) return

    try {
      const queryObj = JSON.parse(query)
      const newQuery: Partial<SavedQuery> = {
        name: queryName,
        description: queryDescription,
        category: queryCategory,
        tags: queryTags,
        query: queryObj,
        dataSourceId: queryObj.sourceId || 'postgres',
        created_by: 'user',
        execution_count: 0,
        avg_execution_time: 0,
        is_favorite: false
      }

      const response = await fetch(buildApiUrl(API_CONFIG.endpoints.queries), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuery)
      })

      if (response.ok) {
        const savedQuery = await response.json()
        setSavedQueries(prev => [...prev, savedQuery])
        setCurrentQuery(savedQuery)
        setIsSaveDialogOpen(false)
        setQueryName("")
        setQueryDescription("")
        setQueryTags([])
      }
    } catch (error) {
      console.error('Error saving query:', error)
      setError('Failed to save query')
    }
  }

  const loadQuery = (savedQuery: SavedQuery) => {
    setQuery(JSON.stringify(savedQuery.query, null, 2))
    setCurrentQuery(savedQuery)
    setIsLoadDialogOpen(false)

    // Update execution count
    fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.query(savedQuery.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        execution_count: savedQuery.execution_count + 1,
        last_executed: new Date().toISOString()
      })
    }).catch(error => console.error('Error updating execution count:', error))
  }

  const deleteQuery = async (queryId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.query(queryId)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSavedQueries(prev => prev.filter(q => q.id !== queryId))
        if (currentQuery?.id === queryId) {
          setCurrentQuery(null)
        }
      }
    } catch (error) {
      console.error('Error deleting query:', error)
    }
  }

  const toggleFavorite = async (savedQuery: SavedQuery) => {
    try {
      const response = await fetch(`http://localhost:3001/queries/${savedQuery.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_favorite: !savedQuery.is_favorite
        })
      })

      if (response.ok) {
        const updatedQuery = await response.json()
        setSavedQueries(prev => prev.map(q =>
          q.id === savedQuery.id ? updatedQuery : q
        ))
        if (currentQuery?.id === savedQuery.id) {
          setCurrentQuery(updatedQuery)
        }
      }
    } catch (error) {
      console.error('Error updating favorite status:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !queryTags.includes(newTag.trim())) {
      setQueryTags(prev => [...prev, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setQueryTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const executeQuery = async () => {
    setIsExecuting(true)
    setError(null)

    try {
      // Parse and validate the JSON query
      const queryObj = JSON.parse(query)
      setParsedQuery(queryObj)

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
      const derivedSources = [{
        name: queryObj.sourceId || "postgres",
        type: queryObj.sourceId === "postgres" ? "PostgreSQL" :
              queryObj.sourceId === "salesforce_demo" ? "Salesforce" : "REST API",
        objects: [queryObj.object || "unknown"],
        fields: queryObj.select || []
      }]
      const derivedMappings = [{
        term: queryObj.from || queryObj.object || "unknown",
        source: queryObj.sourceId || "postgres",
        object: queryObj.object || "unknown",
        fields: (queryObj.select || []).reduce((acc: any, field: string) => {
          acc[field.split('.')[1] || field] = field
          return acc
        }, {})
      }]

      const executionTime = data.execution?.time || data.executionTime || Math.floor(Math.random() * 500) + 100
      const rowsCandidate: any = data.data?.results || data.rows || data
      const recordCount = Array.isArray(rowsCandidate) ? rowsCandidate.length : rowsCandidate ? 1 : 0

      const transformedResponse = {
        data: rowsCandidate,
        lineage: data.lineage
          ? { ...data.lineage, sources: derivedSources, mappings: derivedMappings }
          : { sources: derivedSources, mappings: derivedMappings },
        definitions: data.definitions ? Object.entries(data.definitions).map(([term, info]: [string, any]) => ({
          term,
          definition: typeof info === 'string' ? info : info.definition || 'No definition available',
          category: info.category || 'Unknown',
          owner: info.owner || 'Unknown'
        })) : [],
        execution: data.execution || { time: executionTime, records: recordCount, dataSize: '' },
        executionTime,
        recordCount
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
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Query Builder</h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          Build, save, and execute semantic queries against your data sources. Create reusable queries with complete lineage tracking.
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

        {currentQuery && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Query:</span>
                </div>
                <div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{currentQuery.name}</span>
                  {currentQuery.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current inline ml-1" />}
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Category: {currentQuery.category} • Executions: {currentQuery.execution_count}
                    {currentQuery.last_executed && ` • Last run: ${new Date(currentQuery.last_executed).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              {currentQuery.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentQuery.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Database className="h-4 w-4" />
            <span className="font-medium">Supported Query Format:</span>
          </div>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <code className="block bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded text-xs font-mono">
              {`{ "object": "resource", "select": ["field1", "field2"], "limit": 10, "sourceId": "source_id" }`}
            </code>
            <div className="mt-3 flex items-center gap-3">
              <Label className="text-xs">Data Source</Label>
              <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                <SelectTrigger className="w-64 h-8">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.kind})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableEndpoints.length > 0 && (
                <>
                  <Label className="text-xs">Endpoint</Label>
                  <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                    <SelectTrigger className="w-72 h-8">
                      <SelectValue placeholder="Select endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEndpoints.map((ep) => (
                        <SelectItem key={ep} value={ep}>{ep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
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
              <div className="flex gap-2 flex-wrap">
                <Button onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                  <Play className={`h-4 w-4 mr-2 ${isExecuting ? "animate-pulse" : ""}`} />
                  {isExecuting ? "Executing..." : "Run Query"}
                </Button>
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Save Query</DialogTitle>
                      <DialogDescription>
                        Save this query for future use. You can organize it with categories and tags.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="query-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="query-name"
                          value={queryName}
                          onChange={(e) => setQueryName(e.target.value)}
                          className="col-span-3"
                          placeholder="Enter query name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="query-description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="query-description"
                          value={queryDescription}
                          onChange={(e) => setQueryDescription(e.target.value)}
                          className="col-span-3"
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="query-category" className="text-right">
                          Category
                        </Label>
                        <Select value={queryCategory} onValueChange={setQueryCategory}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reporting">Reporting</SelectItem>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="crm">CRM</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">
                          Tags
                        </Label>
                        <div className="col-span-3 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add tag"
                              onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            />
                            <Button type="button" onClick={addTag} size="sm">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {queryTags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                                {tag} ×
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveQuery} disabled={!queryName.trim()}>
                        Save Query
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Load Saved Query</DialogTitle>
                      <DialogDescription>
                        Select a previously saved query to load and execute.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {savedQueries.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No saved queries yet</p>
                      ) : (
                        savedQueries.map((savedQuery) => (
                          <Card key={savedQuery.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1" onClick={() => loadQuery(savedQuery)}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{savedQuery.name}</h4>
                                    {savedQuery.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                                  </div>
                                  {savedQuery.description && (
                                    <p className="text-sm text-muted-foreground mb-2">{savedQuery.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Category: {savedQuery.category}</span>
                                    <span>Executions: {savedQuery.execution_count}</span>
                                    {savedQuery.last_executed && (
                                      <span>Last: {new Date(savedQuery.last_executed).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  {savedQuery.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {savedQuery.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleFavorite(savedQuery)
                                    }}
                                  >
                                    <Star className={`h-4 w-4 ${savedQuery.is_favorite ? 'text-yellow-500 fill-current' : ''}`} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => deleteQuery(savedQuery.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={resetQuery}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={copyQuery}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              {results && (
                <Button variant="outline" size="sm" onClick={downloadResults}>
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
                  <LineageVisualization
                    lineage={results.lineage}
                    execution={results.execution}
                    queryParams={parsedQuery?.params || {}}
                    data={results.data}
                    termsById={termsById}
                  />
                </div>
              </TabsContent>

              <TabsContent value="definitions" className="mt-6">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <DefinitionsDisplay definitions={results.definitions} data={results.data} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
