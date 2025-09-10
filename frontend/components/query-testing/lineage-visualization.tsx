"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, ArrowRight, GitBranch } from "lucide-react"

interface LineageVisualizationProps {
  lineage: {
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
  }
}

export function LineageVisualization({ lineage }: LineageVisualizationProps) {
  return (
    <div className="space-y-6">
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
          {lineage.mappings.map((mapping, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default" className="font-mono">
                  {mapping.term}
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
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
