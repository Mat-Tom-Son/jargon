"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { FieldMappingEditor } from "./field-mapping-editor"
import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

interface CreateMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateMapping?: (mapping?: any) => void
  mode?: 'create' | 'edit'
  initialRule?: {
    id?: string
    termId: string
    sourceId: string
    objectName: string
    fieldMappings: Array<{ semantic: string; concrete: string; expression?: string }>
    expression?: string
  }
  prefill?: {
    termId?: string
    sourceId?: string
    objectName?: string
  }
}


type DiscoveredObject = { name: string; fields: { name: string; type?: string; nullable?: boolean }[] }

const steps = [
  { id: 1, name: "Core Info", description: "Select term and data source" },
  { id: 2, name: "Object Mapping", description: "Choose source object" },
  { id: 3, name: "Field Mapping", description: "Map semantic fields" },
  { id: 4, name: "Review Mapping", description: "Confirm your mapping" },
]

export function CreateMappingDialog({ open, onOpenChange, onCreateMapping, mode = 'create', initialRule, prefill }: CreateMappingDialogProps) {
  // Real data state
  const [realTerms, setRealTerms] = useState([])
  const [realSources, setRealSources] = useState([])
  const [discovered, setDiscovered] = useState<{ objects: DiscoveredObject[] } | null>(null)
  const [suggestedFields, setSuggestedFields] = useState<string[]>([])

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    termId: "",
    sourceId: "",
    objectName: "",
    fieldMappings: [] as Array<{ semantic: string; concrete: string; expression: string }>,
  })
  // Filters support OR groups of AND rows: groups[gi][ri]
  const [filtersGroups, setFiltersGroups] = useState<Array<Array<{ field: string; op: string; value: string }>>>([])
  const allowedOps = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN']

  // Prefill for edit
  useEffect(() => {
    if (open && initialRule) {
      setFormData({
        termId: initialRule.termId,
        sourceId: initialRule.sourceId,
        objectName: initialRule.objectName,
        fieldMappings: (initialRule.fieldMappings || []).map(m => ({ semantic: m.semantic, concrete: m.concrete, expression: m.expression || '' }))
      })
      // Parse existing expression into OR groups of AND rows
      const parsed = parseExpression(initialRule.expression || '')
      setFiltersGroups(parsed.length ? parsed : [[{ field: '', op: '=', value: '' }]])
    }
  }, [open, initialRule])

  // Prefill for create when provided (e.g., from source detail CTA)
  useEffect(() => {
    if (open && !initialRule && prefill) {
      setFormData(prev => ({
        termId: prefill.termId || prev.termId,
        sourceId: prefill.sourceId || prev.sourceId,
        objectName: prefill.objectName || prev.objectName,
        fieldMappings: prev.fieldMappings
      }))
    }
  }, [open, prefill, initialRule])

  // Fetch real data on component open
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [termsRes, sourcesRes] = await Promise.all([
          fetch(buildApiUrl(API_CONFIG.endpoints.terms)),
          fetch(buildApiUrl(API_CONFIG.endpoints.sources))
        ]);

        if (termsRes.ok) {
          const terms = await termsRes.json();
          setRealTerms(terms);
        }

        if (sourcesRes.ok) {
          const sources = await sourcesRes.json();
          setRealSources(sources);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Discover objects/fields from selected source
  useEffect(() => {
    const run = async () => {
      if (!formData.sourceId) { setDiscovered(null); return; }
      try {
        const url = buildApiUrl(API_CONFIG.endpoints.source(formData.sourceId) + '/discover')
        const res = await fetch(url)
        if (!res.ok) throw new Error('discover_failed')
        const json = await res.json()
        setDiscovered(json || { objects: [] })
      } catch (e) {
        console.warn('Discovery failed', e)
        setDiscovered({ objects: [] })
      }
    }
    run()
  }, [formData.sourceId])

  // Suggest fields from saved queries for source+object
  useEffect(() => {
    const run = async () => {
      if (!formData.sourceId || !formData.objectName) { setSuggestedFields([]); return; }
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.queries))
        if (!res.ok) throw new Error('queries_failed')
        const arr = await res.json()
        const set = new Set<string>()
        ;(arr || []).forEach((q: any) => {
          const srcOk = (q.dataSourceId || q.query?.sourceId) === formData.sourceId
          const objOk = String(q.query?.object || '').toLowerCase() === String(formData.objectName).toLowerCase()
          if (srcOk && objOk && Array.isArray(q.query?.select)) {
            q.query.select.forEach((f: any) => typeof f === 'string' && set.add(f))
          }
        })
        const list = Array.from(set)
        setSuggestedFields(list)
        if (formData.fieldMappings.length === 0 && list.length) {
          const prefill = list.slice(0, 12).map(f => ({ semantic: f, concrete: f, expression: f }))
          setFormData(prev => ({ ...prev, fieldMappings: prefill }))
        }
      } catch (e) {
        console.warn('Query suggestion failed', e)
        setSuggestedFields([])
      }
    }
    run()
  }, [formData.sourceId, formData.objectName])

  const selectedTerm = realTerms.find((t) => t.id === formData.termId)
  const selectedSource = realSources.find((s) => s.id === formData.sourceId)
  const availableObjects = (discovered?.objects || []).map(o => ({ name: o.name }))
  const availableFields = (() => {
    const obj = (discovered?.objects || []).find(o => o.name === formData.objectName)
    const discoveredFields = obj ? obj.fields.map(f => f.name) : []
    const set = new Set<string>([...discoveredFields, ...suggestedFields])
    return Array.from(set)
  })()

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      const selectedTerm = realTerms.find(t => t.id === formData.termId)
      const selectedSource = realSources.find(s => s.id === formData.sourceId)

      // Build the mapping rule from configured field mappings
      const fields = Array.from(new Set((formData.fieldMappings || []).map(m => m.semantic).filter(Boolean)))
      const fieldMappings: Record<string, string> = {}
      ;(formData.fieldMappings || []).forEach(m => { if (m.semantic && m.concrete) fieldMappings[m.semantic] = m.concrete })
      const ruleData = {
        termId: formData.termId,
        sourceId: formData.sourceId,
        object: formData.objectName,
        expression: buildExpression(filtersGroups),
        fields,
        fieldMappings
      };

      // Save to API
      const isEdit = mode === 'edit' && initialRule?.id
      const url = isEdit ? buildApiUrl(`/rules/${encodeURIComponent(String(initialRule?.id))}`) : buildApiUrl(API_CONFIG.endpoints.rules)
      const method = isEdit ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ? { 'x-api-key': process.env.NEXT_PUBLIC_ADMIN_API_TOKEN } : {})
        },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        const newRule = await response.json();
        console.log("Created mapping rule:", newRule);

        // Call the callback if provided (for compatibility)
        if (onCreateMapping) {
          const mappingData = {
            termName: selectedTerm?.name || "",
            termCategory: selectedTerm?.category || "",
            sourceName: selectedSource?.name || "",
            sourceType: selectedSource?.kind || "",
            objectName: formData.objectName,
            fieldMappings: formData.fieldMappings.length > 0 ? formData.fieldMappings : [
              {
                semantic: selectedTerm?.name || "",
                concrete: formData.objectName,
                expression: formData.objectName
              }
            ],
          };
          onCreateMapping(mappingData);
        }

        onOpenChange(false);
        setCurrentStep(1);
        setFormData({
          termId: "",
          sourceId: "",
          objectName: "",
          fieldMappings: [],
        });

        // refresh via callback
        onCreateMapping?.(newRule)
      } else {
        console.error("Failed to create mapping rule");
      }
    } catch (error) {
      console.error("Error creating mapping rule:", error);
    }
  }

  function buildExpression(groups: Array<Array<{ field: string; op: string; value: string }>>): string {
    if (!groups || !groups.length) return ''
    const groupExprs = groups.map(rows => {
      const parts = rows
        .filter(r => r.field && r.op && (r.value !== undefined))
        .map(r => `${r.field} ${r.op} ${formatValue(r.value, r.op)}`)
      if (!parts.length) return ''
      return parts.length > 1 ? `(${parts.join(' AND ')})` : parts[0]
    }).filter(Boolean)
    return groupExprs.join(' OR ')
  }
  function formatValue(v: string, op: string): string {
    if (op === 'IN') {
      // comma-separated list
      const items = v.split(',').map(s => s.trim()).filter(Boolean).map(x => quoteIfNeeded(x))
      return `(${items.join(', ')})`
    }
    return quoteIfNeeded(v)
  }
  function quoteIfNeeded(v: string): string {
    // naive number detection
    if (/^-?\d+(?:\.\d+)?$/.test(v)) return v
    // wrap strings in single quotes, escape existing
    return `'${v.replace(/'/g, "''")}'`
  }

  function parseExpression(expr: string): Array<Array<{ field: string; op: string; value: string }>> {
    const groups: Array<Array<{ field: string; op: string; value: string }>> = []
    if (!expr || typeof expr !== 'string') return groups
    const orParts = splitTopLevel(expr, /\bOR\b/i)
    for (const orPart of orParts) {
      const trimmed = orPart.trim().replace(/^\((.*)\)$/s, '$1').trim()
      const andParts = splitTopLevel(trimmed, /\bAND\b/i)
      const rows: Array<{ field: string; op: string; value: string }> = []
      for (const andPart of andParts) {
        const p = andPart.trim()
        if (!p) continue
        const m = p.match(/^(\S+)\s*(=|!=|>=|<=|>|<|LIKE|IN)\s*(.+)$/i)
        if (!m) continue
        const [, field, opRaw, rhsRaw] = m
        const op = opRaw.toUpperCase()
        if (op === 'IN') {
          const inner = rhsRaw.trim().replace(/^\(/, '').replace(/\)$/, '')
          const vals = inner.split(',').map(s => s.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1')).filter(Boolean)
          rows.push({ field, op, value: vals.join(',') })
        } else {
          const val = rhsRaw.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1')
          rows.push({ field, op, value: val })
        }
      }
      if (rows.length) groups.push(rows)
    }
    return groups
  }

  function splitTopLevel(input: string, sep: RegExp): string[] {
    const out: string[] = []
    let depth = 0
    let token = ''
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (ch === '(') { depth++; token += ch; continue }
      if (ch === ')') { depth = Math.max(0, depth - 1); token += ch; continue }
      if (depth === 0) {
        // attempt sep match at this position
        const rest = input.slice(i)
        const m = rest.match(/^\s*(AND|OR)\b/i)
        if (m && sep.test(m[1])) {
          if (token.trim()) out.push(token.trim())
          token = ''
          // skip matched operator
          i += m[0].length - 1
          continue
        }
      }
      token += ch
    }
    if (token.trim()) out.push(token.trim())
    return out
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.termId && formData.sourceId
      case 2:
        return formData.objectName
      case 3:
        return true // Allow proceeding even if no field mappings configured
      case 4:
        return true // Always allow proceeding to submit
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Mapping Rule</DialogTitle>
          <DialogDescription>Connect a business term to concrete data source fields.</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">{step.name}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < steps.length - 1 && <div className="w-12 h-px bg-border mx-4" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {/* Step 1: Core Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Business Term</Label>
                  <Select
                    value={formData.termId}
                    onValueChange={(value) => setFormData({ ...formData, termId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business term" />
                    </SelectTrigger>
                    <SelectContent>
                      {realTerms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          <div>
                            <div className="font-medium">{term.name}</div>
                            <div className="text-sm text-muted-foreground">{term.category}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select
                    value={formData.sourceId}
                    onValueChange={(value) => setFormData({ ...formData, sourceId: value, objectName: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {realSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">{source.kind}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTerm && selectedSource && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mapping Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline">{selectedTerm.name}</Badge>
                        <span className="mx-2">→</span>
                        <Badge variant="outline">{selectedSource.name}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedTerm.category} • {selectedSource.kind}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Object Mapping */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Select Object from {selectedSource?.name}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {availableObjects.map((object) => (
                    <Card
                      key={object.name}
                      className={`cursor-pointer transition-colors ${
                        formData.objectName === object.name ? "ring-2 ring-primary bg-accent" : "hover:bg-accent"
                      }`}
                      onClick={() => setFormData({ ...formData, objectName: object.name })}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{object.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          Discovered fields: {(discovered?.objects.find(o => o.name === object.name)?.fields.length || 0)}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Field Mapping + Filters */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <FieldMappingEditor
                termName={selectedTerm?.name || ""}
                sourceName={selectedSource?.name || ""}
                objectName={formData.objectName}
                fieldMappings={formData.fieldMappings}
                concreteFields={availableFields}
                onFieldMappingsChange={(mappings) => setFormData({ ...formData, fieldMappings: mappings })}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>Compose filters with AND inside groups; groups are OR-ed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filtersGroups.map((group, gi) => (
                    <div key={gi} className="rounded-md border p-3 space-y-3">
                      <div className="text-xs font-medium opacity-70">Group {gi + 1} (AND)</div>
                      {group.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <Label className="text-xs">Field</Label>
                            <Select value={row.field} onValueChange={(v) => setFiltersGroups(prev => prev.map((g, i) => i===gi ? g.map((r,j) => j===ri ? { ...r, field: v } : r) : g))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFields.map(f => (
                                  <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Op</Label>
                            <Select value={row.op} onValueChange={(v) => setFiltersGroups(prev => prev.map((g, i) => i===gi ? g.map((r,j) => j===ri ? { ...r, op: v } : r) : g))}>
                              <SelectTrigger>
                                <SelectValue placeholder="=" />
                              </SelectTrigger>
                              <SelectContent>
                                {allowedOps.map(op => (
                                  <SelectItem key={op} value={op}>{op}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-5">
                            <Label className="text-xs">Value</Label>
                            <input
                              className="w-full h-9 rounded border px-2 text-sm bg-background"
                              value={row.value}
                              placeholder={row.op === 'IN' ? 'a,b,c' : 'value'}
                              onChange={(e) => setFiltersGroups(prev => prev.map((g, i) => i===gi ? g.map((r,j) => j===ri ? { ...r, value: e.target.value } : r) : g))}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setFiltersGroups(prev => prev.map((g,i) => i===gi ? [...g, { field: '', op: '=', value: '' }] : g))}>Add Filter Row</Button>
                        {group.length > 0 && (
                          <Button type="button" variant="ghost" onClick={() => setFiltersGroups(prev => prev.map((g,i) => i===gi ? [] : g))}>Clear Group</Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setFiltersGroups(prev => [...prev, [{ field: '', op: '=', value: '' }]])}>Add OR Group</Button>
                    {filtersGroups.length > 0 && (
                      <Button type="button" variant="ghost" onClick={() => setFiltersGroups([])}>Clear All</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review Mapping */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mapping Summary</CardTitle>
                  <CardDescription>Review your mapping configuration before creating.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Business Term</Label>
                      <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          {selectedTerm?.name}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {selectedTerm?.category}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Data Source</Label>
                      <div className="mt-1 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-sm font-medium text-green-900 dark:text-green-100">
                          {selectedSource?.name}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          {formData.objectName}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Field Mappings ({formData.fieldMappings.length})</Label>
                    <div className="mt-2 space-y-2">
                      {formData.fieldMappings.length > 0 ? (
                        formData.fieldMappings.map((mapping, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {mapping.semantic}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {mapping.concrete}
                            </Badge>
                            {mapping.expression && mapping.expression !== mapping.concrete && (
                              <span className="text-xs text-gray-500 ml-2">({mapping.expression})</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          No field mappings configured
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed()}>
                {mode === 'edit' ? 'Save Changes' : 'Create Mapping'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
