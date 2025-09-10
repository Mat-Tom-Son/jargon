import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Database, BookOpen, GitBranch, Activity, Plus, ArrowRight, ArrowUpRight, TrendingUp, CheckCircle, AlertTriangle, Zap, Users } from "lucide-react"
import Link from "next/link"

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Translation Layer Admin</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Enterprise-grade semantic debt management platform. Monitor system health, manage business terminology, and ensure data governance compliance.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              All systems operational
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              99.9% uptime this month
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/semantic-debt">
              <CheckCircle className="h-4 w-4 mr-2" />
              View Debt Report
            </Link>
          </Button>
          <Button asChild>
            <Link href="/test">
              <Activity className="h-4 w-4 mr-2" />
              Test Query
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <Link href="/sources">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Data Sources</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">3</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">sources</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Active: 2</span>
                  <span className="text-muted-foreground">Pending: 1</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <Link href="/terms">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Business Terms</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">12</div>
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">terms</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-700 dark:text-green-400 font-medium">+2 from last week</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                <ArrowUpRight className="h-3 w-3" />
                <span>Growing vocabulary</span>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <Link href="/mappings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Mapping Rules</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <GitBranch className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">8</div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">rules</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Validated: 8</span>
                  <span className="text-muted-foreground">Total: 8</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>100% validated</span>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">Query Volume</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">1,247</div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">queries</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="h-3 w-3 text-orange-500" />
              <span className="text-orange-700 dark:text-orange-400 font-medium">Last 24 hours</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>Avg 120ms response</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <Link href="/semantic-debt">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-300">Semantic Debt Score</CardTitle>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">72%</div>
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">health score</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current: 72%</span>
                  <span className="text-muted-foreground">Target: 90%+</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>$45K monthly savings potential</span>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed border-2 hover:border-solid hover:shadow-md transition-all cursor-pointer">
          <Link href="/sources">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Add Data Source</CardTitle>
              <CardDescription>Connect a new database or API</CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-dashed border-2 hover:border-solid hover:shadow-md transition-all cursor-pointer">
          <Link href="/terms">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Define Business Term</CardTitle>
              <CardDescription>Create semantic definitions</CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-dashed border-2 hover:border-solid hover:shadow-md transition-all cursor-pointer">
          <Link href="/mappings">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Create Mapping</CardTitle>
              <CardDescription>Map terms to data fields</CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-dashed border-2 hover:border-solid hover:shadow-md transition-all cursor-pointer">
          <Link href="/semantic-debt">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <CardTitle className="text-lg">Semantic Debt Assessment</CardTitle>
              <CardDescription>Measure and track semantic debt</CardDescription>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Data Sources</CardTitle>
              <CardDescription>Latest configured data sources</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sources">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Salesforce Production</p>
                  <p className="text-sm text-muted-foreground">REST API • 847 objects</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Customer Database</p>
                  <p className="text-sm text-muted-foreground">PostgreSQL • 23 tables</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Analytics API</p>
                  <p className="text-sm text-muted-foreground">REST API • Schema discovery</p>
                </div>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Mapping Rules</CardTitle>
              <CardDescription>Latest business term mappings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mappings">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Active Customer → Salesforce</p>
                  <p className="text-sm text-muted-foreground">Account.Status = 'Active'</p>
                </div>
              </div>
              <Badge variant="default">Validated</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Revenue → Database</p>
                  <p className="text-sm text-muted-foreground">orders.total_amount</p>
                </div>
              </div>
              <Badge variant="default">Validated</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="font-medium">User Activity → Analytics</p>
                  <p className="text-sm text-muted-foreground">events.user_actions</p>
                </div>
              </div>
              <Badge variant="outline">Needs Review</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
