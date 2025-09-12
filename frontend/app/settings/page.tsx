"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Settings, Database, Cloud, Globe, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

interface Integration {
  name: string
  status: string
  type: string
  envVars: string
}

interface ConfigStatus {
  integrations: Integration[]
  environment: {
    hasPostgresEnv: boolean
    hasSalesforceEnv: boolean
    port: number
    nodeEnv: string
  }
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [restartProgress, setRestartProgress] = useState(0)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    // PostgreSQL
    DATABASE_URL: '',
    DB_HOST: '',
    DB_PORT: '5432',
    DB_NAME: '',
    DB_USER: '',
    DB_PASSWORD: '',

    // Salesforce
    SALESFORCE_INSTANCE_URL: '',
    SALESFORCE_ACCESS_TOKEN: '',

    // Server
    PORT: '3001',
    NODE_ENV: 'development',

    // Demo Data
    ENABLE_DEMO_DATA: true
  })

  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/config/status')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)

        // Pre-populate form with current values if they exist
        setFormData(prev => ({
          ...prev,
          DATABASE_URL: process.env.NEXT_PUBLIC_DATABASE_URL || '',
          SALESFORCE_INSTANCE_URL: process.env.NEXT_PUBLIC_SALESFORCE_INSTANCE_URL || '',
          SALESFORCE_ACCESS_TOKEN: process.env.NEXT_PUBLIC_SALESFORCE_ACCESS_TOKEN || '',
          PORT: data.environment.port.toString(),
          NODE_ENV: data.environment.nodeEnv
        }))
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      toast({
        title: "Error",
        description: "Failed to load configuration status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async () => {
    setUpdating(true)
    setSaveSuccess(false)
    // Clear any existing success state when starting a new update
    setSaveSuccess(false)
    try {
      const response = await fetch('http://localhost:3001/config/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        setConfig(result)
        setSaveSuccess(true)

        // Save demo data setting to localStorage for immediate effect
        localStorage.setItem('ENABLE_DEMO_DATA', JSON.stringify(formData.ENABLE_DEMO_DATA))

        // Dispatch storage event to notify other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'ENABLE_DEMO_DATA',
          newValue: JSON.stringify(formData.ENABLE_DEMO_DATA)
        }))

        toast({
          title: "🎉 Configuration Saved Successfully!",
          description: `${result.updated.length} settings saved to ${result.envFile}`,
          duration: 3000,
        })

        // Show prominent restart message after a delay
        setTimeout(() => {
          toast({
            title: "🔄 Ready to Restart",
            description: "Click the restart button below or run 'npm run restart'",
            duration: 8000,
          })
        }, 2500)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update configuration')
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      toast({
        title: "❌ Save Failed",
        description: error instanceof Error ? error.message : "Failed to update configuration",
        variant: "destructive"
      })
      setSaveSuccess(false)
    } finally {
      setUpdating(false)
    }
  }

  const restartServer = async () => {
    setRestarting(true)
    setRestartProgress(0)

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setRestartProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      toast({
        title: "🔄 Restarting Server...",
        description: "This may take 10-15 seconds",
        duration: 15000,
      })

      // Wait for server to be ready to restart
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Poll for server availability during restart
      let attempts = 0
      const maxAttempts = 20

      while (attempts < maxAttempts) {
        try {
          const response = await fetch('http://localhost:3001/health')
          if (response.ok) {
            setRestartProgress(100)
            clearInterval(progressInterval)

            toast({
              title: "✅ Server Restarted Successfully!",
              description: "All configuration changes are now active",
              duration: 5000,
            })

            // Reload the page to show updated status
            setTimeout(() => {
              window.location.reload()
            }, 2000)

            setRestarting(false)
            return
          }
        } catch (error) {
          // Server not ready yet, continue polling
        }

        attempts++
        setRestartProgress(Math.min(90, 20 + (attempts * 3)))
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // If we get here, restart may have failed
      clearInterval(progressInterval)
      toast({
        title: "⚠️ Restart Check Failed",
        description: "Server may still be restarting. Refresh the page to check status.",
        variant: "destructive"
      })

    } catch (error) {
      console.error('Restart failed:', error)
      toast({
        title: "❌ Restart Failed",
        description: "Manual restart may be required. Run 'npm run restart'",
        variant: "destructive"
      })
    } finally {
      setRestarting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status.includes('✅')) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status.includes('⚠️')) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return <RefreshCw className="h-4 w-4 text-gray-500" />
  }

  const getStatusColor = (status: string) => {
    if (status.includes('✅')) return 'bg-green-50 border-green-200'
    if (status.includes('⚠️')) return 'bg-yellow-50 border-yellow-200'
    return 'bg-gray-50 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Settings & Configuration</h1>
                <p className="text-muted-foreground">
                  Configure your data source integrations and environment variables
                </p>
              </div>
            </div>

      {/* Demo Data Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formData.ENABLE_DEMO_DATA ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            Demo Data Settings
          </CardTitle>
          <CardDescription>
            Control whether demo/mock data is displayed in the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="demo-data-toggle" className="text-base font-medium">
                Enable Demo Data
              </Label>
              <p className="text-sm text-muted-foreground">
                Show sample data sources, business terms, and mapping rules when real data is not available
              </p>
            </div>
            <Switch
              id="demo-data-toggle"
              checked={formData.ENABLE_DEMO_DATA}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, ENABLE_DEMO_DATA: checked }))
              }
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> When demo data is disabled, you will only see data from your configured integrations.
              Make sure your PostgreSQL and Salesforce connections are properly configured.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Integration Status
          </CardTitle>
          <CardDescription>
            Current status of your data source integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config?.integrations.map((integration, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(integration.status)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(integration.status)}
                  <h3 className="font-semibold">{integration.name}</h3>
                </div>
                <Badge variant="outline" className="mb-2">{integration.type}</Badge>
                <p className="text-sm text-muted-foreground">{integration.envVars}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            Configure environment variables for your data sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PostgreSQL Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <h3 className="text-lg font-semibold">PostgreSQL Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="database_url">DATABASE_URL (Optional)</Label>
                <Input
                  id="database_url"
                  placeholder="postgresql://user:password@localhost:5432/database"
                  value={formData.DATABASE_URL}
                  onChange={(e) => setFormData(prev => ({ ...prev, DATABASE_URL: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db_host">DB_HOST</Label>
                <Input
                  id="db_host"
                  placeholder="localhost"
                  value={formData.DB_HOST}
                  onChange={(e) => setFormData(prev => ({ ...prev, DB_HOST: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db_port">DB_PORT</Label>
                <Input
                  id="db_port"
                  type="number"
                  value={formData.DB_PORT}
                  onChange={(e) => setFormData(prev => ({ ...prev, DB_PORT: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db_name">DB_NAME</Label>
                <Input
                  id="db_name"
                  placeholder="jargon_dev"
                  value={formData.DB_NAME}
                  onChange={(e) => setFormData(prev => ({ ...prev, DB_NAME: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db_user">DB_USER</Label>
                <Input
                  id="db_user"
                  placeholder="postgres"
                  value={formData.DB_USER}
                  onChange={(e) => setFormData(prev => ({ ...prev, DB_USER: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db_password">DB_PASSWORD</Label>
                <Input
                  id="db_password"
                  type="password"
                  value={formData.DB_PASSWORD}
                  onChange={(e) => setFormData(prev => ({ ...prev, DB_PASSWORD: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Salesforce Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Salesforce Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sf_instance_url">Instance URL</Label>
                <Input
                  id="sf_instance_url"
                  placeholder="https://your-org.salesforce.com"
                  value={formData.SALESFORCE_INSTANCE_URL}
                  onChange={(e) => setFormData(prev => ({ ...prev, SALESFORCE_INSTANCE_URL: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sf_access_token">Access Token</Label>
                <Input
                  id="sf_access_token"
                  type="password"
                  placeholder="Your Salesforce access token"
                  value={formData.SALESFORCE_ACCESS_TOKEN}
                  onChange={(e) => setFormData(prev => ({ ...prev, SALESFORCE_ACCESS_TOKEN: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Server Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Server Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.PORT}
                  onChange={(e) => setFormData(prev => ({ ...prev, PORT: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="node_env">Environment</Label>
                <Input
                  id="node_env"
                  value={formData.NODE_ENV}
                  onChange={(e) => setFormData(prev => ({ ...prev, NODE_ENV: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> After saving configuration, restart the server to apply changes:
              <br />
              <code className="bg-muted px-2 py-1 rounded text-sm mt-2 block">
                npm run restart
              </code>
              <span className="text-xs text-muted-foreground mt-1 block">
                (Or: <code>./restart-server.sh</code>)
              </span>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button
              onClick={updateConfig}
              disabled={updating}
              className="w-full"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Saving Configuration...
                </>
              ) : (
                '💾 Save Configuration'
              )}
            </Button>

            {saveSuccess && !restarting && (
              <Button
                onClick={restartServer}
                variant="outline"
                className="w-full border-green-500 text-green-700 hover:bg-green-50"
              >
                🔄 Restart Server to Apply Changes
              </Button>
            )}

            {restarting && (
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${restartProgress}%` }}
                ></div>
                <div className="text-center text-sm mt-2 text-gray-600 dark:text-gray-400">
                  Restarting server... {restartProgress}%
                </div>
              </div>
            )}
          </div>

          {config && saveSuccess && !restarting && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Configuration Saved</p>
                  <p className="text-sm opacity-80">
                    Settings saved to: <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs">
                      apps/gateway/.env
                    </code>
                  </p>
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      🔄 Restart Required
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Run this command in a new terminal:
                    </p>
                    <code className="block mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded text-xs font-mono">
                      npm run restart
                    </code>
                    <code className="block mt-1 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded text-xs font-mono">
                      # or: ./restart-server.sh
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
