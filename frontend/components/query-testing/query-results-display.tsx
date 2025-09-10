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

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TableIcon className="h-8 w-8 mx-auto mb-2" />
        <p>No data returned</p>
      </div>
    )
  }

  const columns = Object.keys(data[0])

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>
    }
    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value.toString()}</Badge>
    }
    if (typeof value === "number") {
      return <span className="font-mono">{value.toLocaleString()}</span>
    }
    if (typeof value === "string" && value.includes("@")) {
      return <span className="text-blue-600">{value}</span>
    }
    return <span>{value.toString()}</span>
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
                        {formatValue(row[column])}
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
