"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, GitBranch, MoreHorizontal, Edit, Trash2, Eye, CheckCircle, AlertCircle, Clock, TrendingUp, Zap, Database, Layers, ArrowRight, AlertTriangle } from "lucide-react"
import { CreateMappingDialog } from "./create-mapping-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data - in real app this would come from API
const mockMappingRules = [
  {
    id: "1",
    termName: "Active Customer",
    termCategory: "Customer",
    sourceName: "Salesforce Production",
    sourceType: "REST",
    objectName: "Account",
    status: "validated",
    createdAt: "2024-01-15",
    lastValidated: "2024-02-20",
    fieldMappings: [
      { semantic: "Customer Identifier", concrete: "Id", expression: "Id" },
      { semantic: "Customer Name", concrete: "Name", expression: "Name" },
      { semantic: "Active Customer Status", concrete: "Status", expression: "Active__c = true AND Status__c != 'Churned'" },
    ],
  },
  {
    id: "2",
    termName: "Opportunity Value",
    termCategory: "Sales",
    sourceName: "Salesforce Production",
    sourceType: "REST",
    objectName: "Opportunity",
    status: "validated",
    createdAt: "2024-01-20",
    lastValidated: "2024-02-18",
    fieldMappings: [
      { semantic: "Opportunity Identifier", concrete: "Id", expression: "Id" },
      { semantic: "Opportunity Value Amount", concrete: "Amount", expression: "Amount" },
      { semantic: "Sales Stage", concrete: "StageName", expression: "StageName" },
    ],
  },
  {
    id: "3",
    termName: "Monthly Recurring Revenue",
    termCategory: "Finance",
    sourceName: "Customer Database",
    sourceType: "PostgreSQL",
    objectName: "subscriptions",
    status: "draft",
    createdAt: "2024-02-01",
    lastValidated: null,
    fieldMappings: [
      { semantic: "Customer Reference ID", concrete: "customer_id", expression: "customer_id" },
      { semantic: "Monthly Revenue Amount", concrete: "monthly_amount", expression: "monthly_amount" },
      { semantic: "Revenue Currency", concrete: "currency_code", expression: "currency_code" },
    ],
  },
  {
    id: "4",
    termName: "Lead Score",
    termCategory: "Marketing",
    sourceName: "Analytics API",
    sourceType: "REST",
    objectName: "leads",
    status: "error",
    createdAt: "2024-02-10",
    lastValidated: "2024-02-15",
    fieldMappings: [
      { semantic: "Lead Identifier", concrete: "lead_id", expression: "lead_id" },
      { semantic: "Lead Quality Score", concrete: "score", expression: "score" },
      { semantic: "Last Modified Date", concrete: "updated_at", expression: "updated_at" },
    ],
  },
]

const statusColors = {
  validated: "default",
  draft: "secondary",
  error: "destructive",
} as const

