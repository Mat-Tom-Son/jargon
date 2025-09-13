"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertTriangle, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

interface DataSourceDetailProps {
  sourceId: string
}

export function DataSourceDetail({ sourceId }: DataSourceDetailProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.source(sourceId)))
        if (!res.ok) throw new Error(`Failed to load source: ${res.status}`)
        const data = await res.json()
        setSource(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load source')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sourceId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sources
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground">Loading source...</div>
      </div>
    )
  }

  if (error || !source) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sources
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {error || 'Source not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sources
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{source.name}</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{source.kind}</Badge>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{source.id}</code>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Configuration</div>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">{JSON.stringify(source.config, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>

      {source.kind === 'rest' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>REST Settings</CardTitle>
            <CardDescription>Headers and endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Default Headers</div>
              <HeadersEditor source={source} onUpdated={setSource} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Registered Endpoints</div>
              <EndpointsEditor source={source} onUpdated={setSource} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Sample cURL</div>
              <CurlHelper baseUrl={source.config?.baseUrl} endpoint={(source.metadata?.endpoints?.[0] || '').replace(/^\/+/, '')} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HeadersEditor({ source, onUpdated }: { source: any; onUpdated: (s: any) => void }) {
  const initial = source.config?.headers || {}
  const [rows, setRows] = useState<Array<{ key: string; value: string }>>(
    Object.entries(initial).map(([k, v]) => ({ key: k, value: String(v) }))
  )
  const [saving, setSaving] = useState(false)

  const addRow = () => setRows(prev => [...prev, { key: '', value: '' }])
  const updateRow = (i: number, field: 'key' | 'value', val: string) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    try {
      const headers: Record<string, string> = {}
      rows.forEach(r => {
        const k = r.key.trim()
        if (k) headers[k] = r.value
      })
      const res = await fetch(buildApiUrl(API_CONFIG.endpoints.source(source.id)), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { headers } })
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdated(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background"
              placeholder="Header-Name"
              value={row.key}
              onChange={(e) => updateRow(i, 'key', e.target.value)}
            />
            <input
              className="flex-[2] px-2 py-1 text-sm rounded border border-border bg-background"
              placeholder="value"
              value={row.value}
              onChange={(e) => updateRow(i, 'value', e.target.value)}
            />
            <Button variant="outline" size="icon" onClick={() => removeRow(i)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" /> Add Header
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setRows([])}>Clear</Button>
        <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Headers'}</Button>
      </div>
    </div>
  )
}

function EndpointsEditor({ source, onUpdated }: { source: any; onUpdated: (s: any) => void }) {
  const [endpoints, setEndpoints] = useState<string[]>(source.metadata?.endpoints || [])
  const [newEndpoint, setNewEndpoint] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    if (!newEndpoint.trim()) return
    setSaving(true)
    try {
      const res = await fetch(buildApiUrl(API_CONFIG.endpoints.sourceEndpoints(source.id)), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: newEndpoint })
      })
      if (res.ok) {
        const eps = await res.json()
        setEndpoints(eps)
        onUpdated({ ...source, metadata: { ...(source.metadata || {}), endpoints: eps } })
        setNewEndpoint('')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (ep: string) => {
    setSaving(true)
    try {
      const res = await fetch(buildApiUrl(API_CONFIG.endpoints.sourceEndpoints(source.id)), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: ep })
      })
      if (res.ok) {
        const eps = await res.json()
        setEndpoints(eps)
        onUpdated({ ...source, metadata: { ...(source.metadata || {}), endpoints: eps } })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 text-sm bg-muted rounded border border-border"
          placeholder="/drug/ndc.json"
          value={newEndpoint}
          onChange={(e) => setNewEndpoint(e.target.value)}
        />
        <Button size="sm" onClick={add} disabled={saving}>Add</Button>
      </div>
      <ul className="space-y-2">
        {endpoints.map(ep => (
          <li key={ep} className="flex items-center justify-between text-sm bg-muted px-3 py-2 rounded">
            <code>{ep}</code>
            <Button variant="outline" size="sm" onClick={() => remove(ep)} disabled={saving}>Remove</Button>
          </li>
        ))}
        {endpoints.length === 0 && (
          <div className="text-xs text-muted-foreground">No endpoints registered</div>
        )}
      </ul>
    </div>
  )
}

function CurlHelper({ baseUrl, endpoint }: { baseUrl?: string; endpoint?: string }) {
  if (!baseUrl || !endpoint) return (
    <div className="text-xs text-muted-foreground">Add an endpoint to see a cURL example.</div>
  )
  const url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
  const curl = `curl -s '${url}' -H 'Accept: application/json'`
  return (
    <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto">{curl}</pre>
  )
}
