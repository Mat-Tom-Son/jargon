"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

export default function TermDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const [term, setTerm] = useState<any | null>(null)
  const [rules, setRules] = useState<any[]>([])
  const [queries, setQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [tr, rr, qr] = await Promise.all([
          fetch(buildApiUrl(API_CONFIG.endpoints.terms)),
          fetch(buildApiUrl(API_CONFIG.endpoints.rules)),
          fetch(buildApiUrl(API_CONFIG.endpoints.queries))
        ])
        if (tr.ok) {
          const ts = await tr.json()
          const t = (ts || []).find((x: any) => x.id === id)
          setTerm(t || null)
        }
        if (rr.ok) {
          const rs = await rr.json()
          setRules((rs || []).filter((r: any) => r.termId === id))
        }
        if (qr.ok) {
          const qs = await qr.json()
          setQueries((qs || []).filter((q: any) => Array.isArray(q.termIds) && q.termIds.includes(id)))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Term Details</h1>
              <p className="text-muted-foreground">Rules and queries associated with this business term.</p>
            </div>
            <Button asChild>
              <Link href="/terms">Back to Terms</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : term ? (
            <>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>{term.name}</CardTitle>
                  {term.description && <CardDescription>{term.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.isArray(term.tags) && term.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {term.tags.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Rules for this Term</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {rules.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No rules yet. Generate one from the Query Builder or add in Mappings.</div>
                    ) : (
                      <ul className="space-y-2">
                        {rules.map((r: any) => (
                          <li key={r.id} className="text-sm bg-muted rounded p-2">
                            <div className="font-medium">{r.object} • <span className="opacity-70">{r.sourceId}</span></div>
                            <div className="text-xs opacity-80">Fields: {Array.isArray(r.fields) ? r.fields.join(', ') : ''}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Queries Using this Term</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {queries.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No saved queries associated yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {queries.map((q: any) => (
                          <li key={q.id} className="text-sm bg-muted rounded p-2 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{q.name || q.id}</div>
                              <div className="text-xs opacity-80">Source: {q.dataSourceId || q.query?.sourceId || 'n/a'}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/queries/${q.id}`}>View</Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/test`}>Open in Builder</Link>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Term not found.</div>
          )}
        </main>
      </div>
    </div>
  )
}

