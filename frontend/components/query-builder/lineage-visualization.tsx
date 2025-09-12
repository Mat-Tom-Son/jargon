"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, ArrowRight, GitBranch, Clock, Zap, TrendingUp, Code } from "lucide-react"
import Link from "next/link"

interface LineageVisualizationProps {
  lineage: {
    runId: string
    timestamp: string
    sources: Array<{
      name: string
      type: string
      objects: string[]
      fields: string[]
    }>
    mappings: Array<{
      term: string
      source: string
      object: string
      fields: Record<string, string>
    }>
    steps: Array<{
      sourceId: string
      object: string
      fields: string[]
      query: any
    }>
  }
  execution?: {
    time: number
    records: number
    dataSize: string
  }
  queryParams?: Record<string, any>
  data?: any[]
  termsById?: Record<string, string>
}

export function LineageVisualization({ lineage, execution, queryParams, data, termsById = {} }: LineageVisualizationProps) {
  const sample = Array.isArray(data) && data.length > 0 ? data[0] : null
  const previewValue = (v: any) => {
    if (v === null || v === undefined) return 'null'
    if (typeof v === 'string') return v.length > 60 ? v.slice(0, 60) + '…' : v
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (Array.isArray(v)) {
      const elems = v.slice(0, 3).map(e => (typeof e === 'string' || typeof e === 'number') ? String(e) : typeof e)
      return elems.join(', ') + (v.length > 3 ? ` +${v.length - 3} more` : '')
    }
    if (typeof v === 'object') return `{${Object.keys(v).slice(0,3).join(', ')}${Object.keys(v).length>3? '…':''}}`
    return String(v)
  }
  return (
    <div className="space-y-6">
      {/* Execution Summary */}
      {execution && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <Zap className="h-5 w-5" />
              Execution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">{execution.time}ms</div>
                  <div className="text-xs text-muted-foreground">Execution Time</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">{execution.records}</div>
                  <div className="text-xs text-muted-foreground">Records</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">{execution.dataSize}</div>
                  <div className="text-xs text-muted-foreground">Data Size</div>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Run ID: {lineage.runId} • {new Date(lineage.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Parameters */}
      {queryParams && Object.keys(queryParams).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Query Parameters
            </CardTitle>
            <CardDescription>Parameters sent to the data source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(queryParams).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm font-mono bg-muted p-2 rounded">
                  <span className="text-blue-600 font-medium">{key}:</span>
                  <span className="text-green-600">
                    {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Sources Used
          </CardTitle>
          <CardDescription>Sources accessed during query execution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineage.sources.map((source, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{source.name}</h4>
                  <p className="text-sm text-muted-foreground">{source.type}</p>
                </div>
                <Badge variant="outline">{source.objects.length} objects</Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Objects:</div>
                <div className="flex flex-wrap gap-2">
                  {source.objects.map((object) => (
                    <Badge key={object} variant="secondary" className="font-mono text-xs">
                      {object}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <div className="text-sm font-medium">Fields:</div>
                <div className="flex flex-wrap gap-2">
                  {source.fields.map((field) => (
                    <Badge key={field} variant="outline" className="font-mono text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Concrete Fields Observed */}
      {sample && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Concrete Fields Observed
            </CardTitle>
            <CardDescription>From the first result row</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.keys(sample).slice(0, 20).map((k) => (
                <div key={k} className="flex items-center justify-between gap-4 p-2 bg-muted rounded text-sm font-mono">
                  <span className="text-blue-700 dark:text-blue-300">{k}</span>
                  <span className="text-green-700 dark:text-green-300 truncate">{previewValue((sample as any)[k])}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Lineage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Field Mappings
          </CardTitle>
          <CardDescription>How semantic fields map to concrete data source fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {lineage.mappings?.map((mapping, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default" className="font-mono">
                  {termsById[mapping.term] || mapping.term}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{mapping.source}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="font-mono">
                  {mapping.object}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Field Mappings:</div>
                <div className="space-y-2">
                  {Object.entries(mapping.fields).map(([semantic, concrete]) => (
                    <div key={semantic} className="flex items-center gap-2 text-sm font-mono bg-muted p-2 rounded">
                      <span className="text-blue-600">{semantic}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-green-600">{concrete}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/mappings?sourceId=${encodeURIComponent(mapping.source)}&object=${encodeURIComponent(mapping.object)}`}>
                      View Rule
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/terms?termId=${encodeURIComponent(mapping.term)}`}>
                      View Term
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
