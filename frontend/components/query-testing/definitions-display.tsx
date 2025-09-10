"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, User } from "lucide-react"

interface DefinitionsDisplayProps {
  definitions: Array<{
    term: string
    definition: string
    category: string
    owner: string
  }>
}

export function DefinitionsDisplay({ definitions }: DefinitionsDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{definitions.length} business terms used in this query</div>

      <div className="grid grid-cols-1 gap-4">
        {definitions.map((def, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {def.term}
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
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{def.definition}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
