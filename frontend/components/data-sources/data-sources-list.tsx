"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Database, Globe, Server, MoreHorizontal, Eye, Settings, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw, Zap } from "lucide-react"
import { AddDataSourceDialog } from "./add-data-source-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Mock data - in real app this would come from API
const mockDataSources = [
  {
    id: "1",
    name: "Salesforce Production",
    type: "REST",
    status: "active",
    description: "Production Salesforce instance",
    lastSync: "2 hours ago",
    objectCount: 15,
    icon: Globe,
  },
  {
    id: "2",
    name: "Customer Database",
    type: "PostgreSQL",
    status: "active",
    description: "Main customer data warehouse",
    lastSync: "30 minutes ago",
    objectCount: 8,
    icon: Database,
  },
  {
    id: "3",
    name: "Analytics API",
    type: "REST",
    status: "pending",
    description: "Internal analytics service",
    lastSync: "Never",
    objectCount: 0,
    icon: Server,
  },
]

export function DataSourcesList() {
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Manage and configure your heterogeneous data source connections. Connect to Salesforce, databases, REST APIs, and more.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">2 of 3 sources active</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">23 objects discovered</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              <span className="text-orange-700 dark:text-orange-400 font-medium">Last sync: 30 min ago</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDataSources.map((source) => {
          const Icon = source.icon
          const isActive = source.status === "active"
          const isPending = source.status === "pending"

          return (
            <Card key={source.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border-0 shadow-sm ${
              isActive
                ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50'
                : isPending
                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActive
                        ? 'bg-green-500/10'
                        : isPending
                        ? 'bg-yellow-500/10'
                        : 'bg-gray-500/10'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isActive
                          ? 'text-green-600 dark:text-green-400'
                          : isPending
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg ${
                        isActive
                          ? 'text-green-900 dark:text-green-100'
                          : isPending
                          ? 'text-yellow-900 dark:text-yellow-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>{source.name}</CardTitle>
                      <CardDescription className="font-medium">{source.type}</CardDescription>
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
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Source
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{source.description}</p>

                {/* Status and Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : isPending ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                      )}
                      <Badge variant={isActive ? "default" : "secondary"} className={
                        isActive
                          ? 'bg-green-500 hover:bg-green-600'
                          : isPending
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-gray-500 hover:bg-gray-600'
                      }>
                        {source.status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{source.objectCount} objects</span>
                  </div>

                  {/* Sync Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last sync: {source.lastSync}</span>
                    {isActive && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    )}
                  </div>

                  {/* Discovery Progress for Pending */}
                  {isPending && (
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

      <AddDataSourceDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