export function MappingRulesList() {
  const searchParams = useSearchParams()
  const qpSourceId = searchParams.get('sourceId') || ''
  const qpObject = searchParams.get('object') || ''
  const qpTermId = searchParams.get('termId') || ''
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [mappingRules, setMappingRules] = useState(mockMappingRules)
  const [demoDataEnabled, setDemoDataEnabled] = useState<boolean | null>(null)
  const focusedRef = useRef<HTMLDivElement | null>(null)

  // Load demo data setting from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ENABLE_DEMO_DATA')
    if (stored !== null) {
      const enabled = JSON.parse(stored)
      setDemoDataEnabled(enabled)
      if (!enabled) {
        setMappingRules([]) // Clear demo data when disabled
      } else {
        setMappingRules(mockMappingRules) // Restore demo data when enabled
      }
    } else {
      // If no stored value, default to true and store it
      setDemoDataEnabled(true)
      localStorage.setItem('ENABLE_DEMO_DATA', 'true')
    }
  }, [])

  // Update when demo data setting changes
  useEffect(() => {
    if (demoDataEnabled !== null) {
      if (!demoDataEnabled) {
        setMappingRules([])
      } else {
        setMappingRules(mockMappingRules)
      }
    }
  }, [demoDataEnabled])

  // Listen for demo data setting changes from settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ENABLE_DEMO_DATA') {
        const enabled = e.newValue ? JSON.parse(e.newValue) : true
        setDemoDataEnabled(enabled)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const filteredRules = mappingRules.filter((rule) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = (
      rule.termName.toLowerCase().includes(searchLower) ||
      rule.sourceName.toLowerCase().includes(searchLower) ||
      rule.objectName.toLowerCase().includes(searchLower) ||
      rule.termCategory.toLowerCase().includes(searchLower)
    )
    const matchesQp = (
      (!qpSourceId || rule.sourceName.toLowerCase().includes(qpSourceId.toLowerCase())) &&
      (!qpObject || rule.objectName.toLowerCase().includes(qpObject.toLowerCase()))
    )
    return matchesSearch && matchesQp
  })

  // Reorder to surface first match and scroll to it
  const orderedRules = useMemo(() => {
    if (!qpSourceId && !qpObject && !qpTermId) return filteredRules
    const idx = filteredRules.findIndex(r =>
      (qpSourceId ? r.sourceName.toLowerCase().includes(qpSourceId.toLowerCase()) : true) &&
      (qpObject ? r.objectName.toLowerCase().includes(qpObject.toLowerCase()) : true)
    )
    if (idx === -1) return filteredRules
    const copy = filteredRules.slice()
    const [rule] = copy.splice(idx, 1)
    return [rule, ...copy]
  }, [filteredRules, qpSourceId, qpObject, qpTermId])

  useEffect(() => {
    if (focusedRef.current) {
      focusedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [orderedRules.length, qpSourceId, qpObject, qpTermId])

  const handleCreateMapping = (newMapping: any) => {
    const mappingRule = {
      id: Date.now().toString(),
      termName: newMapping.termName,
      termCategory: newMapping.termCategory,
      sourceName: newMapping.sourceName,
      sourceType: newMapping.sourceType,
      objectName: newMapping.objectName,
      status: "draft" as const,
      createdAt: new Date().toISOString().split('T')[0],
      lastValidated: null,
      fieldMappings: newMapping.fieldMappings,
    }
    setMappingRules(prev => [mappingRule, ...prev])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "validated":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Mapping Rules</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Connect business terms to concrete data source fields and expressions. Define the semantic translation layer that powers your queries.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">{mappingRules.length} mapping rules defined</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                {mappingRules.reduce((sum, rule) => sum + rule.fieldMappings.length, 0)} fields mapped
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">
                {mappingRules.filter(rule => rule.status === 'validated').length} validated rules
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Validate All
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Mapping
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-6">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by term, source, object, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table")} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards" className="text-xs">Cards</TabsTrigger>
            <TabsTrigger value="table" className="text-xs">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{mockMappingRules.length}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">Mapping Rules</div>
                <div className="text-xs text-blue-500 dark:text-blue-500 mt-2">Total defined</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <GitBranch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {mockMappingRules.filter((rule) => rule.status === "validated").length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">Validated</div>
                <div className="text-xs text-green-500 dark:text-green-500 mt-2">
                  {Math.round((mockMappingRules.filter((rule) => rule.status === "validated").length / mockMappingRules.length) * 100)}% success rate
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {mockMappingRules.filter((rule) => rule.status === "draft").length}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mt-1">Draft</div>
                <div className="text-xs text-yellow-500 dark:text-yellow-500 mt-2">Needs review</div>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {mockMappingRules.filter((rule) => rule.status === "error").length}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">Errors</div>
                <div className="text-xs text-red-500 dark:text-red-500 mt-2">Requires attention</div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table")}>
        <TabsContent value="cards" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orderedRules.map((rule, i) => {
              const isValidated = rule.status === "validated"
              const isDraft = rule.status === "draft"
              const isError = rule.status === "error"

              const isFocused = i === 0 && (qpSourceId || qpObject || qpTermId)

              return (
                <Card key={rule.id} ref={isFocused ? focusedRef : null} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border ${isFocused ? 'border-blue-400 ring-2 ring-blue-200' : 'border-0'} shadow-sm ${
                  isValidated
                    ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50'
                    : isDraft
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50'
                    : isError
                    ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className={`text-xl font-semibold ${
                            isValidated
                              ? 'text-green-900 dark:text-green-100'
                              : isDraft
                              ? 'text-yellow-900 dark:text-yellow-100'
                              : isError
                              ? 'text-red-900 dark:text-red-100'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {rule.termName}
                          </CardTitle>
                          <Badge variant="outline" className={`text-xs font-medium border-current ${
                            isValidated
                              ? 'text-green-700 dark:text-green-300'
                              : isDraft
                              ? 'text-yellow-700 dark:text-yellow-300'
                              : isError
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {rule.termCategory}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          <Database className="h-3 w-3 inline mr-1" />
                          {rule.sourceName} → <code className="text-xs bg-muted px-1 py-0.5 rounded">{rule.objectName}</code>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(rule.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Mapping
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Zap className="h-4 w-4 mr-2" />
                              Validate Now
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Mapping
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isValidated ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : isDraft ? (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        ) : isError ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                        <Badge variant={statusColors[rule.status as keyof typeof statusColors]} className={
                          isValidated
                            ? 'bg-green-500 hover:bg-green-600'
                            : isDraft
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : isError
                            ? 'bg-red-500 hover:bg-red-600'
                            : ''
                        }>
                          {rule.status}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{rule.fieldMappings.length} fields mapped</span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        Field Mappings ({rule.fieldMappings.length})
                      </div>
                      <div className="space-y-3">
                        {rule.fieldMappings.slice(0, 3).map((mapping, index) => (
                          <div key={index} className="relative group">
                            {/* Arrow line */}
                            <div className="absolute left-4 top-6 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-green-400"></div>

                            <div className="flex items-center gap-3">
                              {/* Source field */}
                              <div className="flex-1">
                                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Semantic</div>
                                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">{mapping.semantic}</div>
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="flex-shrink-0 text-green-500">
                                <ArrowRight className="h-5 w-5" />
                              </div>

                              {/* Target field */}
                              <div className="flex-1">
                                <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                                  <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Concrete</div>
                                  <div className="text-sm font-mono text-green-900 dark:text-green-100 break-all">
                                    {mapping.expression.length > 20 ? `${mapping.expression.slice(0, 20)}...` : mapping.expression}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Full expression tooltip on hover */}
                            {mapping.expression.length > 20 && (
                              <div className="absolute z-10 invisible group-hover:visible bg-black text-white text-xs rounded px-2 py-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {mapping.expression}
                              </div>
                            )}
                          </div>
                        ))}
                        {rule.fieldMappings.length > 3 && (
                          <div className="text-center py-2">
                            <Badge variant="outline" className="text-xs">
                              +{rule.fieldMappings.length - 3} more mappings
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                      <span>Created {new Date(rule.createdAt).toLocaleDateString()}</span>
                      {rule.lastValidated ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Validated {new Date(rule.lastValidated).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">Never validated</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </TabsContent>

      <TabsContent value="table" className="mt-6">
        <Card className="border-0 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Business Term</TableHead>
                <TableHead className="font-semibold">Data Source</TableHead>
                <TableHead className="font-semibold">Object</TableHead>
                <TableHead className="font-semibold">Fields</TableHead>
                <TableHead className="font-semibold">Last Validated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => {
                const isValidated = rule.status === "validated"
                const isDraft = rule.status === "draft"
                const isError = rule.status === "error"

                return (
                  <TableRow key={rule.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(rule.status)}
                        <Badge variant={statusColors[rule.status as keyof typeof statusColors]} className={`text-xs ${
                          isValidated
                            ? 'bg-green-500 hover:bg-green-600'
                            : isDraft
                            ? 'bg-yellow-500 hover:bg-yellow-600'
                            : isError
                            ? 'bg-red-500 hover:bg-red-600'
                            : ''
                        }`}>
                          {rule.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.termName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Badge variant="outline" className="text-xs h-4">{rule.termCategory}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          {rule.sourceName}
                        </div>
                        <div className="text-sm text-muted-foreground">{rule.sourceType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{rule.objectName}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{rule.fieldMappings.length}</span>
                        <span className="text-xs text-muted-foreground">mapped</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {rule.lastValidated ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{new Date(rule.lastValidated).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Mapping
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Zap className="h-4 w-4 mr-2" />
                            Validate Now
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Mapping
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>
      </Tabs>

      {filteredRules.length === 0 && demoDataEnabled !== null && (
        <div className="text-center py-12">
          {demoDataEnabled ? (
            <>
              <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No mapping rules found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search criteria." : "Get started by creating your first mapping rule."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Mapping
                </Button>
              )}
            </>
          ) : (
            <>
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Mapping Rules Available</h3>
              <p className="text-muted-foreground mb-4">
                Demo data is disabled and no real mapping rules are configured yet.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To see sample data, enable demo data in{" "}
                  <a href="/settings" className="text-primary hover:underline">
                    Settings
                  </a>
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Mapping
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <CreateMappingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateMapping={handleCreateMapping}
      />
    </div>
  )
}
