"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, User, Edit, Plus } from "lucide-react"
import { useState } from "react"

interface DefinitionsDisplayProps {
  definitions: Array<{
    term: string
    definition: string
    category: string
    owner: string
  }>
  data?: any[] // The actual query results to derive definitions from
}

export function DefinitionsDisplay({ definitions, data }: DefinitionsDisplayProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Derive field definitions from data structure
  const getFieldDefinitions = (data: any[]) => {
    if (!data || data.length === 0) return []

    const sample = data[0]
    const fields = new Set<string>()

    const collectFields = (obj: any, prefix = '') => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
          if (!fields.has(key)) {
            fields.add(key)
          }
        })
      }
    }

    collectFields(sample)

    return Array.from(fields).map(field => ({
      term: field,
      definition: `Field "${field}" from the query results`,
      category: 'Data Field',
      owner: 'System',
      inferred: true
    }))
  }

  const allDefinitions = [
    ...definitions,
    ...(data ? getFieldDefinitions(data) : [])
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {allDefinitions.length} business terms and fields
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Definition
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {allDefinitions.map((def, index) => (
          <Card key={`${def.term}-${index}`} className={def.inferred ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/10' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {def.term}
                    {def.inferred && (
                      <Badge variant="outline" className="text-xs ml-2">
                        Inferred
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="outline" className="mr-2">
                      {def.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs">
                      <User className="h-3 w-3" />
                      {def.owner}
                    </span>
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {def.definition}
                {def.inferred && (
                  <span className="block mt-2 text-xs text-blue-600 dark:text-blue-400">
                    This definition was automatically inferred from your query results
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
