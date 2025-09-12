"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

interface HealthStatus {
  status: 'online' | 'offline' | 'checking'
  message?: string
  lastChecked?: Date
}

export function HealthCheck({ showDetails = false }: { showDetails?: boolean }) {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking'
  })

  const checkHealth = async () => {
    setHealth({ status: 'checking' })

    try {
      const response = await fetch('http://localhost:3001/health', {
        timeout: 5000 // 5 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        setHealth({
          status: 'online',
          message: data.message || 'Gateway server is online',
          lastChecked: new Date()
        })
      } else {
        setHealth({
          status: 'offline',
          message: `Server responded with status ${response.status}`,
          lastChecked: new Date()
        })
      }
    } catch (error) {
      setHealth({
        status: 'offline',
        message: 'Cannot connect to gateway server. Make sure it\'s running.',
        lastChecked: new Date()
      })
    }
  }

  useEffect(() => {
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (health.status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
    }
  }

  const getStatusBadge = () => {
    switch (health.status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Online</Badge>
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>
    }
  }

  if (health.status === 'online' && !showDetails) {
    return null // Don't show anything if everything is working
  }

  return (
    <Alert className={`${health.status === 'online' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">Gateway Server</span>
            {getStatusBadge()}
          </div>
          {health.message && (
            <AlertDescription className="text-sm">
              {health.message}
            </AlertDescription>
          )}
          {health.lastChecked && (
            <div className="text-xs text-muted-foreground mt-1">
              Last checked: {health.lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {health.status === 'offline' && (
            <Button size="sm" variant="outline" onClick={checkHealth}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={checkHealth}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
