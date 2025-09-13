"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"
import { Database, Clock, Play, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SavedQueryDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const [q, setQ] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.query(id)}`)
        if (!res.ok) return
        const data = await res.json()
        setQ(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const openInBuilder = () => {
    if (!q?.query) return
    try {
      sessionStorage.setItem('QB_LOAD_QUERY', JSON.stringify(q.query))
      window.location.href = '/test'
    } catch {}
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/queries">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Saved Queries
            </Link>
          </Button>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : q ? (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>{q.name || q.id}</CardTitle>
                  {q.description && <CardDescription>{q.description}</CardDescription>}
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
                  <div>
                    <div className="text-sm font-medium mb-1">Query JSON</div>
                    <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-80">{JSON.stringify(q.query, null, 2)}</pre>
                  </div>
                  <Button size="sm" onClick={openInBuilder}>
                    <Play className="h-4 w-4 mr-2" /> Open in Builder
                  </Button>
                  <div>
                    <div className="text-sm font-medium mb-1">Run History</div>
                    {Array.isArray(q.history) && q.history.length > 0 ? (
                      <ul className="space-y-2">
                        {q.history.map((h: any) => (
                          <li key={h.id} className="text-xs bg-muted rounded px-2 py-2 flex items-center justify-between">
                            <span>{new Date(h.timestamp).toLocaleString()} • {h.recordCount} records • {h.executionTime}ms</span>
                            <code className="opacity-70">{h.object}</code>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-muted-foreground">No runs yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Query not found.</div>
          )}
        </main>
      </div>
    </div>
  )
}


