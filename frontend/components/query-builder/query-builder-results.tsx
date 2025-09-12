"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronRight, TableIcon, Code } from "lucide-react"

interface QueryResultsDisplayProps {
  data: Record<string, any>[]
}

export function QueryResultsDisplay({ data }: QueryResultsDisplayProps) {
  const [viewMode, setViewMode] = useState<"table" | "json">("table")
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  if (!data || !Array.isArray(data) || data.length === 0 || !data[0]) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TableIcon className="h-8 w-8 mx-auto mb-2" />
        <p>No data returned</p>
      </div>
    )
  }

  // Smart column detection - show most important fields
  const getColumns = (items: any[]) => {
    if (!items || items.length === 0) return []

    const sample = items[0]

    // Define priority fields that are most commonly useful
    const priorityFields = [
      'product_ndc', 'brand_name', 'generic_name', 'dosage_form', 'route',
      'labeler_name', 'marketing_category', 'product_type',
      'active_ingredients', 'packaging', 'pharm_class'
    ]

    // Get all available fields
    const allFields = new Set<string>()
    const collectFields = (obj: any, prefix = '', depth = 0) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj) && depth < 2) {
        Object.keys(obj).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          if (!allFields.has(fullKey)) {
            allFields.add(fullKey)
          }
          // Only go one level deep for nested objects
          if (depth === 0) {
            collectFields(obj[key], fullKey, depth + 1)
          }
        })
      }
    }
    collectFields(sample)

    // Prioritize important fields, limit to reasonable number
    const availablePriority = priorityFields.filter(field => allFields.has(field))
    const otherFields = Array.from(allFields)
      .filter(field => !priorityFields.includes(field) && !field.includes('.'))
      .slice(0, 8) // Limit other fields

    // Combine and limit total columns
    const selectedFields = [...availablePriority, ...otherFields].slice(0, 12)

    return selectedFields
  }

  const columns = getColumns(data)

  // Extract nested values using dot notation
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Helpers for value formatting
  const isPrimitive = (v: any) => v === null || ['string', 'number', 'boolean'].includes(typeof v)
  const isPrimitiveArray = (arr: any[]): boolean => arr.every(v => isPrimitive(v))
  const isSimpleObject = (o: any): boolean => {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false
    const keys = Object.keys(o)
    if (keys.length === 0 || keys.length > 4) return false
    return keys.every(k => isPrimitive(o[k]) || (Array.isArray(o[k]) && isPrimitiveArray(o[k])))
  }

  const summarizeArrayOfPrimitives = (arr: any[], maxItems = 3): string => {
    const shown = arr.slice(0, maxItems).map(v => String(v))
    const suffix = arr.length > maxItems ? ` +${arr.length - maxItems} more` : ''
    return `${shown.join(', ')}${suffix}`
  }

  const summarizeObject = (obj: Record<string, any>, maxPairs = 3): string => {
    const entries = Object.entries(obj)
      .slice(0, maxPairs)
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          return `${k}: ${isPrimitiveArray(v) ? summarizeArrayOfPrimitives(v, 2) : `[${v.length}]`}`
        }
        return `${k}: ${isPrimitive(v) ? String(v) : '{...}'}
`      })
      .join(', ')
    return entries || '{}'
  }

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const formatValue = (value: any, maxLength: number = 60) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>
    }
    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value.toString()}</Badge>
    }
    if (typeof value === "number") {
      return <span className="font-mono">{value.toLocaleString()}</span>
    }
    if (typeof value === "string") {
      if (value.includes("@")) {
        return <span className="text-blue-600">{value.length > maxLength ? value.substring(0, maxLength) + "..." : value}</span>
      }
      return <span>{value.length > maxLength ? value.substring(0, maxLength) + "..." : value}</span>
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">[]</span>
      }
      if (value.length === 1) {
        const firstItem = value[0]
        if (isPrimitive(firstItem)) {
          return <span className="text-green-700 font-medium">{String(firstItem)}</span>
        }
        if (typeof firstItem === 'object' && firstItem !== null) {
          // If simple object, show key:value summary
          if (isSimpleObject(firstItem)) {
            return <span className="text-green-700 font-medium">{summarizeObject(firstItem, 2)}</span>
          }
          return <span className="text-purple-600">{`{${Object.keys(firstItem).length} keys}`}</span>
        }
        return <span className="text-purple-600">[1 item]</span>
      }
      // For multiple items, show a summary
      const types = new Set(value.map(item => typeof item))
      if (types.size === 1 && types.has('string')) {
        return <span className="text-green-700 font-medium">{summarizeArrayOfPrimitives(value as any[], 3)}</span>
      }
      if (types.size === 1 && types.has('number')) {
        return <span className="text-blue-600">[{value.length} numbers]</span>
      }
      // If array of simple objects (e.g., active_ingredients), show summarized list of first key(s)
      if ((value as any[]).every(v => isSimpleObject(v))) {
        const previews = (value as any[]).slice(0, 3).map(v => summarizeObject(v as any, 2))
        const suffix = value.length > 3 ? ` +${value.length - 3} more` : ''
        return <span className="text-green-700 font-medium">{previews.join('; ')}{suffix}</span>
      }
      return <span className="text-purple-600">[{value.length} items]</span>
    }
    if (typeof value === "object") {
      // Show a compact preview of first few key/value pairs
      const preview = summarizeObject(value as any, 3)
      return <span className="text-green-700 font-medium">{preview}</span>
    }
    return <span>{String(value)}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{data.length} records</div>
        <div className="flex gap-2">
          <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
            <TableIcon className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button variant={viewMode === "json" ? "default" : "outline"} size="sm" onClick={() => setViewMode("json")}>
            <Code className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                {columns.map((column) => (
                  <TableHead key={column} className="font-mono text-xs">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <>
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(index)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedRows.has(index) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column} className="text-sm">
                        {formatValue(getNestedValue(row, column))}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has(index) && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="bg-muted/30">
                        <Card>
                          <CardContent className="p-4">
                            <pre className="text-xs font-mono overflow-auto">{JSON.stringify(row, null, 2)}</pre>
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <pre className="text-sm font-mono overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
