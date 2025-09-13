"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Database, Globe, Server, MoreHorizontal, Eye, Settings, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw, Zap, AlertTriangle, Copy, GitBranch, Search, Filter, Star, Activity, BarChart3, Users } from "lucide-react"
import { AddDataSourceDialog } from "./add-data-source-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { buildApiUrl, API_CONFIG } from "@/lib/api-config"

interface DataSource {
  id: string
  name: string
  kind: string
  version: string
  environment: string
  status: string
  description: string
  tags: string[]
  config: any
  metadata?: {
    tables?: string[]
    objects?: string[]
    endpoints?: string[]
    lastSync?: string
    recordCount?: number
    responseTime?: number
  }
  created_at: string
  updated_at: string
  parent_id?: string
}

export function DataSourcesList() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [cloneName, setCloneName] = useState("")
  const [cloneEnvironment, setCloneEnvironment] = useState("")
  const [versionName, setVersionName] = useState("")
  const [versionDescription, setVersionDescription] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEnvironment, setFilterEnvironment] = useState<string>("all")
  const [filterKind, setFilterKind] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [renamingId, setRenamingId] = useState<string>("")
  const [renameValue, setRenameValue] = useState<string>("")

  // Load data sources from API
  useEffect(() => {
    loadDataSources()
  }, [])

  const loadDataSources = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(API_CONFIG.endpoints.sources))
      if (response.ok) {
        const sources = await response.json()
        setDataSources(sources)
      } else {
        console.error('Failed to load data sources')
        setDataSources([])
      }
    } catch (error) {
      console.error('Error loading data sources:', error)
      setDataSources([])
    } finally {
      setLoading(false)
    }
  }

  const handleClone = async () => {
    if (!selectedSource || !cloneName.trim()) return

    try {
      const response = await fetch(`http://localhost:3001/sources/${selectedSource.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cloneName,
          environment: cloneEnvironment || selectedSource.environment
        })
      })

      if (response.ok) {
        const newSource = await response.json()
        setDataSources(prev => [...prev, newSource])
        setShowCloneDialog(false)
        setCloneName("")
        setCloneEnvironment("")
        setSelectedSource(null)
      }
    } catch (error) {
      console.error('Error cloning data source:', error)
    }
  }

  const handleCreateVersion = async () => {
    if (!selectedSource) return

    try {
      const response = await fetch(`http://localhost:3001/sources/${selectedSource.id}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: versionName || `${selectedSource.name} v${Date.now()}`,
          description: versionDescription,
          version: `1.0.${Date.now()}`
        })
      })

      if (response.ok) {
        const newVersion = await response.json()
        setDataSources(prev => [...prev, newVersion])
        setShowVersionDialog(false)
        setVersionName("")
        setVersionDescription("")
        setSelectedSource(null)
      }
    } catch (error) {
      console.error('Error creating version:', error)
    }
  }

  const handleToggleStatus = async (source: DataSource) => {
    try {
      const newStatus = source.status === 'active' ? 'inactive' : 'active'
      const response = await fetch(`http://localhost:3001/sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const updatedSource = await response.json()
        setDataSources(prev => prev.map(s => s.id === source.id ? updatedSource : s))
      }
    } catch (error) {
      console.error('Error updating source status:', error)
    }
  }

  const getFilteredSources = () => {
    return dataSources.filter(source => {
      const name = (source.name || '').toLowerCase()
      const desc = (source.description || '').toLowerCase()
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase())
      const env = (source.environment || '').toLowerCase()
      const matchesEnvironment = filterEnvironment === 'all' || env === filterEnvironment
      const matchesKind = filterKind === 'all' || source.kind === filterKind
      const matchesStatus = filterStatus === 'all' || (source.status || '').toLowerCase() === filterStatus

      return matchesSearch && matchesEnvironment && matchesKind && matchesStatus
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'sql':
        return <Database className="h-4 w-4" />
      case 'salesforce':
        return <Users className="h-4 w-4" />
      case 'rest':
        return <Globe className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const filteredSources = getFilteredSources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Manage and configure your heterogeneous data source connections. Connect to Salesforce, databases, REST APIs, and more with full versioning and lineage support.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                {dataSources.filter(s => s.status === 'active').length} of {dataSources.length} sources active
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4 text-purple-500" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">
                {dataSources.length} total sources
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">
                Full lineage tracking
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadDataSources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search data sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterEnvironment} onValueChange={setFilterEnvironment}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterKind} onValueChange={setFilterKind}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="salesforce">Salesforce</SelectItem>
                  <SelectItem value="rest">REST</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading data sources...</span>
        </div>
      ) : (
        filteredSources.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No data sources found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterEnvironment !== 'all' || filterKind !== 'all' || filterStatus !== 'all'
                ? "Try adjusting your filters or search terms."
                : "Get started by adding your first data source."
              }
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => {
            const isActive = source.status === "active"
            const isInactive = source.status === "inactive"

            return (
              <Card key={source.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border-0 shadow-sm ${
                isActive
                  ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50'
                  : isInactive
                  ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50'
                  : 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50'
              }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-green-500/10'
                        : isInactive
                        ? 'bg-gray-500/10'
                        : 'bg-yellow-500/10'
                    }`}>
                      {getKindIcon(source.kind)}
                    </div>
                    <div>
                      <CardTitle className={`text-lg ${
                        isActive
                          ? 'text-green-900 dark:text-green-100'
                          : isInactive
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-yellow-900 dark:text-yellow-100'
                      }`}>
                        {renamingId === source.id ? (
                          <input
                            className="px-2 py-1 text-sm rounded border border-border bg-background"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                try {
                                  const resp = await fetch(buildApiUrl(API_CONFIG.endpoints.source(source.id)), {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: renameValue })
                                  })
                                  if (resp.ok) {
                                    const updated = await resp.json()
                                    setDataSources(prev => prev.map(s => s.id === source.id ? updated : s))
                                  }
                                } finally {
                                  setRenamingId("")
                                  setRenameValue("")
                                }
                              } else if (e.key === 'Escape') {
                                setRenamingId("")
                                setRenameValue("")
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span onDoubleClick={() => { setRenamingId(source.id); setRenameValue(source.name) }}>
                            {source.name}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="font-medium">{source.kind} • {source.environment || 'unknown'}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/sources/${source.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Schema & Objects
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Connection Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={async () => {
                        if (!confirm(`Remove data source "${source.name}"? This cannot be undone.`)) return
                        try {
                          const resp = await fetch(buildApiUrl(API_CONFIG.endpoints.source(source.id)), { method: 'DELETE' })
                          if (resp.ok) {
                            setDataSources(prev => prev.filter(s => s.id !== source.id))
                          }
                        } catch (e) {
                          console.error('Failed to remove source', e)
                        }
                      }}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Source
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{source.description || 'No description available'}</p>

                {/* Status and Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : isInactive ? (
                        <Clock className="h-4 w-4 text-gray-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <Badge variant={isActive ? "default" : "secondary"} className={
                        isActive
                          ? 'bg-green-500 hover:bg-green-600'
                          : isInactive
                          ? 'bg-gray-500 hover:bg-gray-600'
                          : 'bg-yellow-500 hover:bg-yellow-600'
                      }>
                        {source.status || 'unknown'}
                      </Badge>
                    </div>
                    {source.metadata?.recordCount && (
                      <span className="text-sm font-medium text-muted-foreground">{source.metadata.recordCount} records</span>
                    )}
                  </div>

                  {/* Sync Status */}
                  <div className="flex items-center justify-between text-xs">
                    {source.metadata?.lastSync && (
                      <span className="text-muted-foreground">Last sync: {new Date(source.metadata.lastSync).toLocaleDateString()}</span>
                    )}
                    {isActive && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    )}
                  </div>

                  {/* Discovery Progress for Non-Active */}
                  {source.status !== 'active' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Schema Discovery</span>
                        <span className="text-muted-foreground">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/sources/${source.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
          </div>
        )
      )
      }

      <AddDataSourceDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
