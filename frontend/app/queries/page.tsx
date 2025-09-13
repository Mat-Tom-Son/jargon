"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"
import { Database, Clock, Star, Play, Trash2 } from "lucide-react"
import Link from "next/link"

export default function SavedQueriesPage() {
  const [queries, setQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.queries))
        if (!res.ok) return
        const data = await res.json()
        setQueries(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openInBuilder = (q: any) => {
    if (!q?.query) return
    try {
      sessionStorage.setItem('QB_LOAD_QUERY', JSON.stringify(q.query))
      window.location.href = '/test'
    } catch {}
  }

  const deleteQuery = async (id: string) => {
    try {
      const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.query(id)}`, { method: 'DELETE' })
      if (res.ok) setQueries(prev => prev.filter(q => q.id !== id))
    } catch {}
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Saved Queries</h1>
              <p className="text-muted-foreground">Browse and manage saved queries with metadata.</p>
            </div>
            <Button asChild>
              <Link href="/test">Open Query Builder</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queries.map((q) => (
                <Card key={q.id} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{q.name || q.id}</CardTitle>
                        {q.description && <CardDescription>{q.description}</CardDescription>}
                      </div>
                      {q.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Database className="h-3 w-3" />
                      <span>Source: {q.dataSourceId || q.query?.sourceId || 'n/a'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Execs: {q.execution_count || 0}</span>
                      {q.last_executed && <span>• Last: {new Date(q.last_executed).toLocaleString()}</span>}
                    </div>
                    {Array.isArray(q.tags) && q.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {q.tags.map((t: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openInBuilder(q)}>
                        <Play className="h-4 w-4 mr-2" />
                        Open in Builder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteQuery(q.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {queries.length === 0 && (
                <div className="text-sm text-muted-foreground">No saved queries.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}


