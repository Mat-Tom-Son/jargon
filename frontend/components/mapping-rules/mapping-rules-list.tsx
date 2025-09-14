"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, GitBranch, MoreHorizontal, Trash2, Database, Layers, ArrowRight, Edit } from "lucide-react"
import { CreateMappingDialog } from "./create-mapping-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

type UIMappingRule = {
  id: string
  termId: string
  termName: string
  termCategory?: string
  sourceId: string
  sourceName: string
  sourceType: string
  objectName: string
  expression?: string
  createdAt?: string | null
  fieldMappings: Array<{ semantic: string; concrete: string; expression?: string }>
}

// No status UI; keep structure minimal

export function MappingRulesList() {
  const searchParams = useSearchParams()
  const qpSourceId = searchParams.get('sourceId') || ''
  const qpObject = searchParams.get('object') || ''
  const qpTermId = searchParams.get('termId') || ''
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [mappingRules, setMappingRules] = useState<UIMappingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<null | {
    id: string;
    termId: string;
    sourceId: string;
    objectName: string;
    fieldMappings: Array<{ semantic: string; concrete: string; expression?: string }>
  }>(null)
  const [createPrefill, setCreatePrefill] = useState<{ termId?: string; sourceId?: string; objectName?: string } | null>(null)
  const focusedRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesRes, termsRes, sourcesRes] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.endpoints.rules)),
        fetch(buildApiUrl(API_CONFIG.endpoints.terms)),
        fetch(buildApiUrl(API_CONFIG.endpoints.sources))
      ])
      if (!rulesRes.ok || !termsRes.ok || !sourcesRes.ok) throw new Error('load_failed')
      const [rules, terms, sources] = await Promise.all([rulesRes.json(), termsRes.json(), sourcesRes.json()])
      const termById = new Map(terms.map((t: any) => [t.id, t]))
      const sourceById = new Map(sources.map((s: any) => [s.id, s]))
      const ui: UIMappingRule[] = (rules as any[]).map(r => {
        const t = termById.get(r.termId)
        const s = sourceById.get(r.sourceId)
        const fm = r.fieldMappings || {}
        const fmArr = Object.entries(fm).map(([semantic, concrete]) => ({ semantic, concrete: String(concrete), expression: r.expression || '' }))
        return {
          id: r.id,
          termId: r.termId,
          termName: t?.name || r.termId,
          termCategory: t?.category || '',
          sourceId: r.sourceId,
          sourceName: s?.name || r.sourceId,
          sourceType: s?.kind || '',
          objectName: r.object,
          expression: r.expression || '',
          createdAt: r.created_at || null,
          fieldMappings: fmArr,
        }
      })
      setMappingRules(ui)
    } catch (e: any) {
      setError(e?.message || 'failed')
      setMappingRules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Check for create prefill request (e.g., from source detail CTA)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('MR_CREATE_PREFILL')
      if (raw) {
        const pre = JSON.parse(raw)
        setCreatePrefill({ termId: pre.termId, sourceId: pre.sourceId, objectName: pre.objectName })
        setShowCreateDialog(true)
        sessionStorage.removeItem('MR_CREATE_PREFILL')
      }
    } catch {}
  }, [])

  const filteredRules = mappingRules.filter((rule) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = (
      rule.termName.toLowerCase().includes(searchLower) ||
      rule.sourceName.toLowerCase().includes(searchLower) ||
      rule.objectName.toLowerCase().includes(searchLower) ||
      (rule.termCategory || '').toLowerCase().includes(searchLower)
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

  const handleCreateMapping = (_newMapping: any) => {
    // The dialog triggers a window reload after save; also refresh here for safety
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mapping rule?')) return;
    try {
      const res = await fetch(buildApiUrl(`/rules/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ? { 'x-api-key': process.env.NEXT_PUBLIC_ADMIN_API_TOKEN } : {})
        }
      })
      if (!res.ok) throw new Error('failed')
      await load()
    } catch (_) {
      // noop; could add toast
    }
  }

  // No status icon

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
            {/* Removed validated count */}
          </div>
        </div>
        <div className="flex gap-3">
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

      {/* Loading / Error */}
      {loading && (
        <div className="text-sm text-muted-foreground">Loading mapping rules…</div>
      )}
      {(!loading && error) && (
        <div className="text-sm text-red-600">Failed to load mapping rules: {error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{mappingRules.length}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">Mapping Rules</div>
                <div className="text-xs text-blue-500 dark:text-blue-500 mt-2">Total defined</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <GitBranch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Removed validated card */}

        {/* Additional status cards removed (no status model in UI) */}
      </div>

      {/* Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table")}>
        <TabsContent value="cards" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orderedRules.map((rule, i) => {
              const isFocused = i === 0 && (qpSourceId || qpObject || qpTermId)

              return (
                <Card key={rule.id} ref={isFocused ? focusedRef : null} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border ${isFocused ? 'border-blue-400 ring-2 ring-blue-200' : 'border-0'} shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className={`text-xl font-semibold text-gray-900 dark:text-gray-100`}>
                            {rule.termName}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-medium border-current text-gray-700 dark:text-gray-300">
                            {rule.termCategory}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          <Database className="h-3 w-3 inline mr-1" />
                          {rule.sourceName} → <code className="text-xs bg-muted px-1 py-0.5 rounded">{rule.objectName}</code>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* no status */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing({
                              id: rule.id,
                              termId: (rule as any).termId || '',
                              sourceId: (rule as any).sourceId || '',
                              objectName: rule.objectName,
                              fieldMappings: rule.fieldMappings,
                              expression: rule.expression || ''
                            })}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Mapping
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(rule.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Mapping
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-end">
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

                    <div className="flex items-center justify-start text-xs text-muted-foreground border-t border-border/50 pt-3">
                      <span>{rule.createdAt ? `Created ${new Date(rule.createdAt).toLocaleDateString()}` : 'Created —'}</span>
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
                <TableHead className="font-semibold">Business Term</TableHead>
                <TableHead className="font-semibold">Data Source</TableHead>
                <TableHead className="font-semibold">Object</TableHead>
                <TableHead className="font-semibold">Fields</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => {
                return (
                  <TableRow key={rule.id} className="hover:bg-muted/30 transition-colors">
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing({
                            id: rule.id,
                            termId: (rule as any).termId || '',
                            sourceId: (rule as any).sourceId || '',
                            objectName: rule.objectName,
                            fieldMappings: rule.fieldMappings,
                            expression: rule.expression || ''
                          })}>
                            Edit Mapping
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(rule.id)}>
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

      {(filteredRules.length === 0 && !loading && !error) && (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No mapping rules found</h3>
          <p className="text-muted-foreground mb-4">{searchQuery ? "Try adjusting your search criteria." : "Get started by creating your first mapping rule."}</p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Mapping
            </Button>
          )}
        </div>
      )}

      <CreateMappingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateMapping={handleCreateMapping}
        prefill={createPrefill || undefined}
      />
      {/* Edit Mapping */}
      {editing && (
        <CreateMappingDialog
          open={!!editing}
          onOpenChange={(v) => { if (!v) setEditing(null) }}
          onCreateMapping={() => { setEditing(null); load(); }}
          mode="edit"
          initialRule={{
            id: editing.id,
            termId: editing.termId,
            sourceId: editing.sourceId,
            objectName: editing.objectName,
            fieldMappings: editing.fieldMappings
          }}
        />
      )}
    </div>
  )
}
