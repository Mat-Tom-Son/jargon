"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, BookOpen, MoreHorizontal, Edit, Trash2, GitBranch, Users, TrendingUp, Eye, User, CheckCircle } from "lucide-react"
import Link from "next/link"
import { AddBusinessTermDialog } from "./add-business-term-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { API_CONFIG, buildApiUrl } from "@/lib/api-config"

const categories = ["All", "Customer", "Sales", "Finance", "Marketing"]

export function BusinessTermsList() {
  const searchParams = useSearchParams()
  const focusedTermId = searchParams.get('termId') || ''
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [businessTerms, setBusinessTerms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const focusedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.terms))
        if (!res.ok) throw new Error('load_failed')
        const arr = await res.json()
        setBusinessTerms(arr)
      } catch (e: any) {
        setError(e?.message || 'failed')
        setBusinessTerms([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredTerms = businessTerms.filter((term) => {
    const matchesSearch =
      term.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || term.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // If a termId is provided, prioritize showing it and scroll into view
  const orderedTerms = useMemo(() => {
    if (!focusedTermId) return filteredTerms
    const idx = filteredTerms.findIndex(t => t.id === focusedTermId)
    if (idx === -1) return filteredTerms
    const copy = filteredTerms.slice()
    const [term] = copy.splice(idx, 1)
    return [term, ...copy]
  }, [filteredTerms, focusedTermId])

  useEffect(() => {
    if (focusedRef.current) {
      focusedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [orderedTerms.length, focusedTermId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Business Terms</h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Define and manage your organization's business vocabulary and semantic contracts. Create clear definitions that power your data translation layer.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700 dark:text-blue-400 font-medium">{businessTerms.length} terms defined</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-green-700 dark:text-green-400 font-medium">{new Set(businessTerms.map((term) => term.owner)).size} contributors</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-purple-700 dark:text-purple-400 font-medium">Growing vocabulary</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Import Terms
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Define New Term
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-6">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by term name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className={`transition-all ${
                selectedCategory === category
                  ? 'shadow-sm'
                  : 'hover:shadow-sm'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === "All" && <BookOpen className="h-3 w-3 mr-1" />}
              {category === "Customer" && <User className="h-3 w-3 mr-1" />}
              {category === "Sales" && <TrendingUp className="h-3 w-3 mr-1" />}
              {category === "Finance" && <CheckCircle className="h-3 w-3 mr-1" />}
              {category === "Marketing" && <Users className="h-3 w-3 mr-1" />}
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orderedTerms.map((term, i) => {
          const categoryColors = {
            Customer: 'from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50',
            Sales: 'from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50',
            Finance: 'from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50',
            Marketing: 'from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50'
          }

          const categoryTextColors = {
            Customer: 'text-blue-700 dark:text-blue-300',
            Sales: 'text-green-700 dark:text-green-300',
            Finance: 'text-purple-700 dark:text-purple-300',
            Marketing: 'text-orange-700 dark:text-orange-300'
          }

          const isFocused = focusedTermId && term.id === focusedTermId
          return (
            <Card
              key={term.id}
              ref={isFocused ? focusedRef : null}
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border ${isFocused ? 'border-blue-400 ring-2 ring-blue-200' : 'border-0'} shadow-sm bg-gradient-to-br ${categoryColors[term.category as keyof typeof categoryColors] || 'from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50'}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <CardTitle className={`text-xl font-semibold ${categoryTextColors[term.category as keyof typeof categoryTextColors] || 'text-gray-700 dark:text-gray-300'}`}>
                      {term.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-medium border-current ${categoryTextColors[term.category as keyof typeof categoryTextColors] || 'text-gray-600'}`}>
                        {term.category}
                      </Badge>
                      {/* popularity badge removed (no usage count available) */}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/terms/${term.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-60 hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Definition
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <GitBranch className="h-4 w-4 mr-2" />
                          View Data Mappings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive Term
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{term.description}</p>

                <div className="flex flex-wrap gap-2">
                  {term.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
                      {tag}
                    </Badge>
                  ))}
                  {term.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      +{term.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm border-t border-border/50 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {(term.owner || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-muted-foreground font-medium">{term.owner || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created {(() => { const d = term.created_at || term.createdAt; return d ? new Date(d).toLocaleDateString() : '—'; })()}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTerms.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No terms found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first business term."}
          </p>
          {!searchQuery && selectedCategory === "All" && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Term
            </Button>
          )}
        </div>
      )}

      <AddBusinessTermDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  )
}
